var utils = require("../lib/utils");

exports.singleLineNoArgs = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("abc\n# insert another()");

		test.ok(tree.isTree(), "Expecting a valid tree");
		test.ok(tree.hasContent(2), "Tree should have only one content element");

		tree.n(0).isText("abc");
		tree.n(1).isInstruction("insert");

		var instructionArguments = tree.n(1).get("args");
		test.equals(instructionArguments.template, "another");
		test.deepEqual(instructionArguments.args, []);
	});

	test.done();
};

exports.singleLineWithArgs = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("abc\n#   insert some   (one, two.three)");

		test.ok(tree.isTree(), "Expecting a valid tree");
		test.ok(tree.hasContent(2), "Tree should have only one content element");

		tree.n(0).isText("abc");
		tree.n(1).isInstruction("insert");

		var instructionArguments = tree.n(1).get("args");
		test.equals(instructionArguments.template, "some");
		test.deepEqual(instructionArguments.args, [{
			type : "ObjectIdentifier",
			path : ["one"]
		}, {
			type : "ObjectIdentifier",
			path : ["two", "three"]
		}]);
	});

	test.done();
};

exports.singleLineWithLiterals = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("# insert literal (true, 12, null, 'a string', ['an', 'array'], {'an' : 'object', 'works' : true}, [], {})");

		test.ok(tree.isTree(), "Expecting a valid tree");
		test.ok(tree.hasContent(1), "Tree should have only one content element");

		tree.n(0).isInstruction("insert");

		var instructionArguments = tree.n(0).get("args");
		test.equals(instructionArguments.template, "literal");
		test.deepEqual(instructionArguments.args, [{
			type : "BooleanLiteral",
			value : true
		}, {
			type : "NumericLiteral",
			value : 12
		}, {
			type : "NullLiteral",
			value : null
		}, {
			type : "StringLiteral",
			value : 'a string'
		}, {
			type : "ArrayLiteral",
			value : ['an', 'array']
		}, {
			type : "ObjectLiteral",
			value : {'an' : 'object', 'works' : true}
		}, {
			type : "ArrayLiteral",
			value : []
		}, {
			type : "ObjectLiteral",
			value : {}
		}]);
	});

	test.done();
};

exports.insideElement = function (test) {
	// TODO not yet in the grammar
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
		var tree = utils.parse("# foreach one in two \nDo Something\n# /foreach");

		tree.n(0).isForLoop("one", "in", ["two"]);
		tree.n(0).n(0).isText("Do Something");
	});

	test.done();
};

exports.containerForeachInWithParenthesis = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("# foreach (stricter in object.one) \n<div>Say: {stricter}</div>\n# /foreach");

		tree.n(0).isForLoop("stricter", "in", ["object", "one"]);
		tree.n(0).n(0).isElement("div");
		tree.n(0).n(0).n(1).isVariable(["stricter"]);
	});

	test.done();
};

// TODO all the others with and without parenthesis


// TODO single line instruction not on a single line


// TODO if statements