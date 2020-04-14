import { ISocketManagerOptions } from '../interface';
import { checkCompletion } from '../helper';

export class SocketManager {
  private rooms: Map<string, string[]>;
  private users: Map<string, string[]>;
  private sockets: Map<string, any>;

  constructor(options: ISocketManagerOptions){
    this.rooms = options.rooms;
    this.users = options.users;
    this.sockets = options.sockets;
  }

  public join(roomName: string, userId: string): void {
    const room: string[] = this.getRoom(roomName);
    if ( ! room ) {
      this.rooms.set(roomName,[userId]);
    } else if ( !room.includes(userId) ) {
      room.push(userId);
    }
  }

  public leave(roomName: string, userId: string): void {
    const room: string[] = this.getRoom(roomName);
    if ( room ) {
      if ( !room.includes(userId) ) {
        room.splice(room.indexOf(userId), 1);
      }
      if ( ! room.length ) {
        this.rooms.delete(roomName);
      }
    }
  }

  private sendTo(roomName: string, eventName: string, data: any): void {
    const room: string[] = this.getRoom(roomName);
    if ( room && room.length ) {
      const sockets: string[] = [];
      room.forEach((userId: string) => {
        const socketIds: string[] = this.users.get(userId);
        socketIds.forEach((socketId: string) => {
          sockets.push(socketId);
        })
      });
      data.room = roomName;
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
