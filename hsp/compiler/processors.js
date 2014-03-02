function escapeNewLines (text) {
    return text.replace(/\r\n?|[\n\u2028\u2029]/g, "\n").replace(/\n/g, "\\n");
}

/**
 * Text outside a template, just return what we've got
 */
exports["plaintext"] = function (node, walker) {
    return node.value;
};

/**
 * Template definition, this is the root of the tree, return a self calling function that recursively applies
 * - walker.walk on its content array
 * - walker.each on its arguments definition, used for simple serialization
 */
exports["template"] = function (node, walker) {
    var tplName = node.name;
    var CRLF = '\r\n';

    // add template arguments to the scope
    if (node.args) {
        for (var i = 0, sz = node.args.length; sz > i; i++) {
            walker.addScopeVariable(node.args[i]);
        }
    } else if (node.controller) {
        walker.addScopeVariable(node.controller.ref); // the controller reference - e.g. "c"
    }

    var tplCode = ["[", walker.walk(node.content, module.exports).join(","), "]"].join("");
    var globals = walker._globals;

    // generate globals validation statement - e.g. var _c;try {_c=c} catch(e) {};
    var gs = [], gsz = globals.length;
    if (gsz) {
        gs = ["  var _"+globals.join(',_')+";"];
        for (var i=0;gsz>i;i++) {
            gs.push( "try {_" + globals[i] + "=" + globals[i] + "} catch(e) {};");
        }
        gs.push(CRLF);
    }
    var gss=gs.join("");

    // reset template scope and global list
    walker.resetScope();
    walker.resetGlobalRefs();

    walker.templates[tplName] = tplCode;

    var exp = '';
    if (node.export === true) {
        exp = ' =exports.' + tplName;
    }

    if (node.controller) {
        var p = node.controller.path;
        return ['var ', tplName, exp, ' = require("hsp/rt").template({ctl:[', p[0], ',', walker.each(p, argAsString),
                '],ref:"', node.controller.ref, '"}, function(n){', CRLF, gss, '  return ', tplCode, ';', CRLF, '});', CRLF].join("");
    } else {
        return ['var ', tplName, exp, ' = require("hsp/rt").template([', walker.each(node.args, argAsString),
                '], function(n){', CRLF, gss, '  return ', tplCode, ';', CRLF, '});', CRLF].join("");
    }
};

/**
 * Generate a text node
 */
exports["text"] = function (node, walker) {
    if (node.value === undefined) {
        console.dir(node);
        return "n.$text(0,[\"\"])";
    }

    return ["n.$text(0,[\"", escapeNewLines(node.value.replace(/"/g, "\\\"")), "\"])"].join('');
};

/**
 * For a given value double it's definition returning "value",value. This method should only be called on object
 * literals (strings)
 */
function argAsString (value) {
    // No need to toString because it's already a string
    return '"' + value + '"';
}

/**
 * Generate a text node
 */
exports["textblock"] = function (node, walker) {
    // we should generate sth like
    // n.$text({e1:[1,"person","firstName"],e2:[1,"person","lastName"]},["Hello ",1," ",2,"!"])
    var tb = formatTextBlock(node, 1, walker);
    return ["n.$text(", tb.expArg, ",", tb.blockArgs, ")"].join('');
};

/**
 * Generate a log expression
 */
exports["log"] = function (node, walker) {
    var e, idx=1, code=[], indexes=[];
    for (var i=0,sz=node.exprs.length;sz>i;i++) {
        e = formatExpression(node.exprs[i], idx, walker);
        idx = e.nextIndex;
        indexes.push(e.exprIdx);
        code.push(e.code);
    }
    return ["n.log({", code.join(",") , "},[", indexes.join(',') , "],'",walker.fileName,"','",walker.dirPath,"',",node.line,",",node.column,")"].join('');
};

/**
 * Generate a let expression
 */
