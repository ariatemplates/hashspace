var fs = require("fs");
var compiler = require("./compiler");

/**
 * Render an Hashspace file at the given `path` and callback `fn(error, compiledTemplate)`.
 *
 * @param {String} path
 * @param {Object|Function} options or callback
 * @param {Function} fn the callback
 */
exports.renderFile=function (path, options, fn) {
	if (typeof options === 'function') {
		fn = options, options = {};
	}

	fs.readFile(path, "utf8", function (err, content) {
		var compiledTemplate;
		if (!err) {
			try {
				var r=compiler.compile(content);
				compiledTemplate = r.code;
				//err=r.errors;
			} catch (ex) {
				err = ex;
			}
		}
		fn(err, compiledTemplate);
	});
};

/**
 * Render an hashspace template provided as a string
 * @return the compiled JS 
 */
exports.renderString=function (src) {
	var r={code:'',errors:null};
	try {
		r=compiler.compile(src,"[noname]");
	} catch (ex) {
		r.serverErrors=[{description:ex.toString()}];
	}
	return r;
};
