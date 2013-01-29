var utils = require("../lib/utils");

exports.staticText = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("Some text here");

		test.ok(tree.isTree(), "Expecting a valid tree");
		test.ok(tree.hasContent(1), "Tree should have only one content element");

		tree.n(0).isText("Some text here");
	});

	test.done();
};

exports.staticTextMultiline = function (test) {
	test.doesNotThrow(function () {
		var text = "first line\nanother line\r\nwindows line\n\n\r\nmixed lines";
		var tree = utils.parse(text);

		test.ok(tree.isTree(), "Expecting a valid tree");
		test.ok(tree.hasContent(1), "Tree should have only one content element");

		tree.n(0).isText(text);
	});

	test.done();
};

/*
exports.staticTextInstruction = function (test) {
	test.doesNotThrow(function () {
		var text = "instruction # must be on the beginning of a line\nOnly spaces allowed # if (true)\n";
		var tree = utils.parse(text);
		tree.log();

		test.ok(tree.isTree(), "Expecting a valid tree");
		test.ok(tree.hasContent(1), "Tree should have only one content element");

		test.ok(tree.n(0).isText(text), "First node should be a text content");
	});

	test.done();
};
*/