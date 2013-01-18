var parser = require("../hsp/parser");
var utils = require("./lib/utils");
var path = require("path");

var allTemplates = {};

exports.htmlTemplates = {
	setUp : function (callback) {
		utils.getTemplates(path.join(__dirname, "html"), function (templates) {
			allTemplates = templates;
			callback();
		});
	},

	testExpected : function (test) {
		// Expect N assertions for template
		test.expect(Object.keys(allTemplates).length * 1);

		utils.each(function (name, template, next) {
			console.log("\n->Parsing template", name);
			//console.log(template.content);

			var actualTree = parser.parse(template.content);
			//console.log(require("util").inspect(actualTree, false, null, true));
			//console.log(JSON.stringify(actualTree));

			test.deepEqual(actualTree, template.tree);

			next();
		}, function () {
			test.done();
		});
	}
}
