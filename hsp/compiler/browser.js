var compiler = require("./compiler");

/*!
 * Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
 */
var reCommentContents = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)\s*\*\//;

module.exports = function (fn) {
	if (typeof fn !== 'function') {
		throw new TypeError('Expected a function');
	}

	var match = reCommentContents.exec(fn.toString());

	if (!match) {
		throw new TypeError('Multiline comment missing.');
	}

	var result = compiler.compile(match[1], "dynamic_code.js", {
		globalRef: "hsp",
		mode: "global",
		includeSyntaxTree: true
	});

	// Extract the templates from the eval code
	var extract = [];
	for (var name in result.codeFragments) {
		if (result.codeFragments.hasOwnProperty(name)) {
			extract.push(name + ":" + name);
		}
	}

	function wrap (code, templatesJson) {
		var result = "(function () {\n" + code;
		result += "\nreturn {";
		result += templatesJson.join(",");
		result += "}})()";
		return result;
	}

	return eval(wrap(result.code, extract));
};
