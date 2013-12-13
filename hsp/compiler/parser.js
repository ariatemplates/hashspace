var PEG = require("pegjs");
var fs = require("fs");
var grammar = fs.readFileSync(__dirname + "/hspblocks.pegjs", "utf-8");
var klass = require("../klass");
var blockParser = PEG.buildParser(grammar, {
    trackLineAndColumn : true
});

/**
 * Return the list of instruction blocks that compose a template file at this stage the template AST is not complete -
 * cf. parse() function to get the complete syntax tree Note: this function is exposed for unit test purposes and should
 * not be used directly
 * @param {String} template the template to parse
 */
function getBlockList (template) {
    // add a last line feed a the end of the template as the parser parses the plaintext
    // sequences only when ending with a new line sequence (workaround to solve pegjs issue)
    return blockParser.parse(template + "\r\n");
}
exports.getBlockList = getBlockList;

exports.parse = function (template) {
    var res = {};
    try {
        var bl = getBlockList(template);
        var st = new SyntaxTree();
        st.generateTree(bl);
        // st.displayErrors();
        res = {
            syntaxTree : st.tree.content,
            errors : st.errors
        };
    } catch (ex) {
        res = {
            syntaxTree : null,
            errors : [{
                        description : ex.toString(),
                        line : ex.line,
                        column : ex.column
                    }]
        };
    }
    return res;
};

/**
 * Node of the Syntax tree
 */
var Node = klass({
    $constructor : function (type, parent) {
        this.type = type;
        this.parent = parent;
    }
});

