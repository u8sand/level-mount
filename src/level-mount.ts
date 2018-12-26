import { StringOrBuffer } from './types'
import { AbstractLevelDOWN, AbstractGetOptions, AbstractOptions, ErrorCallback, ErrorValueCallback, AbstractIteratorOptions, AbstractIterator, AbstractBatch, AbstractChainedBatch, ErrorKeyValueCallback } from 'abstract-leveldown'
import { LevelDOWNMountIterator } from './level-mount-iterator'

export class LevelDOWNMount<K extends StringOrBuffer = string, V = any, O = any> extends AbstractLevelDOWN<K, V> {
  _mounts: {
    [key: string]: AbstractLevelDOWN<K, V>
  } = {}

  constructor(root: AbstractLevelDOWN<K, V>, location?: string) {
    super(location)

    // Mount the root store to an empty prefix
    this.mount('', root)
  }

  // Mount a given prefix to an AbstractLevelDOWN-compatible store
  mount(mount_loc: string, mount: AbstractLevelDOWN<K, V>) {
    this._mounts[mount_loc] = mount
  }

  // Resolve the mount and internal path that a given key falls under
  _resolve_mount(key: K) {
    // TODO: improve mount search complexity?
    // TODO: handle keys that aren't strings?

    // Coerce key to string
    const key_str = String(key)
    
    // Sort mount locations by length (largest first)
    const mounts = Object.keys(this._mounts).sort((a, b) => b.length - a.length)

    // Select the first mount which matches the prefix of the key
    //  (the root mount with prefix '' will get matched as a fallback)
    for (const mount_loc of mounts) {
      if (key_str.slice(0, mount_loc.length) === mount_loc) {
        return {
          mount: mount_loc,
          path: key_str.slice(mount_loc.length) as K,
        }
      }
    }
    throw new Error('An impossible error occured')
  }

  _open(options: O, callback: ErrorCallback) {
    Promise.all(
      Object.values(this._mounts).map((mount) =>
        new Promise((resolve, reject) => {
          // TODO: get options passed through
          mount.open((err) => {
            if(err) reject(err)
            else resolve()
          })
        })
      )
    ).then(
      () => process.nextTick(callback)
    ).catch(
      (err) => callback(err)
    )
  }

  _close(callback: ErrorCallback) {
    Promise.all(
      Object.values(this._mounts).map((mount) =>
        new Promise((resolve, reject) => {
          mount.close((err) => {
            if (err) reject(err)
            else resolve()
          })
        })
      )
    ).then(
      () => process.nextTick(callback)
    ).catch(
      (err) => callback(err)
    )
  }

  _get(key: K, options: AbstractGetOptions, callback: ErrorValueCallback<V>) {
    // Forward to underlying store
    const { mount, path } = this._resolve_mount(key)
    this._mounts[mount].get(path, options, callback)
  }

  _put(key: K, val: V, options: AbstractOptions, callback: ErrorCallback) {
    // Forward to underlying store
    const { mount, path } = this._resolve_mount(key)
    this._mounts[mount].put(path, val, options, callback)
  }

  _del(key: K, options: AbstractOptions, callback: ErrorCallback) {
    // Forward to underlying store
    const { mount, path } = this._resolve_mount(key)
    this._mounts[mount].del(path, options, callback)
  }

  _batch(array: ReadonlyArray<AbstractBatch<K, V>>, options: AbstractOptions, cb: ErrorCallback) {
    // Group batch operations by resolved mount
    const ops = array.reduce((grouped_ops, op: AbstractBatch<K, V>) => {
      const { mount, path } = this._resolve_mount(op.key)
      if (grouped_ops[mount] === undefined)
        grouped_ops[mount] = []
      grouped_ops[mount].push({ ...op, key: path })
      return grouped_ops
    }, {})

    // Forward batch options to underlying stores
    Promise.all(
      Object.keys(ops).map((mount) =>
        new Promise((resolve, reject) => {
          this._mounts[mount].batch(ops[mount], options, (err) => {
            if(err) reject(err)
            else resolve()
          })
        })
      )
    ).then(
      () => process.nextTick(cb)
    ).catch(
      (err) => process.nextTick(cb, err)
    )
  }

  _iterator(options: AbstractIteratorOptions<K>): AbstractIterator<K, V> {
    return new LevelDOWNMountIterator(this, options)
  }
}
