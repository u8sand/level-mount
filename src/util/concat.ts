import { StringOrBuffer } from '../types'

export function concat<K extends StringOrBuffer>(prefix: K, key: K, force?: boolean): K {
  if (typeof key === 'string' && (force || key.length)) return prefix + key as K
  if (Buffer.isBuffer(key) && (force || key.length))
    return Buffer.concat([Buffer.from(String(prefix)), key as Buffer]) as K
  return key
}
