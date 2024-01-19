import { AbstractConnection } from './AbstractConnection';
import { AbstractUser } from './AbstractUser';
import { MessagingParams } from '../params';

export abstract class AbstractChannel {
  public connections: Map<string, AbstractConnection>;
  public users: Map<string, AbstractUser>;

  protected constructor() {
    this.connections = new Map<string, AbstractConnection>();
    this.users = new Map<string, any>();
  }

  public send(params: Omit<MessagingParams, 'channel'>) {
    this.connections.forEach( (connection: AbstractConnection) => {
      // provide handling or verbose param
      connection.send(params).catch(console.error);
    })
  }

}
