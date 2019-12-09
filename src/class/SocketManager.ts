import { ISocketManagerOptions } from '../interface';

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
    } else {
      room.push(userId);
    }
  }

  public leave(roomName: string, userId: string): void {
    const room: string[] = this.getRoom(roomName);
    if ( room ) {
      room.splice(room.indexOf(userId), 1);
      if ( ! room.length ) {
        this.rooms.delete(roomName);
      }
    }
  }

  public to(roomName: string, event: string, data: any): void {
    const room: string[] = this.getRoom(roomName);
    if ( room ) {
      const sockets: string[] = [];
      room.forEach((userId: string) => {
        const socketIds: string[] = this.users.get(userId);
        socketIds.forEach((socketId: string) => {
          sockets.push(socketId);
        })
      });
      sockets.forEach((socketId: string) => {
        this.sockets.get(socketId).send(JSON.stringify({ event, data}));
      })
    }
  }

  private getRoom(roomName: string): string[] {
    return this.rooms.get(roomName);
  }
}
