var klass = require("../../klass");
var HExpression = require("./hExpression").HExpression;
var htmlEntitiesToUtf8 = require("./htmlEntities").htmlEntitiesToUtf8;

//http://www.w3.org/TR/html-markup/syntax.html#syntax-elements
var VOID_HTML_ELEMENTS = {
    "area": true,
    "base": true,
    "br": true,
    "col": true,
    "command": true,
    "embed": true,
    "hr": true,
    "img": true,
    "input": true,
    "keygen": true,
    "link": true,
    "meta": true,
    "param": true,
    "source": true,
    "track": true,
    "wbr": true
};

/**
 * Checks if an element is a void one.
 * @param {String} the element name.
 * @return {Boolean} true if the element is a void one.
 */
function isVoidElement(elName) {
    var result = false;
    if (elName && elName.toLowerCase) {
        result = VOID_HTML_ELEMENTS.hasOwnProperty(elName.toLowerCase());
    }
    return result;
}

/**
 * Node of the Syntax tree
 */
var Node = klass({
    $constructor : function (type, parent) {
        this.type = type;
        this.parent = parent;
    }
});

/**
 * A map of the reserved keywords.
 */
var reservedKeywords = {
    "event": true,
    "scope": true
};

/**
 * The SyntaxTree class made to build the syntax tree from the block list from the parser. 
 * Entry point: generateTree()
 */
