import { EventEmitter } from 'events';
import { Namespace } from '../core';

export interface SocketManagerOptions {
  namespace: Namespace,
  eventEmitter: EventEmitter,
  pingTimeout: number
}
