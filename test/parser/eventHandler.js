var utils = require("../lib/utils");

exports.events = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("<div onclick='{inTheScope()}'></div><span onpress=\"{an.object(event)}\"></span>");

		var events, args;

		tree.n(0).isElement("div");
		events = tree.n(0).more("events");
		events.length(1);
		events.n(0).isCallback("click", true);
		args = events.n(0).get("args");
		test.deepEqual(args, {
			method : {
				type : "ObjectIdentifier",
				path : ["inTheScope"]
			},
			args : []
		});

		tree.n(1).isElement("span");
		events = tree.n(1).more("events");
		events.length(1);
		events.n(0).isCallback("press");
		args = events.n(0).get("args");
		test.deepEqual(args, {
			method : {
				type : "ObjectIdentifier",
				path : ["an", "object"]
			},
			args : [{
				type : "ObjectIdentifier",
				path : ["event"]
			}]
		});
	});

	test.done();
};

exports.emptyTag = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("<missing onsleep='{aroundHere([\"a\",\"string\"])}' />");

		var events, args;

		tree.n(0).isElement("missing");
		events = tree.n(0).more("events");
		events.length(1);
		events.n(0).isCallback("sleep", true);
		args = events.n(0).get("args");
		test.deepEqual(args, {
			method : {
				type : "ObjectIdentifier",
				path : ["aroundHere"]
			},
			args : [{
				type : "ArrayLiteral",
				value : ["a", "string"]
			}]
		});
	});

	test.done();
};

exports.multipleEvents = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("<div onfirst='{inTheScope()}' onsecond='{doit(\"please\", true)}'></div>");

		var events, args;

		tree.n(0).isElement("div");
		events = tree.n(0).more("events");
		events.length(2);

		events.n(0).isCallback("first", true);
		args = events.n(0).get("args");
		test.deepEqual(args, {
			method : {
				type : "ObjectIdentifier",
				path : ["inTheScope"]
			},
			args : []
		});

		events.n(1).isCallback("second", true);
		args = events.n(1).get("args");
		test.deepEqual(args, {
			method : {
				type : "ObjectIdentifier",
				path : ["doit"]
			},
			args : [{
				type : "StringLiteral",
				value : "please"
			}, {
				type : "BooleanLiteral",
				value : true
			}]
		});
	});

	test.done();
};

exports.traditionalCallback = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("<another onbusy='aroundHere()' another='here' />");

		tree.n(0).isElement("another");
		var events = tree.n(0).more("events");
		events.length(0);

		var attributes = tree.n(0).more("attr");
		attributes.length(2);
		attributes.n(0).isAttribute("onbusy", true, true);
		test.deepEqual(attributes.n(0).get("value"), ['aroundHere()']);
	});

	test.done();
};

exports.objectIdentifiers = function (test) {
	test.doesNotThrow(function () {
		var tree = utils.parse("<another onsomething-bad='{doIt(another.object, here.it.comes)}'>Try it</another>");

		var events, args;

		tree.n(0).isElement("another");
		events = tree.n(0).more("events");
		events.length(1);
		events.n(0).isCallback("something-bad", true);

		args = events.n(0).get("args");
		test.deepEqual(args, {
			method : {
				type : "ObjectIdentifier",
				path : ["doIt"]
			},
			args : [{
				type : "ObjectIdentifier",
				path : ["another", "object"]
			}, {
				type : "ObjectIdentifier",
				path : ["here", "it", "comes"]
			}]
		});
	});

	test.done();
};