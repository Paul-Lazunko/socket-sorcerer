import { AbstractChannel } from './AbstractChannel';
import { AbstractUser } from './AbstractUser';
import { AbstractConnection } from './AbstractConnection';
import { WebSocket } from 'ws';

export abstract class AbstractNamespace {

  protected channels: Map<string, AbstractChannel>;
  protected users: Map<string, AbstractUser>;
  protected connections: Map<string, AbstractConnection>;
  protected connectionsByToken: Map<string, string>;

  protected constructor() {
    this.channels = new Map<string, AbstractChannel>();
    this.users = new Map<string, AbstractUser>();
    this.connections = new Map<string, AbstractConnection>();
    this.connectionsByToken = new Map<string, string>();
  }

  protected abstract createChannel(name: string): void;
  protected abstract createUser(id: string): void;

  public abstract connect(webSocket: WebSocket, uid?:string, cid?: string, channels?: string[]): void;
  public abstract disconnect(cid?:string): void;


  public connectionJoinChannel(id: string, name: string) {
    this.createChannel(name);
    const connection: AbstractConnection = this.connections.get(id);

    const channel: AbstractChannel = this.channels.get(name);
    connection.channels.set(name, channel);
    channel.connections.set(id, connection);
    // ?
    if (connection.user) {
      channel.users.set(connection.user.id, connection.user);
    }
  }

  public connectionLeaveChannel(id: string, name: string) {
    const channel: AbstractChannel = this.channels.get(name);
    const connection: AbstractConnection = this.connections.get(id);
    if (connection) {
      const user: AbstractUser = connection.user;
      if (user?.channels.has(name) && user?.connections.size === 1) {
        channel.users.delete(user.id);
        user.channels.delete(name)
      }
    }
    if (channel) {
      channel.connections.delete(id);
      connection.channels.delete(name);

      if (!channel.connections.size) {
        this.channels.delete(name);
      }
    }

  }

  public userJoinChannel(id: string, name: string) {
    const self = this;
    this.createUser(id);
    this.createChannel(name);
    const user: AbstractUser = this.users.get(id);
    const channel: AbstractChannel = this.channels.get(name);
    user.channels.set(name, channel)
    channel.users.set(id, user);
    user.connections.forEach((connection: AbstractConnection) => {
      channel.connections.set(connection.id, connection)
      self.connections.get(connection.id).channels.set(name, channel);
    })
  }

  public userLeaveChannel(id: string, name: string) {
    const self = this;
    const channel: AbstractChannel = this.channels.get(name);
    const user: AbstractUser = this.users.get(id);
    if (user) {
      user.channels.delete(name)
    }
    if (user && channel) {
      user.connections.forEach((connection: AbstractConnection) => {
        channel.connections.delete(connection.id);
        connection.channels.delete(name);
      });
    }
    if (channel) {
      channel.users.delete(id);
      if (!channel.users.size && !channel.connections.size) {
        this.channels.delete(name);
      }
    }

  }

  deleteConnection(cid: string) {
    if (this.connections.has(cid)) {
      const self = this;
      const connection: AbstractConnection = this.connections.get(cid);
      const { user } = connection;
      connection.channels.forEach((channel: AbstractChannel, name: string) => self.connectionLeaveChannel(cid, name));
      user.connections.delete(cid);
      if (!user.connections.size) {
        user.channels.forEach((channel: AbstractChannel, name: string) => self.userLeaveChannel(user.id, name));
        this.users.delete(user.id)
      }
      connection.destruct();
      this.connections.delete(cid);
      this.connectionsByToken.delete(connection.connectionToken);
    }
  }

  deleteUser(uid: string) {
    if (this.users.has(uid)) {
      const user: AbstractUser = this.users.get(uid);
      user.channels.forEach((channel: AbstractChannel, name: string) => this.userLeaveChannel(uid, name) );
      user.connections.forEach((connection: AbstractConnection, cid: string) => this.connections.delete(cid))
      this.users.delete(uid);
    }
  }

  deleteChannel(name: string) {
    const channel: AbstractChannel = this.channels.get(name);
    if (channel) {
      channel.connections.forEach((connection: AbstractConnection, cid: string) => this.connectionLeaveChannel(cid, name))
      channel.users.forEach((user: AbstractUser, uid: string) => this.userLeaveChannel(uid, name));
      this.channels.delete(name);
    }
  }

  public stats() {
    return {
      channels: this.channels.size,
      users: this.users.size,
      connections: this.connections.size
    }
  }


  public getChannel(name: string): AbstractChannel {
    return this.channels.get(name);
  }


}
