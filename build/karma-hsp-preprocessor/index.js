var compiler = require("../../index").compiler;

var createHspPreprocessor = function () {

  return function (content, file, done) {

    var compileResult = compiler.compile(content, file.path);

    //TODO: this check won't be needed as soon as https://github.com/ariatemplates/hashspace/issues/61 is fixed
    if (compileResult.errors.length === 0) {
      done(compileResult.code);
    } else {
      throw new Error(compileResult.errors[0]);
    }
  };
};

// PUBLISH DI MODULE
module.exports = {
  'preprocessor:hsp': ['factory', createHspPreprocessor]
};