var SyntaxTree = klass({
    /**
     * Generate the syntax tree from the root block list
     */
    generateTree : function (blockList) {
        this.errors = [];
        this.tree = new Node("file", null);
        this.tree.content = [];

        this._advance(0, blockList, this.tree.content);
    },

    _logError : function (description, errdesc) {
        var desc = {
            description : description
        };
        if (errdesc) {
            if (errdesc.line) {
                desc.line = errdesc.line;
                desc.column = errdesc.column;
            }
            if (errdesc.code) {
                desc.code = errdesc.code;
            }
        }
        this.errors.push(desc);
    },

    displayErrors : function () {
        if (this.errors.length) {
            for (var i = 0, sz = this.errors.length; sz > i; i++) {
                console.log("Error " + (i + 1) + "/" + sz + ": " + this.errors[i].description);
            }
        }
    },

    /**
     * Process a list of blocks and advance the cursor index that scans the collection
     * @param {function} optEndFn an optional end function that takes a node type as argument
     * @return {int} the index of the block where the function stopped or -1 if all blocks have been handled
     */
    _advance : function (startIdx, blocks, out, optEndFn) {
        var b, type;
        if (blocks) {
            for (var i = startIdx, sz = blocks.length; sz > i; i++) {
                b = blocks[i];
                type = b.type;

                if (optEndFn && optEndFn(type, b.name)) {
                    // we stop here
                    return i;
                }
                if (this["_" + type]) {
                    i = this["_" + type](i, blocks, out);
                } else {
                    this._logError("Invalid statement: " + type, b);
                }
            }
            return blocks.length;
        }
    },

    /**
     * Template block management
     */
    _template : function (idx, blocks, out) {
        var n = new Node("template"), b = blocks[idx];
        n.name = b.name;
        if (b.controller) {
            n.controller = b.controller;
            n.controller.ref = b.controllerRef;
        } else {
            n.args = b.args;
        }
        n.export = b.mod === "export";
        n.startLine = b.line;
        n.endLine = b.endLine;
        n.content = [];
        out.push(n);

        if (b.mod !== '' && b.mod !== "export") {
            this._logError("Invalid template template modifier: " + b.mod, blocks[idx]);
        }

        if (!b.closed) {
            this._logError("Missing end template statement", b);
        }

        // parse sub-list of blocks
        this._advance(0, b.content, n.content);
        return idx;
    },

    /**
     * Catch invalid template definitions
     */
    _invalidtemplate : function (idx, blocks, out) {
        this._logError("Invalid template declaration", blocks[idx]);
        return idx;
    },

    /**
     * Text block management
     */
    _plaintext : function (idx, blocks, out) {
        var n = new Node("plaintext"), b = blocks[idx];
        n.value = b.value;
        out.push(n);
        return idx;
    },

    /**
     * Text block management: regroups adjacent text and expression blocks
     */
    _text : function (idx, blocks, out) {
        var sz = blocks.length, idx2 = idx, goahead = (sz > idx2), b, buf = [], n = null, insertIdx = -1;

        while (goahead) {
            b = blocks[idx2];
            if (b.type === "text") {
                if (b.value !== "") {
                    buf.push(b);
                }
            } else if (b.type === "expression") {
                if (b.category === "jsexpression") {
                    // pre-process expression
                    var e = new HExpression(b, this);
                    // inject the processed expression in the block list
                    b = blocks[idx2] = e.getSyntaxTree();
                }

                if (b.category === "invalidexpression") {
                    this._logError("Invalid expression", b);
                } else if (b.category !== "functionref") {
                    buf.push(b);
                } else {
                    // this is an insert statement
                    insertIdx = idx2;
                    idx2++; // will be handled below
                    goahead = false;
                }
            } else if (b.type === "comment") {
                // ignore comments
            } else {
                goahead = false;
            }

            if (goahead) {
                idx2++;
                goahead = (sz > idx2);
            }
        }

        if (buf.length === 1 && buf[0].type === "text") {
            // only one text block
            n = new Node("text");
            n.value = buf[0].value;
        } else if (buf.length > 0) {
            // an expression or several blocks have to be aggregated
            n = new Node("textblock");
            n.content = buf;
        }
        if (n) {
            out.push(n);
        }

        if (insertIdx > -1) {
            // an insert block has to be added after the text block
            this._insert(insertIdx, blocks, out);
        }

        // return the last index that was handled
        return idx2 > idx ? idx2 - 1 : idx;
    },

    /**
     * Text block management: regroups adjacent text and expression blocks
     */
    _expression : function (idx, blocks, out) {
        var b = blocks[idx], cat = b.category;
        if (cat === "invalidexpression") {
            this._logError("Invalid expression", b);
            return idx;
        }

        return this._text(idx, blocks, out);
    },

    /**
     * Catch invalid expressions
     */
    _invalidexpression : function (idx, blocks, out) {
        this._logError("Invalid expression", blocks[idx]);
        return idx;
    },

    /**
     * Insert
     */
    _insert : function (idx, blocks, out) {
        var n = new Node("insert"), b = blocks[idx];
        n.path = b.path;
        n.args = b.args;

        if (n.path.length > 1) {
            this._logError("Long paths for insert statements are not supported yet: " + n.path.join("."), b);
        } else {
            out.push(n);
        }
        return idx;
    },

    /**
     * If block management
     */
    _if : function (idx, blocks, out) {
        var n = new Node("if"), b = blocks[idx], lastValidIdx = idx;
        var condition = new HExpression(b.condition, this);
        n.condition = condition.getSyntaxTree();
        n.condition.bound = true;
        n.content1 = [];
        out.push(n);

        var endFound = false, out2 = n.content1, idx2 = idx;

        if (n.condition.type === "invalidexpression") {
            this._logError("Invalid if condition", n.condition);
        }

        while (!endFound) {
            idx2 = this._advance(idx2 + 1, blocks, out2, this._ifEndTypes);
            if (idx2 < 0 || !blocks[idx2]) {
                this._logError("Missing end if statement", blocks[lastValidIdx]);
                endFound = true;
            } else {
                var type = blocks[idx2].type;
                if (type === "endif") {
                    endFound = true;
                } else if (type === "else") {
                    n.content2 = [];
                    out2 = n.content2;
                    lastValidIdx = idx2;
                } else if (type === "elseif") {
                    // consider as a standard else statement
                    n.content2 = [];
                    out2 = n.content2;
                    lastValidIdx = idx2;
                    endFound = true;

                    // process as if it were an if node
                    idx2 = this._if(idx2, blocks, out2);
                }
            }
        }
        return idx2;
    },

    /**
     * Detects if blocks end types
     */
    _ifEndTypes : function (type) {
        return (type === "endif" || type === "else" || type === "elseif");
    },

    _endif : function (idx, blocks, out) {
        // only called in case of error
        var b = blocks[idx];
        this._logError("{/if} statement does not match any {if} block", b);
        return idx;
    },

    _else : function (idx, blocks, out) {
        // only called in case of error
        var b = blocks[idx];
        this._logError("{else} statement found outside any {if} block", b);
        return idx;
    },

    _elseif : function (idx, blocks, out) {
        // only called in case of error
        var b = blocks[idx];
        this._logError("{else if} statement found outside any {if} block", b);
        return idx;
    },

    /**
     * Foreach block management
     */
    _foreach : function (idx, blocks, out) {
        var n = new Node("foreach"), b = blocks[idx];
        n.item = b.item;
        n.key = b.key;
        n.collection = b.colref;
        n.collection.bound = true;
        n.content = [];
        out.push(n);

        var idx2 = this._advance(idx + 1, blocks, n.content, this._foreachEndTypes);
        if (idx2 < 0 || !blocks[idx2]) {
            this._logError("Missing end foreach statement", blocks[idx]);
        }

        return idx2;
    },

    /**
     * Detects foreach end
     */
    _foreachEndTypes : function (type) {
        return (type === "endforeach");
    },

    _endforeach : function (idx, blocks, out) {
        // only called in case of error
        var b = blocks[idx];
        this._logError("{/foreach} statement does not match any {foreach} block", b);
        return idx;
    },

    /**
     * Element block management
     */
    _element : function (idx, blocks, out) {
        return this._elementOrComponent("element", idx, blocks, out);
    },

    /**
     * Component block management
     */
    _component : function (idx, blocks, out) {
        return this._elementOrComponent("component", idx, blocks, out);
    },

    /**
     * Processing function for elements and components
     * @arg blockType {String} "element" or "component"
     */
    _elementOrComponent : function (blockType, idx, blocks, out) {
        var n = new Node(blockType), b = blocks[idx];
        n.name = b.name;
        n.closed = b.closed;
        if (b.ref) {
            // only for components
            n.ref = b.ref;
        }

        // Handle attributes
        var atts = b.attributes, att, att2, type, lc;
        n.attributes = [];

        for (var i = 0, sz = atts.length; sz > i; i++) {
            att = atts[i];
            var sz2 = att.value.length;

            // check if attribute contains uppercase
            lc = att.name.toLowerCase();
            if (lc !== att.name) {
                // this._logError("Invalid attribute name - must be lower case: "+att.name,b);
                // continue;
            }

            if (sz2 === 0) {
                // this case arises when the attibute is empty - so let's create an empty text node
                if (att.value === '') {
                    // attribute has no value - e.g. autocomplete in an input element
                    att2 = {
                        name : att.name,
                        type : "name",
                        line : att.line,
                        column : att.column
                    };
                    n.attributes.push(att2);
                    continue;
                } else {
                    att.value.push({
                        type : "text",
                        value : ""
                    });
                }
                sz2 = 1;
            }
            if (sz2 === 1) {
                // literal or expression
                type = att.value[0].type;
                if (type === "text" || type === "expression") {
                    if (type === "expression") {
                        var v = att.value[0], cat = v.category;
                        if (cat === "jsexpression") {
                            // pre-process expression
                            var e = new HExpression(v, this);
                            // inject the processed expression in the block list
                            att.value[0] = e.getSyntaxTree();
                        } else if (cat === "invalidexpression") {
                            this._logError("Invalid expression", v);
                        } else if (att.name.match(/^on/i) && cat !== "functionref") {
                            this._logError("Event handler attribute only support function expressions", v);
                        }
                    }
                    att2 = att.value[0];
                    att2.name = att.name;
                } else {
                    this._logError("Invalid attribute type: " + type, att);
                    continue;
                }
            } else {
                // length > 1 so attribute is a text block

                // if attribute is an event handler, raise an error
                if (att.name.match(/^on/i)) {
                    this._logError("Event handler attributes don't support text and expression mix", att);
                }
                // raise errors if we have invalid attributes
                for (var j = 0; sz2 > j; j++) {
                    var v = att.value[j];
                    if (v.type === "expression") {
                        if (v.category === "jsexpression") {
                            // pre-process expression
                            var e = new HExpression(v, this);
                            // inject the processed expression in the block list
                            att.value[j] = e.getSyntaxTree();
                        } else if (v.category === "invalidexpression") {
                            this._logError("Invalid expression", v);
                        }
                    }
                }
                att2 = {
                    name : att.name,
                    type : "textblock",
                    content : att.value
                };
            }

            n.attributes.push(att2);
        }

        n.content = [];
        out.push(n);

        var idx2 = idx;
        if (!b.closed) {
            var endFound = false, out2 = n.content, ename = b.name;

            while (!endFound) {
                idx2 = this._advance(idx2 + 1, blocks, out2, function (type, name) {
                    return (type === "end" + blockType); // && name===ename
                });
                if (idx2 < 0 || !blocks[idx2]) {
                    // we didn't find any endelement or endcomponent
                    this._logError("Missing end " + blockType + " </" + ename + ">", b);
                    endFound = true;
                } else {
                    // check if the end name is correct
                    var b2=blocks[idx2];
                    if (b2.type==="endelement") {
                        if (blocks[idx2].name !== ename) {
                            this._logError("Missing end " + blockType + " </" + ename + ">", b);
                            idx2 -= 1; // the current end element/component may be caught by a container element
                        }
                    } else {
                        // endcomponent
                        var p1=this._getComponentPathAsString(b.ref), p2=this._getComponentPathAsString(b2.ref);
                        if (p1!==p2) {
                            this._logError("Missing end component </#" + p1 + ">", b);
                            idx2 -= 1; // the current end element/component may be caught by a container element
                        }
                    }
                    endFound = true;
                }
            }
        }

        return idx2;
    },

    /**
     * Transform a component path into a string - useful for error checking
     * If path is invalid null is returned
     * @param {Object} ref the ref structure returned by the PEG parser for components and endcomponents
     */
    _getComponentPathAsString:function(ref) {
        if (ref.category!=="objectref" || !ref.path || !ref.path.length || !ref.path.join) {
            return null;
        }
        return ref.path.join(".");
    },

    /**
     * Catch invalid element errors
     */
    _invalidelement : function (idx, blocks, out) {
        // only called in case of error
        var b = blocks[idx];
        this._logError("Invalid HTML element syntax", b);
        return idx;
    },

    /**
     * Ignore comment blocks
     */
    _comment : function (idx, blocks, out) {
        return idx;
    },

    /**
     * Capture isolated end elements to raise an error
     */
    _endelement : function (idx, blocks, out) {
        // only called in case of error
        var b = blocks[idx], nm = b.name;
        this._logError("End element </" + nm + "> does not match any <" + nm + "> element", b);
        return idx;
    },

    /**
     * Capture isolated end components to raise an error
     */
    _endcomponent: function (idx, blocks, out) {
        // only called in case of error
        var b = blocks[idx], p = this._getComponentPathAsString(b.ref) ;
        this._logError("End component </#" + p + "> does not match any <#" + p + "> component", b);
        return idx;
    }

});

