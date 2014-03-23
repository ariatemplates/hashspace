/**
 * Escapes new lines characters in a string.
 * @param {String} text the input string.
 * @return {String} the excaped strin.
 */
function escapeNewLines (text) {
    return text.replace(/\r\n?|[\n\u2028\u2029]/g, "\n").replace(/\n/g, "\\n");
}

/**
 * Text outside a template, just return what we've got.
 * @param {Node} node the current Node object as built by the treebuilder.
 * @param {TreeWalker} walker the template walker instance.
 * @return {String} a snippet of Javascript code built from the node.
 */
exports["plaintext"] = function (node, walker) {
    return node.value;
};

/**
 * Template definition, this is the root of the tree, return a self calling function that recursively applies
 * - walker.walk on its content array
 * - walker.each on its arguments definition, used for simple serialization
 * @param {Node} node the current Node object as built by the treebuilder.
 * @param {TreeWalker} walker the template walker instance.
 * @return {String} a snippet of Javascript code built from the node.
 */
exports["template"] = function (node, walker) {
    var templateName = node.name;
    var CRLF = '\r\n';

    //Adds template arguments to the scope
    if (node.args) {
        for (var i = 0; i < node.args.length; i++) {
            walker.addScopeVariable(node.args[i]);
        }
    } else if (node.controller) {
        walker.addScopeVariable(node.controller.ref); // the controller reference - e.g. "c"
    }

    //Generates the code of the template's content
    var templateCode = ["[", walker.walk(node.content, module.exports).join(","), "]"].join("");
    var globals = walker._globals;

    //Generates globals validation statement - e.g. var _c;try {_c=c} catch(e) {};
    var globalsStatement = [], globalsLength = globals.length;
    if (globalsLength) {
        globalsStatement = ["  var _" + globals.join(',_') + ";"];
        for (var i=0; i < globalsLength; i++) {
            globalsStatement.push( "try {_" + globals[i] + "=" + globals[i] + "} catch(e) {};");
        }
        globalsStatement.push(CRLF);
    }
    var globalsStatementString = globalsStatement.join("");

    //Resets template scope and global list
    walker.resetScope();
    walker.resetGlobalRefs();

    walker.templates[templateName] = templateCode;

    var exportString = '';
    if (node.export === true) {
        exportString = ' =exports.' + templateName;
    }

    if (node.controller) {
        var path = node.controller.path;
        return ['var ', templateName, exportString, ' = require("hsp/rt").template({ctl:[', path[0], ',', walker.each(path, argAsString),
                '],ref:"', node.controller.ref, '"}, function(n){', CRLF, globalsStatementString, '  return ', templateCode, ';', CRLF, '});', CRLF].join("");
    } else {
        return ['var ', templateName, exportString, ' = require("hsp/rt").template([', walker.each(node.args, argAsString),
                '], function(n){', CRLF, globalsStatementString, '  return ', templateCode, ';', CRLF, '});', CRLF].join("");
    }
};

/**
 * Generates a text node.
 * @param {Node} node the current Node object as built by the treebuilder.
 * @param {TreeWalker} walker the template walker instance.
 * @return {String} a snippet of Javascript code built from the node.
 */
exports["text"] = function (node, walker) {
    if (node.value === undefined) {
        console.dir(node);
        return "n.$text(0,[\"\"])";
    }

    return ["n.$text(0,[\"", escapeNewLines(node.value.replace(/"/g, "\\\"")), "\"])"].join('');
};

/**
 * For a given value double it's definition returning "value",value.
 * This method should only be called on object literals (strings).
 * @param {String} value the initial value.
 * @return {String} the doubled value.
 */
function argAsString (value) {
    // No need to toString because it's already a string
    return '"' + value + '"';
}

/**
 * Generate a textblock node.
 * @param {Node} node the current Node object as built by the treebuilder.
 * @param {TreeWalker} walker the template walker instance.
 * @return {String} a snippet of Javascript code built from the node.
 */
exports["textblock"] = function (node, walker) {
    // we should generate sth like
    // n.$text({e1:[1,"person","firstName"],e2:[1,"person","lastName"]},["Hello ",1," ",2,"!"])
    var textBlock = formatTextBlock(node, 1, walker);
    return ["n.$text(", textBlock.exprArg, ",", textBlock.blockArgs, ")"].join('');
};

/**
 * Generates a log expression.
 * @param {Node} node the current Node object as built by the treebuilder.
 * @param {TreeWalker} walker the template walker instance.
 * @return {String} a snippet of Javascript code built from the node.
 */
