var ForbiddenInlineComments, regexes;

regexes = {
  normalComment: /^\s*\#.*/,
  includesHash: /\#/,
  stringInterpolation: /".*\#{.*"/
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
    if (regexes.includesHash.test(line) && !regexes.normalComment.test(line) && !regexes.stringInterpolation.test(line))
      return { context: line }
  };

  return ForbiddenInlineComments;

})();
