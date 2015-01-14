var ForbiddenInlineComments, regexes;

regexes = {
  normalComment: /^\s*\#.*/,
  includesHash: /\#/,
  stringInterpolation: /".*\#{.*"/,
  quotedHash: /['"].*([#]).*['"]/,
  quotedMultilineHash: /(^|\s)['"][^'"]*([#]).*/
};

module.exports = ForbiddenInlineComments = (function() {
  function ForbiddenInlineComments() {}

  ForbiddenInlineComments.prototype.rule = {
    name: 'forbidden_inline_comments',
    level: 'error',
    message: 'Disallows inline comments',
    description: 'Disallows inline comments.'
  };

  ForbiddenInlineComments.prototype.lintLine = function(line, lineApi) {
    var hashIsAllowed = regexes.normalComment.test(line) ||
                        regexes.stringInterpolation.test(line) ||
                        regexes.quotedHash.test(line) ||
                        regexes.quotedMultilineHash.test(line);

    if (regexes.includesHash.test(line) && !hashIsAllowed)
      return { context: line }
  };

  return ForbiddenInlineComments;

})();
