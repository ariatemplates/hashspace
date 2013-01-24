var PEG = require("pegjs");

var fs = require("fs");
var grammar = fs.readFileSync(__dirname + "/peg/htmltemplate.pegjs", "utf-8");
var parser = PEG.buildParser(grammar);

exports.parse = function (template) {
	return parser.parse(template);
};