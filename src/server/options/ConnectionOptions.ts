import { WebSocket } from 'ws';

export interface ConnectionOptions {
  id: string;
  webSocket: WebSocket,
  connectionToken?: string;
}
