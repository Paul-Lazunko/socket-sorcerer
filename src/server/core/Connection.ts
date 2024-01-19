import { AbstractConnection } from './index';
import { ConnectionOptions } from '../options';

export class Connection extends AbstractConnection {
  constructor(options: ConnectionOptions) {
    super(options);
  }

}