exports["log"] = function (node, walker) {
    var expr, index = 1, code = [], indexes = [];
    for (var i = 0; i < node.exprs.length; i++) {
        expr = formatExpression(node.exprs[i], index, walker);
        index = expr.nextIndex;
        indexes.push(expr.exprIdx);
        code.push(expr.code);
    }
    return ["n.log({", code.join(","), "},[", indexes.join(','), "],'", walker.fileName, "','", walker.dirPath, "',",node.line, ",", node.column, ")"].join('');
};

/**
 * Generates a let expression.
 * @param {Node} node the current Node object as built by the treebuilder.
 * @param {TreeWalker} walker the template walker instance.
 * @return {String} a snippet of Javascript code built from the node.
 */
exports["let"] = function (node, walker) {
    var expr, index = 1, code = [], assignment = [], varName;
    for (var i = 0; i < node.assignments.length; i++) {
        expr = formatExpression(node.assignments[i].value, index, walker);
        index = expr.nextIndex;
        varName = node.assignments[i].identifier;
        walker.addScopeVariable(varName);
        assignment.push("'" + varName + "'");
        assignment.push(expr.exprIdx);
        code.push(expr.code);
    }
    return ["n.let({", code.join(",") , "},[", assignment.join(',') , "])"].join('');
};

/**
 * Generates an if node.
 * @param {Node} node the current Node object as built by the treebuilder.
 * @param {TreeWalker} walker the template walker instance.
 * @return {String} a snippet of Javascript code built from the node.
 */
exports["if"] = function (node, walker) {
    // we should generate sth like
    // n.$if({e1:[1,"person","firstName"]}, 1, [n.$text({e1:[1,"person","firstName"]},["Hello ",1])], [..])

    var expr = formatExpression(node.condition, 1, walker);

    var content1 = ',[]', content2 = '';
    if (node.content1) {
        content1 = ',[' + walker.walk(node.content1, module.exports).join(",") + ']';
    }
    if (node.content2) {
        content2 = ',[' + walker.walk(node.content2, module.exports).join(",") + ']';
    }

    if (expr.code !== '') {
        expr.code = "{" + expr.code + "}";
    }

    return ['n.$if(', expr.code, ',', expr.exprIdx, content1, content2, ')'].join('');
};

/**
 * Generates a foreach node.
 * @param {Node} node the current Node object as built by the treebuilder.
 * @param {TreeWalker} walker the template walker instance.
 * @return {String} a snippet of Javascript code built from the node.
 */
exports["foreach"] = function (node, walker) {
    // we should generate sth like
    // n.$foreach( {e1: [1, 0, "things"]}, "thing", "thing_key", 1, [...])

    var expr = formatExpression(node.collection, 1, walker);

    var content = '[]';
    if (node.content) {
        // add all contextual variables
        walker.pushSubScope([node.item, node.key, node.item + "_isfirst", node.item + "_islast"]);
        content = '[' + walker.walk(node.content, module.exports).join(",") + ']';
        walker.popSubScope();
    }

    if (expr.code !== '') {
        expr.code = "{" + expr.code + "}";
    }
    var forType = 0; // to support types than 'in'

    return ['n.$foreach(', expr.code, ',"', node.key, '","', node.item, '",', forType, ',', expr.exprIdx, ',', content, ')'].join('');
};

/*
 * Manages element and component nodes.
 * @param {Node} node the current Node object as built by the treebuilder.
 * @param {TreeWalker} walker the template walker instance.
 * @return {String} a snippet of Javascript code built from the node.
 */
function elementOrComponent (node, walker) {
    // we should generate sth like
    // n.elt("div", {e1:[0,0,"arg"]}, {"title":["",1]}, 0, [...])
    var attributeContent = "0", eventContent = "0", exprCode = "0", attributes = node.attributes, length = attributes.length;
    if (length > 0) {
        var list, attributeName, attributesList = [], eventList = [], exprList = [], attribute, type, exprIndex = 1;

        for (var i = 0; length > i; i++) {
            attribute = attributes[i];
            list = attributesList;
            attributeName = attribute.name;
            if (attribute.name.match(/^on/i)) {
                // this is an event handler
                list = eventList;
                attributeName = attribute.name.slice(2);
            }

            type = attribute.type;
            if (type === "text") {
                list.push('"' + attributeName + '":"' + attribute.value + '"');
            } else if (type === "expression") {
                var expr = formatExpression(attribute, exprIndex, walker);
                exprIndex = expr.nextIndex;
                exprList.push(expr.code);
                if (list === eventList) {
                    list.push('"' + attributeName + '":' + expr.exprIdx);
                } else {
                    list.push('"' + attributeName + '":["",' + expr.exprIdx + ']');
                }
            } else if (type === "textblock") {
                var textBlock = formatTextBlock(attribute, exprIndex, walker);
                exprIndex = textBlock.nextIndex;
                if (textBlock.exprArg !== '0') {
                    exprList.push(textBlock.exprArg.slice(1, -1));
                }
                list.push('"' + attributeName + '":' + textBlock.blockArgs);
            } else if (type === "name") {
                list.push('"' + attributeName + '":null');
            } else {
                walker.logError("Invalid attribute type: " + type);
            }
        }
        if (attributesList.length) {
            attributeContent = "{" + attributesList.join(',') + "}";
        }
        if (eventList.length) {
            eventContent = "{" + eventList.join(',') + "}";
        }
        exprCode = exprList.length === 0 ? "0" : "{" + exprList.join(',') + "}";
    }

    var content = '';
    if (node.content && node.content.length) {
        content = ',[' + walker.walk(node.content, module.exports).join(",") + ']';
    }

    return [exprCode, ',', attributeContent, ',', eventContent, content].join('');
}

