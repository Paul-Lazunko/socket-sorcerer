import {
  ANY_EVENT_EXCEPTIONS,
  ANY_EVENT_MARKER,
  PING_EVENT_NAME,
  PONG_EVENT_NAME
} from './constants';
import { WebSocketClientOptions } from './options';
import { EventEmitter } from './core';

export class WebSocketClient {
  private socket: any;
  private eventEmitter: EventEmitter;
  private readonly serverUrl: string;
  private token: string;
  private doReconnectOnClose: boolean;
  private readonly reconnectInterval: number;
  private readonly authEventName: string;
  public isConnected: boolean;
  private framesQueue: string[];
  private isActive: boolean;
  private onOpenHandler: any;
  private onCloseHandler: any;

  constructor(options: WebSocketClientOptions) {
    this.serverUrl = options.serverUrl;
    this.token = options.token;
    this.isActive = true;
    this.doReconnectOnClose = options.doReconnectOnClose;
    this.reconnectInterval = options.reconnectInterval;
    this.authEventName = options.authEventName;
    this.eventEmitter = new EventEmitter();
    this.framesQueue = [];
    if ( options.hooks ) {
      if (options.hooks.onOpen) {
        this.onOpenHandler = options.hooks.onOpen;
      }
      if (options.hooks.onClose) {
        this.onCloseHandler = options.hooks.onClose;
      }
    }
    const isSetAnyEventHandler: boolean =  !! options.events[ANY_EVENT_MARKER];
    if (  this.authEventName ) {
      ANY_EVENT_EXCEPTIONS.push(this.authEventName);
    }
    for ( const event in options.events ) {
      if ( event !== ANY_EVENT_MARKER ) {
        if ( isSetAnyEventHandler && ! ANY_EVENT_EXCEPTIONS.includes(event) ) {
          this.eventEmitter.on(event, options.events[ANY_EVENT_MARKER]);
        }
        this.eventEmitter.on(event, options.events[event])
      }
    }
    this.setSocket();
  }

  deactivate() {
    this.doReconnectOnClose = false;
    this.isActive = false;
    this.socket.close();
  }

  activate() {
    this.doReconnectOnClose = true;
    this.isActive = true;
    this.setSocket()
  }

  setToken(token: string) {
    this.token = token;
  }

  setSocket() {
    if ( this.socket ) {
      this.socket.close();
    }
    // @ts-ignore
    this.socket = new window['WebSocket'](this.serverUrl);
    this.socket.addEventListener('open', this.onOpen.bind(this));
    this.socket.addEventListener('close', this.onClose.bind(this));
    this.socket.addEventListener('error', this.onError.bind(this));
    this.socket.addEventListener('message', (messageEvent: any) => {
      try {
        const params = JSON.parse(messageEvent.data);
        const { event, data } = params;
        switch (event) {
          case PING_EVENT_NAME:
            this.emit(PONG_EVENT_NAME,{},  true);
            this.eventEmitter.emit(event, data);
            break;
          case this.authEventName:
            this.emit(this.authEventName, { token: this.token }, true);
            break;
          default:
            this.eventEmitter.emit(event, data);
            break;
        }
      } catch(e) {
        console.error({ e })
      }
    });

  }

  private onClose() {
    this.isConnected = false;
    if ( typeof this.onCloseHandler === 'function') {
      this.onCloseHandler()
    }
    this.doReconnect();
  }

  private onError(error: any) {
    console.error(error)
  }

  private doReconnect() {
    if( this.doReconnectOnClose ) {
      setTimeout(() => {
        this.setSocket();
      }, this.reconnectInterval)
    }
  }

  private onOpen =  (connection: any) => {
    this.isConnected = true;
    while ( this.framesQueue.length ) {
      if ( this.isConnected) {
        const frame: string = this.framesQueue.pop();
        this.socket.send(frame);
      } else {
        break;
      }
    }
    if ( typeof this.onOpenHandler === 'function') {
      this.onOpenHandler()
    }
  };

  public emit (event: string, data: any, highPriority: boolean = false) {
    if ( this.isActive ) {
      const params = JSON.stringify({
        event,
        data
      });
      if ( this.isConnected ) {
        this.socket.send(params);
      } else {
        highPriority ? this.framesQueue.unshift(params) : this.framesQueue.push(params);
      }
    }
  }

}
