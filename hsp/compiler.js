var parser = require("./parser");

exports.compile = function (template) {
	var ast = parser.parse(template);

	// ast starts from a template definition
	if (ast.type !== "template") {
		console.log("First node is not a template");
		return;
	}

	try {
		return processors[ast.type](ast);
	} catch (ex) {
		console.log(ex);
		return "";
	}
};

// Now I use \n and \t for readability, but it should be an empty string
var LINE_SEPARATOR = "\n";
var ___ = "\t";

var processors = {
	"template" : function (node) {
		var functionName = node.name;
		var args = node.args.join(",");

		return [
			'function ' + functionName + '(' + args + ') {',
			___ + 'if (!' + functionName + '.ng) {',
			//___ + ___ + 'var Ng=require("hsp/rt").NodeGenerator, n=Ng.nodes;',
			___ + ___ + 'var Ng=require("hsp/rt").NodeGenerator, n=Ng.nodes, el=require("hsp/rt/eltnode");',
			___ + ___ + functionName + '.ng=new Ng([',
			___ + ___ + ___ + processors["template.content"](node.content),
			___ + ___ + ']);',
			___ + '}',
			___ + 'return ' + functionName + '.ng.process(' + processors["template.arguments"](node.args) + ');',
			'}'
		].join(LINE_SEPARATOR);
	},
	"template.arguments" : function (args) {
		var result = [];
		for (var i = 0; i < args.length; i += 1) {
			result.push("\"" + args[i] + "\"", args[i]);
		}
		return "this,[" + result.join(",") + "]";
	},
	"template.content" : function (content) {
		var result = [];
		for (var i = 0; i < content.length; i += 1) {
			// Allow some content to be dropped by the processor
			// TODO how??
			var processedContent = processors[content[i].type](content[i]);
			if (processedContent) {
				result.push(processedContent);
			}
		}
		return result.join("," + LINE_SEPARATOR);
	},
	"element" : function (element) {
		// TODO handle empty tag elements
		var map = extractAttributeVariables(element.attr);
		return [
			//'n.' + element.name + "(",
			'new el("' + element.name + '",',
			___ + processors["element.variables"](map) + ",",    // all attributes whose value might change
			___ + processors["element.attributes"](map) + ",",   // attribute descriptions
			___ + processors["element.content"](element),        // element content
			')'
		].join(LINE_SEPARATOR);
	},
	"element.variables" : function (map) {
		if (map.variables.length === 0) {
			return 0;
		} else {
			var result = [];
			for (var i = 0; i < map.variables.length; i += 1) {
				var variable = map.variables[i];
				result.push(variable.name + ":[" + variable.bind + "," + buildPath(variable.path) + "]");
			}
			return "{" + result.join(",") + "}";
		}
	},
	"element.attributes" : function (map) {
		var result = [];
		var i, attribute;
		// loop on the statics is simple as they map key value
		for (i = 0; i < map.areStatic.length; i += 1) {
			attribute = map.areStatic[i];
			result.push("\"" + attribute.name + "\":" + attribute.quote + attribute.value + attribute.quote);
		}
		// loop on dynamic expects an array of text or references to a variable
		for (i = 0; i < map.areDynamic.length; i += 1) {
			attribute = map.areDynamic[i];
			result.push("\"" + attribute.name + "\":" + serializeDynamicAttributeValues(attribute));
		}
		return "{" + result.join(",") + "}";
	},
	"element.content" : function (element) {
		if (!element.empty) {
			var content = element.content;
			var result = [];
			for (var i = 0; i < content.length; i += 1) {
				result.push(processors[content[i].type](content[i]));
			}
			return "[" + LINE_SEPARATOR + result.join("," + LINE_SEPARATOR) + LINE_SEPARATOR + "]";
		} else {
			return "[]";
		}
	},
	"text" : function (element) {
		return "n.$text(0, [\"" + escapeNewLines(element.content.replace(/"/g, "\\\"")) + "\"])";
	},
	"value" : function (value) {
		return "n.$text({e1:[" + bindValue(value.bind) + ", " + buildPath(value.args) + "]}, [\"\", 1])";
	},
	"instruction" : function (instruction) {
		return processors["instruction." + instruction.name](instruction);
	},
	"instruction.insert" : function (instruction) {
		var map = extractVariableArguments(instruction.args.args);

		var insertParams = [
			processors["element.variables"](map),
			'"' + instruction.args.base + '"',
			"[" + map.args.join(",") + "]"
		];
		return "n.$insert(" + insertParams.join(",") + ")";
	},
	"instruction.if" : function (instruction) {
		// TODO
		//console.log("IF", instruction);
		var ifParams = [
			"{e1:[1, 0, \"true\"]}",
			1,
			"[" + processors["template.content"](instruction.content) + "]"
		];

		return "n.$if(" + ifParams.join(",") + ")";
	},
	"instruction.for" : function (instruction) {
		//console.log("FOR", instruction);
		var foreachParams = [
			"{e1:[1, " + buildPath(instruction.args.collection.value) + "]}",
			"\"" + instruction.args.iterator + "\"",
			0,
			1,
			"[" + processors["template.content"](instruction.content) + "]"
		];

		return "n.$foreach(" + foreachParams.join(",") + ")";
	}
};

