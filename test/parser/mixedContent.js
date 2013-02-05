// Test that a file can contain mixed template and other content
// Template part is replaced with pure text
var parser = require("../../compiler/parser");
var parseTree = require("../lib/parseTree");
var _ = require("underscore");

exports.singleTemplate = function (test) {
	test.doesNotThrow(function () {
		try {
			var parsed = parser.parse([
				"  \t\t\r\n  \n\n  ", // a bunch of blanks
				"   # template mixed()  ",
				"   Some text",
				"# /template  ",
				"  \n\n\n\t\t " //few extra blanks
			].join("\n"));

			test.ok(_.isArray(parsed), "Expecting the parsed content to be an array");

			// the tree here should be a valid single intermediate representation
			var tree = parseTree.create(parsed[0]);
			tree.isTree();
			tree.hasContent(1);

			tree.n(0).isText("Some text");
		} catch (ex) {
			throw new Error(ex);
		}
	});

	test.done();
};


exports.multipleTemplates = function (test) {
	test.doesNotThrow(function () {
		try {
			var parsed = parser.parse([
				"# template first(one)",
				"Text one",
				"# /template",
				"  \n\n\n\t\t ", //few blanks before another template
				"  # template second(two) ",
				"    Other text {two}",
				"  # /template"
			].join("\n"));

			test.ok(_.isArray(parsed), "Expecting the parsed content to be an array");
			test.equals(parsed.length, 2, "Expecting two templates in the same file");

			var first = parseTree.create(parsed[0]);
			first.isTree();
			first.hasContent(1);

			first.n(0).isText("Text one");

			var second = parseTree.create(parsed[1]);
			second.isTree();
			second.hasContent(1);

			second.n(0).isText("Other text");
			second.n(1).isVariable(["two"]);
		} catch (ex) {
			throw new Error(ex);
		}
	});

	test.done();
};

exports.multipleContent = function (test) {
	test.doesNotThrow(function () {
		try {
			var text = "Some plain text here";
			var js = "(function () {var works = one().node ? 'yeah' : 'nope'})()";
			var other = ["/*!",
				" * Open Source license",
				" * With '# ' symbols inside # # ## yeah!",
				" */",
				"<html><head>...and so on!"
			].join("\n");

			var parsed = parser.parse([
				text,
				// a first template
				"# template one()",
				"<cool/>",
				"# /template",
				"     ",
				// some javascript
				js,
				// another template
				"# template two()",
				"<even>better</even>",
				"# /template",
				" \t\n\t\n",
				// Any other text, it doesn't matter
				other
			].join("\n"));

			test.ok(_.isArray(parsed), "Expecting the parsed content to be an array");
			test.equals(parsed.length, 5, "Expecting 5 blocks of content");

			// first is text
			test.equals(parsed[0].value.trim(), text);

			//second is a template
			var tpl = parseTree.create(parsed[1]);
			tpl.isTree();
			tpl.hasContent(1);
			tpl.n(0).isElement("cool");

			// third is JavaScript
			test.equals(parsed[2].value.trim(), js);

			// fourth is another template
			tpl = parseTree.create(parsed[3]);
			tpl.isTree();
			tpl.hasContent(1);
			tpl.n(0).isElement("even");
			tpl.n(0).n(0).isText("better");

			// last one is some other text
			test.equals(parsed[4].value.trim(), other);
		} catch (ex) {
			throw new Error(ex);
		}
	});

	test.done();
};