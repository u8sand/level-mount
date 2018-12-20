declare module 'ltgt' {
  export type Range<K> = {
    gt?: K
    gte?: K
    lt?: K
    lte?: K
    reverse?: boolean
    start?: K
    end?: K
  }
  export function upperBound<K>(range: Range<K>): K
  export function upperBoundKey<K>(range: Range<K>): K
  export function upperBoundInclusive<K>(range: Range<K>): boolean
  export function lowerBound<K>(range: Range<K>): K
  export function lowerBoundKey<K>(range: Range<K>): K
  export function lowerBoundInclusive<K>(range: Range<K>): boolean
  export function filter<K>(range: Range<K>, cmp?: (a: K, b: K) => number): (k: K) => boolean
  export function compare<K>(a: K, b: K): number
  export function contains<K>(range: Range<K>, k: K, cmp?: (a: K, b: K) => number): boolean
}
