import { AbstractBatch, AbstractGetOptions, AbstractIterator, AbstractIteratorOptions, AbstractLevelDOWN, AbstractOptions, ErrorCallback, ErrorValueCallback } from 'abstract-leveldown'
import { LevelDOWNMountIterator } from './level-mount-iterator'
import { StringOrBuffer } from './types'
import { EasierLevelDOWNEmitter, EasierLevelDOWNBatchOpts } from 'easier-abstract-leveldown'
import { concat } from './util/concat';

export type LevelDOWNMounts = Array<{
  mount: string,
  db: AbstractLevelDOWN
  options?: any
}>
export interface LevelDOWNMountOptions {
  db: AbstractLevelDOWN
  options?: any
  mounts?: LevelDOWNMounts
}

/**
 * LevelMount, like file system directory mounts and somewhat like the opposite of subleveldown.
 * Can be used *with* subleveldown. Examples:
 * 
 * const hybrid_db = levelup(levelmount({
 *   db: leveldown('root'),
 *   options: {}, // options for leveldown
 *   mounts: [
 *     {
 *       mount: '!tmp!',
 *       db: memdown(),
 *     },
 *     {
 *       mount: '!var!',
 *       db: someotherdown(),
 *       options: {}, // someotherdown options for _open
 *     }
 *   ],
 * })
 * 
 * hybrid_db.put('hello', 'world') // ends up in root leveldown with key `hello`
 * hybrid_db.put('!tmp!blah', 'bleh') // ends up in memdown with key `blah`
 * 
 * const var_db = subleveldown(hybrid_db, 'var', { separator: '!' })
 * var_db.put('goodbye', 'world') // ends up in someotherdown with key `goodbye`
 */
export class LevelDOWNMount<K extends StringOrBuffer = string, V = any, O extends LevelDOWNMountOptions = any> extends AbstractLevelDOWN<K, V> {
  _mounts: LevelDOWNMounts = []

  constructor(opts: O) {
    super(undefined)

    // Sort mount locations by length (largest first)
    this._mounts = [
      {
        db: opts.db,
        mount: '',
        options: opts.options,
      },
      ...(opts.mounts || []),
    ].sort((a, b) => b.mount.length - a.mount.length)
  }

  // Resolve the mount and internal path that a given key falls under
  _resolve_mount(key: K) {
    // TODO: improve mount search complexity?
    // TODO: handle keys that aren't strings?

    // Coerce key to string
    const key_str = String(key)

    // Select the first mount which matches the prefix of the key
    //  (the root mount with prefix '' will get matched as a fallback)
    for (const { db, mount } of this._mounts) {
      if (key_str.slice(0, mount.length) === mount) {
        return {
          db,
          mount,
          path: key_str.slice(mount.length) as K,
        }
      }
    }
    throw new Error('An impossible error occured')
  }

  _open(opts: O, callback: ErrorCallback) {
    Promise.all(
      this._mounts.map(({ db, options }) =>
        new Promise((resolve, reject) => {
          db.open(options, (err) => {
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

  _close(callback: ErrorCallback) {
    Promise.all(
      this._mounts.map(({ db }) =>
        new Promise((resolve, reject) => {
          db.close((err) => {
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
    const { db, path } = this._resolve_mount(key)
    db.get(path, options, callback)
  }

  _put(key: K, val: V, options: AbstractOptions, callback: ErrorCallback) {
    // Forward to underlying store
    const { db, path } = this._resolve_mount(key)
    db.put(path, val, options, callback)
  }

  _del(key: K, options: AbstractOptions, callback: ErrorCallback) {
    // Forward to underlying store
    const { db, path } = this._resolve_mount(key)
    db.del(path, options, callback)
  }

  _batch(array: ReadonlyArray<AbstractBatch<K, V>>, options: AbstractOptions, cb: ErrorCallback) {
    // Group batch operations by resolved mount
    const dbs = {}
    const ops = {}
    for (const op of array) {
      const { mount, db, path } = this._resolve_mount(op.key)
      if (ops[mount] === undefined) {
        ops[mount] = []
        dbs[mount] = db
      }
      ops[mount].push({ ...op, key: path })
    }

    // Forward batch options to underlying stores
    Promise.all(
      Object.keys(ops).map((mount) =>
        new Promise((resolve, reject) => {
          dbs[mount].batch(ops[mount], options, (err) => {
            if (err) reject(err)
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

  // If the underlying store supports the EasierAbstractLevelDOWN changes
  //  extension, we'll capture those changes and emit them on this store.
  changes(): EasierLevelDOWNEmitter<K, V> {
    const newEmitter = new EasierLevelDOWNEmitter<K, V>()
    for (const {mount, db} of this._mounts) {
      if (db.changes !== undefined) {
        db.changes().onPut(
          (key: K, value: V) =>
            newEmitter.emitPut(concat(mount as K, key), value)
        ).onDel(
          (key: K) =>
            newEmitter.emitDel(concat(mount as K, key))
        ).onBatch(
          (array: EasierLevelDOWNBatchOpts<K, V>) =>
            newEmitter.emitBatch(
              array.map((op) => {
                if (op.type === 'put') {
                  return {
                    type: op.type,
                    key: concat(mount as K, op.key),
                    value: op.value,
                  }
                } else if (op.type === 'del') {
                  return {
                    type: op.type,
                    key: concat(mount as K, op.key),
                  }
                } else
                  throw new Error(`Unrecognized batch operation '${(op as { type: string }).type}'`)
              })
            )
        )
      }
    }

    return newEmitter
  }
}