exports["let"] = function (node, walker) {
    var e, idx=1, code=[], asn=[], varName;
    for (var i=0,sz=node.assignments.length;sz>i;i++) {
        e = formatExpression(node.assignments[i].value, idx, walker);
        idx = e.nextIndex;
        varName=node.assignments[i].identifier;
        walker.addScopeVariable(varName);
        asn.push("'"+varName+"'");
        asn.push(e.exprIdx);
        code.push(e.code);
    }
    return ["n.let({", code.join(",") , "},[", asn.join(',') , "])"].join('');
};

/**
 * Generate an if node
 */
exports["if"] = function (node, walker) {
    // we should generate sth like
    // n.$if({e1:[1,"person","firstName"]}, 1, [n.$text({e1:[1,"person","firstName"]},["Hello ",1])], [..])

    var e = formatExpression(node.condition, 1, walker);

    var c1 = ',[]', c2 = '';
    if (node.content1) {
        c1 = ',[' + walker.walk(node.content1, module.exports).join(",") + ']';
    }
    if (node.content2) {
        c2 = ',[' + walker.walk(node.content2, module.exports).join(",") + ']';
    }

    if (e.code !== '') {
        e.code = "{" + e.code + "}";
    }

    return ['n.$if(', e.code, ',', e.exprIdx, c1, c2, ')'].join('');
};

/**
 * Generate a foreach node
 */
exports["foreach"] = function (node, walker) {
    // we should generate sth like
    // n.$foreach( {e1: [1, 0, "things"]}, "thing", "thing_key", 1, [...])

    var e = formatExpression(node.collection, 1, walker);

    var c = '[]';
    if (node.content) {
        // add all contextual variables
        walker.pushSubScope([node.item, node.key, node.item + "_isfirst", node.item + "_islast"]);

        c = '[' + walker.walk(node.content, module.exports).join(",") + ']';

        walker.popSubScope();
    }

    if (e.code !== '') {
        e.code = "{" + e.code + "}";
    }
    var forType = 0; // to support types than 'in'

    return ['n.$foreach(', e.code, ',"', node.key, '","', node.item, '",', forType, ',', e.exprIdx, ',', c, ')'].join('');
};

/*
 * Manage insertion expressions
 */
exports["insert"] = function (node, walker) {
    node.category = "functionref";
    var e = formatExpression(node, 1, walker);
    var exprcode = e.code.length === 0 ? "0" : "{" + e.code + "}";

    return ['n.$insert(', exprcode, ',', e.exprIdx, ')'].join('');
};

/*
 * Manage element and component nodes
 */
function elementOrComponent (node, walker) {
    // we should generate sth like
    // n.elt("div", {e1:[0,0,"arg"]}, {"title":["",1]}, 0, [...])
    var attcontent = "0", evtcontent = "0", exprcode = "0", atts = node.attributes, sz = atts.length;
    if (sz > 0) {
        var list, aname, attlist = [], evtlist = [], exprlist = [], att, type, exprIdx = 1;

        for (var i = 0; sz > i; i++) {
            att = atts[i];
            list = attlist;
            aname = att.name;
            if (att.name.match(/^on/i)) {
                // this is an event handler
                list = evtlist;
                aname = att.name.slice(2);
            }

            type = att.type;
            if (type === "text") {
                list.push('"' + aname + '":"' + att.value + '"');
            } else if (type === "expression") {
                var e = formatExpression(att, exprIdx, walker);
                exprIdx = e.nextIndex;
                exprlist.push(e.code);
                if (list === evtlist) {
                    list.push('"' + aname + '":' + e.exprIdx);
                } else {
                    list.push('"' + aname + '":["",' + e.exprIdx + ']');
                }
            } else if (type === "textblock") {
                var tb = formatTextBlock(att, exprIdx, walker);
                exprIdx = tb.nextIndex;
                if (tb.expArg !== '0') {
                    exprlist.push(tb.expArg.slice(1, -1));
                }
                list.push('"' + aname + '":' + tb.blockArgs);
            } else if (type === "name") {
                list.push('"' + aname + '":null');
            } else {
                walker.logError("Invalid attribute type: " + type);
            }
        }
        if (attlist.length) {
            attcontent = "{" + attlist.join(',') + "}";
        }
        if (evtlist.length) {
            evtcontent = "{" + evtlist.join(',') + "}";
        }
        exprcode = exprlist.length === 0 ? "0" : "{" + exprlist.join(',') + "}";
    }

    var c = '';
    if (node.content && node.content.length) {
        c = ',[' + walker.walk(node.content, module.exports).join(",") + ']';
    }

    return [exprcode, ',', attcontent, ',', evtcontent, c].join('');
}

