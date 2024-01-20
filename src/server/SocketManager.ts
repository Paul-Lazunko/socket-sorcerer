import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import { Namespace } from '@server-core';
import { SocketManagerOptions } from '@server-options';
import { ChannelingParams, ConnectionJoinChannel, MessagingParams, UserJoinChannel } from '@server-params';

export class SocketManager {
  public namespace: Namespace;
  public eventEmitter: EventEmitter;

  constructor(options: SocketManagerOptions) {
    this.namespace = options.namespace;
    this.eventEmitter = options.eventEmitter;
  }

  connect(webSocket: WebSocket, token: string,  user: string, connection: string, channels: string[],) {
    return this.namespace.connect(webSocket, user, connection, channels, token)
  }

  disconnect(connection: string) {
    return this.namespace.disconnect(connection);
  }

  closeByToken(token: string) {
    return this.namespace.disconnectByToken(token);
  }

  public join(params: ChannelingParams): void {
   const { channel } = params;
   if (channel) {
     if ((params as UserJoinChannel).user) {
       return this.namespace.userJoinChannel((params as UserJoinChannel).user, channel);
     } else if ((params as ConnectionJoinChannel).connection) {
       return this.namespace.connectionJoinChannel((params as ConnectionJoinChannel).connection, channel)
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

  public stats() {
    return this.namespace.stats();
  }


}
