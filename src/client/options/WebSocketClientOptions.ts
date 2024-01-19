export interface WebSocketClientOptions {
  serverUrl: string
  token: any
  doReconnectOnClose: boolean
  reconnectInterval: number
  authEventName: string
  events: Record<string, (...args: any[]) => any | Promise<any>>,
  hooks?: {
    onOpen?:  () => void,
    onClose?: () => void
  }
}
