import { IDictionary } from './IDictionary';
import { TEventHandler } from '../type';

export interface IClientOptions {
  serverUrl: string
  token: string
  doReconnectOnClose: boolean
  reconnectInterval: number
  authEventName: string
  events: IDictionary<TEventHandler>
}
