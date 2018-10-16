const test = require('ava');

const check = require('../');

test('exposes a function', t => {
  t.is(typeof check, 'function');
});