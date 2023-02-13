import crypto from 'crypto';
import { now } from 'microtime';

export function uidHelper () {
  return crypto
    .createHash('md5')
    .update(`${now()}-${Math.random() * 1000}`)
    .digest('hex');
}
