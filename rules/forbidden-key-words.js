// Based on https://github.com/benchling/coffeelint-forbidden-keywords by benchling

var ForbiddenKeywords;

module.exports = ForbiddenKeywords = (function() {
  function ForbiddenKeywords() {}

  ForbiddenKeywords.prototype.rule = {
    name: 'forbidden_keywords',
    level: 'error',
    message: 'The keyword is forbidden',
    forbidden: {
      'yes': 'true',
      'no': 'false',
      'on': 'true',
      'off': 'false'
    },   
    description: 'This rule forbids the usage of a specified subset of the following keywords:\n  if, unless, while, loop, until, true, yes, on, false, no, off,\n  is, ==, isnt, !=, !, not, &&, and, ||, or, ++, --, .., ...\nBy default, [\'yes\', \'no\', \'on\', \'off\'] are forbidden.'
  };

  ForbiddenKeywords.prototype.tokens = ['IF', 'LOOP', 'UNTIL', 'BOOL', 'UNARY', 'UNARY_MATH', 'COMPARE', 'LOGIC', 'LOOP', '++', '--', '..', '...'];

  ForbiddenKeywords.prototype.lintToken = function(token, tokenApi) {
    var error, forbidden, keyword, line, pos, replacement, type, value;  
    forbidden = tokenApi.config[this.rule.name].forbidden;
    type      = token[0], value = token[1], pos = token[2];
    line      = tokenApi.lines[tokenApi.lineNumber];
    keyword   = line.slice(pos.first_column, +pos.last_column + 1 || 9e9);
    if (keyword in forbidden) {
      replacement = forbidden[keyword];
      error = {
        message: replacement != null ? "The \"" + keyword + "\" keyword is forbidden. Use \"" + replacement + "\" instead" : "The \"" + keyword + "\" keyword is forbidden"
      };
      return error;
    }
  };

  return ForbiddenKeywords;

})();
