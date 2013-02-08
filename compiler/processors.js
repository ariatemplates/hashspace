var writer;
/**
 * Utility method to set the formatter that should handle blocks and few basic javascript idioms.
 * Better for testing
 */
exports.setFormatter = function (formatter) {
	writer = formatter;
};

/**
 * Text outside a template, just return what we've got
 */
exports.plainText = function (node, walker) {
	return node.value;
};

/**
 * Template definition, this is the root of the tree, return a self calling function that recursively applies
 * - walker.walk on its content array
 * - walker.each on its arguments definition, used for simple serialization
 */
exports.template = function (node, walker) {
	var functionName = node.name;
	return [
		'function ' + functionName + '(' + node.args + '){',
		'if(!' + functionName + '.ng){',
		'var Ng=require("hsp/rt").NodeGenerator,n=Ng.nodes;',
		functionName + '.ng=new Ng([',
		walker.walk(node.content, module.exports).join(","),
		']);',
		'}',
		'return ' + functionName + '.ng.process(this,[' + (walker.each(node.args, exports.keyValue)).join(",") + '])',
		'}'
	].join("");
};

/**
 * HTML element definition
 */
exports.element = function (node, walker) {
	var eventMap = extractObjectIdentifiersFromCallbacks(node.events);
	var map = extractAttributeVariables(node.attr, eventMap.counter);

	return [
		'n.elt("' + node.name + '",',
		variablesAndEvents(eventMap.events, eventMap.variables.concat(map.variables), walker) + ",",   // all attributes whose value might change
		exports.elementAttributes(map) + ",",          // attribute descriptions
		exports.elementCallbacks(eventMap) + ",",      // callbacks
		"[" + walker.walk(node.content, module.exports).join(",") + "]",  // element content
		')'
	].join("");
};

/**
 * Generate the attribute list for an HTML element.
 * Given a map of static / dynamic attributes return an array of parameters that are either
 * - a string for static values
 * - a number for the variable reference
 */
exports.elementAttributes = function (map) {
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
};

/**
 * Generate the events list for an HTML element
 */
exports.elementCallbacks = function (map) {
	if (map.eventTypes.length === 0) {
		return 0;
	} else {
		return "{" + map.eventTypes.join(",") + "}";
	}
};

/**
 * Generate a text node
 * TODO this should peek into the walker to consume values that are close sibling
 */
exports.text = function (node, walker) {
	return "n.$text(0,[\"" + escapeNewLines(node.value.replace(/"/g, "\\\"")) + "\"])";
};

/**
 * Generate a value node (variable text, with or without binding)
 * TODO Once text is modified this should simply handle cases where variables are not preceded by text
 */
exports.value = function (node, walker) {
	return "n.$text({e1:[" + (bindValue(node.bind) ? 1 : 0) + "," + exports.buildPath(node.args) + "]},[\"\",1])";
};

/**
 * Generate a value node (variable text, with or without binding)
 * TODO Once text is modified this should simply handle cases where variables are not preceded by text
 */
exports.instruction = function (node, walker) {
	var nextProcessor = "instruction_" + node.name;
	if (nextProcessor in module.exports) {
		return exports[nextProcessor](node, walker);
	}
	// TODO else log something to the user. With the grammar at the time of writing, the else is unreachable
};

/**
 * Insert another template
 */
exports.instruction_insert = function (node, walker) {
	var map = extractVariableArguments(node.args.args);

	var params = [
		boundVariables(map.variables, walker),
		node.args.template,   // no quotes it's a function call
		"[" + map.args.join(",") + "]"
	];
	return "n.$insert(" + params.join(",") + ")";
};

/**
 * Conditional branch
 */
exports.instruction_if = function (node, walker) {
	var map = extractVariableArguments([node.args]);

	var params = [
		boundVariables(map.variables, walker),
		1,    // for now this is always the first variable element
		"[" + walker.walk(node.content[0], module.exports).join(",") + "]"   // if block
	];
	if (node.content[1].length > 0) {
		// else block is optional
		params.push("[" + walker.walk(node.content[1], module.exports).join(",") + "]");
	}
	return "n.$if(" + params.join(",") + ")";
};

/**
 * Foreach loop
 */
