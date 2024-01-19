import { EventEmitter } from 'events';
import { Server, WebSocket } from 'ws';
import { v4 } from 'uuid';


import { Namespace } from './core';
import {
  CONNECT_EVENT_NAME,
  DISCONNECT_EVENT_NAME,
  PING_EVENT_NAME,
  PONG_EVENT_NAME,
  ANY_EVENT_MARKER,
  ANY_EVENT_EXCEPTIONS,
  AFTER_CONNECT_EVENT_NAME
} from './constants';
import { WebSocketServerOptions } from './options';
import { MessagingParams } from './params';

import { SocketManager } from './SocketManager';


export class WebsocketServer {
  private server: Server;
  private eventEmitter: EventEmitter;
  private pingTimers: Map<string, any>;
  private authTimers: Map<string, any>;


  private manager: SocketManager;
  private readonly pingInterval: number;
  private readonly pingTimeout: number;
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
    this.authTimeout = options.authenticate.authTimeout;
    this.authEventName = options.authenticate.eventName;
    this.authEventHandler = options.authenticate.eventHandler;
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
    this.manager = new SocketManager({
      eventEmitter: this.eventEmitter,
      namespace: new Namespace()
    });
    this.server = new Server({ ...options.serverOptions, clientTracking: false });
    this.server.on('connection', this.onConnection.bind(this));
  }

  private close(id: string, uid: string, token: string) {
    // Clear timers
    clearTimeout(this.pingTimers.get(id));
    this.pingTimers.delete(id);
    clearTimeout(this.authTimers.get(id));
    this.authTimers.delete(id);
    // Leave all rooms and close socket
    this.manager.disconnect(id);
    // emit disconnect event
    this.eventEmitter.emit(DISCONNECT_EVENT_NAME, uid, id, token)
  }

  private onConnection(webSocket: WebSocket) {
    const id = v4();
    let uid: string;
    let token: any;

    webSocket.on('close', () => {
      this.close(id, uid, token);
    });

    webSocket.on('message', async (data: string) => {
      try {
        const params: MessagingParams = JSON.parse(data);
        switch (params?.event) {
          case PONG_EVENT_NAME:
            this.setPingTimeout(webSocket, id);
            this.eventEmitter.emit(AFTER_CONNECT_EVENT_NAME, uid, id, token);
            break;
          case this.authEventName:
            try {
              uid = await this.authEventHandler(params.data.token);
              if ( !uid ) {
                throw new Error('Authentication failed');
              }
              clearTimeout(this.authTimers.get(id));
              this.authTimers.delete(id);
              uid = uid.toString()
              const tokenKey = typeof params.data.token === 'object' ? params.data.token.token : params.data.token;
              this.manager.connect(webSocket, tokenKey, uid, id, []);
              this.eventEmitter.emit(CONNECT_EVENT_NAME, uid, id, params.data.token);
            } catch ( authError ) {
              console.log({ authError })
              webSocket.close();
            }
            break;
          default:
            this.eventEmitter.emit(params.event, params.data, uid, id);
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
    const self = this;
    const timeout = this.pingTimers.get(id);
    if (timeout) {
      clearTimeout(timeout);
    }
    this.pingTimers.set(id, setTimeout(() => {
      webSocket.close();
    }, this.pingTimeout));
    setTimeout(() => {
      webSocket.send(JSON.stringify({ event: PING_EVENT_NAME, data: {}}))
    }, this.pingInterval)
  }

  private setAuthTimeout(webSocket: WebSocket, id: string) {
    const self = this;
    this.authTimers.set(id, setTimeout(() => {
      webSocket.close();
    }, this.authTimeout))
  }

  public getManager() {
    return this.manager;
  }
}
