export interface SocketAuthenticateOptions {
  eventName: string,
  eventHandler: (value:string)  =>  Promise<string>,
  authTimeout: number
}
