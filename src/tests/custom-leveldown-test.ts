import { AbstractLevelDOWN } from 'abstract-leveldown';
import * as assert from 'assert';
import levelup from 'levelup';
import { reversePromise } from '../util/reverse-promise';
import { streamPromise } from '../util/stream-promise';

export function CustomLevelDOWNTestSuite<T extends AbstractLevelDOWN<any, any>>(
  desc: string,
  LevelDOWNFactory: () => T
) {
  async function withEmptyStore(): Promise<any> {
    return levelup(LevelDOWNFactory())
  }

  async function withStore() {
    const db = await withEmptyStore()
    await db.put('aa', 'bb')
    return db
  }

  async function withBufferStore() {
    const db = await withEmptyStore()
    await db.put(Buffer.from('aa'), Buffer.from('bb'))
    return db
  }

  async function withDeepStore() {
    const db = await withEmptyStore()
    await db.put('aa', {
      'cc': 'dd',
      'ee': 'ff'
    })
    return db
  }

  describe(desc, () => {
    it('can put', async () => {
      const db = await withEmptyStore()
      await db.put('aa', 'bb')
    })

    it('can put deep', async () => {
      const db = await withEmptyStore()
      await db.put('aa', {
        'cc': 'dd',
        'ee': 'ff'
      })
    })

    it('can put key buffer', async () => {
      const db = await withEmptyStore()
      await db.put(Buffer.from('aa'), 'bb')
    })

    it('can put val buffer', async () => {
      const db = await withEmptyStore()
      await db.put('aa', Buffer.from('bb'))
    })

    it('can put key val buffer', async () => {
      const db = await withEmptyStore()
      await db.put(Buffer.from('aa'), Buffer.from('bb'))
    })

    it('can get', async () => {
      const db = await withStore()
      assert.deepEqual(
        await db.get('aa', { asBuffer: false }),
        'bb'
      )
    })

    it('can get deep', async () => {
      const db = await withDeepStore()
      assert.deepEqual(
        await db.get('aa', { asBuffer: false }),
        {
          'cc': 'dd',
          'ee': 'ff'
        }
      )
    })

    it('can get key buffer', async () => {
      const db = await withStore()
      assert.deepEqual(
        await db.get(Buffer.from('aa'), { asBuffer: false }),
        'bb'
      )
    })

    it('can get val buffer', async () => {
      const db = await withStore()
      assert.deepEqual(
        await db.get('aa', { asBuffer: true }),
        Buffer.from('bb')
      )
    })

    it('can get key val buffer', async () => {
      const db = await withStore()
      assert.deepEqual(
        await db.get(Buffer.from('aa'), { asBuffer: true }),
        Buffer.from('bb')
      )
    })

    it('can get from buffer store', async () => {
      const db = await withBufferStore()
      assert.deepEqual(
        await db.get('aa'),
        Buffer.from('bb')
      )
    })

    it('can get key buffer from buffer store', async () => {
      const db = await withBufferStore()
      assert.deepEqual(
        await db.get(Buffer.from('aa')),
        Buffer.from('bb')
      )
    })

    it('can get val buffer from buffer store', async () => {
      const db = await withBufferStore()
      assert.deepEqual(
        await db.get('aa', { asBuffer: true }),
        Buffer.from('bb')
      )
    })

    it('can get key val buffer from buffer store', async () => {
      const db = await withBufferStore()
      assert.deepEqual(
        await db.get(Buffer.from('aa'), { asBuffer: true }),
        Buffer.from('bb')
      )
    })

    it("can't get non-existant", async () => {
      const db = await withEmptyStore()
      await reversePromise(db.get('aa', { asBuffer: false }))
    })

    it('can del', async () => {
      const db = await withStore()
      await db.del('aa')
    })

    it('can del deep', async () => {
      const db = await withDeepStore()
      await db.del('aa')
    })

    it('can del buffer', async () => {
      const db = await withStore()
      await db.del(Buffer.from('aa'))
    })

    it('can del from buffer store', async () => {
      const db = await withBufferStore()
      await db.del('aa')
    })

    it('can del buffer', async () => {
      const db = await withBufferStore()
      await db.del(Buffer.from('aa'))
    })

    it("can't del non-existant", async () => {
      const db = await withEmptyStore()
      await reversePromise(db.del('aa'))
    })

    it('can batch/iterator', async () => {
      const db = await withEmptyStore()
      let validation = {
        'cc': 'dd',
        'ee': 'ff',
      }

      await db.batch()
        .put('aa', 'bb')
        .put('cc', 'dd')
        .del('aa')
        .put('ee', 'ff')
        .write()

      const data = await streamPromise<{ key: string, value: string }>(
        db.createReadStream({
          keysAsBuffer: false,
          valuesAsBuffer: false,
        })
      )
      for (const d of data) {
        assert.deepEqual(
          validation[d.key.toString()],
          d.value.toString()
        )
        delete validation[d.key.toString()]
      }
      assert.deepEqual(
        validation,
        {}
      )
    })

    it('can iterate empty', async () => {
      const db = await withEmptyStore()

      const data = await streamPromise<{ key: string, value: string }>(
        db.createReadStream({
          keysAsBuffer: false,
          valuesAsBuffer: false,
        })
      )
      for (const d of data) {
        assert.fail("Got something, expected nothing")
      }
    })

    it('can iterate while mutating', async () => {
      const db = await withEmptyStore()
      await Promise.all([
        db.put('aa', 'bb'),
        new Promise((resolve, reject) => {
          db.createReadStream({
            keysAsBuffer: false,
            valuesAsBuffer: false,
          }).on('data', (data) => {
          }).on('end', (data) => {
            resolve()
          })
        })
      ])
    })

    it('can batch/iterator with buffers', async () => {
      const db = await withEmptyStore()
      let validation = {
        [Buffer.from('cc') as any]: Buffer.from('dd'),
        [Buffer.from('ee') as any]: Buffer.from('ff'),
      }

      await db.batch()
        .put(Buffer.from('aa'), Buffer.from('bb'))
        .put(Buffer.from('cc'), Buffer.from('dd'))
        .del(Buffer.from('aa'))
        .put(Buffer.from('ee'), Buffer.from('ff'))
        .write()

      const data = await streamPromise<{ key: Buffer, value: Buffer }>(
        db.createReadStream({
          keysAsBuffer: true,
          valuesAsBuffer: true,
        })
      )
      for (const d of data) {
        assert.deepEqual(
          validation[d.key as any],
          Buffer.from(d.value)
        )
        delete validation[d.key as any]
      }
      assert.deepEqual(
        validation,
        {}
      )
    })

    it('can batch/iterator range', async () => {
      const db = await withEmptyStore()

      let validation = {
        'cc': 'dd',
        'ee': 'ff',
      }

      await db.batch()
        .put('aa', 'bb')
        .put('cc', 'dd')
        .put('ee', 'ff')
        .put('ff', 'qq')
        .write()

      const data = await streamPromise<{ key: string, value: string }>(
        db.createReadStream({
          keysAsBuffer: false,
          valuesAsBuffer: false,
          gte: 'cc',
          lte: 'ee',
        })
      )
      for (const d of data) {
        assert.deepEqual(
          validation[String(d.key)],
          String(d.value)
        )
        delete validation[d.key]
      }
      assert.deepEqual(
        validation,
        {}
      )
    })
  })
}
