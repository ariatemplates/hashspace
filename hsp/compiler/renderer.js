var fs = require("fs");
var compiler = require("./compiler");

/**
 * Render an Hashspace file at the given `path` and callback `fn(err, str)`.
 *
 * @param {String} path
 * @param {Object|Function} options or callback
 * @param {Function} fn
 */
function renderFile (path, options, fn) {
	if (typeof options === 'function') {
		fn = options, options = {};
	}

	fs.readFile(path, "utf8", function (err, content) {
		var compiledTemplate;

		if (!err) {
			try {
				var r=compiler.compile(content);
				compiledTemplate = r.code;
				err=r.errors;
			} catch (ex) {
				err = [ex];
			}
		}
		console.log(compiledTemplate)
		
		fn(err, compiledTemplate);
	});
};

exports.__express = renderFile;