import { AbstractIterator, AbstractIteratorOptions, ErrorCallback, ErrorKeyValueCallback } from 'abstract-leveldown'
import heapq from 'heapq'
import ltgt from 'ltgt'
import { KeyVal, StringOrBuffer } from './types'
import { ErrorKeyValueCallbackToPromise } from './util/callback-promise'
import { concat } from './util/concat'
import { normalize_options, test_from_options, test_prefix_from_options } from './util/leveldown-opts'

export class LevelDOWNMountIterator<K extends StringOrBuffer, V> extends AbstractIterator<K, V> {
  _mounts: { mount: K, iterator: AbstractIterator<K, V> }[]
  _options: AbstractIteratorOptions
  _iterator: AsyncIterableIterator<KeyVal<K, V>>
  _test: (k: K) => boolean

  constructor(db, options: AbstractIteratorOptions) {
    super(options)

    this.db = db
    this._options = normalize_options(options)
    this._test = test_from_options(this._options)
    
    // Sorted mount locations
    const _test_prefix = test_prefix_from_options(this._options)
    const _mounts = (Object.keys(db._mounts) as K[]).filter(
      _test_prefix
    )

    // Filter by mounts which could overlap with the iteration
    //  (the root mount and any mount which satisfies the range filter)
    this._mounts = _mounts.map((mount) => {
      let opts = {...this._options}

      if (mount !== '') {
        if (opts.gt !== undefined && opts.gt.slice(0, mount.length) === mount) {
          opts.gt = opts.gt.slice(mount.length)
          opts.lt = opts.lte = undefined
        } else if (opts.gte !== undefined && opts.gte.slice(0, mount.length) === mount) {
          opts.gte = opts.gte.slice(mount.length)
          opts.lt = opts.lte = undefined
        } else if (opts.lt !== undefined && opts.lt.slice(0, mount.length) === mount) {
          opts.lt = opts.lt.slice(mount.length)
          opts.gt = opts.gte = undefined
        } else if (opts.lte !== undefined && opts.lte.slice(0, mount.length) === mount) {
          opts.lte = opts.lte.slice(mount.length)
          opts.gt = opts.gte = undefined
        } else {
          opts.gt = opts.gte = opts.lt = opts.lte = undefined
        }
      }

      return (
        {
          mount: mount, 
          iterator: db._mounts[mount].iterator(opts),
        }
      )
    })

    this._iterator = this.iterator()
  }

  async *iterator() {
    let Q = []
    let done = 0

    // Compare by next iterable key
    const _cmp = this._options.reverse ? (
      (a, b) => ltgt.compare(a.next.key, b.next.key) > 0
    ) : (
      (a, b) => ltgt.compare(a.next.key, b.next.key) < 0
    )

    // Get next iterable for given mount
    const _next = async (mount) => {
      const { key, value } = await ErrorKeyValueCallbackToPromise<K, V>(
        mount.iterator.next.bind(mount.iterator)
      )
      const next_mount = {
        ...mount,
        done: key === undefined && value === undefined,
        next: {
          key: key === undefined ? undefined : concat(mount.mount, key),
          value: value
        }
      }
      return next_mount
    }

    // Initialize heapq with first value from all mounts
    for (const mount of this._mounts) {
      const next_mount = await _next(mount)
      if (!next_mount.done)
        heapq.push(Q, next_mount, _cmp)
    }

    // Work all iterators
    while (Q.length > 0 && done++ < this._options.limit) {
      const mount = heapq.pop(Q, _cmp)
      if (this._test(mount.next.key))
        yield mount.next

      const next_mount = await _next(mount)
      if (!next_mount.done)
        heapq.push(Q, next_mount, _cmp)
    }
  }

  // Get the next key/value reported by all relevant mounts
  _next(callback: ErrorKeyValueCallback<K, V>) {
    this._iterator.next().then(
      ({done, value}) => {
        if(done)
          process.nextTick(callback)
        else
          process.nextTick(callback, null, value.key, value.value)
      }
    ).catch(
      (err) => process.nextTick(callback, err)
    )
  }

  // Cleanly end this iterator by ending any remaining mount iterators
  _end(callback: ErrorCallback) {
    if (this._mounts.length === 0) {
      // No mounts left to end, we're done
      return process.nextTick(callback)
    } else {
      // Use the first mount on the queue
      const mount = this._mounts[0]

      // End the mounts iterator
      return process.nextTick(
        mount.iterator.end.bind(mount.iterator),
        (err) => {
          // Shift the mount off the queue
          this._mounts.shift()
          // Continue ending this iterator reporting any error
          process.nextTick(
            this._end.bind(this),
            (_err) => process.nextTick(callback, _err || err)
          )
        }
      )
    }
  }
}
