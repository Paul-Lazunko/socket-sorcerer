import crypto from 'crypto';

export function uidHelper () {
  return crypto
    .createHash('md5')
    .update(`${new Date().getTime()}-${Math.round(Math.random() * 1000)}`)
    .digest('hex');
}