var SyntaxTree = klass({
    /**
     * Generate the syntax tree from the root block list.
     * @param {Object} blockList the block list.
     */
    generateTree : function (blockList) {
        this.errors = [];
        this.tree = new Node("file", null);
        this.tree.content = [];

        this._advance(blockList, 0, this.tree.content);

        this._postProcessTree();
    },

    /**
     * Adds an error to the current error list.
     * @param {String} description the error description
     * @param {Object} errdesc additional object (block, node, ...) which can contain additional info about the error (line/column number, code).
     */
    _logError : function (description, errdesc) {
        //TODO: errdesc is a bit vague
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

    /**
     * Process a list of blocks and advance the cursor index that scans the collection.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} startIndex the index from which the process has to start.
     * @param {Array} out the output as an array of Node.
     * @param {Function} optEndFn an optional end function that takes a node type as argument.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    _advance : function (blocks, startIndex, out, optEndFn) {
        var block, type;
        if (blocks) {
            for (var i = startIndex; i < blocks.length; i++) {
                block = blocks[i];
                type = block.type;

                if (optEndFn && optEndFn(type, block.name)) {
                    // we stop here
                    return i;
                }
                //by convention, a block of type xyz is managed by a __xyz function in the class 
                if (this["__" + type]) {
                    i = this["__" + type](i, blocks, out);
                } else {
                    this._logError("Invalid statement: " + type, block);
                }
            }
            return blocks.length;
        }
    },

    /**
     * Post validation once the tree is properly parsed.
     */
    _postProcessTree : function() {
        var nodes = this.tree.content;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].type === "template") {
                this._processNodeContent(nodes[i].content,nodes[i]);
            }
        }
    },

    /**
     * Validates the content of a container node.
     * @param {Array} nodeList the content of a container node
     * @param {Node} parent the parent node
     */
    _processNodeContent:function(nodeList, parent) {
        // Ensure that {let} nodes are always at the beginning of a containter element
        var node, contentFound = false; // true when a node different from let is found
        for (var i = 0; i < nodeList.length; i++) {
            node = nodeList[i];
            //console.log(i+":"+node.type)
            if (node.type === "comment") {
                continue;
            }
            if (node.type==="text") {
                // tolerate static white space text
                if (node.value.match(/^\s*$/)) {
                    continue;
                }
            }
            if (node.type === "let") {
                if (contentFound) {
                    // error: let must be defined before any piece of content
                    this._logError("Let statements must be defined at the beginning of a block", node);
                } else {
                    parent.needSubScope = true;
                }
            } else {
                contentFound = true;
                if (node.content) {
                    this._processNodeContent(node.content, node);
                }
                if (node.content1) {
                    this._processNodeContent(node.content1, node);
                }
                if (node.content2) {
                    this._processNodeContent(node.content2, node);
                }
            }
        }
    },

    /**
     * Manages a template block.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __template : function (index, blocks, out) {
        var node = new Node("template"), block = blocks[index];
        node.name = block.name;
        if (block.controller) {
            node.controller = block.controller;
            node.controller.ref = block.controllerRef;
        } else {
            node.args = block.args;
            // check args
            for (var i=0; i < node.args.length; i++) {
                if (reservedKeywords[node.args[i]]) {
                    this._logError("Reserved keywords cannot be used as template argument: "+node.args[i], block);
                }
            }
        }
        node.export = block.mod === "export";
        node.startLine = block.line;
        node.endLine = block.endLine;
        node.content = [];
        out.push(node);

        if (block.mod !== '' && block.mod !== "export") {
            this._logError("Invalid template template modifier: " + block.mod, blocks[index]);
        }

        if (!block.closed) {
            this._logError("Missing end template statement", block);
        }

        // parse sub-list of blocks
        this._advance(block.content, 0, node.content);
        return index;
    },

    /**
     * Catches invalid template definitions.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __invalidtemplate : function (index, blocks, out) {
        this._logError("Invalid template declaration", blocks[index]);
        return index;
    },

    /**
     * Manages a text block.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __plaintext : function (index, blocks, out) {
        var node = new Node("plaintext"), block = blocks[index];
        node.value = block.value;
        out.push(node);
        return index;
    },

    /**
     * Manages a log statement.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __log : function (index, blocks, out) {
        var node = new Node("log"), block = blocks[index], exprs = [];
        node.line = block.line;
        node.column = block.column;
        for (var i = 0; i < block.exprs.length; i++) {
            var expr = new HExpression(block.exprs[i], this);
            exprs[i] = expr.getSyntaxTree();
        }
        node.exprs = exprs;
        out.push(node);
        return index;
    },

    /**
     * Manages a let statement.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __let : function (index, blocks, out) {
        var node = new Node("let"), block = blocks[index], assignments = [];
        node.line = block.line;
        node.column = block.column;
        for (var i = 0; i < block.assignments.length; i++) {
            var expr = new HExpression(block.assignments[i].value, this);
            assignments.push({identifier:block.assignments[i].identifier, value: expr.getSyntaxTree()});
        }
        node.assignments = assignments ;
        out.push(node);
        return index;
    },

    /**
     * Manages a text block: regroups adjacent text and expression blocks
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __text : function (index, blocks, out) {
        var length = blocks.length, buffer = [];

        //Regroups adjacent text and expression blocks by looking at the next ones
        var nextIndex = index, goAhead = (length > nextIndex), block;
        while (goAhead) {
            block = blocks[nextIndex];
            if (block.type === "text") {
                if (block.value !== "") {
                    try {
                      block.value = htmlEntitiesToUtf8(block.value);
                      buffer.push(block);
                    } catch (e) {
                      this._logError(e.message, block);
                    }
                }
            } else if (block.type === "expression") {
                if (block.category === "jsexpression") {
                    // pre-process expression
                    var expr = new HExpression(block, this);
                    // inject the processed expression in the block list
                    block = blocks[nextIndex] = expr.getSyntaxTree();
                }

                if (block.category === "invalidexpression") {
                    this._logError("Invalid expression", block);
                } else {
                    buffer.push(block);
                }
            } else if (block.type === "comment") {
                // ignore comments
            } else {
                goAhead = false;
            }

            if (goAhead) {
                nextIndex++;
                goAhead = (length > nextIndex);
            }
        }

        //Manages the adjacent text and expression blocks found
        var node = null;
        if (buffer.length === 1 && buffer[0].type === "text") {
            // only one text block
            node = new Node("text");
            node.value = buffer[0].value;
        } else if (buffer.length > 0) {
            // if buffer is composed of only text expressions we concatenate them
            var onlyText=true;
            for (var i = 0; i < buffer.length; i++) {
                if (buffer[i].type !== "text") {
                    onlyText = false;
                    break;
                }
            }
            if (onlyText) {
                var texts=[];
                for (var i = 0; i < buffer.length; i++) {
                    texts.push(buffer[i].value);
                }
                node = new Node("text");
                node.value = texts.join('');
            } else {
                // an expression or several blocks have to be aggregated
                node = new Node("textblock");
                node.content = buffer;
            }
        }
        if (node) {
            out.push(node);
        }

        // return the last index that was handled
        return nextIndex > index ? nextIndex - 1 : index;
    },

    /**
     * Manages an expression block.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __expression : function (index, blocks, out) {
        var block = blocks[index];
        if (block.category === "invalidexpression") {
            this._logError("Invalid expression", block);
            return index;
        }

        return this.__text(index, blocks, out);
    },

    /**
     * Catches invalid expressions.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __invalidexpression : function (index, blocks, out) {
        this._logError("Invalid expression", blocks[index]);
        return index;
    },

    /**
     * Manages an if block.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __if : function (index, blocks, out) {
        //creates the if node
        var node = new Node("if"), block = blocks[index], lastValidIndex = index;
        var condition = new HExpression(block.condition, this);
        node.condition = condition.getSyntaxTree();
        node.condition.bound = true;
        node.content1 = [];
        out.push(node);

        var endFound = false, out2 = node.content1;

        if (node.condition.type === "invalidexpression") {
            this._logError("Invalid if condition", node.condition);
        }

        //process the content of the if block, until one of the if end is found (i.e. endif, else or elseif), if any
        while (!endFound) {
            //fills node.content1 with the next blocks
            index = this._advance(blocks, index + 1, out2, this._ifEndTypes);
            if (index < 0 || !blocks[index]) {
                this._logError("Missing end if statement", blocks[lastValidIndex]);
                endFound = true;
            } else {
                var type = blocks[index].type;
                if (type === "endif") {
                    endFound = true;
                } else if (type === "else") {
                    //loop will restrat, filling node.content2 with the next blocks
                    node.content2 = [];
                    out2 = node.content2;
                    lastValidIndex = index;
                } else if (type === "elseif") {
                    // consider as a standard else statement
                    node.content2 = [];
                    out2 = node.content2;
                    lastValidIndex = index;
                    endFound = true;

                    // process as if it were an if node
                    index = this.__if(index, blocks, out2);
                }
            }
        }
        return index;
    },

    /**
     * Detects if blocks end types.
     * @param {String} type the block type.
     * @retrun {Boolean} true if the block terminates an if.
     */
    _ifEndTypes : function (type) {
        return (type === "endif" || type === "else" || type === "elseif");
    },

    /**
     * Manages an endif block.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __endif : function (index, blocks, out) {
        // only called in case of error, i.e not digested by __if
        var block = blocks[index];
        this._logError("{/if} statement does not match any {if} block", block);
        return index;
    },

    /**
     * Manages an else block.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __else : function (index, blocks, out) {
        // only called in case of error, i.e not digested by __if
        var block = blocks[index];
        this._logError("{else} statement found outside any {if} block", block);
        return index;
    },

    /**
     * Manages an elseif block.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __elseif : function (index, blocks, out) {
        // only called in case of error, i.e not digested by __if
        var block = blocks[index];
        this._logError("{else if} statement found outside any {if} block", block);
        return index;
    },

    /**
     * Manages a foreach block.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __foreach : function (index, blocks, out) {
        //creates the foreach node
        var node = new Node("foreach"), block = blocks[index];
        node.item = block.item;
        node.key = block.key;
        node.collection = block.colref;
        node.collection.bound = true;
        node.content = [];
        out.push(node);

        //fills node.content with the next blocks, until an endforeach is found, if any
        var nextIndex = this._advance(blocks, index + 1, node.content, this._foreachEndTypes);
        if (nextIndex < 0 || !blocks[nextIndex]) {
            this._logError("Missing end foreach statement", blocks[index]);
        }

        return nextIndex;
    },

    /**
     * Detects foreach end.
     * @param {String} type the block type.
     * @retrun {Boolean} true if the block terminates an foreach.
     */
    _foreachEndTypes : function (type) {
        return (type === "endforeach");
    },

    /**
     * Manages an endforeach block.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __endforeach : function (index, blocks, out) {
        // only called in case of error, i.e not digested by __foreach
        var block = blocks[index];
        this._logError("{/foreach} statement does not match any {foreach} block", block);
        return index;
    },

    /**
     * Manages an element block.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __element : function (index, blocks, out) {
        var block = blocks[index];
        if (isVoidElement(block.name)) {
          block.closed=true;
        }
        return this._elementOrComponent("element", index, blocks, out);
    },

    /**
     * Manages a component block.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __component : function (index, blocks, out) {
        return this._elementOrComponent("component", index, blocks, out);
    },

    /**
     * Manages a component attribute block.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __cptattribute : function (index, blocks, out) {
        return this._elementOrComponent("cptattribute", index, blocks, out);
    },

    /**
     * Processing function for elements, components and component attributes
     * @arg blockType {String} "element", "component" or "cptattribute".
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    _elementOrComponent : function (blockType, index, blocks, out) {
        var node = new Node(blockType), block = blocks[index];
        node.name = block.name;
        node.closed = block.closed;
        if (block.ref) {
            // only for components
            node.ref = block.ref;
        }

        // Handle attributes
        var attributes = block.attributes, attribute, outAttribute;
        node.attributes = [];

        for (var i = 0; i < attributes.length; i++) {
            attribute = attributes[i];
            var length = attribute.value.length;

            if (length === 0) {
                // this case arises when the attibute is empty - so let's create an empty text node
                if (attribute.value === '') {
                    // attribute has no value - e.g. autocomplete in an input element
                    outAttribute = {
                        name : attribute.name,
                        type : "name",
                        line : attribute.line,
                        column : attribute.column
                    };
                    node.attributes.push(outAttribute);
                    continue;
                } else {
                    attribute.value.push({
                        type : "text",
                        value : ""
                    });
                }
                length = 1;
            }
            if (length === 1) {
                // literal or expression
                var type = attribute.value[0].type;
                if (type === "text" || type === "expression") {
                    if (type === "expression") {
                        var value = attribute.value[0], category = value.category;
                        if (category === "jsexpression") {
                            // pre-process expression
                            var expr = new HExpression(value, this);
                            // inject the processed expression in the block list
                            attribute.value[0] = expr.getSyntaxTree();
                        } else if (category === "invalidexpression") {
                            this._logError("Invalid expression", value);
                        } else if (attribute.name.match(/^on/i) && category !== "functionref") {
                            this._logError("Event handler attribute only support function expressions", value);
                        }
                    }
                    outAttribute = attribute.value[0];
                    outAttribute.name = attribute.name;
                } else {
                    this._logError("Invalid attribute type: " + type, attribute);
                    continue;
                }
            } else {
                // length > 1 so attribute is a text block

                // if attribute is an event handler, raise an error
                if (attribute.name.match(/^on/i)) {
                    this._logError("Event handler attributes don't support text and expression mix", attribute);
                }
                // raise errors if we have invalid attributes
                for (var j = 0; j < length; j++) {
                    var value = attribute.value[j];
                    if (value.type === "expression") {
                        if (value.category === "jsexpression") {
                            // pre-process expression
                            var expr = new HExpression(value, this);
                            // inject the processed expression in the block list
                            attribute.value[j] = expr.getSyntaxTree();
                        } else if (value.category === "invalidexpression") {
                            this._logError("Invalid expression", value);
                        }
                    }
                }
                outAttribute = {
                    name : attribute.name,
                    type : "textblock",
                    content : attribute.value
                };
            }

            node.attributes.push(outAttribute);
        }

        //fills node.content with the next blocks, until an matching end element is found, if any
        node.content = [];
        out.push(node);

        if (!block.closed) {
            var endFound = false, blockName = block.name;

            while (!endFound) {
                index = this._advance(blocks, index + 1, node.content, function (type, name) {
                    return (type === "end" + blockType); // && name===blockName
                });
                if (index < 0 || !blocks[index]) {
                    if (blockType==="component") {
                        blockName="#"+this._getComponentPathAsString(block.ref);
                    }
                    // we didn't find any endelement or endcomponent
                    this._logError("Missing end " + blockType + " </" + blockName + ">", block);
                    endFound = true;
                } else {
                    // check if the end name is correct
                    var endBlock = blocks[index];
                    if (endBlock.type === "endelement" || endBlock.type === "endcptattribute") {
                        if (endBlock.name !== blockName) {
                            this._logError("Missing end " + blockType + " </" + blockName + ">", block);
                            index -= 1; // the current end element/component may be caught by a container element
                        }
                    } else {
                        // endcomponent
                        var beginPath = this._getComponentPathAsString(block.ref), endPath = this._getComponentPathAsString(endBlock.ref);
                        if (beginPath !== endPath) {
                            this._logError("Missing end component </#" + beginPath + ">", block);
                            index -= 1; // the current end element/component may be caught by a container element
                        }
                    }
                    endFound = true;
                }
            }
        }

        return index;
    },

    /**
     * Transform a component path into a string - useful for error checking
     * If path is invalid null is returned
     * @param {Object} ref the ref structure returned by the PEG parser for components and endcomponents
     * @retrun {String} the path as a string
     */
    _getComponentPathAsString : function(ref) {
        if (ref.category !== "objectref" || !ref.path || !ref.path.length || !ref.path.join) {
            return null;
        }
        return ref.path.join(".");
    },

    /**
     * Catches invalid element errors.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __invalidelement : function (index, blocks, out) {
        // only called in case of error
        var block = blocks[index];
        var msg = "Invalid HTML element syntax";
        if (block.code && block.code.match(/^<\/?\@/gi)) {
            msg = "Invalid component attribute syntax";
        }
        this._logError(msg, block);
        return index;
    },

    /**
     * Ignores comment blocks.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __comment : function (index, blocks, out) {
        return index;
    },

    /**
     * Captures isolated end elements to raise an error.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __endelement : function (index, blocks, out) {
        // only called in case of error, i.e not digested by _elementOrComponent
        var block = blocks[index], name = block.name;
        if (isVoidElement(name)) {
          this._logError("The end element </" + name + "> was rejected as <" + name + "> is a void HTML element and can't have a closing element", block);
        } else {
          this._logError("End element </" + name + "> does not match any <" + name + "> element", block);
        }
        return index;
    },

    /**
     * Captures isolated end components to raise an error.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __endcomponent: function (index, blocks, out) {
        // only called in case of error, i.e not digested by _elementOrComponent
        var block = blocks[index], path = this._getComponentPathAsString(block.ref) ;
        this._logError("End component </#" + path + "> does not match any <#" + path + "> component", block);
        return index;
    },

    /**
     * Captures isolated end component attributes to raise an error.
     * @param {Array} blocks the full list of blocks.
     * @param {Integer} index the index of the block to manage.
     * @param {Array} out the output as an array of Node.
     * @return {Integer} the index of the block where the function stopped or -1 if all blocks have been handled.
     */
    __endcptattribute: function (index, blocks, out) {
        // only called in case of error, i.e not digested by _elementOrComponent
        var block = blocks[index], name = block.name ;
        this._logError("End component attribute </@" + name + "> does not match any <@" + name + "> component attribute", block);
        return index;
    }

});
exports.SyntaxTree = SyntaxTree;
