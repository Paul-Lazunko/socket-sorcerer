import { ServerOptions } from 'ws';
import { ISocketAuthenticateOptions } from './ISocketAuthenticateOptions';
import { IDictionary } from './IDictionary';
import { TEventHandler } from '../type';

export interface IServerOptions {
  serverOptions: ServerOptions
  pingInterval: number
  pingTimeout: number
  authenticate: ISocketAuthenticateOptions
  events: IDictionary<TEventHandler>
}
