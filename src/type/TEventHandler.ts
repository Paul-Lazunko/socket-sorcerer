export type TEventHandler =  (data: any, uid: string, socket: any) => boolean | Promise<boolean>;
