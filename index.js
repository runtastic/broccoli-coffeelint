var fs         = require('fs');
var path       = require('path');
var chalk      = require('chalk');
var findup     = require('findup-sync');
var mkdirp     = require('mkdirp');
var Filter     = require('broccoli-persistent-filter');
var crypto     = require('crypto');
var stringify  = require('json-stable-stringify');
var COFFEELINT = require('coffeelint').lint;
var REGISTERRULE = require('coffeelint').registerRule;

CoffeeLint.prototype = Object.create(Filter.prototype);
CoffeeLint.prototype.constructor = CoffeeLint;
function CoffeeLint (inputNode, options) {
  if (!(this instanceof CoffeeLint)) return new CoffeeLint(inputNode, options);

  REGISTERRULE(require('./rules/forbidden-key-words.js'));
  options = options || {};
  if (!options.hasOwnProperty('persist')) {
    options.persist = true;
  }

  Filter.call(this, inputNode, {
    annotation: options.annotation,
    persist: options.persist
  });

  this.log     = true;
  this.options = options;
  this.console = console;

  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      this[key] = options[key]
    }
  }
}

CoffeeLint.prototype.extensions = ['coffee'];
CoffeeLint.prototype.targetExtension = 'coffeelint.js';

CoffeeLint.prototype.baseDir = function() {
  return __dirname;
};

CoffeeLint.prototype.build = function () {
  var self = this;
  self._errors = [];

  if (!self.coffeelintJSON) {
    var coffeelintPath  = self.coffeelintJSONPath || path.join(this.inputPaths[0], self.coffeelintJSONRoot || '');
    self.coffeelintJSON = self.getConfig(coffeelintPath);
  }

  return Filter.prototype.build.call(this)
      .finally(function() {
        if (self._errors.length > 0) {
          var label = ' CoffeeLint Error' + (self._errorLength > 1 ? 's' : '')
          console.log('\n' + self._errors.join('\n'));
          console.log(chalk.yellow('===== ' + self._errorLength + label + '\n'));
        }
      })
};

CoffeeLint.prototype.processString = function (content, relativePath) {
  var passed = COFFEELINT(content, this.coffeelintJSON);
  var errors = this.processErrors(relativePath, passed);
  this._errorLength += passed.length;
  if (errors && this.log) {
    this.logError(errors)
  }

  if (!this.disableTestGenerator) {
    return this.testGenerator(relativePath, passed, errors);
  }
};

CoffeeLint.prototype.processErrors = function (file, errors) {
  if (!errors) { return ''; }

  var len = errors.length,
  str = '',
  error, idx;

  if (len === 0) { return ''; }
  str += '============================================================\n';
  str += file + ' (' + len + ' error' + ((len === 1) ? '' : 's') + '):\n';
  for (idx=0; idx<len; idx++) {
    error = errors[idx];
    if (error !== null) {
      str += '------------------------------------------------------------\n';
      if (error.level) {
        str += 'level: ' + error.level + '\n';
      }
      str += 'line: ' + error.lineNumber + '\n';
      str += 'rule: ' + error.rule + '\n';
      str += 'message: ' + error.message + '\n';
      if (error.line) {
        str += error.line + '\n';
      }
      if (error.context) {
        str += error.context + '\n';
      }
    }
  }
  return str;
};

CoffeeLint.prototype.testGenerator = function(relativePath, passed, errors) {
  if (errors) {
    errors = "\\n" + this.escapeErrorString(errors);
  } else {
    errors = ""
  }

  return "module('CoffeeLint - " + path.dirname(relativePath) + "');\n" +
         "test('" + relativePath + " should pass coffeelint', function() { \n" +
         "  ok(" + !!passed + ", '" + relativePath + " should pass coffeelint." + errors + "'); \n" +
         "});\n"
};

CoffeeLint.prototype.logError = function(message, color) {
  color = color || 'red';
  this._errors.push(chalk[color](message) + "\n");
};

CoffeeLint.prototype.getConfig = function(rootPath) {
  if (!rootPath) { rootPath = process.cwd(); }
  var coffeelintJSONPath = findup('coffeelint.json', {cwd: rootPath, nocase: true});
  if (coffeelintJSONPath) {
    var config = fs.readFileSync(coffeelintJSONPath, {encoding: 'utf8'});
    try {
      return JSON.parse(this.stripComments(config));
    } catch (e) {
      console.error(chalk.red('Error occured parsing coffeelint.json.'));
      console.error(e.stack);
      return null;
    }
  }
};

CoffeeLint.prototype.stripComments = function(string) {
  string = string || "";

  string = string.replace(/\/\*(?:(?!\*\/)[\s\S])*\*\//g, "");
  string = string.replace(/\/\/[^\n\r]*/g, ""); // Everything after '//'

  return string;
};

CoffeeLint.prototype.escapeErrorString = function(string) {
  string = string.replace(/\n/gi, "\\n");
  string = string.replace(/'/gi, "\\'");

  return string;
};

CoffeeLint.prototype.optionsHash  = function() {
  if (!this._optionsHash) {
    this._optionsHash = crypto.createHash('md5')
        .update(stringify(this.options), 'utf8')
        .update(stringify(this.coffeelintJSON) || '', 'utf8')
        .update(this.testGenerator.toString(), 'utf8')
        .update(this.logError.toString(), 'utf8')
        .update(this.escapeErrorString.toString(), 'utf8')
        .digest('hex');
  }

  return this._optionsHash;
};

CoffeeLint.prototype.cacheKeyProcessString = function(string, relativePath) {
  return this.optionsHash() + Filter.prototype.cacheKeyProcessString.call(this, string, relativePath);
};

module.exports = CoffeeLint;
