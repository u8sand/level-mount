import test from 'tape'
import assert from 'assert'
import { streamPromise } from './stream-promise';

/**
 * Convert tape tests into mocha assertions!
 * 
 * @example
 * tape_it('my mocha tape test assertion', function (test) {
 *   test('my tape test', function (t) {
 *     t.equal(1, 1)
 *   })
 * })
 * 
 * @param desc Description of the test (like normal `it`)
 * @param func Test function accepting test harness as parameter
 * @returns Same the resulting `it` mocha construct
 */
export default function tape_it(desc, func) {
  return it(desc, async () => {
    const htest = test.createHarness()
    const stream = htest.createStream()
    const data_promise = streamPromise<string>(stream);
    const htest_promise = func(htest)

    let name
    for(const row of await data_promise) {
      if (row.indexOf('#') === 0)
        name = row.slice(2)
      if (row.indexOf('ok') === 0)
        assert.equal(true, true, name)
      else if (row.indexOf('not ok') === 0)
        assert.equal(true, false, name)
    }

    await htest_promise
  })
}
