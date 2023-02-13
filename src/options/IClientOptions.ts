export interface IClientOptions {
  serverUrl: string
  token: string
  doReconnectOnClose: boolean
  reconnectInterval: number
  authEventName: string
  events: Record<string, (...args: any[]) => any | Promise<any>>,
  hooks?: {
    onOpen?:  () => void,
    onClose?: () => void
  }
}
