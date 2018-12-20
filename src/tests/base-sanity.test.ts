import assert from 'assert'
import ltgt from 'ltgt'
import { test_from_options, test_prefix_from_options } from '../util/leveldown-opts';

describe('base sanity', () => {
  it('works', () => {
    assert.deepEqual(
      [
        'a',
        '!no_mount!b',
        '!no_mount!',
        '!mount!c',
        '!mount!',
      ].filter(
        test_from_options(
          {
            gt: '',
            lt: '\xff',
          }
        )
      ),
      [
        'a',
        '!no_mount!b',
        '!no_mount!',
        '!mount!c',
        '!mount!',
      ]
    )
  })

  it('works', () => {
    assert.deepEqual(
      [
        'a',
        '!no_mount!b',
        '!no_mount!',
        '!mount!c',
        '!mount!',
      ].filter(
        test_from_options(
          {
            gt: '!',
            lt: '!\xff',
          }
        )
      ),
      [
        '!no_mount!b',
        '!no_mount!',
        '!mount!c',
        '!mount!',
      ]
    )
  })

  it('works', () => {
    assert.deepEqual(
      [
        '',
        'a',
        '!no_mount!b',
        '!no_mount!',
        '!mount!c',
        '!mount!',
      ].filter(
        test_prefix_from_options(
          {
            gt: '!mount!',
            lt: '!mount!\xff',
          }
        )
      ),
      [
        '',
        '!mount!c',
        '!mount!',
      ]
    )
  })


  it('works', () => {
    assert.deepEqual(
      [
        '',
        'a',
        'aa',
        'c',
        'cc',
        'e',
        'ee',
        'g',
      ].filter(
        test_from_options(
          {
            gte: 'c',
            lte: 'e',
          }
        )
      ),
      [
        'c',
        'cc',
        'e',
      ]
    )
  })
})