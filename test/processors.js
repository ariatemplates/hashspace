var processors = require("../compiler/processors");
var treeWalker = require("../compiler/treeWalker");

exports.plainText = function (test) {
	var node = {
		type : "plainText",
		value : "Some text"
	};

	var result = processors[node.type](node, {});

	test.equal(node.value, result);
	test.done();
};

exports.template = function (test) {
	var node = {
		type : "template",
		name : "one",
		args : [1, 2],
		content : [{
			name : "a",
			content : [1, 2, 3]
		}]
	};

	// mock the walker
	var walker = {
		walk : function (array, processorsArgs) {
			// I expect to loop on the template content
			test.deepEqual(array, node.content, "Expecting the list of content");
			test.equal(processorsArgs, processors, "Expecting the list of processors");
			return ["YES"];
		},
		each : function (array, callback) {
			return ["DONE"];
		}
	};
	
	var result = processors[node.type](node, walker);

	expected = [
		'function one(1,2){',
		'if(!one.ng){',
		'var Ng=require("hsp/rt").NodeGenerator,n=Ng.nodes,el=require("hsp/rt/eltnode");',
		'one.ng=new Ng([YES]);',
		'}',
		'return one.ng.process(this,[DONE])',
		'}'
	].join("");
	test.equal(result, expected);
	test.done();
};

exports.bindVaraible = function (test) {
	var result = processors.bindVariable({
		bind : true,
		path : ["a"]
	});
	test.equal(result, '[1,0,"a"]');

	result = processors.bindVariable({
		bind : false,
		path : ["b", "c", "d"]
	});
	test.equal(result, '[0,"b","c","d"]');
	test.done();
};

exports.elementNoArgs = function (test) {
	// mock the walker
	var walker = {
		walk : function (array, processorsArgs) {
			return array;
		},
		each : treeWalker.each  // use the real each method
	};

	// no arguments
	var node = {
		type : "element",
		name : "NAME",
		attr : [],
		content : ["CONTENT"]
	};
	
	var result = processors[node.type](node, walker);
	var expected = 'new el("NAME",0,{},[CONTENT])';
	test.equal(result, expected);

	// with static arguments
	node = {
		type : "element",
		name : "STATIC",
		attr : [{
			name : "A",
			value : "static",
			isStatic : true,
			quote : "'"
		}, {
			name : "b",
			value : "yes",
			isStatic : true,
			quote : '"'
		}],
		content : ["CONTENT"]
	};
	
	result = processors[node.type](node, walker);
	expected = 'new el("STATIC",0,{"A":\'static\',"b":"yes"},[CONTENT])';
	test.equal(result, expected);

	// dynamic arguments (attr.bind is whether or not it has the bind modifier)
	node = {
		type : "element",
		name : "DYN",
		attr : [{
			name : "A",
			value : ["begin", {
				type : "value",
				args : ["a"],
				bind : false
			}],
			isStatic : false,
			quote : "'"
		}, {
			name : "B",
			value : [{
				type : "value",
				args : ["b", "c"],
				bind : false
			}],
			isStatic : false,
			quote : '"'
		}, {
			name : "C",
			value : [{
				type : "value",
				args : ["c", "b", "a"],
				bind : true
			}, "other", {
				type : "value",
				args : ["f"],
				bind : true
			}],
			isStatic : false,
			quote : '"'
		}],
		content : ["CONTENT"]
	};
	
	result = processors[node.type](node, walker);
	expected = 'new el("DYN",{e1:[1,0,"a"],e2:[1,"b","c"],e3:[0,"c","b","a"],e4:[0,0,"f"]},{"A":[\'begin\',1],"B":[\'\',2],"C":[\'\',3,"other",4]},[CONTENT])';
	test.equal(result, expected);

	test.done();
};

exports.emptyElement = function (test) {
	// no arguments
	var node = {
		type : "element",
		name : "EMPTY",
		attr : [],
		empty : true
	};
	
	// here we use a real walker
	var result = processors[node.type](node, treeWalker);
	var expected = 'new el("EMPTY",0,{},[])';
	test.equal(result, expected);

	test.done();
};

exports.textInTemplate = function (test) {
	var node = {
		type : "text",
		value : "TEXT with ' quotes \" and \n new \r\n lines"
	};
	
	var result = processors[node.type](node, {});
	var expected = 'n.$text(0,["TEXT with \' quotes \\" and \\n new \\n lines"])';
	test.equal(result, expected);

	test.done();
};

