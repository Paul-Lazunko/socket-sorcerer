import { ServerOptions } from 'ws';
import { SocketAuthenticateOptions } from './SocketAuthenticateOptions';

interface Verbose {
  enable: boolean,
  displayMetricsOnly?: boolean,
  displayMetricsInterval: number
}

export interface WebSocketServerOptions {
  serverOptions: ServerOptions;
  pingInterval: number;
  pingTimeout: number;
  disablePing?: boolean;
  optionalAuth?: boolean;
  authenticate: SocketAuthenticateOptions
  events: Record<string, (...args: any[]) => any | Promise<any>>,
  verbose?: Verbose;
  logger?: any;
  blackList?: string[]
}
