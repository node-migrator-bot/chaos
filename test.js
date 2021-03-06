// tests for chaos

var assert = require('assert')
  , db = require('./chaos')('databasetest')

var test = {}

test.simple = [
  function(next) {
    db.set('foo', { bar: 'bar' }, function(err) {
      db.get('foo', function(err, val) {
        assert.deepEqual({ bar: 'bar' }, val)
        next()
      })
    })
  }
]

test.hkeys = [
  function (next) {
    db.del('john', function(err) {
      db.hset('john', 'last name', 'doe', function(err) {  
        db.hget('john', 'last name', function(err, val) {
          assert.equal(null, err)
          assert.equal('doe', val)
          next()
        })
      })
    })
  }
, function (next) {
    db.del('json', function(err) {
      db.hset('json', 'foo-_', { foo: 'bar' }, function(err) {
        db.hget('json', 'foo-_', function(err, val) {
          assert.equal(null, err)
          assert.deepEqual({ foo: 'bar' }, val)
          next()
        })
      })
    })
  }
, function (next) {
    var store = db.mount('storage')
    store.set('foo', ['bar'], function(err) {
      store.set('bar', 'foo', function(err) {
        store.all(function(err, kv) {
          assert.deepEqual({ foo: ['bar'], bar: 'foo' }, kv)
          next()
        })
      })
    })
  }
, function (next) {
    var test_many = {
      'john': 'doe'
    , 'mary': 'loo'
    }
    var test_many_keys = []
    for (var k in test_many) {
      test_many_keys.push(k)
    }
    var test_many_vals = []
    for (var k in test_many) {
      test_many_vals.push(test_many[k])
    }  
  
    db.del('persons', function(err) {
      db.hset('persons', 'john', 'doe', function(err) {
        db.hset('persons', 'mary', 'loo', function(err) {
          db.hgetall('persons', function(err, data) {
            assert.equal(null, err)
            assert.deepEqual(data, test_many)
            db.hkeys('persons', function(err, data) {
              assert.equal(null, err)
              assert.deepEqual(data.sort(), test_many_keys.sort())
              db.hvals('persons', function(err, data) {
                assert.equal(null, err)
                assert.deepEqual(data.sort(), test_many_vals.sort())
                next()
              })
            })            
          })
        })
      })
    })
  }
, function (next) {
    db.del('will', function(err) {
      db.hset('will', 'delete', 'now', function(err) {  
        db.hget('will', 'delete', function(err, data) {
          assert.equal(null, err)
          db.hdel('will', 'delete', function(err) {
            db.hget('will', 'delete', function(err, data) {
              assert.notEqual(null, err)
              db.del('will', function(err) {
                assert.equal(null, err)
                db.hgetall('will', function(err, data) {
                  assert.notEqual(null, err)
                })
              })
            })
          })
        })
      })
    })
  }
]

test.watch = [
  function (next) {
    db.watch('foo', function(err, data) {
      assert.equal('bar', data)
      db.unwatch('foo')
      db.set('foo', 'hey', function() {
        next()
      })
    })
    db.set('foo', 'bar')
  }
, function (next) {  
    db.del('foobar', function(err) {
      db.watch('foobar', function(err, data) {
        //assert.equal(null, err)
        //assert.equal('', data)
        db.unwatch('foobar')
        db.hgetall('foobar', function(err, data) {
          assert.equal(null, err)
          assert.deepEqual({bar: 'bar'}, data)
          next()
        })
      })
      db.hset('foobar', 'bar', 'bar', function(err) {
        assert.equal(null, err)
      })
    })
  }
]

test.jkeys = [
  function(next) {
    db.jset('hello', { foo: 'bar' }, function(err) {
      db.jget('hello', function(err, data) {
        assert.deepEqual(data, { foo: 'bar' })
        next()
      })
    })
  }
]

var tests = []
for (var k in test) {
  test[k].forEach(function (t) {
    tests.push(t)
  })
}

var handle = function () {}

tests.forEach(function (layer) {
  var child = handle
  handle = function () {
    layer(function() {
      child()
    })
  }
})

handle()