exports.valueInTemplate = function (test) {
	var node = {
		type : "value",
		args : ["a"],
		bind : true     // bind modifier
	};
	
	var result = processors[node.type](node, {});
	var expected = 'n.$text({e1:[0,0,"a"]},["",1])';
	test.equal(result, expected);

	node = {
		type : "value",
		args : ["a", "b"],
		bind : false     // bind modifier
	};
	
	result = processors[node.type](node, {});
	expected = 'n.$text({e1:[1,"a","b"]},["",1])';
	test.equal(result, expected);

	test.done();
};

exports.insert = function (test) {
	var node = {
		type : "instruction",
		name : "insert",
		args : {
			template : "one",
			args : []
		}
	};
	
	var result = processors[node.type](node, {
		each : treeWalker.each
	});
	var expected = 'n.$insert(0,one,[])';
	test.equal(result, expected);


	// identifiers and some literals
	node = {
		type : "instruction",
		name : "insert",
		args : {
			template : "one",
			args : [{
				type : "ObjectIdentifier",
				path : ["first"]
			}, {
				type : "ObjectIdentifier",
				path : ["second", "second"]
			}, {
				type : "ObjectLiteral",
				value : {}
			}, {
				type : "ArrayLiteral",
				value : []
			}]
		}
	};
	
	result = processors[node.type](node, {
		each : treeWalker.each
	});
	expected = 'n.$insert({e1:[1,0,"first"],e2:[1,"second","second"]},one,[1,1,1,2,0,{},0,[]])';
	test.equal(result, expected);

	//few other literals
	node = {
		type : "instruction",
		name : "insert",
		args : {
			template : "two",
			args : [{
				type : "BooleanLiteral",
				value : false
			}, {
				type : "NumericLiteral",
				value : 3.5
			}, {
				type : "NullLiteral",
				value : null
			}, {
				type : "StringLiteral",
				value : "a string 'with \" quotes"
			}, {
				type : "ObjectLiteral",
				value : {
					one : 1,
					two : "two",
					three : [1,2,3]
				}
			}, {
				type : "ArrayLiteral",
				value : [true, "one", 1]
			}]
		}
	};
	result = processors[node.type](node, {
		each : treeWalker.each
	});
	expected = 'n.$insert(0,two,[0,false,0,3.5,0,null,0,"a string \'with \\" quotes",0,{"one":1,"two":"two","three":[1,2,3]},0,[true,"one",1]])';
	test.equal(result, expected);

	test.done();
};

exports.ifBlock = function (test) {
	var node = {
		type : "instruction",
		name : "if",
		args : {
			type : "ObjectIdentifier",
			path : ["a"]
		},
		content : [
			["THEN"],  // then block
			["ELSE"]   // else block
		]
	};
	var result = processors[node.type](node, {
		each : treeWalker.each,
		walk : function (array) {
			return array;
		}
	});
	var expected = 'n.$if({e1:[1,0,"a"]},1,[THEN],[ELSE])';
	test.equal(result, expected);


	node = {
		type : "instruction",
		name : "if",
		args : {
			type : "ObjectIdentifier",
			path : ["a", "b"]
		},
		content : [
			["THEN"],  // then block
			[]
		]
	};
	result = processors[node.type](node, {
		each : treeWalker.each,
		walk : function (array) {
			return array;
		}
	});
	expected = 'n.$if({e1:[1,"a","b"]},1,[THEN])';
	test.equal(result, expected);

	test.done();
};

exports.foreach = function (test) {
	var node = {
		type : "instruction",
		name : "foreach",
		args : {
			iterator : "variable",
			keyword : "in",
			collection : {
				type : "ObjectIdentifier",
				path : ["here"]
			}
		},
		content : ["FOR"]
	};
	
	var result = processors[node.type](node,  {
		each : treeWalker.each,
		walk : function (array) {
			return array;
		}
	});
	var expected = 'n.$foreach({e1:[1,0,"here"]},"variable",0,1,[FOR])';
	test.equal(result, expected);


	node = {
		type : "instruction",
		name : "foreach",
		args : {
			iterator : "another",
			keyword : "in",
			collection : {
				type : "ObjectIdentifier",
				path : ["larger", "object"]
			}
		},
		content : ["FOR"]
	};
	
	result = processors[node.type](node,  {
		each : treeWalker.each,
		walk : function (array) {
			return array;
		}
	});
	expected = 'n.$foreach({e1:[1,"larger","object"]},"another",0,1,[FOR])';
	test.equal(result, expected);

	test.done();
};