import { EventEmitter } from 'events';
import { Server } from 'ws';
import {IMessageParams, IServerOptions} from '../interface';
import { uidHelper } from '../helper';
import { PING_EVENT_NAME, PONG_EVENT_NAME } from '../constant';
import {SocketManager} from "./SocketManager";

export class WebsocketServer {
  private server: Server;
  private eventEmitter: EventEmitter;
  private pingTimers: Map<string, NodeJS.Timer>;
  private authTimers: Map<string, NodeJS.Timer>;
  private sockets: Map<string,any>;
  private users: Map<string,string[]>;
  private rooms: Map<string,string[]>;
  private manager: SocketManager;
  private readonly pingInterval: number;
  private readonly pingTimeout: number;
  private readonly authTimeout: number;
  private readonly authEventName: string;
  private readonly authEventHandler: (value: string) => Promise<string>;

  constructor(options: IServerOptions) {
    this.pingTimers = new Map<string, NodeJS.Timer>();
    this.authTimers = new Map<string, NodeJS.Timer>();
    this.pingInterval = options.pingInterval;
    this.pingTimeout = options.pingTimeout;
    this.authEventName = options.authenticate.eventName;
    this.authEventHandler = options.authenticate.eventHandler;
    this.authTimeout = options.authenticate.authTimeout;
    this.sockets = new Map<string, any>();
    this.users = new Map<string, string[]>();
    this.rooms = new Map<string, string[]>();
    this.manager = new SocketManager({
      rooms: this.rooms,
      users: this.users,
      sockets: this.sockets
    });
    this.eventEmitter = new EventEmitter();
    for ( const event in options.events) {
      console.log(options.events[event], event)
      this.eventEmitter.on(event, options.events[event].bind(this.manager));
    }
    this.server = new Server(options.serverOptions);
    this.server.on('connection', this.onConnection.bind(this));
  }

  private emit(socket: any, event: string, data: any ) {
    const params: any = {
      event,
      data
    };
    socket.send(JSON.stringify(params))
  }

  private close(id: string, uid: string) {
    this.sockets.delete(id);
    clearTimeout(this.pingTimers.get(id));
    this.pingTimers.delete(id);
    clearTimeout(this.authTimers.get(id));
    this.authTimers.delete(id);
    const user: string[] = this.users.get(uid);
    if ( user ) {
      user.splice(user.indexOf(uid),1);
      if ( !user.length ) {
        this.users.delete(uid);
      }
      this.rooms.forEach((room: string[], roomName: string) => {
        if ( room.includes(uid) ) {
          room.splice(room.indexOf(uid),1);
          if ( !room.length ) {
            this.rooms.delete(roomName);
          }
        }
      });
      this.eventEmitter.emit('disconnect', uid)
    }
    console.log(`disconnected ${id}`)
  }

  private onConnection(socket: any) {

    const self = this;

    const id = uidHelper();

    let uid: string | undefined = undefined;

    console.log(`connected ${id}`);

    this.sockets.set(id, socket);

    this.pingTimers.set(id, setTimeout(() => {}, 0));

    socket.on('close', () => {
      self.close(id, uid);
    });

    socket.on('message', async (data: string) => {
      try {
        const params: IMessageParams = JSON.parse(data);
        console.log('received data', params);
        switch (params.event) {
          case PONG_EVENT_NAME:
            let timeout: NodeJS.Timer = self.pingTimers.get(id);
            if ( timeout ) {
              clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
              self.setSocketTimer(socket, id);
            }, self.pingInterval);
            break;

          case self.authEventName:
            try {
              uid = await self.authEventHandler(params.data.token);
              if ( !uid ) {
                throw new Error('Authentication failed');
              }
              clearTimeout(this.authTimers.get(id));
              this.authTimers.delete(id);
              const userExists: boolean = !! self.users.get(uid);
              if ( ! userExists ) {
                self.users.set(uid, [id]);
              } else {
                if ( !self.users.get(uid).includes(id) ) {
                  self.users.get(uid).push(id);
                }
              }
              this.manager.join(uid, uid);
              this.eventEmitter.emit('connect', id, uid);
              console.log(self.users);
            } catch ( error ) {
              socket.close();
            }
            break;
          default:
            this.eventEmitter.emit(params.event, params.data, uid, socket);
            break;
        }
      } catch(e) {
        console.log({e})
      }
    });
    self.setSocketTimer(socket, id);
    this.authTimers.set(id, setTimeout(() => {
      socket.close();
    }, this.authTimeout));
    this.emit(socket, this.authEventName, {});
  }

  private setSocketTimer(socket: any, id: string) {
    this.pingTimers.set(id, setTimeout(() => {
      socket.close();
    }, this.pingTimeout));
    this.emit(socket, PING_EVENT_NAME, {});
  }
}
