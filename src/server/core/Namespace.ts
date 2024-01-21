import { WebSocket } from 'ws';
import { v4 } from 'uuid';

import {
  AbstractConnection,
  AbstractNamespace,
  Channel,
  User,
  Connection, AbstractChannel, AbstractUser,
} from './index';


export class Namespace extends AbstractNamespace {
  constructor() {
    super();
  }

  protected createChannel(name: string) {
    if (!this.channels.has(name)) {
      this.channels.set(name, new Channel() as AbstractChannel)
    }
  }

  protected createUser(id: string) {
    if (!this.users.has(id)) {
      this.users.set(id, new User({ id }) as AbstractUser)
    }
  }

  public connect(webSocket: WebSocket, uid: string, cid?: string, channels?: string[], token?: string) {
    const self = this;
    cid = cid || v4();
    if (token) {
      this.connectionsByToken.set(token, cid)
    }
    channels = channels ? [...channels, uid, cid ] : [uid, cid];
    this.createUser(uid)
    const user = this.users.get(uid);
    const connection: AbstractConnection = new Connection({ id: cid, webSocket }) as AbstractConnection;
    connection.user = user;
    this.connections.set(cid, connection);
    user.connections.set(cid, connection);
    // check channels
    channels.forEach((channel: string) => {
      self.createChannel(channel)
      if (channel !== cid) {
        self.userJoinChannel(uid, channel)
      } else {
        self.connectionJoinChannel(cid, channel)
      }
    });
  }

  public disconnect(cid: string) {
    this.deleteConnection(cid);
  }
  public disconnectByToken(token: string) {
    if (token && this.connectionsByToken.has(token)) {
      this.deleteConnection(this.connectionsByToken.get(token));

    }
  }


}
