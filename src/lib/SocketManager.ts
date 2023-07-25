import { ISocketManagerOptions } from '../options';
import { checkCompletion } from '../helpers';

export class SocketManager {
  public rooms: Map<string, string[]>;
  private users: Map<string, string[]>;
  private sockets: Map<string, any>;
  private socketsByToken: Map<string, string>;

  constructor(options: ISocketManagerOptions){
    this.rooms = options.rooms;
    this.users = options.users;
    this.sockets = options.sockets;
    this.socketsByToken = options.socketsByToken;
  }

  public join(roomName: string, userId: string): void {
    const room: string[] = this.getRoom(roomName);
    if ( ! room ) {
      this.rooms.set(roomName,[userId]);
    } else {
      // Non-unique array of ids allows proper usage of multiple connections for the same user
      if (!room.includes(userId)) {
        room.push(userId);
      }
    }

  }

  public leave(roomName: string, userId: string): void {
    const room: string[] = this.getRoom(roomName);
    if ( room ) {
      if ( room.includes(userId) ) {
        room.splice(room.indexOf(userId), 1);
      }
      if ( ! room.length ) {
        this.rooms.delete(roomName);
      }
    }
  }

  public closeByToken(token: string) {
    const socketId = this.socketsByToken.get(token);
    if ( socketId ) {
      const socket = this.sockets.get(socketId);
      if ( socket ) {
        socket.close();
      }
    }
  }

  private sendTo(roomName: string, eventName: string, data: any): void {
    const room: string[] = this.getRoom(roomName);
    if ( room && room.length ) {
      let sockets: string[] = [];
      // Due to changes at the line #22 - prevent sending the same multiple times
      room.forEach((userId: string) => {
        if (this.users.has(userId)) {
          const socketIds: string[] = this.users.get(userId);
          socketIds.forEach((socketId: string) => {
            sockets.push(socketId);
          });
        }
      });
      data.room = roomName;
      sockets = Array.from(new Set(sockets));
      sockets.forEach((socketId: string) => {
        if ( this.sockets.has(socketId) ) {
          this.sockets.get(socketId).send(JSON.stringify({ data, event: eventName }));
        }
      })
    }
  }

  public to (roomName: string) {
    let eventName: string;
    let data: string;
    const self = this;
    return {
      event(name: string) {
        eventName = name;
        const isComplete: boolean = checkCompletion(roomName, eventName, data, self.sendTo.bind(self));
        return isComplete ? {} : this;
      },
      data(obj: any) {
        data = obj;
        const isComplete: boolean = checkCompletion(roomName, eventName, data, self.sendTo.bind(self));
        return isComplete ? {} : this;
      }
    }
  }

  private getRoom(roomName: string): string[] {
    return this.rooms.get(roomName);
  }
}
