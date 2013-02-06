var utils = require("../lib/utils");

exports.plainText = function (test) {
	test.doesNotThrow(function () {
		// TODO arrays are not allowed
		var tree = utils.parse("{variable}\n{two.levels}\n{three.levels.here}");

		tree.n(0).isVariable(["variable"]);
		tree.n(2).isVariable(["two", "levels"]);
		tree.n(4).isVariable(["three", "levels", "here"]);
	});

	test.done();
};

exports.modifiers = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("{is.bound}\n{:is.notBound}");

		tree.n(0).isVariable(["is", "bound"], false);
		tree.n(2).isVariable(["is", "notBound"], true);
	});

	test.done();
};

exports.insideElement = function (test) {
	test.doesNotThrow(function () {
		// TODO arrays are not allowed
		var tree = utils.parse("<div something = 'static'>{one}</div><span>Text {flows.around} here</span>");

		tree.n(0).isElement("div");
		tree.n(0).n(0).isVariable(["one"]);

		tree.n(1).isElement("span");
		tree.n(1).n(1).isVariable(["flows", "around"]);
	});

	test.done();
};

exports.asAttribute = function (test) {
	test.doesNotThrow(function () {
		// TODO arrays are not allowed
		var tree = utils.parse("As first<div class='{one}&nbsp;two'>or last<span class='strong {:two.style.classname}'>Text</span></div>");

		tree.n(1).isElement("div");
		var attributes = tree.n(1).get("attr");
		test.deepEqual(attributes, [{
			name : "class",
			isStatic : false,
			quote : "'",
			value : [{
				type : "value",
				args : ["one"],
				bind : false
			}, "&nbsp;two"]
		}]);

		var span = tree.n(1).n(1);
		span.isElement("span");
		attributes = span.get("attr");
		test.deepEqual(attributes, [{
			name : "class",
			isStatic : false,
			quote : "'",
			value : ["strong ", {
				type : "value",
				args : ["two", "style", "classname"],
				bind : true
			}]
		}]);
	});

	test.done();
};

exports.multipleAttributes = function (test) {
	test.doesNotThrow(function () {
		// TODO arrays are not allowed
		var tree = utils.parse("<article style=\"{two2.color}='{two2.colorValue}';\" static=\"no&#20;vars&#20;here\"></article>");

		tree.n(0).isElement("article");
		var attributes = tree.n(0).get("attr");
		test.deepEqual(attributes, [{
			name : "style",
			isStatic : false,
			quote : '"',
			value : [{
				type : "value",
				args : ["two2", "color"],
				bind : false
			}, "='", {
				type : "value",
				args : ["two2", "colorValue"],
				bind : false
			}, "';"]
		}, {
			name : "static",
			isStatic : true,
			quote : '"',
			value : ["no&#20;vars&#20;here"]
		}]);
	});

	test.done();
};