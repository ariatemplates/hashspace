var parser = require("../hsp/parser");
var fs = require("fs");
var path = require("path");
var Q = require("q");

var allTemplates = {};

function getTemplateDeferred (file) {
	var deferred = Q.defer();
	fs.readFile(file, "utf-8", function (error, text) {
		if (error) {
			// I claim that I never get here becuase I already did a readdir, but there might be a read error
			deferred.reject(new Error(error));
		} else {
			storeTemplate(file, text);
			deferred.resolve(text);
		}
	});
	return deferred.promise;
}

function storeTemplate (fileName, content) {
	var templateName = path.basename(fileName);
	var parts = content.split("EOT");

	try {
		allTemplates[templateName] = {
			content : parts[0].trim(),
			tree : JSON.parse(parts[1] || "{}")
		};
	} catch (ex) {
		console.error("Error while reading", fileName);
		console.log(ex);
	}
}

exports.htmlTemplates = {
	setUp : function (callback) {
		var templatesFolder = path.join(__dirname, "html");
		fs.readdir(templatesFolder, function (err, templates) {
			templates.reduce(function (working, fileName) {
				return working.then(getTemplateDeferred.bind(null, path.join(templatesFolder, fileName)));
			}, Q.resolve(templates)).then(function () {
				callback();
			});
		});
	},

	testExpected : function (test) {
		// Expect N assertions for template
		test.expect(Object.keys(allTemplates).length * 1);

		for (var name in allTemplates) {
			var template = allTemplates[name];
			console.log("Parsing template", name);
			//console.log(template.content);

			var actualTree = parser.parse(template.content);
			//console.log(require("util").inspect(actualTree, false, null, true));
			//console.log(JSON.stringify(actualTree));

			test.deepEqual(actualTree, template.tree);
		}
		test.done();
	}
}
