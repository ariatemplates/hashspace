var renderer = require("../hsp/compiler/renderer");

var createHspPreprocessor = function () {

  return function (content, file, done) {

    // compile src
    var r = renderer.renderString(content);

    //TODO: rename "serverErrors" into "compileErrors" or similar
    if (r.serverErrors && r.serverErrors.length) {
      throw new Error(r.serverErrors[0].description);
    } else {
      done(r.code);
    }
  };
};

// PUBLISH DI MODULE
module.exports = {
  'preprocessor:hsp': ['factory', createHspPreprocessor]
};