import { AbstractLevelDOWN } from 'abstract-leveldown';
import tape_it from '../util/tape_it';

// Fix to annoying issue--Typescript and babel-typescript handle default imports differently
const testCommon = require('abstract-leveldown/test/common')

export function AbstractLevelDOWNTestSuite<T extends AbstractLevelDOWN<any, any>>(
  desc: string,
  LevelDOWNFactory: () => T
) {
  describe(desc, () => {
    tape_it('open-test.args', async (htest) => {
      require('abstract-leveldown/test/open-test').args(
        htest,
        testCommon({
          test: htest,
          factory: LevelDOWNFactory,
        })
      )
    })
    tape_it('open-test.open', async (htest) => {
      require('abstract-leveldown/test/open-test').open(
        htest,
        testCommon({
          test: htest,
          factory: LevelDOWNFactory,
        })
      )
    })
    tape_it('del-test.all', async (htest) => {
      require('abstract-leveldown/test/del-test').all(
        htest,
        testCommon({
          test: htest,
          factory: LevelDOWNFactory,
        })
      )
    })
    tape_it('get-test.all', async (htest) => {
      require('abstract-leveldown/test/get-test').all(
        htest,
        testCommon({
          test: htest,
          factory: LevelDOWNFactory,
        })
      )
    })
    tape_it('put-test.all', async (htest) => {
      require('abstract-leveldown/test/put-test').all(
        htest,
        testCommon({
          test: htest,
          factory: LevelDOWNFactory,
        })
      )
    })
    // tape_it('put-get-del-test.all', async (htest) => {
    //   require('abstract-leveldown/test/put-get-del-test').all(
    //     htest,
    //     testCommon({
    //       test: htest,
    //       factory: LevelDOWNFactory,
    //     })
    //   )
    // })
    // tape_it('batch-test.all', async (htest) => {
    //   require('abstract-leveldown/test/batch-test').all(
    //     htest,
    //     testCommon({
    //       test: htest,
    //       factory: LevelDOWNFactory,
    //     })
    //   )
    // })
    // tape_it('chained-batch-test.all', async (htest) => {
    //   require('abstract-leveldown/test/chained-batch-test').all(
    //     htest,
    //     testCommon({
    //       test: htest,
    //       factory: LevelDOWNFactory,
    //     })
    //   )
    // })
    tape_it('iterator-test.all', async (htest) => {
      require('abstract-leveldown/test/iterator-test').all(
        htest,
        testCommon({
          test: htest,
          factory: LevelDOWNFactory,
        })
      )
    })
    tape_it('iterator-range-test.all', async (htest) => {
      require('abstract-leveldown/test/iterator-range-test').all(
        htest,
        testCommon({
          test: htest,
          factory: LevelDOWNFactory,
          bufferKeys: false,
        })
      )
    })
  })
}
