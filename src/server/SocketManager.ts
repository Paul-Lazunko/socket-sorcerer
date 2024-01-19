import { EventEmitter } from 'events';
import { SocketManagerOptions } from '@options';
import { Namespace } from '@server-core';
import { ChannelingParams, ConnectionJoinChannel, MessagingParams, UserJoinChannel } from '@server-params';
import { WebSocket } from 'ws';

export class SocketManager {
  public namespace: Namespace;
  public eventEmitter: EventEmitter;

  constructor(options: SocketManagerOptions){
    this.namespace = options.namespace;
    this.eventEmitter = options.eventEmitter;
  }

  connect(webSocket: WebSocket, token: string,  user: string, connection: string, channels: string[],) {

  }

  disconnect(connection: string) {
    return this.namespace.disconnect(connection);
  }

  public join(params: ChannelingParams): void {
   const { channel, user, connection } = params;
   if (channel) {
     if (user) {
       return this.namespace.userJoinChannel(user, channel);
     } else if (connection) {
       return this.namespace.connectionJoinChannel(connection, channel)
     }
   }
  }

  public leave(params: ChannelingParams): void {
    const { channel } = params as ChannelingParams;
    if (channel) {
      if ((params as UserJoinChannel).user) {
        return this.namespace.userLeaveChannel((params as UserJoinChannel).user, channel);
      } else if ((params as ConnectionJoinChannel).connection) {
        return this.namespace.connectionLeaveChannel((params as ConnectionJoinChannel).connection, channel)
      }
    }
  }

  public send(params: MessagingParams): void {
    const { channel, ...message } = params;
    const targetChannel = this.namespace.getChannel(channel);
    if (targetChannel) {
      targetChannel.send(message);
    }
  }


}
