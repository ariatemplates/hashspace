var utils = require("../lib/utils");

exports.empty = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("");

		test.ok(tree.isTree(), "Expecting a valid empty tree");
		test.ok(!tree.hasContent(), "Tree should be empty");
	});

	test.done();
};