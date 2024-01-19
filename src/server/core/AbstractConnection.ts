import { ConnectionOptions } from '../options';
import { AbstractUser } from './AbstractUser';
import { AbstractChannel } from './AbstractChannel';
import { MessagingParams } from '../params';

export abstract class AbstractConnection {
  protected options: ConnectionOptions;
  public channels: Map<string, AbstractChannel>;
  public user: AbstractUser;

  protected constructor(options: ConnectionOptions) {
    this.options = options;
    this.channels = new Map<string, any>();
  }

  public get id() {
    return this.options.id;
  }

  public get connectionToken() {
    return this.options.connectionToken;
  }

  public destruct() {
   try {
     this.options.webSocket.close();
     this.options.webSocket.terminate();
   } catch(e) {
     // TODO: provide verbose
   }
  }

  public send(params: Omit<MessagingParams, 'channel'>) {
    const { webSocket } = this.options;
    if (webSocket && webSocket.OPEN) {
      return new Promise((resolve, reject) => {
        webSocket.send(JSON.stringify(params), (error: Error) => {
          if (error) {
            reject(error)
          } else {
            resolve(true)
          }
        })
      });
    }
  }


}
