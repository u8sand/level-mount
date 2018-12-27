import { AbstractLevelDOWN } from 'abstract-leveldown';
import * as assert from 'assert';
import levelup from 'levelup';
import sub from 'subleveldown';
import levelmount, { LevelDOWNMount } from '..'
import { reversePromise } from '../util/reverse-promise';
import { streamPromise } from '../util/stream-promise';

// TODO: More stringent tests

export function LevelMountTestSuite<T extends AbstractLevelDOWN<any, any>>(
  desc: string,
  LevelDOWNFactory1: () => T,
  LevelDOWNFactory2: () => T
) {
  async function withEmptyStores(): Promise<any> {
    return {
      level_1: LevelDOWNFactory1(),
      level_2: LevelDOWNFactory2(),
    }
  }

  describe(desc, () => {
    let level_1, level_2, db, db_no_mount, db_mount

    before(async () => {
      const stores = await withEmptyStores()
      level_1 = levelup(stores.level_1)
      level_2 = levelup(stores.level_2)
      db = levelup(levelmount({
        db: stores.level_1,
        mounts: [
          {
            mount: '!mount!',
            db: stores.level_2,
          },
        ],
      }))
      db_no_mount = sub(db, '!no_mount!', { separator: '!' })
      db_mount = sub(db, '!mount!', { separator: '!' })

      await db.put('aa', 'bb')
      await db_no_mount.put('cc', 'dd')
      await db_mount.put('ee', 'ff')
    })

    it('can access level_1', async () => {
      assert.equal(
        await level_1.get('aa'),
        'bb'
      )
    })

    it('can access no_mount', async () => {
      assert.equal(
        await db_no_mount.get('cc'),
        'dd'
      )
    })

    it('can access mount', async () => {
      assert.equal(
        await db_mount.get('ee'),
        'ff'
      )
    })

    it('can access mount through db', async () => {
      assert.equal(
        await db.get('!mount!ee'),
        'ff'
      )
    })

    it('can access no_mount through level_1', async () => {
      assert.equal(
        await level_1.get('!no_mount!cc'),
        'dd'
      )
    })

    it('can not access mount through level_1', async () => {
      await reversePromise(level_1.get('!mount!ee'))
    })

    it('can access mount through level_2', async () => {
      assert.equal(
        await level_2.get('ee'),
        'ff'
      )
    })

    it('can iterate through all stores', async () => {
      let validation = {
        'aa': 'bb',
        '!no_mount!cc': 'dd',
        '!mount!ee': 'ff',
      }

      const data = await streamPromise<{ key: string, value: string }>(
        db.createReadStream({
          keysAsBuffer: false,
          valuesAsBuffer: false,
        })
      )
      for (const d of data) {
        assert.deepEqual(
          validation[String(d.key)],
          String(d.value)
        )
        delete validation[String(d.key)]
      }
      assert.deepEqual(
        validation,
        {}
      )
    })

    it('can iterate through multiple stores', async () => {
      let validation = {
        '!no_mount!cc': 'dd',
        '!mount!ee': 'ff',
      }

      const data = await streamPromise<{ key: string, value: string }>(
        db.createReadStream({
          keysAsBuffer: false,
          valuesAsBuffer: false,
          gt: '!',
          lt: '!\xff',
        })
      )
      for (const d of data) {
        assert.deepEqual(
          validation[String(d.key)],
          String(d.value)
        )
        delete validation[String(d.key)]
      }
      assert.deepEqual(
        validation,
        {}
      )
    })

    it('can iterate through specific store', async () => {
      let validation = {
        '!mount!ee': 'ff',
      }

      const data = await streamPromise<{ key: string, value: string }>(
        db.createReadStream({
          keysAsBuffer: false,
          valuesAsBuffer: false,
          gt: '!mount!',
          lt: '!mount!\xff',
        })
      )
      for (const d of data) {
        assert.deepEqual(
          validation[String(d.key)],
          String(d.value)
        )
        delete validation[String(d.key)]
      }
      assert.deepEqual(
        validation,
        {}
      )
    })

    it('can iterate through specific store with sublevel', async () => {
      let validation = {
        'ee': 'ff',
      }

      const data = await streamPromise<{ key: string, value: string }>(
        db_mount.createReadStream({
          keysAsBuffer: false,
          valuesAsBuffer: false,
        })
      )
      for (const d of data) {
        assert.deepEqual(
          validation[String(d.key)],
          String(d.value)
        )
        delete validation[String(d.key)]
      }
      assert.deepEqual(
        validation,
        {}
      )
    })
  })
}