import { EventEmitter } from 'events';
import { IncomingMessage } from 'http'
import { Server, WebSocket } from 'ws';
import { v4 } from 'uuid';

import { Namespace } from '@server-core';
import {
  CONNECT_EVENT_NAME,
  DISCONNECT_EVENT_NAME,
  PING_EVENT_NAME,
  PONG_EVENT_NAME,
  ANY_EVENT_MARKER,
  ANY_EVENT_EXCEPTIONS,
  AFTER_CONNECT_EVENT_NAME, AUTH_SUCCESS_EVENT, AUTH_FAILED_EVENT,
} from '@server-constants';
import { WebSocketServerOptions } from '@server-options';
import { MessagingParams } from '@server-params';
import { pseudoInterval } from '@server-helpers';
import { SocketManager } from './SocketManager';


export class WebSocketServer {
  private server: Server;
  private readonly eventEmitter: EventEmitter;
  private pingTimers: Map<string, any>;
  private authTimers: Map<string, any>;
  private readonly manager: SocketManager;
  private readonly pingInterval: number;
  private readonly pingTimeout: number;
  private readonly disablePing: boolean;
  private readonly authTimeout: number;
  private readonly authEventName: string;

  private readonly authEventHandler: (value: string) => Promise<string>;

  constructor(options: WebSocketServerOptions) {
    // Initialization
    this.eventEmitter = new EventEmitter();
    this.pingTimers = new Map<string, any>();
    this.authTimers = new Map<string, any>();
    this.pingInterval = options.pingInterval;
    this.pingTimeout = options.pingTimeout;
    this.disablePing = options.disablePing;
    this.authTimeout = options.authenticate.authTimeout;
    this.authEventName = options.authenticate.eventName;
    this.authEventHandler = options.authenticate.eventHandler;
    this.manager = new SocketManager({
      namespace: new Namespace()
    });
    const isSetAnyEventHandler: boolean = Boolean(options.events[ANY_EVENT_MARKER]);
    if ( this.authEventName ) {
      ANY_EVENT_EXCEPTIONS.push(this.authEventName);
    }
    for ( const event in options.events ) {
      if ( event !== ANY_EVENT_MARKER ) {
        if ( isSetAnyEventHandler && ! ANY_EVENT_EXCEPTIONS.includes(event) ) {
          this.eventEmitter.on(event, options.events[ANY_EVENT_MARKER].bind(this.manager));
        }
        this.eventEmitter.on(event, options.events[event].bind(this.manager));
      }
    }

    const { verbose } = options;
    if (verbose?.enable) {
      pseudoInterval({
        handler: this.displayStats.bind(this),
        isActive: true,
        forceExit: false,
        interval: verbose.interval
      })
    }
    this.server = new Server({ ...options.serverOptions, clientTracking: false });
    this.server.on('connection', this.onConnection.bind(this));
  }

  private displayStats() {
    const { channels, users, connections} = this.manager.stats();
    console.log({
      channels,
      groupChannels: channels - users - connections,
      users,
      authorizedConnections: connections,
      activeConnections: this.pingTimers.size
    })
  }

  private close(id: string, uid: string, token: string, ip: string) {
    // Clear timers
    if (this.pingTimers.has(id)) {
      clearTimeout(this.pingTimers.get(id));
      this.pingTimers.delete(id);
    }
    if (this.authTimers.has(id)) {
      clearTimeout(this.authTimers.get(id));
      this.authTimers.delete(id);
    }
    // Leave all rooms and close socket
    this.manager.disconnect(id);
    // emit disconnect event
    this.eventEmitter.emit(DISCONNECT_EVENT_NAME, id, uid, token)
  }

  private onConnection(webSocket: WebSocket, req: IncomingMessage) {
    const id = v4();
    let uid: string;
    let token: any;
    const ip = req.headers['x-forwarded-for'] as string || req.headers['x-real-ip'] as string || req.socket.remoteAddress ;


    webSocket.on('close', () => {
      this.close(id, uid, token, ip);
    });

    webSocket.on('message', async (data: string) => {
      try {
        const params: MessagingParams = JSON.parse(data);
        switch (params?.event) {
          case PONG_EVENT_NAME:
            this.setPingTimeout(webSocket, id);
            this.eventEmitter.emit(AFTER_CONNECT_EVENT_NAME, id, uid, token);
            break;
          case this.authEventName:
            try {
              uid = await this.authEventHandler(params.data.token);
              if ( !uid ) {
                webSocket.send(JSON.stringify({ event: AUTH_FAILED_EVENT, data: {} }));
                webSocket.close();
                return;
              }
              if (this.authTimers.has(id)) {
                clearTimeout(this.authTimers.get(id));
                this.authTimers.delete(id);
              }
              uid = uid.toString()
              const tokenKey = typeof params.data.token === 'object' ? params.data.token.token : params.data.token;
              this.manager.connect(webSocket, tokenKey, uid, id, []);
              this.eventEmitter.emit(CONNECT_EVENT_NAME, id, uid, params.data.token, ip);
              token = params.data.token;
              webSocket.send(JSON.stringify({ event: AUTH_SUCCESS_EVENT, data: {}}))
            } catch ( error ) {
              console.log({ error })
              webSocket.close();
            }
            break;
          default:
            this.eventEmitter.emit(params.event, params.data, id, uid);
            break;
        }
      } catch( error ) {
        console.log({ error });
      }
    });

    this.setPingTimeout(webSocket, id);
    this.setAuthTimeout(webSocket, id);
    webSocket.send(JSON.stringify({ event: this.authEventName, data: {}}));
  }

  private setPingTimeout(webSocket: WebSocket, id: string) {
    if (!this.disablePing) {
      const self = this;
      const timeout = this.pingTimers.get(id);
      if (timeout) {
        clearTimeout(timeout);
      }
      this.pingTimers.set(id, setTimeout(() => {
        webSocket.close();
      }, self.pingTimeout));
      setTimeout(() => {
        webSocket.send(JSON.stringify({ event: PING_EVENT_NAME, data: {}}))
      }, self.pingInterval)
    }
  }

  private setAuthTimeout(webSocket: WebSocket, id: string) {
    const self = this;
    this.authTimers.set(id, setTimeout(() => {
      webSocket.close();
    }, self.authTimeout))
  }

  public getManager() {
    return this.manager;
  }
}
