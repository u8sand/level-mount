import memdown from 'memdown'
import levelmount from '.'
import { AbstractLevelDOWNTestSuite } from './tests/abstract-leveldown-test'
import { CustomLevelDOWNTestSuite } from './tests/custom-leveldown-test'
import { LevelMountTestSuite } from './tests/level-mount-test'

AbstractLevelDOWNTestSuite(
  'abstract leveldown sanity test',
  () => memdown()
)

CustomLevelDOWNTestSuite(
  'custom leveldown sanity test',
  () => memdown(),
)


LevelMountTestSuite(
  'levelmount mount tests (memdown, memdown)',
  () => memdown(),
  () => memdown(),
)

CustomLevelDOWNTestSuite(
  'levelmount custom leveldown tests with no mounts',
  () => levelmount({
    db: memdown(),
  })
)

CustomLevelDOWNTestSuite(
  'levelmount custom leveldown tests with mount on a*',
  () => levelmount({
    db: memdown(),
    mounts: [
      {
        mount: 'a',
        db: memdown(),
      }
    ],
  })
)

AbstractLevelDOWNTestSuite(
  'levelmount leveldown tests with no mounts',
  () => levelmount({
    db: memdown()
  })
)

AbstractLevelDOWNTestSuite(
  'levelmount leveldown tests with mount on 0*-9*',
  () => levelmount({
    db: memdown(),
    mounts: [
      {
        mount: '0',
        db: memdown(),
      },
      {
        mount: '1',
        db: memdown(),
      },
      {
        mount: '2',
        db: memdown(),
      },
      {
        mount: '3',
        db: memdown(),
      },
      {
        mount: '4',
        db: memdown(),
      },
      {
        mount: '5',
        db: memdown(),
      },
      {
        mount: '6',
        db: memdown(),
      },
      {
        mount: '7',
        db: memdown(),
      },
      {
        mount: '8',
        db: memdown(),
      },
      {
        mount: '9',
        db: memdown(),
      },
    ]
  })
)
