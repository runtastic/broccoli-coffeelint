'use strict';

var path           = require('path');
var coffeelintTree = require('..');
var expect         = require('expect.js');
var rimraf         = require('rimraf');
var root           = process.cwd();
var fs             = require('fs');
var broccoli       = require('broccoli');
var builder;


describe('broccoli-coffeelint', function(){
  var loggerOutput;

  function readFile(path) {
    return fs.readFileSync(path, {encoding: 'utf8'});
  }

  function chdir(path) {
    process.chdir(path);
  }

  beforeEach(function() {
    chdir(root);

    loggerOutput = [];
  });

  afterEach(function() {
    if (builder) {
      builder.cleanup();
    }
  });

  describe('coffeelint.json', function() {
    it('uses the coffeelint.json as configuration for hinting', function(){
      var sourcePath = 'tests/fixtures/some-files-ignoring-trailing-semi-colons';
      chdir(sourcePath);
      var tree = coffeelintTree('.', {
        logError: function(message) { loggerOutput.push(message); }
      });   
      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.length).to.eql(0);
      });
    });

    it('can handle comments in coffeelint.json', function(){
      var sourcePath = 'tests/fixtures/comments-in-coffeelintJSON';
      chdir(sourcePath);

      var tree = coffeelintTree('.', {
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.length).to.eql(0);
      });
    });

    it('can find a coffeelint.json in a specified coffeelintJSONRoot path', function(){
      var sourcePath = 'tests/fixtures/some-files-ignoring-trailing-semi-colons-non-default-coffeelintJSON-path';

      var tree = coffeelintTree(sourcePath, {
        coffeelintJSONRoot: 'blah',
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.length).to.eql(0);
      });
    });

    it('can find a coffeelint.json in a specified coffeelintJSONPath', function(){
      var sourcePath = 'tests/fixtures/some-files-ignoring-trailing-semi-colons';
      var tree = coffeelintTree(sourcePath, {
        coffeelintJSONRoot: '../coffeelintJSON-outside-project-hierarchy',
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.length).to.eql(0);
      });
    });

    it('can find a coffeelint.json in the root of the provided tree', function(){
      var sourcePath = 'tests/fixtures/some-files-ignoring-trailing-semi-colons';

      var tree = coffeelintTree(sourcePath, {
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.length).to.eql(0);
      });
    });
  });

  describe('logError', function() {
    it('logs errors using custom supplied function', function(){
      var sourcePath = 'tests/fixtures/some-files-with-trailing-semi-colons';
      var tree = coffeelintTree(sourcePath, {
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.join('\n')).to.match(/Line contains a trailing semicolon/)
      });
    });

    it('does not log if `log` = false', function(){
      var sourcePath = 'tests/fixtures/some-files-with-trailing-semi-colons';
      var tree = coffeelintTree(sourcePath, {
        logError: function(message) { loggerOutput.push(message) },
        log: false
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.length).to.eql(0);
      });
    });
  });

  describe('testGenerator', function() {
    it('generates test files for coffeelint errors', function(){
      var sourcePath = 'tests/fixtures/some-files-with-trailing-semi-colons';
      var tree = coffeelintTree(sourcePath, {
        destFile: 'coffeelint-tests.js',
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var dir = results.directory;
        expect(readFile(dir + '/core.coffeelint.js')).to.match(/Line contains a trailing semicolon/)
        expect(readFile(dir + '/look-no-errors.coffeelint.js')).to.match(/ok\(true, 'look-no-errors.coffee should pass coffeelint.'\);/)
      });
    });

    it('calls escapeErrorString on the error string provided', function() {
      var escapeErrorStringCalled = false;
      var sourcePath = 'tests/fixtures/some-files-with-trailing-semi-colons';
      
      var tree = coffeelintTree(sourcePath, {
        logError: function(message) { loggerOutput.push(message) },
        escapeErrorString: function(string) {
          escapeErrorStringCalled = true;
          return "blazhorz";
        }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var dir = results.directory;
        expect(escapeErrorStringCalled).to.be.ok();
        expect(readFile(dir + '/core.coffeelint.js')).to.match(/blazhorz/)
      });
    });

    it('does not generate tests if disableTestGenerator is set', function(){
      var sourcePath = 'tests/fixtures/some-files-with-trailing-semi-colons';
      var tree      = coffeelintTree(sourcePath, {
        destFile: 'coffeelint-tests.js',
        logError: function(message) { loggerOutput.push(message) },
        disableTestGenerator: true
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var dir = results.directory;
        expect(readFile(dir + '/core.coffeelint.js')).to.not.match(/Line contains a trailing semicolon/)
        expect(readFile(dir + '/look-no-errors.coffeelint.js')).to.not.match(/ok\(true, 'look-no-errors.coffee should pass coffeelint.'\);/)
      });
    });
  });

  describe('escapeErrorString', function() {
    var tree;

    beforeEach(function() {
      tree = coffeelintTree('.', {
        logError: function(message) { loggerOutput.push(message) }
      });
    });

    it('escapes single quotes properly', function() {
      expect(tree.escapeErrorString("'something'")).to.equal('\\\'something\\\'');
    });
  });

  describe('forbidden keywords', function() {
    it('detects the forbidden keywords and logs errors', function(){
      var sourcePath = 'tests/fixtures/some-files-with-forbidden-keywords';
      var tree = coffeelintTree(sourcePath, {
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var joinedLoggerOutput = loggerOutput.join('\n');
        expect(joinedLoggerOutput).to.match(/The "or" keyword is forbidden./);
        expect(joinedLoggerOutput).to.match(/The "and" keyword is forbidden/);
        expect(joinedLoggerOutput).to.match(/The "isnt" keyword is forbidden/);
        expect(joinedLoggerOutput).to.match(/The "is" keyword is forbidden/);
        expect(joinedLoggerOutput).to.match(/The "not" keyword is forbidden/);
      });
    });
  });
  describe('inline comments', function() {
    it('detects inline comments and logs errors', function(){
      var sourcePath = 'tests/fixtures/some-files-with-inline-comments';
      var tree = coffeelintTree(sourcePath, {
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var joinedLoggerOutput = loggerOutput.join('\n');
        expect(joinedLoggerOutput).to.match(/Disallows inline comments/);
        expect(joinedLoggerOutput).not.to.match(/look-no-errors.coffee/);
      });
    });
  });


});
