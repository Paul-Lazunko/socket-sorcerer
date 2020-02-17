export const PING_EVENT_NAME = 'ping'
export const PONG_EVENT_NAME = 'pong'
export const CONNECT_EVENT_NAME = 'connect'
export const DISCONNECT_EVENT_NAME = 'disconnect'

export const ANY_EVENT_MARKER: string = '*';

export const ANY_EVENT_EXCEPTIONS: string[] = [
  CONNECT_EVENT_NAME,
  DISCONNECT_EVENT_NAME,
  PONG_EVENT_NAME,
  PING_EVENT_NAME
];
