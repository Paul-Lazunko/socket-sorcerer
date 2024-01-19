import { ServerOptions } from 'ws';
import { SocketAuthenticateOptions } from './SocketAuthenticateOptions';

export interface WebSocketServerOptions {
  serverOptions: WebSocketServerOptions
  pingInterval: number
  pingTimeout: number
  authenticate: SocketAuthenticateOptions
  events: Record<string, (...args: any[]) => any | Promise<any>>,
  pingDataGetter?: (...args: any[]) => Promise<any>
}
