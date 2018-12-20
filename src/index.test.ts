import memdown from 'memdown'
import LevelMount from './index'
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
  () => LevelMount(
    memdown(),
    {}
  )
)

CustomLevelDOWNTestSuite(
  'levelmount custom leveldown tests with mount on a*',
  () => LevelMount(
    memdown(),
    {
      'a': memdown(),
    }
  )
)

AbstractLevelDOWNTestSuite(
  'levelmount leveldown tests with no mounts',
  () => LevelMount(
    memdown(),
    {}
  )
)

AbstractLevelDOWNTestSuite(
  'levelmount leveldown tests with mount on 0*-9*',
  () => LevelMount(
    memdown(),
    {
      '0': memdown(),
      '1': memdown(),
      '2': memdown(),
      '3': memdown(),
      '4': memdown(),
      '5': memdown(),
      '6': memdown(),
      '7': memdown(),
      '8': memdown(),
      '9': memdown(),
    }
  )
)
