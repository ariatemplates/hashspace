var createHspPreprocessor = function (args, config, logger, helper) {
  var compiler = require("../../index").compiler;
  var log = logger.create('preprocessor.hsp');

  return function (content, file, done) {

    log.debug('Processing "%s".', file.originalPath);
    var compileResult = compiler.compile(content, file.path);

    //TODO: refactor as soon as https://github.com/ariatemplates/hashspace/issues/61 is fixed
    if (compileResult.errors.length  === 0) {
      done(compileResult.code);
    } else {
      compileResult.errors.forEach(function(error){
        log.error('%s\n in %s at %d:%d', error.description, file.originalPath, error.line, error.column);
      });
      done(new Error(compileResult.errors));
    }
  };
};

// PUBLISH DI MODULE
module.exports = {
  'preprocessor:hsp': ['factory', createHspPreprocessor]
};