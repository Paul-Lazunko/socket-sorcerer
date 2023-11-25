import { v4 } from 'uuid';

export function uidHelper () {
  return `${v4()}-${new Date().getTime()}`;
}