exports.instruction_foreach = function (node, walker) {
	var map = extractVariableArguments([node.args.collection]);

	var params = [
		boundVariables(map.variables, walker),
		'"' + node.args.iterator + '"',    // name of the loop variable that should be created
		0,   // for type: 0=in / 1=of / 2=on
		1,   // index of the collection expression
		"[" + walker.walk(node.content, module.exports).join(",") + "]"
	];
	return "n.$foreach(" + params.join(",") + ")";
};

/**
 * For a given value double it's definition returning "value",value. This method should only be called on object literals (strings)
 */
exports.keyValue = function (value) {
	// No need to toString because it's already a string
	return '"' + value + '",' + value;
};

/**
 * Just serialize a value into its string representation
 */
exports.toString = function (value) {
	return value;
};

/**
 * Return an array representing a ValueExpression.
 * The first element in the array is 1 or 0 whether the value is bound or not.
 */
exports.bindVariable = function (variable) {
	// variable.bind is whether or not the value is bound
	return "[" + (variable.bind ? 1 : 0) + "," + exports.buildPath(variable.path) + "]";
};

/**
 * Build the path from the template scope to the ObjectIdentifier.
 * If the ObjectIdentifier has only one value it means that it's bound to the template scope
 * Otherwise to the previous object specified in the path
 */
exports.buildPath = function (pathArray) {
	if (pathArray.length === 1) {
		// the variable is bound to the template scope
		return "0,\"" + pathArray[0] + "\"";
	} else {
		return "\"" + pathArray.join("\",\"") + "\"";
	}
};

function extractAttributeVariables (attributes, counter) {
	// variables in the body are handled differently
	var map = {
		areStatic : [],
		areDynamic : [],
		variables : []
	};
	counter = counter || 0;

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
						bind : bindValue(value.bind),
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

function bindValue (modifier) {
	// If modifiers is used, return false no auto binding
	return modifier ? false : true;
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

function extractVariableArguments (args) {
	var map = {
		variables : [],
		args : []
	};
	var counter = 0;

	for (var i = 0; i < args.length; i += 1) {
		var param = args[i];
		if (param.type === "ObjectIdentifier") {
			counter += 1;
			var id = counter;
			var variable = "e" + id;

			// Only identifiers are dynamic values
			// (we ignore the fact that object and array might have reference to other identifiers)
			map.variables.push({
				name : variable,
				bind : 1,   // TODO this should be configurable in the grammar
				path : param.path
			});

			map.args.push(1, id);
		} else {
			map.args.push(0, JSON.stringify(param.value));
		}
	}

	return map;
}

function boundVariables (array, walker) {
	var value = array.length;
	if (value > 0) {
		value = "{" + walker.each(array, function (variable) {
			return variable.name + ":" + exports.bindVariable(variable);
		}).join(",") + "}";
	}
	return value;
}

function variablesAndEvents (events, variables, walker) {
	if (events.length === 0 && variables.length === 0) {
		return 0;
	}

	var values = [];
	// events are already serialized
	for (var i = 0; i < events.length; i += 1) {
		values.push(events[i]);
	}
	walker.each(variables, function (variable) {
		values.push(variable.name + ":" + exports.bindVariable(variable));
	});
	return "{" + values.join(",") + "}";
}

function extractObjectIdentifiersFromCallbacks (events) {
	var map = {
		variables : [],
		events : [],
		eventTypes : [],
		counter : 0
	};
	var counter = 0, id, variable;

	for (var i = 0; i < events.length; i += 1) {
		var event = events[i];
		var parameters = event.args.args;

		var eventCall = "[";
		var methodPath = event.args.method.path;
		if (methodPath.length === 1) {
			// literal callback
			eventCall += "4," + methodPath[0];
		} else {
			// standard callback
			eventCall += '3,"' + methodPath[0] + '","' + methodPath[1] + '"';
		}

		for (var j = 0; j < parameters.length; j += 1) {
			var param = parameters[j];
			if (param.type === "ObjectIdentifier") {
				counter += 1;
				id = counter;
				variable = "e" + id;

				map.variables.push({
					name : variable,
					bind : 0,   // arguments of method call are not bound
					path : param.path
				});

				// add a dynamic expression
				eventCall += ",1," + id;
			} else {
				// add a literal
				eventCall += ",0," + JSON.stringify(param.value);
			}
		}
		eventCall += "]";

		counter += 1;
		id = counter;
		variable = "e" + id;
		map.events.push(variable + ":" + eventCall);
		map.eventTypes.push('"' + event.name + '":' + id);
	}

	// because the next variable computation shouldn't restart from 0
	map.counter = counter;

	return map;
}