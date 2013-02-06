var fs = require("fs");
var generator = require("./codeGenerator");

/**
 * Render an Hashspace file at the given `path` and callback `fn(err, str)`.
 *
 * @param {String} path
 * @param {Object|Function} options or callback
 * @param {Function} fn
 */
exports.renderFile = function (path, options, fn) {
	if (typeof options === 'function') {
		fn = options, options = {};
	}

	fs.readFile(path, "utf8", function (err, content) {
		var compiledTemplate;

		if (!err) {
			try {
				compiledTemplate = generator.compile(content);
			} catch (ex) {
				err = ex;
			}
		}
		
		fn(err, compiledTemplate);
	});
};

exports.__express = exports.renderFile;