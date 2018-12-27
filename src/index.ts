import { LevelDOWNMount, LevelDOWNMountOptions } from './level-mount';

export * from './level-mount'

export default function levelmount(options: LevelDOWNMountOptions) {
  return new LevelDOWNMount(options)
}