/**
 * Generates an element node.
 * @param {Node} node the current Node object as built by the treebuilder.
 * @param {TreeWalker} walker the template walker instance.
 * @return {String} a snippet of Javascript code built from the node.
 */
exports["element"] = function (node, walker) {
    var generatedNode = elementOrComponent(node, walker);
    var subScope = (node.needSubScope === true)? ',1' : '';
    return ['n.elt("', node.name, '",', generatedNode, subScope, ')'].join('');
};

/**
 * Generates a component node.
 * @param {Node} node the current Node object as built by the treebuilder.
 * @param {TreeWalker} walker the template walker instance.
 * @return {String} a snippet of Javascript code built from the node.
 */
exports["component"] = function (node, walker) {
    var generatedNode = elementOrComponent(node, walker);
    var path = node.ref.path;

    walker.addGlobalRef(path[0]);

    return ['n.cpt([_', path[0], ',"', path.join('","'), '"],', generatedNode, ')'].join('');
};

/**
 * Generates a cptattribute node.
 * @param {Node} node the current Node object as built by the treebuilder.
 * @param {TreeWalker} walker the template walker instance.
 * @return {String} a snippet of Javascript code built from the node.
 */
exports["cptattribute"] = function (node, walker) {
    var generatedNode = elementOrComponent(node, walker);
    return ['n.catt("', node.name, '",', generatedNode, ')'].join('');
};

/**
 * Formats an expression according to its category.
 * @param {Object} expression the expression to format.
 * @param {Integer} firstIndex index of the expression.
 * @param {TemplateWalker} walker the template walker instance.
 * @return {Object} the expression string and the next expression index that can be used
 */
