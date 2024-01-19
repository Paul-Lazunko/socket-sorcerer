import { EventEmitter } from 'events';
import { Namespace } from '@server-core';

export interface SocketManagerOptions {
  namespace: Namespace,
  eventEmitter: EventEmitter
}
