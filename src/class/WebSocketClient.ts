import {
  ANY_EVENT_EXCEPTIONS,
  ANY_EVENT_MARKER,
  PING_EVENT_NAME,
  PONG_EVENT_NAME
} from '../constant';
import { IClientOptions } from '../interface';
import { EventEmitter } from './EventEmitter';
import { checkCompletion } from '../helper';

export class WebSocketClient {
  private socket: WebSocket;
  private eventEmitter: EventEmitter;
  private readonly serverUrl: string;
  private readonly token: string;
  private doReconnectOnClose: boolean;
  private readonly reconnectInterval: number;
  private readonly authEventName: string;
  private isConnected: boolean;
  private framesQueue: string[];

  constructor(options: IClientOptions) {
    this.serverUrl = options.serverUrl;
    this.token = options.token;
    this.doReconnectOnClose = options.doReconnectOnClose;
    this.reconnectInterval = options.reconnectInterval;
    this.authEventName = options.authEventName;
    this.eventEmitter = new EventEmitter();
    this.framesQueue = [];
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

  stopReconnect() {
    this.doReconnectOnClose = false;
  }

  startReconnect() {
    this.doReconnectOnClose = true;
  }

  setSocket() {
    if ( this.socket ) {
      this.socket.close();
    }
    // @ts-ignore
    this.socket = new window['WebSocket'](this.serverUrl);
    this.socket.onopen = this.onOpen.bind(this);
    this.socket.onclose= this.onClose.bind(this);
    this.socket.onerror = this.onError.bind(this);
    this.socket.onmessage = (messageEvent: any) => {
      try {
        const params = JSON.parse(messageEvent.data);
        const { event, data } = params;
        switch (event) {
          case PING_EVENT_NAME:
            this.emit('', PONG_EVENT_NAME,{},  true);
            break;
          case this.authEventName:
            this.emit('', this.authEventName, { token: this.token }, true);
            break;
          default:
            this.eventEmitter.emit(event, data);
            break;
        }
      } catch(e) {
        console.log({e})
      }
    }
  }

  private onClose() {
    this.isConnected = false;
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
  };

  private emit ( room: string = '', event: string, data: any, highPriority: boolean = false) {
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