exports["element"] = function (node, walker) {
    var s = elementOrComponent(node, walker);
    var subScope=(node.needSubScope===true)? ',1' : '';
    return ['n.elt("', node.name, '",', s, subScope, ')'].join('');
};

exports["component"] = function (node, walker) {
    var s = elementOrComponent(node, walker);
    var p = node.ref.path;

    walker.addGlobalRef(p[0]);

    return ['n.cpt([_', p[0], ',"', p.join('","'), '"],', s, ')'].join('');
};

exports["cptattribute"] = function (node, walker) {
    var s = elementOrComponent(node, walker);
    return ['n.catt("', node.name, '",', s, ')'].join('');
};

/**
 * Format an expression according to its category
 * Return the expression string and the next expression index that can be used
 */
function formatExpression (expression, firstIdx, walker) {
    var cat = expression.category, code = '', nextIndex = firstIdx, bound = (expression.bound === false) ? 0 : 1;
    var exprIdx = firstIdx;
    if (cat === 'objectref' || cat === 'functionref') {
        var path = expression.path, argExprs = null, argExprIdx = null, args = expression.args;
        if (path.length === 0) {
            walker.logError("Expression path cannot be empty");
        } else {
            var root = path[0], isRootInScope = walker.isInScope(root);
            var arg1 = isRootInScope ? bound : 2;
            if (root === "event") {
                arg1 = 0;
            }

            if (arg1===2) {
                // root is a global reference
                walker.addGlobalRef(root);
                root="_"+root;
                path[0]="_"+path[0];
            }

            if (cat === 'functionref') {
                arg1 = isRootInScope ? 3 : 4;
                argExprs = [];
                argExprIdx = [];
                var arg, acat, e, idx = exprIdx + 1;
                for (var i = 0, sz = args.length; sz > i; i++) {
                    arg = args[i];
                    acat = arg.category;
                    if (acat === "string" || acat === "boolean" || acat === "number") {
                        continue;
                    }
                    e = formatExpression(arg, idx, walker);
                    argExprs.push(e.code);
                    argExprIdx[i] = e.exprIdx;
                    idx = e.nextIndex;
                }
                nextIndex = idx;
            } else {
                nextIndex++;
            }

            var res, rootRef = path[0];
            if (isRootInScope || root === "event") {
                rootRef = '"' + rootRef + '"';
            }
            var psz = path.length;
            if (psz === 1) {
                res = ['e', exprIdx, ':[', arg1, ',1,', rootRef];
            } else {
                var p = [], pitm;
                p.push(rootRef);
                for (var i = 1; psz > i; i++) {
                    pitm = path[i];
                    if ((typeof pitm) === "string") {
                        p.push('"' + pitm + '"');
                    } else {
                        p.push(pitm);
                    }
                }
                res = ['e', exprIdx, ':[', arg1, ',', psz, ',', p.join(',')];
            }

            if (args && args.length > 0) {
                var acat, arg;
                for (var i = 0, sz = args.length; sz > i; i++) {
                    arg = args[i];
                    acat = arg.category;
                    if (acat === "string") {
                        res.push(',0,"' + escapeNewLines(arg.value.replace(/"/g, "\\\"")) + '"');
                    } else if (acat === "boolean" || acat === "number") {
                        res.push(',0,' + arg.value);
                    } else {
                        // this is not a literal
                        res.push(',1,' + argExprIdx[i]);
                    }
                }
                if (argExprs && argExprs.length > 0) {
                    res.push("],");
                    res.push(argExprs.join(","));
                } else {
                    res.push("]");
                }

            } else {
                res.push("]");
            }
            code = res.join("");
        }

    } else if (cat === 'boolean' || cat === 'number') {
        code = ['e', exprIdx, ':[5,', expression.value, ']'].join('');
        nextIndex++;
    } else if (cat === 'string') {
        code = ['e', exprIdx, ':[5,"', ('' + expression.value).replace(/"/g, "\\\""), '"]'].join('');
        nextIndex++;
    } else if (cat === 'jsexpression') {
        var refs = expression.objectrefs, ref, e, idx = exprIdx + 1, exprs = [], exprIdxs = [];

        if (refs === undefined) {
            console.warn("[formatExpression] The following expression has not been pre-processed - parser should be updated: ");
            console.dir(expression);
        }

        var args = [], sz = refs.length, argSeparator = (sz > 0) ? ',' : '';
        for (var i = 0; sz > i; i++) {
            ref = refs[i];
            args[i] = "a" + i;
            e = formatExpression(ref, idx, walker);
            exprs.push(e.code);
            exprIdxs[i] = e.exprIdx;
            idx = e.nextIndex;
        }
        var func = ['function(', args.join(','), ') {return ', expression.code, ';}'].join('');
        var code0 = ['e', exprIdx, ':[6,', func, argSeparator, exprIdxs.join(','), ']'].join('');
        exprs.splice(0, 0, code0);
        code = exprs.join(',');
        nextIndex = exprIdxs[exprIdxs.length - 1] + 1;
    } else {
        walker.logError("Unsupported expression: " + cat, expression);
    }

    return {
        code : code,
        exprIdx : exprIdx,
        nextIndex : nextIndex
    };
}

