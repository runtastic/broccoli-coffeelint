var fs         = require('fs');
var path       = require('path');
var chalk      = require('chalk');
var findup     = require('findup-sync');
var mkdirp     = require('mkdirp');
var walkSync   = require('walk-sync');
var COFFEELINT = require('coffeelint').lint;
var helpers    = require('broccoli-kitchen-sink-helpers');
var Filter     = require('broccoli-filter');
var REGISTERRULE = require('coffeelint').registerRule;

var mapSeries  = require('promise-map-series')

CoffeeLint.prototype = Object.create(Filter.prototype);
CoffeeLint.prototype.constructor = CoffeeLint;
function CoffeeLint (inputTree, options) {
  if (!(this instanceof CoffeeLint)) return new CoffeeLint(inputTree, options);
  REGISTERRULE(require('./rules/forbidden-key-words.js'));
  REGISTERRULE(require('./rules/forbidden-inline-comments.js'));
  options = options || {};

  this.inputTree = inputTree;
  this.log       = true;

  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      this[key] = options[key]
    }
  }
};

CoffeeLint.prototype.extensions = ['coffee'];
CoffeeLint.prototype.targetExtension = 'coffeelint.js';

CoffeeLint.prototype.write = function (readTree, destDir) {
  var self          = this
  self._errors      = [];
  self._errorLength = 0;
  return readTree(this.inputTree).then(function (srcDir) {
    var paths = walkSync(srcDir)
    if (!self.coffeelintJSON) {
      var coffeelintPath  = self.coffeelintJSONPath || path.join(srcDir, self.coffeelintJSONRoot || '');
      self.coffeelintJSON = self.getConfig(coffeelintPath);
    }
    return mapSeries(paths, function (relativePath) {
      if (relativePath.slice(-1) === '/') {
        mkdirp.sync(destDir + '/' + relativePath)
      } else {
        if (self.canProcessFile(relativePath)) {
          return self.processAndCacheFile(srcDir, destDir, relativePath)
        } else {
          helpers.copyPreserveSync(
            srcDir + '/' + relativePath, destDir + '/' + relativePath)
        }
      }
    })
  })
  .finally(function() {
    if (self._errors.length > 0) {
      var label = ' CoffeeLint Error' + (self._errorLength > 1 ? 's' : '')
      console.log('\n' + self._errors.join('\n'));
      console.log(chalk.yellow('===== ' + self._errorLength + label + '\n'));
    }
  })
}

CoffeeLint.prototype.processString = function (content, relativePath) {
  var passed = COFFEELINT(content, this.coffeelintJSON);
  var errors = this.processErrors(relativePath, passed);
  this._errorLength += passed.length
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
      str += '------------------------------------------------------------\n'
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
}

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
      console.error(chalk.red('Error occured parsing cofeelint.json.'));
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

module.exports = CoffeeLint;