function formatExpression (expression, firstIndex, walker) {
    var category = expression.category, code = '', nextIndex = firstIndex, bound = (expression.bound === false) ? 0 : 1;
    var exprIndex = firstIndex;
    if (category === 'objectref' || category === 'functionref') {
        var path = expression.path, argExprs = null, argExprIndex = null, args = expression.args;
        if (path.length === 0) {
            walker.logError("Expression path cannot be empty");
        } else {
            var root = path[0], isRootInScope = walker.isInScope(root);
            /* Possible expression types are:
             * 0: unbound data ref - e.g. {e1:[0,1,"item_key"]}
             * 1: bound data ref - e.g. {e1:[1,2,"person","name"]}
             * 2: literal data ref - e.g. {e1:[2,2,person,"name"]}
             * 3: function call - e.g. {e1:[3,2,"ctl","deleteItem",1,2,1,0]}
             * 4: function call literal- e.g. {e1:[4,1,myfunc,1,2,1,0]}
             * 5: literal value - e.g. {e1:[5,"some value"]}
             * 6: function expression - e.g. {e1:[6,function(a0,a1){return a0+a1;},2,3]}*/
            var exprType = isRootInScope ? bound : 2;
            if (root === "event") {
                exprType = 0;
            }

            if (exprType === 2) {
                // root is a global reference
                walker.addGlobalRef(root);
                root = "_" + root;
                path[0] = "_" + path[0];
            }

            if (category === 'functionref') {
                exprType = isRootInScope ? 3 : 4;
                argExprs = [];
                argExprIndex = [];
                var arg, argCategory, expr, index = exprIndex + 1;
                for (var i = 0; i < args.length; i++) {
                    arg = args[i];
                    argCategory = arg.category;
                    if (argCategory === "string" || argCategory === "boolean" || argCategory === "number") {
                        continue;
                    }
                    expr = formatExpression(arg, index, walker);
                    argExprs.push(expr.code);
                    argExprIndex[i] = expr.exprIdx;
                    index = expr.nextIndex;
                }
                nextIndex = index;
            } else {
                nextIndex++;
            }

            var result, rootRef = path[0];
            if (isRootInScope || root === "event") {
                rootRef = '"' + rootRef + '"';
            }
            var pathLength = path.length;

            var generatedPath = [], pathItem;
            generatedPath.push(rootRef);
            for (var i = 1; i < pathLength; i++) {
                pathItem = path[i];
                if ((typeof pathItem) === "string") {
                    generatedPath.push('"' + pathItem + '"');
                } else {
                    generatedPath.push(pathItem);
                }
            }
            result = ['e', exprIndex, ':[', exprType, ',', pathLength, ',', generatedPath.join(',')];
            

            if (args && args.length > 0) {
                var argCategory, arg;
                for (var i = 0; i < args.length; i++) {
                    arg = args[i];
                    argCategory = arg.category;
                    if (argCategory === "string") {
                        result.push(',0,"' + escapeNewLines(arg.value.replace(/"/g, "\\\"")) + '"');
                    } else if (argCategory === "boolean" || argCategory === "number") {
                        result.push(',0,' + arg.value);
                    } else {
                        // this is not a literal
                        result.push(',1,' + argExprIndex[i]);
                    }
                }
                if (argExprs && argExprs.length > 0) {
                    result.push("],");
                    result.push(argExprs.join(","));
                } else {
                    result.push("]");
                }

            } else {
                result.push("]");
            }
            code = result.join("");
        }

    } else if (category === 'boolean' || category === 'number') {
        code = ['e', exprIndex, ':[5,', expression.value, ']'].join('');
        nextIndex++;
    } else if (category === 'string') {
        code = ['e', exprIndex, ':[5,"', ('' + expression.value).replace(/"/g, "\\\""), '"]'].join('');
        nextIndex++;
    } else if (category === 'jsexpression') {
        var refs = expression.objectrefs, ref, expr, index = exprIndex + 1, exprs = [], exprIdxs = [];

        if (refs === undefined) {
            console.warn("[formatExpression] The following expression has not been pre-processed - parser should be updated: ");
            console.dir(expression);
        }

        var args = [], length = refs.length, argSeparator = (length > 0) ? ',' : '';
        for (var i = 0; length > i; i++) {
            ref = refs[i];
            args[i] = "a" + i;
            expr = formatExpression(ref, index, walker);
            exprs.push(expr.code);
            exprIdxs[i] = expr.exprIdx;
            index = expr.nextIndex;
        }
        var func = ['function(', args.join(','), ') {return ', expression.code, ';}'].join('');
        var code0 = ['e', exprIndex, ':[6,', func, argSeparator, exprIdxs.join(','), ']'].join('');
        exprs.splice(0, 0, code0);
        code = exprs.join(',');
        nextIndex = exprIdxs[exprIdxs.length - 1] + 1;
    } else {
        walker.logError("Unsupported expression: " + category, expression);
    }

    return {
        code : code,
        exprIdx : exprIndex,
        nextIndex : nextIndex
    };
}

/**
 * Format the textblock content for textblock and attribute nodes.
 * @param {Node} node the current Node object as built by the treebuilder.
 * @param {Integer} nextExprIndex the index of the next expression.
 * @param {TreeWalker} walker the template walker instance.
 * @return {String} a snippet of Javascript code built from the node.
 */
function formatTextBlock (node, nextExprIndex, walker) {
    var content = node.content, item, exprArray = [], args = [], index = 0; // idx is the index in the $text array
                                                                                // (=args)
    for (var i = 0; i < content.length; i++) {
        item = content[i];
        if (item.type === "text") {
            if (index % 2 === 0) {
                // even index: arg must be a string
                args[index] = '"' + escapeNewLines(item.value.replace(/"/g, "\\\"")) + '"';
                index++;
            } else {
                // odd index: arg must be an expression - so add the text to the previous item
                if (index > 0) {
                    args[index - 1] = args[index - 1].slice(0, -1) + escapeNewLines(item.value.replace(/"/g, "\\\"")) + '"';
                } else {
                    // we should never get there as index is odd !
                    walker.logError("Invalid textblock structure", node);
                }
            }
        } else if (item.type === "expression") {
            if (index % 2 === 0) {
                // even index: arg must be a string
                args[index] = '""';
                index++;
            }
            var expr = formatExpression(item, nextExprIndex, walker);
            nextExprIndex = expr.nextIndex;
            if (expr.code) {
                exprArray.push(expr.code);
                args[index] = expr.exprIdx; // expression index
            } else {
                args[index] = 0; // invalid expression
            }
            index++;
        }
    }

    var exprArg = "0";
    if (exprArray.length) {
        exprArg = '{' + exprArray.join(",") + '}';
    }
    var blockArgs = "[]";
    if (args.length) {
        blockArgs = '[' + args.join(',') + ']';
    }

    return {
        exprArg : exprArg,
        nextIndex : nextExprIndex,
        blockArgs : blockArgs
    };
}