/**
 * Format the textblock content for textblock and attribute nodes
 */
function formatTextBlock (node, nextExprIdx, walker) {
    var c = node.content, sz = c.length, itm, expArr = [], args = [], idx = 0; // idx is the index in the $text array
                                                                                // (=args)
    for (var i = 0; sz > i; i++) {
        itm = c[i];
        if (itm.type === "text") {
            if (idx % 2 === 0) {
                // even index: arg must be a string
                args[idx] = '"' + escapeNewLines(itm.value.replace(/"/g, "\\\"")) + '"';
                idx++;
            } else {
                // odd index: arg must be an expression - so add the text to the previous item
                if (idx > 0) {
                    args[idx - 1] = args[idx - 1].slice(0, -1) + escapeNewLines(itm.value.replace(/"/g, "\\\"")) + '"';
                } else {
                    // we should never get there as idx is odd !
                    walker.logError("Invalid textblock structure", node);
                }
            }
        } else if (itm.type === "expression") {
            if (idx % 2 === 0) {
                // even index: arg must be a string
                args[idx] = '""';
                idx++;
            }
            var e = formatExpression(itm, nextExprIdx, walker);
            nextExprIdx = e.nextIndex;
            if (e.code) {
                expArr.push(e.code);
                args[idx] = e.exprIdx; // expression idx
            } else {
                args[idx] = 0; // invalid expression
            }
            idx++;
        }
    }

    var expArg = "0";
    if (expArr.length) {
        expArg = '{' + expArr.join(",") + '}';
    }
    var blockArgs = "[]";
    if (args.length) {
        blockArgs = '[' + args.join(',') + ']';
    }

    return {
        expArg : expArg,
        nextIndex : nextExprIdx,
        blockArgs : blockArgs
    };
}
