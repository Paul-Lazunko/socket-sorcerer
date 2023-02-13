import {
  ANY_EVENT_EXCEPTIONS,
  ANY_EVENT_MARKER,
  PING_EVENT_NAME,
  PONG_EVENT_NAME
} from '../constants';
import { IClientOptions } from '../options';
import { EventEmitter } from './EventEmitter';
import { checkCompletion } from '../helpers';

export abstract class AbstractWebSocketClient {
  protected socket: any;
  protected eventEmitter: EventEmitter;
  protected readonly serverUrl: string;
  protected token: string;
  protected doReconnectOnClose: boolean;
  protected readonly reconnectInterval: number;
  protected readonly authEventName: string;
  public isConnected: boolean;
  protected framesQueue: string[];
  protected isActive: boolean;
  protected onOpenHandler: any;
  protected onCloseHandler: any;

  protected constructor(options: IClientOptions) {
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

  abstract setSocket(): void

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

  protected onClose() {
   this.isConnected = false;
    if ( typeof this.onCloseHandler === 'function') {
      this.onCloseHandler()
    }
   this.doReconnect();
  }

  protected onError(error: any) {
    console.error(error)
  }

  protected doReconnect() {
    if( this.doReconnectOnClose ) {
      setTimeout(() => {
        this.setSocket();
      }, this.reconnectInterval)
    }
  }

  protected onOpen =  (connection: any) => {
    console.log({connection})
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

  protected emit ( room: string = '', event: string, data: any, highPriority: boolean = false) {
    if ( this.isActive ) {
      const params = {
        room,
        event,
        data
      };
      if ( this.isConnected ) {
        this.socket.send(JSON.stringify(params));
      } else {
        highPriority ? this.framesQueue.unshift(JSON.stringify(params)) : this.framesQueue.push(JSON.stringify(params))
      }
    }
  }

  public to (roomName: string) {
    let eventName: string;
    let data: string;
    const self = this;
    return {
      event(name: string) {
        eventName = name;
        const isComplete: boolean = checkCompletion(roomName, eventName, data, self.emit.bind(self));
        return isComplete ? {} : this;
      },
      data(dataObj: any) {
        data = dataObj;
        const isComplete: boolean = checkCompletion(roomName, eventName, data, self.emit.bind(self));
        return isComplete ? {} : this;
      }
    }
  }
}
