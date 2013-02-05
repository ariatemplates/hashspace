var walker = require("../compiler/treeWalker");

exports.walk = function (test) {
	test.expect(5);
	// This looks like he parsed structure of a template file
	tree = [{
		type : "text",
		value : "one"
	}, {
		type : "template",
		value : {obj: true}
	}, {
		type : "text",
		value : "two"
	}];

	var processing = [];
	var processors = {
		text : function (node, walkerArg) {
			processing.push(node);

			// I expect to get the walker (to do actions on it)
			test.equal(walkerArg, walker, "Should get the walker in the text processor");

			return "TEXT";
		},
		template : function (node, walkerArg) {
			processing.push(node);

			test.equal(walkerArg, walker, "Should get the walker in the template processor");

			return "TEMPLATE";
		}
	};

	var result = walker.walk(tree, processors);

	test.deepEqual(processing, tree);
	test.deepEqual(result, ["TEXT", "TEMPLATE", "TEXT"]);

	test.done();
};