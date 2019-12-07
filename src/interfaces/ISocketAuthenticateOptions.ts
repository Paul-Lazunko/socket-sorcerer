export interface ISocketAuthenticateOptions {
  eventName: string,
  eventHandler: (value:string)  =>  Promise<string>,
  authTimeout: number
}
