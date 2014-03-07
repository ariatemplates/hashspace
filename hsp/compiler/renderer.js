var fs = require("fs");
var compiler = require("./compiler");

/**
 * Render an Hashspace file at the given `path` and callback `fn(error, compiledTemplate)`.
 * @param {String} path
 * @param {Object|Function} options or callback
 * @param {Function} fn the callback
 */
exports.renderFile = function (path, options, fn) {
    if (typeof options === 'function') {
        fn = options, options = {};
    }

    fs.readFile(path, "utf8", function (err, content) {
        var compiledTemplate;
        if (!err) {
            try {
                var result = compiler.compile(content, path);
                compiledTemplate = result.code;
                // err=r.errors;
            } catch (ex) {
                err = ex;
            }
        }
        fn(err, compiledTemplate);
    });
};

/**
 * Render an hashspace template provided as a string
 * @param {String} src the file content that should be rendered
 * @param {String} fileName the name of the file (used for bettter error processing)
 * @return the compiled JS
 */
exports.renderString = function (src, path) {
    var result = {
        code : '',
        errors : null
    };
    try {
        result = compiler.compile(src, path);
    } catch (ex) {
        result.serverErrors = [{
                description : ex.toString()
            }];
    }
    return result;
};
