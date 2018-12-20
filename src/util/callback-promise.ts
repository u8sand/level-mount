import { ErrorKeyValueCallback } from 'abstract-leveldown'
import { KeyVal } from '../types'

export function ErrorKeyValueCallbackToPromise<K, V>(
  func: (cb: ErrorKeyValueCallback<K, V>) => void
): Promise<KeyVal<K, V>> {
  return new Promise((resolve, reject) => {
    process.nextTick(func, (err, key, value) => {
      if (err)
        reject(err)
      else
        resolve({
          key,
          value,
        })
    })
  })
}
