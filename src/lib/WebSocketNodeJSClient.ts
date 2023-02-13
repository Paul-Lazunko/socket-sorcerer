const { client } = require('websocket');
const WebSocket = client;

import {
  PING_EVENT_NAME,
  PONG_EVENT_NAME
} from '../constants';
import { IClientOptions } from '../options';
import { AbstractWebSocketClient } from './AbstractWebSocketClient';

export class WebSocketNodeJSClient extends AbstractWebSocketClient {

  constructor(options: IClientOptions) {
   super(options);
  }

  setSocket() {
    if ( this.socket ) {
      this.socket.abort();
    }
    // @ts-ignore
    this.socket = new WebSocket();
    this.socket.connect = this.socket.connect.bind(this.socket, [this.serverUrl])
    if (typeof this.socket.close !== 'function') {
      this.socket.close = this.socket.abort;
    }
    this.socket.on('close', this.onClose.bind(this));
    this.socket.on('open', this.onOpen.bind(this));
    this.socket.on('error', this.onError.bind(this));
    this.socket.on('message', (messageEvent: any) => {
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
    });
    this.socket.connect();
  }

}
