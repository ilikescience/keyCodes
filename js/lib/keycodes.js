
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-inherit/index.js", Function("exports, require, module",
"\n\
module.exports = function(a, b){\n\
  var fn = function(){};\n\
  fn.prototype = b.prototype;\n\
  a.prototype = new fn;\n\
  a.prototype.constructor = a;\n\
};//@ sourceURL=component-inherit/index.js"
));
require.register("timoxley-assert/index.js", Function("exports, require, module",
"// http://wiki.commonjs.org/wiki/Unit_Testing/1.0\n\
//\n\
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!\n\
//\n\
// Originally from narwhal.js (http://narwhaljs.org)\n\
// Copyright (c) 2009 Thomas Robinson <280north.com>\n\
//\n\
// Permission is hereby granted, free of charge, to any person obtaining a copy\n\
// of this software and associated documentation files (the 'Software'), to\n\
// deal in the Software without restriction, including without limitation the\n\
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or\n\
// sell copies of the Software, and to permit persons to whom the Software is\n\
// furnished to do so, subject to the following conditions:\n\
//\n\
// The above copyright notice and this permission notice shall be included in\n\
// all copies or substantial portions of the Software.\n\
//\n\
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n\
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n\
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n\
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN\n\
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION\n\
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n\
\n\
\n\
// Adapted for browser components by Tim Oxley\n\
// from https://github.com/joyent/node/blob/72bc4dcda4cfa99ed064419e40d104bd1b2e0e25/lib/assert.js\n\
\n\
// UTILITY\n\
var inherit = require('inherit');\n\
var pSlice = Array.prototype.slice;\n\
\n\
// 1. The assert module provides functions that throw\n\
// AssertionError's when particular conditions are not met. The\n\
// assert module must conform to the following interface.\n\
\n\
var assert = module.exports = ok;\n\
\n\
// 2. The AssertionError is defined in assert.\n\
// new assert.AssertionError({ message: message,\n\
//                             actual: actual,\n\
//                             expected: expected })\n\
\n\
assert.AssertionError = function AssertionError(options) {\n\
  this.name = 'AssertionError';\n\
  this.message = options.message;\n\
  this.actual = options.actual;\n\
  this.expected = options.expected;\n\
  this.operator = options.operator;\n\
  var stackStartFunction = options.stackStartFunction || fail;\n\
\n\
  if (Error.captureStackTrace) {\n\
    Error.captureStackTrace(this, stackStartFunction);\n\
  }\n\
};\n\
\n\
// assert.AssertionError instanceof Error\n\
inherit(assert.AssertionError, Error);\n\
\n\
function replacer(key, value) {\n\
  if (value === undefined) {\n\
    return '' + value;\n\
  }\n\
  if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {\n\
    return value.toString();\n\
  }\n\
  if (typeof value === 'function' || value instanceof RegExp) {\n\
    return value.toString();\n\
  }\n\
  return value;\n\
}\n\
\n\
function truncate(s, n) {\n\
  if (typeof s == 'string') {\n\
    return s.length < n ? s : s.slice(0, n);\n\
  } else {\n\
    return s;\n\
  }\n\
}\n\
\n\
assert.AssertionError.prototype.toString = function() {\n\
  if (this.message) {\n\
    return [this.name + ':', this.message].join(' ');\n\
  } else {\n\
    return [\n\
      this.name + ':',\n\
      truncate(JSON.stringify(this.actual, replacer), 128),\n\
      this.operator,\n\
      truncate(JSON.stringify(this.expected, replacer), 128)\n\
    ].join(' ');\n\
  }\n\
};\n\
\n\
// At present only the three keys mentioned above are used and\n\
// understood by the spec. Implementations or sub modules can pass\n\
// other keys to the AssertionError's constructor - they will be\n\
// ignored.\n\
\n\
// 3. All of the following functions must throw an AssertionError\n\
// when a corresponding condition is not met, with a message that\n\
// may be undefined if not provided.  All assertion methods provide\n\
// both the actual and expected values to the assertion error for\n\
// display purposes.\n\
\n\
function fail(actual, expected, message, operator, stackStartFunction) {\n\
  throw new assert.AssertionError({\n\
    message: message,\n\
    actual: actual,\n\
    expected: expected,\n\
    operator: operator,\n\
    stackStartFunction: stackStartFunction\n\
  });\n\
}\n\
\n\
// EXTENSION! allows for well behaved errors defined elsewhere.\n\
assert.fail = fail;\n\
\n\
// 4. Pure assertion tests whether a value is truthy, as determined\n\
// by !!guard.\n\
// assert.ok(guard, message_opt);\n\
// This statement is equivalent to assert.equal(true, !!guard,\n\
// message_opt);. To test strictly for the value true, use\n\
// assert.strictEqual(true, guard, message_opt);.\n\
\n\
function ok(value, message) {\n\
  if (!!!value) fail(value, true, message, '==', assert.ok);\n\
}\n\
assert.ok = ok;\n\
\n\
// 5. The equality assertion tests shallow, coercive equality with\n\
// ==.\n\
// assert.equal(actual, expected, message_opt);\n\
\n\
assert.equal = function equal(actual, expected, message) {\n\
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);\n\
};\n\
\n\
// 6. The non-equality assertion tests for whether two objects are not equal\n\
// with != assert.notEqual(actual, expected, message_opt);\n\
\n\
assert.notEqual = function notEqual(actual, expected, message) {\n\
  if (actual == expected) {\n\
    fail(actual, expected, message, '!=', assert.notEqual);\n\
  }\n\
};\n\
\n\
// 7. The equivalence assertion tests a deep equality relation.\n\
// assert.deepEqual(actual, expected, message_opt);\n\
\n\
assert.deepEqual = function deepEqual(actual, expected, message) {\n\
  if (!_deepEqual(actual, expected)) {\n\
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);\n\
  }\n\
};\n\
\n\
function _deepEqual(actual, expected) {\n\
  // 7.1. All identical values are equivalent, as determined by ===.\n\
  if (actual === expected) {\n\
    return true;\n\
\n\
  // 7.2. If the expected value is a Date object, the actual value is\n\
  // equivalent if it is also a Date object that refers to the same time.\n\
  } else if (actual instanceof Date && expected instanceof Date) {\n\
    return actual.getTime() === expected.getTime();\n\
\n\
  // 7.3 If the expected value is a RegExp object, the actual value is\n\
  // equivalent if it is also a RegExp object with the same source and\n\
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).\n\
  } else if (actual instanceof RegExp && expected instanceof RegExp) {\n\
    return actual.source === expected.source &&\n\
           actual.global === expected.global &&\n\
           actual.multiline === expected.multiline &&\n\
           actual.lastIndex === expected.lastIndex &&\n\
           actual.ignoreCase === expected.ignoreCase;\n\
\n\
  // 7.4. Other pairs that do not both pass typeof value == 'object',\n\
  // equivalence is determined by ==.\n\
  } else if (typeof actual != 'object' && typeof expected != 'object') {\n\
    return actual == expected;\n\
\n\
  // 7.5 For all other Object pairs, including Array objects, equivalence is\n\
  // determined by having the same number of owned properties (as verified\n\
  // with Object.prototype.hasOwnProperty.call), the same set of keys\n\
  // (although not necessarily the same order), equivalent values for every\n\
  // corresponding key, and an identical 'prototype' property. Note: this\n\
  // accounts for both named and indexed properties on Arrays.\n\
  } else {\n\
    return objEquiv(actual, expected);\n\
  }\n\
}\n\
\n\
function isUndefinedOrNull(value) {\n\
  return value === null || value === undefined;\n\
}\n\
\n\
function isArguments(object) {\n\
  return Object.prototype.toString.call(object) == '[object Arguments]';\n\
}\n\
\n\
function objEquiv(a, b) {\n\
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))\n\
    return false;\n\
  // an identical 'prototype' property.\n\
  if (a.prototype !== b.prototype) return false;\n\
  //~~~I've managed to break Object.keys through screwy arguments passing.\n\
  //   Converting to array solves the problem.\n\
  if (isArguments(a)) {\n\
    if (!isArguments(b)) {\n\
      return false;\n\
    }\n\
    a = pSlice.call(a);\n\
    b = pSlice.call(b);\n\
    return _deepEqual(a, b);\n\
  }\n\
  try {\n\
    var ka = Object.keys(a),\n\
        kb = Object.keys(b),\n\
        key, i;\n\
  } catch (e) {//happens when one is a string literal and the other isn't\n\
    return false;\n\
  }\n\
  // having the same number of owned properties (keys incorporates\n\
  // hasOwnProperty)\n\
  if (ka.length != kb.length)\n\
    return false;\n\
  //the same set of keys (although not necessarily the same order),\n\
  ka.sort();\n\
  kb.sort();\n\
  //~~~cheap key test\n\
  for (i = ka.length - 1; i >= 0; i--) {\n\
    if (ka[i] != kb[i])\n\
      return false;\n\
  }\n\
  //equivalent values for every corresponding key, and\n\
  //~~~possibly expensive deep test\n\
  for (i = ka.length - 1; i >= 0; i--) {\n\
    key = ka[i];\n\
    if (!_deepEqual(a[key], b[key])) return false;\n\
  }\n\
  return true;\n\
}\n\
\n\
// 8. The non-equivalence assertion tests for any deep inequality.\n\
// assert.notDeepEqual(actual, expected, message_opt);\n\
\n\
assert.notDeepEqual = function notDeepEqual(actual, expected, message) {\n\
  if (_deepEqual(actual, expected)) {\n\
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);\n\
  }\n\
};\n\
\n\
// 9. The strict equality assertion tests strict equality, as determined by ===.\n\
// assert.strictEqual(actual, expected, message_opt);\n\
\n\
assert.strictEqual = function strictEqual(actual, expected, message) {\n\
  if (actual !== expected) {\n\
    fail(actual, expected, message, '===', assert.strictEqual);\n\
  }\n\
};\n\
\n\
// 10. The strict non-equality assertion tests for strict inequality, as\n\
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);\n\
\n\
assert.notStrictEqual = function notStrictEqual(actual, expected, message) {\n\
  if (actual === expected) {\n\
    fail(actual, expected, message, '!==', assert.notStrictEqual);\n\
  }\n\
};\n\
\n\
function expectedException(actual, expected) {\n\
  if (!actual || !expected) {\n\
    return false;\n\
  }\n\
\n\
  if (expected instanceof RegExp) {\n\
    return expected.test(actual);\n\
  } else if (actual instanceof expected) {\n\
    return true;\n\
  } else if (expected.call({}, actual) === true) {\n\
    return true;\n\
  }\n\
\n\
  return false;\n\
}\n\
\n\
function _throws(shouldThrow, block, expected, message) {\n\
  var actual;\n\
\n\
  if (typeof expected === 'string') {\n\
    message = expected;\n\
    expected = null;\n\
  }\n\
\n\
  try {\n\
    block();\n\
  } catch (e) {\n\
    actual = e;\n\
  }\n\
\n\
  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +\n\
            (message ? ' ' + message : '.');\n\
\n\
  if (shouldThrow && !actual) {\n\
    fail(actual, expected, 'Missing expected exception' + message);\n\
  }\n\
\n\
  if (!shouldThrow && expectedException(actual, expected)) {\n\
    fail(actual, expected, 'Got unwanted exception' + message);\n\
  }\n\
\n\
  if ((shouldThrow && actual && expected &&\n\
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {\n\
    throw actual;\n\
  }\n\
}\n\
\n\
// 11. Expected to throw an error:\n\
// assert.throws(block, Error_opt, message_opt);\n\
\n\
assert.throws = function(block, /*optional*/error, /*optional*/message) {\n\
  _throws.apply(this, [true].concat(pSlice.call(arguments)));\n\
};\n\
\n\
// EXTENSION! This is annoying to write outside this module.\n\
assert.doesNotThrow = function(block, /*optional*/message) {\n\
  _throws.apply(this, [false].concat(pSlice.call(arguments)));\n\
};\n\
\n\
assert.ifError = function(err) { if (err) {throw err;}};\n\
//@ sourceURL=timoxley-assert/index.js"
));
require.register("keycode/index.js", Function("exports, require, module",
"// Source: http://jsfiddle.net/vWx8V/\n\
// http://stackoverflow.com/questions/5603195/full-list-of-javascript-keycodes\n\
\n\
\n\
\n\
/**\n\
 * Conenience method returns corresponding value for given keyName or keyCode.\n\
 *\n\
 * @param {Mixed} keyCode {Number} or keyName {String}\n\
 * @return {Mixed}\n\
 * @api public\n\
 */\n\
\n\
exports = module.exports = function(searchInput) {\n\
  // Keyboard Events\n\
  if (searchInput && 'object' === typeof searchInput) {\n\
    var hasKeyCode = searchInput.which || searchInput.keyCode || searchInput.charCode\n\
    if (hasKeyCode) searchInput = hasKeyCode\n\
  }\n\
\n\
  // Numbers\n\
  if ('number' === typeof searchInput) return names[searchInput]\n\
\n\
  // Everything else (cast to string)\n\
  var search = String(searchInput)\n\
\n\
  // check codes\n\
  var foundNamedKey = codes[search.toLowerCase()]\n\
  if (foundNamedKey) return foundNamedKey\n\
\n\
  // check aliases\n\
  var foundNamedKey = aliases[search.toLowerCase()]\n\
  if (foundNamedKey) return foundNamedKey\n\
\n\
  // weird character?\n\
  if (search.length === 1) return search.charCodeAt(0)\n\
\n\
  return undefined\n\
}\n\
\n\
/**\n\
 * Get by name\n\
 *\n\
 *   exports.code['enter'] // => 13\n\
 */\n\
\n\
var codes = exports.code = exports.codes = {\n\
  'backspace': 8,\n\
  'tab': 9,\n\
  'enter': 13,\n\
  'shift': 16,\n\
  'ctrl': 17,\n\
  'alt': 18,\n\
  'pause/break': 19,\n\
  'caps lock': 20,\n\
  'esc': 27,\n\
  'space': 32,\n\
  'page up': 33,\n\
  'page down': 34,\n\
  'end': 35,\n\
  'home': 36,\n\
  'left': 37,\n\
  'up': 38,\n\
  'right': 39,\n\
  'down': 40,\n\
  'insert': 45,\n\
  'delete': 46,\n\
  'windows/command': 91,\n\
  'right click': 93,\n\
  'numpad *': 106,\n\
  'numpad +': 107,\n\
  'numpad -': 109,\n\
  'numpad .': 110,\n\
  'numpad /': 111,\n\
  'num lock': 144,\n\
  'scroll lock': 145,\n\
  'my computer': 182,\n\
  'my calculator': 183,\n\
  ';': 186,\n\
  '=': 187,\n\
  ',': 188,\n\
  '-': 189,\n\
  '.': 190,\n\
  '/': 191,\n\
  '`': 192,\n\
  '[': 219,\n\
  '\\\\': 220,\n\
  ']': 221,\n\
  \"'\": 222\n\
}\n\
\n\
// Helper aliases\n\
\n\
var aliases = exports.aliases = {\n\
  'ctl': 17,\n\
  'pause': 19,\n\
  'break': 19,\n\
  'caps': 20,\n\
  'escape': 27,\n\
  'pgup': 33,\n\
  'pgdn': 33,\n\
  'ins': 45,\n\
  'del': 46,\n\
  'spc': 32\n\
}\n\
\n\
\n\
/*!\n\
 * Programatically add the following\n\
 */\n\
\n\
// lower case chars\n\
for (i = 97; i < 123; i++) codes[String.fromCharCode(i)] = i - 32\n\
\n\
// numbers\n\
for (var i = 48; i < 58; i++) codes[i - 48] = i\n\
\n\
// function keys\n\
for (i = 1; i < 13; i++) codes['f'+i] = i + 111\n\
\n\
// numpad keys\n\
for (i = 0; i < 10; i++) codes['numpad '+i] = i + 96\n\
\n\
/**\n\
 * Get by code\n\
 *\n\
 *   exports.name[13] // => 'Enter'\n\
 */\n\
\n\
var names = exports.names = exports.title = {} // title for backward compat\n\
\n\
// Create reverse mapping\n\
for (i in codes) names[codes[i]] = i\n\
\n\
// Add aliases\n\
for (var alias in aliases) {\n\
  codes[alias] = aliases[alias]\n\
}\n\
//@ sourceURL=keycode/index.js"
));
require.alias("timoxley-assert/index.js", "keycode/deps/assert/index.js");
require.alias("timoxley-assert/index.js", "assert/index.js");
require.alias("component-inherit/index.js", "timoxley-assert/deps/inherit/index.js");
