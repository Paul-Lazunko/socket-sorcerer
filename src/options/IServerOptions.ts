import { ServerOptions } from 'ws';
import { ISocketAuthenticateOptions } from './ISocketAuthenticateOptions';

export interface IServerOptions {
  serverOptions: ServerOptions
  pingInterval: number
  pingTimeout: number
  authenticate: ISocketAuthenticateOptions
  events: Record<string, (...args: any[]) => any | Promise<any>>,
}
