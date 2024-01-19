import { AbstractUser } from './index';
import { UserOptions } from '../options';

export class User extends AbstractUser {
  constructor(options: UserOptions) {
    super(options);
  }
}
