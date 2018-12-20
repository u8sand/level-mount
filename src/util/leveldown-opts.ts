import ltgt from 'ltgt'
import { AbstractIteratorOptions } from 'abstract-leveldown'
import { StringOrBuffer } from '../types'

export function normalize_options<K extends StringOrBuffer>(options): AbstractIteratorOptions {
  if (options === undefined) options = {}
  if (options.limit === -1) options.limit = Infinity
  if (options.reverse === true) options.reverse = true
  else options.reverse = false

  let opts: AbstractIteratorOptions = {
    keys: options.keys,
    values: options.values,
    createIfMissing: options.createIfMissing,
    errorIfExists: options.errorIfExists,
    keyEncoding: options.keyEncoding,
    valueEncoding: options.valueEncoding,
    compression: options.compression,
    db: options.db,
    limit: options.limit,
    keyAsBuffer: options.keyAsBuffer,
    valueAsBuffer: options.valueAsBuffer,
    reverse: options.reverse,
    fillCache: options.fillCache,
  }

  if (!options.reverse) {
    let lowerBound = ltgt.lowerBound(options)
    let upperBound = ltgt.upperBound(options)

    if (Buffer.isBuffer(lowerBound)) {
      lowerBound = (<Buffer>lowerBound).toString() as K
    }
    if (Buffer.isBuffer(upperBound)) {
      upperBound = (<Buffer>upperBound).toString() as K
    }

    if (typeof lowerBound === 'undefined' || lowerBound == null || lowerBound == '') {

    } else if (ltgt.lowerBoundInclusive(options)) {
      opts.gte = lowerBound
    } else {
      opts.gt = lowerBound
    }

    if (typeof upperBound === 'undefined' || upperBound == null || upperBound == '') {

    } else if (ltgt.upperBoundInclusive(options)) {
      opts.lte = upperBound
    } else {
      opts.lt = upperBound
    }
  } else {
    let lowerBound = ltgt.upperBound(options)
    let upperBound = ltgt.lowerBound(options)

    if (Buffer.isBuffer(lowerBound)) {
      lowerBound = (<Buffer>lowerBound).toString() as K
    }
    if (Buffer.isBuffer(upperBound)) {
      upperBound = (<Buffer>upperBound).toString() as K
    }

    if (typeof lowerBound === 'undefined' || lowerBound == null || lowerBound == '') {

    } else if (ltgt.upperBoundInclusive(options)) {
      opts.lte = lowerBound
    } else {
      opts.lt = lowerBound
    }

    if (typeof upperBound === 'undefined' || upperBound == null || upperBound == '') {

    } else if (ltgt.lowerBoundInclusive(options)) {
      opts.gte = upperBound
    } else {
      opts.gt = upperBound
    }
  }

  return opts
}

export function test_from_options<K extends StringOrBuffer>(options: AbstractIteratorOptions) {
  return (k: K) => {
    return (
      ((options.lte !== undefined) ? ltgt.compare(
        String(k),
        String(options.lte)
      ) <= 0 : true)
      && ((options.lt !== undefined) ? ltgt.compare(
        String(k),
        String(options.lt)
      ) < 0 : true)
      && ((options.gte !== undefined) ? ltgt.compare(
        String(k),
        String(options.gte)
      ) >= 0 : true)
      && ((options.gt !== undefined) ? ltgt.compare(
        String(k),
        String(options.gt)
      ) > 0 : true)
    )
  }
}

export function test_prefix_from_options<K extends StringOrBuffer>(options: AbstractIteratorOptions) {
  return (k: K) => {
    return (
      ((options.lte !== undefined) ? ltgt.compare(
        String(k),
        String(options.lte).slice(0, k.length)
      ) <= 0 : true)
      && ((options.lt !== undefined) ? ltgt.compare(
        String(k),
        String(options.lt).slice(0, k.length)
      ) <= 0 : true)
      && ((options.gte !== undefined) ? ltgt.compare(
        String(k),
        String(options.gte).slice(0, k.length)
      ) >= 0 : true)
      && ((options.gt !== undefined) ? ltgt.compare(
        String(k),
        String(options.gt).slice(0, k.length)
      ) >= 0 : true)
    )
  }
}
