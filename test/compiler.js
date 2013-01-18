var compiler = require("../hsp/compiler");
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

	compileAndRun : function (test) {
		// Expect N assertions for template
		test.expect(Object.keys(allTemplates).length * 3);

		utils.each(function (name, template, next) {
			console.log("\n->Compiling template", name);
			//console.log(template.content);

			var js;
			test.doesNotThrow(function () {
				js = compiler.compile(template.content);
			});
			//console.log("COMPILED JAVASCRIPT:\n", js);

			utils.run(js, template.args, function (result) {
				test.ifError(result.error);

				// Do some assertions
				//console.log("HTML1", noBlanks(result.html));
				//console.log("HTML2", noBlanks(template.html));
				test.equal(noBlanks(result.html), noBlanks(template.html));
				next();
			});
		}, function () {
			test.done();
		});
	}
};

function noBlanks (text) {
	if (text) {
		return text.replace(/\r\n?|[\n\u2028\u2029]/g, "\n").replace(/\n/g, "").replace(/\s/g, "");
	} else {
		return "";
	}
}