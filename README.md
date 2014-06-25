# Broccoli Coffeelint

Based on Broccoli-JSHint [![Build Status](https://travis-ci.org/rjackson/broccoli-jshint.svg?branch=master)](https://travis-ci.org/rjackson/broccoli-jshint).

Run Coffeelint on the provided tree.

## Usage

```javascript
var coffeelintTree = require('broccoli-coffeelint');

// assuming someTree is a built up tree
var tree = coffeelintTree(someTree);
```

## Documentation

### `coffeelintTree(inputTree, options)`

---

`options.coffeelintJSONRoot` *{String}*

Will look in the root of the provided tree for a `coffeelint.json`. If you would prefer to use another specific root
for looking up your coffeelint config, supply this option.

Default: **input tree root**

---

`options.coffeelintJSONPath` *{String}*

Specify the path to the `coffeelint.json` that you would like to use. Use this option if you would like to use a `coffeelint.json`
file from a path that is not in the same hierarchy as your input tree (if it is use the `coffeelint.json`).

Default: **undefined**

---

`options.log` *{true|false}*

Should we log errors to the console?

Default: **true**

---

`options.disableTestGenerator` *{true|false}*

If `true` no tests will not be generated.

Default: **false**

---

`options.testGenerator` *{Function}*

The function used to generate test modules. You can provide a custom function for your client side testing framework of choice.

The function receives the following arguments:

* `relativePath` - The relative path to the file being tested.
* `errors` - A generated string of errors found.

Default generates QUnit style tests:

```javascript
var path = require('path');

function(relativePath, errors) {
  return "module('" + path.dirname(relativePath) + '");";
         "test('" + relativePath + "' should pass coffeelint', function() { " +
         "  ok(passed, moduleName+" should pass coffeelint."+(errors ? "\n"+errors : '')); " +
         "});
};
```

## ZOMG!!! TESTS?!?!!?

I know, right?

Running the tests:

```javascript
npm install
npm test
```

## License

This project is distributed under the MIT license.
