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

exports.insertAsPlainText = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("This is not an # insert element (content)");

		tree.n(0).isText("This is not an # insert element (content)");
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

exports.containerSimpleIf = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse(
			"# if one.isTrue \nYes it is!\n# /if \n " +
			"# if (two)\nWith <brackets />\n  # /if"
		);

		tree.n(0).isIf(["one", "isTrue"]);
		tree.n(0).nn(0, 0).isText("Yes it is!");
		test.deepEqual(tree.n(0).nn(1, 0), [], "Else 1 statement should be empty");

		tree.n(1).isIf(["two"]);
		tree.n(1).nn(0, 0).isText("With");
		tree.n(1).nn(0, 1).isElement("brackets");
		test.deepEqual(tree.n(1).nn(1, 0), [], "Else 2 statement should be empty");
	});

	test.done();
};

exports.containerIfElse = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse([
			" #  if   something.here  ",
			"   Is Something",
			"# \t else",
			"   Is <something>{different}</something>",
			"  # /if"
		].join("\n"));

		tree.n(0).isIf(["something", "here"]);
		tree.n(0).nn(0, 0).isText("Is Something");
		tree.n(0).nn(1, 0).isText("Is");
		tree.n(0).nn(1, 1).isElement("something");
		tree.n(0).nn(1, 1).n(0).isVariable(["different"]);
	});

	test.done();
};

exports.stackedInstructions = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse([
			"# insert one()",
			"# insert two(2)  ",
			"# insert three(3)",
			"\n\n",
			"# insert four(true)"
		].join("\n"));

		tree.n(0).isInstruction("insert");
		test.equals(tree.n(0).get("args").template, "one");

		tree.n(1).isInstruction("insert");
		test.equals(tree.n(1).get("args").template, "two");

		tree.n(2).isInstruction("insert");
		test.equals(tree.n(2).get("args").template, "three");

		tree.n(3).isText();  // a bunch of new lines

		tree.n(4).isInstruction("insert");
		test.equals(tree.n(4).get("args").template, "four");
	});

	test.done();
};

exports.nestedInstructions = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse([
			"# if (one)",
			"   # insert aNumber(1)",
			"   And write something",
			"# else",
			"   # if two",
			"      This is a nested if",
			"   # else ",
			"      This is a nested else",
			"   # /if",
			"   # insert aNumber(2)",
			"# /if"
		].join("\n"));

		tree.n(0).isIf(["one"]);

		// then block
		tree.n(0).nn(0, 0).isInstruction("insert");
		test.equals(tree.n(0).nn(0, 0).get("args").template, "aNumber");
		tree.n(0).nn(0, 1).isText("And write something");

		// else block
		tree.n(0).nn(1, 1).isInstruction("insert");
		test.equals(tree.n(0).nn(1, 1).get("args").template, "aNumber");
		var nestedIf = tree.n(0).nn(1, 0);
		nestedIf.isIf(["two"]);
		nestedIf.nn(0, 0).isText("This is a nested if");
		nestedIf.nn(1, 0).isText("This is a nested else");
	});

	test.done();
};

// TODO in the errors, container as inline text should be a syntax error, otherwise how do I know that # /if is not of another real if?

// TODO all statements inside an element