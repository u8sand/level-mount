# level-mount
Mount multiple leveldown compatible stores by key prefix onto a single store.

LevelMount, like file system directory mounts and somewhat like the opposite of subleveldown.
Can be used *with* subleveldown. Examples:

```js
const hybrid_db = LevelMount(leveldown('root'), { '!tmp!': memdown(), '!var!': someotherdown() })

hybrid_db.put('hello', 'world') // ends up in root leveldown with key `hello`
hybrid_db.put('!tmp!blah', 'bleh') // ends up in memdown with key `blah`

const var_db = subleveldown(hybrid_db, 'var', { separator: '!' })
var_db.put('goodbye', 'world') // ends up in someotherdown with key `goodbye`
```

levelmount is a abstract leveldown complaint store meaning all other operations are also supported (batch, iterators, etc..) and work the way you'd expect. Iteration across multiple leveldbs seemlessly enables you to segregate key prefixes by store enabling things like storing indexes in different databases from the data itself!
