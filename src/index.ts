import { AbstractLevelDOWN } from 'abstract-leveldown'
import { LevelDOWNMount } from './level-mount'
import { StringOrBuffer } from './types'

/**
 * LevelMount, like file system directory mounts and somewhat like the opposite of subleveldown.
 * Can be used *with* subleveldown. Examples:
 * 
 * const hybrid_db = LevelMount(leveldown('root'), { '!tmp!': memdown(), '!var!': someotherdown() })
 * 
 * hybrid_db.put('hello', 'world') // ends up in root leveldown with key `hello`
 * hybrid_db.put('!tmp!blah', 'bleh') // ends up in memdown with key `blah`
 * 
 * const var_db = subleveldown(hybrid_db, 'var', { separator: '!' })
 * var_db.put('goodbye', 'world') // ends up in someotherdown with key `goodbye`
 * 
 * @param root   The root and fallback levelup instance (keys that don't fall into a mount end up here)
 * @param mounts A mapping from the base key-prefix to the levelup instance which should receive the value
 * @returns levelup instance of mounted databases
 */
export default function LevelMount<K extends StringOrBuffer = string, V = any>(
  root: AbstractLevelDOWN<K, V>,
  mounts: { [key: string]: AbstractLevelDOWN<K, V> }
): AbstractLevelDOWN<K, V> {
  const mount_down = new LevelDOWNMount<K, V>(root)
  for (const mount_loc of Object.keys(mounts))
    mount_down.mount(mount_loc, mounts[mount_loc])
  return mount_down
}
