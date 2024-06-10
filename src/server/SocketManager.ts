import { WebSocket } from 'ws';
import { AbstractChannel, Namespace } from '@server-core';
import { SocketManagerOptions } from '@server-options';
import { ChannelingParams, ConnectionJoinChannel, MessagingParams, UserJoinChannel } from '@server-params';

export class SocketManager {
  public namespace: Namespace;
  private verbose: boolean;
  private logger: any;

  constructor(options: SocketManagerOptions) {
    this.namespace = options.namespace;
    this.verbose = options.verbose;
    this.logger = options.logger;
  }

  connect(webSocket: WebSocket, token: string,  user: string, connection: string, channels: string[]) {
    return this.namespace.connect(webSocket, user, connection, channels, token)
  }

  disconnect(connection: string) {
    this.namespace.disconnect(connection);
  }

  closeByToken(token: string) {
    return this.namespace.disconnectByToken(token);
  }

  public join(params: ChannelingParams): void {
   const { channel } = params;
   if (channel) {
     if ((params as UserJoinChannel).user) {
       const user = (params as UserJoinChannel).user;
       if (this.verbose) {
         this.logger.log(`User ${user} is joining channel ${channel}`);
       }
       return this.namespace.userJoinChannel((params as UserJoinChannel).user, channel);
     } else if ((params as ConnectionJoinChannel).connection) {
       const connection = (params as ConnectionJoinChannel).connection;
       if (this.verbose) {
         this.logger.log(`Socket ${connection} is joining channel ${channel}`);
       }
       return this.namespace.connectionJoinChannel((params as ConnectionJoinChannel).connection, channel)
     }
   }
  }

  public leave(params: ChannelingParams): void {
    const { channel } = params as ChannelingParams;
    if (channel) {
      if ((params as UserJoinChannel).user) {
        const user = (params as UserJoinChannel).user;
        if (this.verbose) {
          this.logger.log(`User ${user} is leaving channel ${channel}`);
        }
        return this.namespace.userLeaveChannel((params as UserJoinChannel).user, channel);
      } else if ((params as ConnectionJoinChannel).connection) {
        const connection = (params as ConnectionJoinChannel).connection;
        if (this.verbose) {
          this.logger.log(`Socket ${connection} is leaving channel ${channel}`);
        }
        return this.namespace.connectionLeaveChannel((params as ConnectionJoinChannel).connection, channel)
      }
    }
  }

  public send(params: MessagingParams): void {
    const { channel, ...message } = params;
    const targetChannel: AbstractChannel = this.namespace.getChannel(channel);
    if (this.verbose) {
      this.logger.log(`Sending event ${message.event} to channel ${channel}`);
      this.logger.log({ channel: targetChannel });
    }
    if (targetChannel) {
      targetChannel.send(message);
    } else {
      if (this.verbose) {
        this.logger.log(`Channel ${channel} doesn't exist`);
      }
    }
  }

  public stats() {
    return this.namespace.stats();
  }

}