function extractAttributeVariables (attributes) {
	// variables in the body are handled differently
	var map = {
		areStatic : [],
		areDynamic : [],
		variables : []
	};
	var counter = 0;

	for (var i = 0; i < attributes.length; i += 1) {
		var attribute = attributes[i];
		if (attribute.isStatic) {
			map.areStatic.push(attribute);
		} else {
			// work on a copy, I don't want to modify the tree now
			var dynamicValues = attribute.value.slice(0);
			for (var j = 0; j < dynamicValues.length; j += 1) {
				var value = dynamicValues[j];

				// TODO maybe even text should have a type...
				if (value.type) {
					// this is a variable
					counter += 1;
					var id = counter;
					var variable = "e" + id;

					map.variables.push({
						name : variable,
						bind : bindValue(value.bind),  // this specifies the default binding
						path : value.args
					});

					dynamicValues.splice(j, 1, id);
				}
			}

			// now dynamicValues has alternating text and id
			map.areDynamic.push({
				name : attribute.name,
				value : dynamicValues,
				quote : attribute.quote
			});
		}
	}

	return map;
}

function serializeDynamicAttributeValues (attribute) {
	var value = attribute.value;
	var quote = attribute.quote;

	var result = [];

	//The first element should always be a text
	if (typeof value[0] !== "string") {
		result.push("''");
	}

	for (var i = 0; i < value.length; i += 1) {
		if (typeof value[i] === "string") {
			result.push(quote + value[i] + quote);
		} else {
			result.push(value[i]);
		}
	}

	return "[" + result.join(",") + "]";
}

function escapeNewLines (text) {
	return text.replace(/\r\n?|[\n\u2028\u2029]/g, "\n").replace(/\n/g, "\\n");
}

function bindValue (modifier) {
	// If modifiers is used, return 0 meaning no auto binding
	return modifier ? 0 : 1;
}

function buildPath (pathArray) {
	if (pathArray.length === 1) {
		// the variable is bound to the template scope
		return "0,\"" + pathArray[0] + "\"";
	} else {
		return "\"" + pathArray.join("\",\"") + "\"";
	}
}

function extractVariableArguments (args) {
	var map = {
		variables : [],
		args : []
	};
	var counter = 0;

	for (var i = 0; i < args.length; i += 1) {
		var param = args[i];
		if (param.type === "IdentifierLiteral") {
			counter += 1;
			var id = counter;
			var variable = "e" + id;

			// Only identifiers are dynamic values 
			// (we ignore the fact that object and array might have reference to other identifiers)
			map.variables.push({
				name : variable,
				bind : 1,
				path : param.value
			});

			map.args.push(1, id);
		} else {
			map.args.push(0, getValue(param));
		}
	}

	return map;
}

function buildArrayFromLiteral (elements) {
	var array = [];
	for (var i = 0; i < elements.length; i += 1) {
		array.push(getValue(elements[i]));
	}
	return "[" + array.join(",") + "]";
}

function buildObjectFromLiteral (properties) {
	var object = [];
	for (var i = 0; i < properties.length; i += 1) {
		object.push(properties[i].name + ":" + getValue(properties[i].value));
	}
	return "{" + object.join(",") + "}";
}

function getValue (element) {
	var value;

	if (element.type === "NullLiteral") {
		value = null;
	} else if (element.type === "ArrayLiteral") {
		value = buildArrayFromLiteral(element.elements);
	} else if (element.type === "ObjectLiteral") {
		value = buildObjectFromLiteral(element.properties);
	} else if (element.type === "StringLiteral") {
		value = "\"" + element.value + "\"";
	} else {
		// Let's imagine that we don't have Identifier literals inside Objects...
		value = element.value;
	}

	return value;
}