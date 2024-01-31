import { AFTER_CONNECT_EVENT_NAME, CONNECT_EVENT_NAME, DISCONNECT_EVENT_NAME } from '../../server/constants';

export const PING_EVENT_NAME = 'ping';
export const PONG_EVENT_NAME = 'pong';
export const AUTH_SUCCESS_EVENT = 'authSuccess'
export const AUTH_FAILED_EVENT = 'authFailed'

export const ANY_EVENT_MARKER: string = '*';

export const ANY_EVENT_EXCEPTIONS: string[] = [
  CONNECT_EVENT_NAME,
  AFTER_CONNECT_EVENT_NAME,
  DISCONNECT_EVENT_NAME,
  PONG_EVENT_NAME,
  PING_EVENT_NAME
];
