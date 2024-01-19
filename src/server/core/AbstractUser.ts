import { AbstractConnection } from './AbstractConnection';
import { AbstractChannel } from './AbstractChannel';
import { UserOptions } from '../options';

export abstract class AbstractUser {

  protected options: UserOptions;
  public connections: Map<string, AbstractConnection>;
  public channels: Map<string, AbstractChannel>;

  protected constructor(options: UserOptions) {
    this.options = options;
    this.connections = new Map<string, AbstractConnection>();
    this.channels = new Map<string, AbstractChannel>();
  }

  public get id() {
    return this.options.id;
  }

}
