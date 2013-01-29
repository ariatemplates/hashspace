var utils = require("../lib/utils");

exports.singleLineNoArgs = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("abc\n# insert another()");

		test.ok(tree.isTree(), "Expecting a valid tree");
		test.ok(tree.hasContent(2), "Tree should have only one content element");

		tree.n(0).isText("abc");
		test.ok(tree.n(1).isInstruction("insert"), "Second node should be an instruction");

		var instructionArguments = tree.n(1).get("args");
		// TODO format of the insert parameters
		test.equals(instructionArguments.base, "another");
		test.equals(instructionArguments.args, "");
	});

	test.done();
};

exports.singleLineWithArgs = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("abc\n#   insert some   (one, two.three)");

		test.ok(tree.isTree(), "Expecting a valid tree");
		test.ok(tree.hasContent(2), "Tree should have only one content element");

		tree.n(0).isText("abc");
		test.ok(tree.n(1).isInstruction("insert"), "Second node should be an instruction");

		var instructionArguments = tree.n(1).get("args");
		// TODO same as before
		test.equals(instructionArguments.base, "some");
		//test.equals(instructionArguments.args, "");
	});

	test.done();
};

exports.singleLineWithLiterals = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("# insert literal (true, 12, null, 'a string', ['an', 'array'], {'an' : 'object', 'works' : true})");

		test.ok(tree.isTree(), "Expecting a valid tree");
		test.ok(tree.hasContent(1), "Tree should have only one content element");

		test.ok(tree.n(0).isInstruction("insert"), "First node should be an instruction");

		var instructionArguments = tree.n(0).get("args");
		// TODO same as before
		test.equals(instructionArguments.base, "literal");
		//test.equals(instructionArguments.args, "");
	});

	test.done();
};

exports.insideElement = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("<div>Hi!\n# insert element (content)\n</div>");
		//tree.log();

		tree.n(0).isElement("div");

		tree.n(0).n(0).isText();
		// TODO the second should be an insert
		// test.ok(tree.n(0).n(1).isInstruction("insert"), "Second node inside the div should be an insert");

		//var instructionArguments = tree.n(0).n(1).get("args");
		// TODO same as before
		//test.equals(instructionArguments.base, "element");
		//test.equals(instructionArguments.args, "");
	});

	test.done();
};

exports.containerForeachIn = function (test) {
	test.doesNotThrow(function () {
		// TODO should be foreach, not for
		var tree = utils.parse("# for one in two \nDo Something\n# /for");
		//tree.log();

		//test.ok(tree.n(0).isElement("div"));

		//test.ok(tree.n(0).n(0).isText());
		// TODO the second shuld be an insert
		// test.ok(tree.n(0).n(1).isInstruction("insert"), "Second node inside the div should be an insert");

		//var instructionArguments = tree.n(0).n(1).get("args");
		// TODO same as before
		//test.equals(instructionArguments.base, "element");
		//test.equals(instructionArguments.args, "");
	});

	test.done();
};

// TODO all the others with and without parenthesis

/*

# template instruction (obj)
# for something in obj
   <span># insert another() {something.text}</span>
# /for
The one above is not an insert instruction
# if false
  This should not be in the output
# /if
  # if (obj && false)
    This neither
  # /if
# /template
*/