var HExpression = klass({
    /**
     * Process the HExpression node parsed by the PEG grammar to generate a more digestable format for the syntax tree
     * (note:processing is mostly for the JSExpression parts)
     * @param {JSON} node the node generated by the PEG Grammar (cf. HExpression)
     */
    $constructor : function (node, globalSyntaxTree) {
        this.rootExpression = node;
        this.errors = null;
        this.globalSyntaxTree = globalSyntaxTree;
        if (node.expType) {
            node.type = node.expType;
        }

        if (node.category !== "jsexpression") {
            // we only reprocess jsexpression
            this._st = node;
        } else {
            this._objectRefs = []; // list of objectref expressions found in the jsexpression

            var code = this._process(node);
            this.rootExpression.code = code;
            this._st = {
                type : "expression",
                category : "jsexpression",
                objectrefs : this._objectRefs,
                code : code
            };

            // if we have only one variable, we can simplify the syntaxtree
            if (code === "a0") {
                this._st = this._objectRefs[0];
            } else if (code.match(/^ *$/)) {
                // there is no code to display
                this._st = {
                    "type" : "text",
                    "value" : code
                };
            }

            // add line / column nbr if present
            if (node.line) {
                this._st.line = node.line;
                this._st.column = node.column;
            }

            // check errors
            if (this.errors) {
                for (var i = 0, sz = this.errors.length; sz > i; i++) {
                    globalSyntaxTree._logError(this.errors[i], this.rootExpression);
                }
            }
        }
    },
    /**
     * Return the syntax tree node to put in the global syntax tree
     */
    getSyntaxTree : function () {
        return this._st;
    },

    /**
     * Log an error on the syntax tree associated to this expression
     */
    _logError : function (msg) {
        if (!this.errors) {
            this.errors = [];
        }
        this.errors.push(msg);
    },

    /**
     * Internal recursive method to process a node
     * @param {JSON} node the expression node to be processed
     * @return {String} the JS code associated to this node
     */
    _process : function (node) {
        var r = "";
        switch (node.type) {
            case "expression" :
                r = this._getValue(node);
                break;
            case "BinaryExpression" :
                r = '(' + this._process(node.left) + ' ' + node.operator + ' ' + this._process(node.right) + ')';
                break;
            case "UnaryExpression" : // e.g. !x +x -x typeof x ++x and --x will not be supported
                r = '' + node.operator + '(' + this._process(node.expression) + ')';
                if (node.operator === '++' || node.operator === '--') {
                    this._logError('Unary operator ' + node.operator + ' is not allowed');
                }
                break;
            case "PostfixExpression" : // e.g. x++ or x-- (not allowed)
                r = '' + '(' + this._process(node.expression) + ')' + node.operator;
                this._logError('Postfix operator ' + node.operator + ' is not allowed');
                break;
            case "Variable" :
                r = this._getValue({
                    type : "expression",
                    "category" : "objectref",
                    bound : node.bound,
                    "path" : [node.name]
                });
                break;
            case "PropertyAccess" :
                // this is an object ref
                var n = node, p = [], nm;
                while (n) {
                    nm = n.name;
                    if (nm.type && nm.type === "expression") {
                        p.push(nm.value);
                    } else {
                        p.push(nm);
                    }
                    n = n.base;
                }
                p.reverse();
                r = this._getValue({
                    type : "expression",
                    "category" : "objectref",
                    bound : node.bound,
                    "path" : p
                });
                break;
            case "ConditionalExpression" :
                r = '(' + this._process(node.condition) + '? ' + this._process(node.trueExpression) + ' : '
                        + this._process(node.falseExpression) + ')';
                break;
            case "FunctionCall" :
                // this is an object ref
                var n = node.name, p = [];
                while (n) {
                    p.push(n.name);
                    n = n.base;
                }
                p.reverse();

                var n = {
                    type : "expression",
                    "category" : "functionref",
                    bound : node.bound,
                    "path" : p
                };
                r = this._getValue(n);

                // add arguments
                var args2 = [], args = node.arguments, sz = args ? args.length : 0, e;
                for (var i = 0; sz > i; i++) {
                    if (!args[i].category) {
                        // add category otherwise HExpression will not be parsed
                        args[i].category = "jsexpression";
                    }
                    e = new HExpression(args[i], this.globalSyntaxTree);
                    args2[i] = e.getSyntaxTree();
                }
                n.args = args2;
                break;
            case "CssClassElement" :
                r = "((" + this._process(node.right) + ")? ''+" + this._process(node.left) + ":'')";
                break;
            case "CssClassExpression" :
                var ls = node.list, sz = ls.length, code = [];
                for (var i = 0; sz > i; i++) {
                    code[i] = this._process(ls[i]);
                }
                if (sz < 1) {
                    r = '';
                } else {
                    r = "[" + code.join(",") + "].join(' ')";
                }
                break;
            default :
                this._logError(node.type + '(s) are not supported yet');
                console.warn('[HExpression] ' + node.type + '(s) are not supported yet:');
                console.dir(node);
                break;
        }
        return r;
    },

    /**
     * Return the code value for a node of type "expression" (i.e. literals, objectrefs...)
     */
    _getValue : function (node) {
        var r = '';
        switch (node.category) {
            case "objectref" :
                var sz = this._objectRefs.length, e, pl, ok;

                // check if an indentical expression already exist
                for (var i = 0; sz > i; i++) {
                    e = this._objectRefs[i], pl = e.path.length, ok = true;
                    // only the path may vary
                    if (e.category !== "objectref") {
                        continue;
                    }
                    if (pl === node.path.length) {
                        for (var j = 0; pl > j; j++) {
                            if (e.path[j] !== node.path[j]) {
                                ok = false;
                                break;
                            }
                        }
                        if (ok) {
                            r = "a" + i;
                            break;
                        }
                    }
                }

                if (!r) {
                    // objectref doesn't exist in previous expressions
                    r = "a" + sz; // argument variable
                    this._objectRefs[sz] = node;
                }
                break;
            case "functionref" :
                // add the function call to the object ref list
                // we don't optimize the storeage as it is less likely to have the same combination repeated
                // than with simple object refs
                var sz = this._objectRefs.length;
                r = "a" + sz; // argument variable
                this._objectRefs[sz] = node;
                break;
            case "string" :
                r = '"' + node.value.replace(/\"/g, '\\"') + '"';
                break;
            case "boolean" :
            case "number" :
                r = node.value;
                break;
            case "null" :
                r = "null";
                break;
        }
        return r;
    }
});