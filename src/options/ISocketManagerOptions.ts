export interface ISocketManagerOptions {
  rooms: Map<string, string[]>,
  users: Map<string, string[]>,
  sockets: Map<string, any>,
  socketsByToken: Map<string, string>,
}
