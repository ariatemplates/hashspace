var parser = require("./parser");
var treeWalker = require("./treeWalker");
var processors = require("./processors");

exports.compile = function (template) {
	// Parsing might throw an exception
	var representation = parser.parse(template);

	// I'm sure it's an array otherwise the parser would have thrown an exception
	representation = treeWalker.walk(representation, processors);

	// TODO or should it return an array?
	return representation.join("\n");
};