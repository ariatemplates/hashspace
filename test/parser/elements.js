var utils = require("../lib/utils");

exports.singleLineNoAttributes = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("<div>abc</div>");

		tree.n(0).isElement("div");
		tree.n(0).n(0).isText("abc");

		var attributes = tree.n(0).more("attr");
		attributes.length(0);
	});

	test.done();
};

exports.singleLineWithArgsSingleQuote = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("<help some='attribute'>one</help>");

		tree.n(0).isElement("help");
		tree.n(0).n(0).isText("one");

		var attributes = tree.n(0).more("attr");
		attributes.length(1);
		attributes.n(0).isAttribute("some", true, true);
		test.deepEqual(attributes.n(0).get("value"), ["attribute"]);
	});

	test.done();
};

exports.singleLineWithArgsDoubleQuote = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse('<help some="attribute">two</help>');

		tree.n(0).isElement("help");
		tree.n(0).n(0).isText("two");

		var attributes = tree.n(0).more("attr");
		attributes.length(1);
		attributes.n(0).isAttribute("some", true);
		test.deepEqual(attributes.n(0).get("value"), ["attribute"]);
	});

	test.done();
};

exports.singleLineWithArgsMixedQuote = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse('<weird one = "1" two=\'due\' three="3\'3">indeed</weird>');

		tree.n(0).isElement("weird");
		tree.n(0).n(0).isText("indeed");

		var attributes = tree.n(0).more("attr");
		attributes.length(3);
		attributes.n(0).isAttribute("one", true);
		attributes.n(1).isAttribute("two", true, true);
		attributes.n(2).isAttribute("three", true);

		test.deepEqual(attributes.n(0).get("value"), ["1"]);
		test.deepEqual(attributes.n(1).get("value"), ["due"]);
		test.deepEqual(attributes.n(2).get("value"), ["3'3"]);
	});

	test.done();
};

exports.mulitpleElements = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse('<div>One</div>\n\t <div>Two</div>\n\t <div>Three</div><div>Four has no space</div>');

		test.ok(tree.hasContent(6), "Expecting 6 elements of alternating text and HTML");

		tree.n(0).isElement("div");
		tree.n(0).n(0).isText("One");

		tree.n(2).isElement("div");
		tree.n(2).n(0).isText("Two");

		tree.n(4).isElement("div");
		tree.n(4).n(0).isText("Three");

		// there's no text between 3 and 4

		tree.n(5).isElement("div");
		tree.n(5).n(0).isText("Four has no space");
	});

	test.done();
};

exports.selfClosing = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse('<img src="http://someting.com/url"/>');

		tree.n(0).isElement("img");
		var attributes = tree.n(0).more("attr");
		attributes.length(1);
		attributes.n(0).isAttribute("src", true);
		test.deepEqual(attributes.n(0).get("value"), ["http://someting.com/url"]);

		// I expect it to be undefined / missing
		test.deepEqual(tree.n(0).get("content"));
	});

	test.done();
};

// TODO element with some initial text should have a text element before the actual element

exports.nestedTags = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse('<div><span>Some text here\n   \t<!-- even a - comment -->\n   \tand some <strong>other</strong> text here</span></div>');

		tree.n(0).isElement("div");

		var span = tree.n(0).n(0);
		span.isElement("span");
		span.n(0).isText("Some text here\n   \t");
		// TODO the comment is dropped but there are two text nodes, should be merged by the optimizer
		span.n(1).isText("\n   \tand some ");
		span.n(2).isElement("strong");
		span.n(2).n(0).isText("other");
		span.n(3).isText(" text here");
	});

	test.done();
};