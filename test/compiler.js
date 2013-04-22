var utils = require("./lib/utils");
var path = require("path");

var allTemplates = {};

exports.htmlTemplates = {
	setUp : function (callback) {
		utils.getTemplates(path.join(__dirname, "samples"), function (templates) {
			allTemplates = templates;

			utils.startServer(function () {
				callback();
			});
		});
	},

	tearDown : function (callback) {
		utils.stopServer(function () {
			callback();
		});
	},

	compileAndRun : function (test) {
		// Expect N assertions for template
		test.expect(Object.keys(allTemplates).length * 3);

		// I expect the test to end in less that 3 seconds
		var timeout = setTimeout(function () {
			test.fail("Test timeout");
			test.done();
		}, 3000);

		utils.each(function (name, template, next) {
			var js;
			test.doesNotThrow(function () {
				js = utils.compile(template.content);
			});

			utils.run(js, template.args, function (result) {
				test.ifError(result.error);

				test.equal(noBlanks(result.html), noBlanks(template.html));
				next();
			});
		}, function () {
			clearTimeout(timeout);
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