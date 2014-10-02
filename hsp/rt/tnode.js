
/*
 * Copyright 2012 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var hsp = require("../rt"),
    klass = require("../klass"),
    log = require("./log"),
    ExpHandler = require("./exphandler");

/**
 * Template node - base class of all nodes
 */
var TNode = klass({
    node : null, // reference to the DOM node object - will be defined on each node instance
    vscope : null, // variable scope - will be defined on each node instance
    root : null, // reference to the root TNode
    parent : null, // parent TNode
    children : null, // array of child node generators
    childNodes : null,// array of child node instances
    adirty : false, // true if some of the node attributes need to be refreshed
    cdirty : false, // true if the node contains dirty sub-nodes
    edirty : false, // (only used by components) true if one the attribute element is dirty
    htmlCbs : null, // array: list of the html callbacks - if any
    nodeNS : null, // string: node namespace - if any
    isCptContent : false, // tells if a node instance is a child of a component (used to raise edirty flags)
    obsPairs : null,      // Array of observed [obj, property] pairs associated to this object
    needSubScope : false, // true if a dedicated sub-scope should be created for this node
    rendered : false,

    $constructor : function (exps,observeExpTarget) {
        this.isStatic = (exps === 0);
        if (!this.isStatic) {
            // create ExpHandler
            this.eh = new ExpHandler(exps,observeExpTarget);
        }
    },

    /**
     * Safely remove all cross references
     */
    $dispose : function () {
        var cn = this.childNodes;
        if (cn) {
            // recursively dispose child nodes
            for (var i = 0, sz = cn.length; sz > i; i++) {
                cn[i].$dispose();
            }
            delete this.childNodes;
        }

        // TODO delete Expression observers !!!!
        if (this.root) {
            this.root.rmAllObjectObservers(this);
        }
        // Note: we must not set this.children to null here.
        // Indeed children are usually static (on the constructor) and so children=null should have no
        // effect, except for $CptAttElement where it may be set at at instance level for cpt attributes
        // created by the run-time
        this.obsPairs = null;
        this.htmlCbs = null;
        this.node = null;
        this.parent = null;
        this.root = null;
        this.vscope = null;
        this.atts = null;
        this.evtHandlers = null;
    },

    /**
     * create and set the atts property, which is an array of attribute objects created from the attcfg passed as
     * argument
     * @param {Map} attcfg the attribute configuration - e.g. {"title":"test2","class":["t2",1],"tabIndex":["",2]}
     * @param {Map} ehcfg the event handler configuration - optional - e.g. {"onclick":2}
     */
    createAttList : function (attcfg, ehcfg) {
        if (ehcfg) {
            var evh = [], cb;
            for (var k in ehcfg) {
                cb = new TCbAtt(k, ehcfg[k]);
                if (cb.isHtmlCallback) {
                    if (!this.htmlCbs) {
                        this.htmlCbs = [];
                    }
                    this.htmlCbs.push(cb);
                }
                evh.push(cb);
            }
            this.evtHandlers = evh;
        }

        if (attcfg === null || attcfg === 0)
            return null;
        var atts = [], itm;
        for (var k in attcfg) {
            if (attcfg.hasOwnProperty(k)) {
                itm = attcfg[k];
                if (itm === null) {
                    atts.push(new TSimpleAtt(k, k));
                } else if (typeof(itm) == "string") {
                    atts.push(new TSimpleAtt(k, itm));
                } else if (itm.constructor === Array) {
                    // attribute using a txtcfg structure to reference expressions
                    atts.push(new TExpAtt(k, itm));
                } else {
                    // unsupported attribute
                    log.error("[TNode] unsupported attribute: " + itm);
                }
            }
        }
        this.atts = atts;
    },

    /**
     * Observer callback called when one of the bound variables used by the node expressions changes
     */
    onPropChange : function (chge) {
        // set attribute dirty to true
        var root = this.root;
        if (!this.adirty) {
            if (this.isCptComponent && this.ctlWrapper) {
                // change component attribute synchronously to have only one refresh phase
                this.refreshAttributes();
            }
            this.adirty = true;

            if (this === root) {
                hsp.refresh.addTemplate(this);
            }
        }

        // mark parent node as containining dirty children (cdirty)

        if (this.isCptContent) {
            // parent node is a component
            this.parent.edirty=true;
        }

        var n = this.parent;
        while (n) {
            if (n.isCptContent && n.parent) {
                n.parent.edirty=true;
            }
            if (n.cdirty) {
                // already dirty - stop loop
                n = null;
            } else {
                n.cdirty = true;
                if (n === root) {
                    hsp.refresh.addTemplate(n);
                }
                n = n.parent;
            }
        }
    },

    /**
     * Create a node instance referencing the current node as base class Create as well the DOM element that will be
     * appended to the parent node DOM element
     * @return {TNode} the new node instance
     */
    createNodeInstance : function (parent) {
        // create node instance referencing the current node as parent in the prototype chain
        var ni = Object.create(this);
        ni.parent = parent;
        if (this.needSubScope) {
            ni.vscope = ni.createSubScope();
        } else {
            ni.vscope = parent.vscope; // we don't create new named variable in vscope, so we use the same vscope
        }
        ni.nodeNS = parent.nodeNS;
        ni.root = parent.root;
        ni.root.createExpressionObservers(ni);

        if (this.isDOMless) {
            // if or for nodes
            ni.node = ni.parent.node;
        } else {
            ni.createNode();
            if (ni.parent.node) {
                ni.parent.node.appendChild(ni.node);
            }

            if (this.children) {
                ni.childNodes = [];
                for (var i = 0, sz = this.children.length; sz > i; i++) {
                    ni.childNodes[i] = this.children[i].createNodeInstance(ni);
                }
            }
        }

        return ni;
    },

    /**
     * Refresh the node By default recursively refresh child nodes - so should be extended by sub-classes if they need
     * more specific logic
     */
    refresh : function () {
        if (this.adirty) {
            // update observable pairs
            this.root.updateObjectObservers(this);
            this.adirty = false; // adirty should not be set to false anywhere else unless updateObjectObservers is not required
        }
        if (this.cdirty) {
            var cn = this.childNodes;
            if (cn) {
                for (var i = 0, sz = cn.length; sz > i; i++) {
                    cn[i].refresh();
                }
            }
            this.cdirty = false;
        }
    },

    /**
     * Abstract function that should be implemented by sub-classes
     */
    createNode : function () {},

    /**
     * Recursively replace the DOM node by another node if it matches the preNode passed as argument
     */
    replaceNodeBy : function (prevNode, newNode) {
        if (prevNode === newNode)
            return;
        if (this.node === prevNode) {
            this.node = newNode;

            var cn = this.childNodes;
            if (cn) {
                for (var i = 0, sz = cn.length; sz > i; i++) {
                    cn[i].replaceNodeBy(prevNode, newNode);
                }
            }
        }
    },

    /**
     * Register the element in the list passed as argument
     * This allows for the component to dynamically rebuild the list of its attribute elements
     * Note: this method is only called when the $if node is used to dynamically create cpt attribute elements
     */
    registerAttElements:function (attElts) {
        var cn=this.childNodes, itm;
        if (cn) {
            for (var i=0, sz=cn.length; sz>i; i++) {
                itm=cn[i];
                if (!itm.registerAttElements) {
                    if (!itm.isEmptyTextNode){
                        // invalid content
                        log.error(this+" Statement must not produce invalid attribute elements when used as component content");
                    }
                } else {
                    itm.registerAttElements(attElts);
                }
            }
        }
    },

    /**
     * Remove child nodes, from the chilNodes list and from the DOM
     * This method is used by containers such as the {if} node
     * @param {DOMNode} DomNode1 the dom comment element used to limit the content start
     * @param {DOMNode} DomNode2 the dom comment element used to limit the content end
     */
    removeChildNodeInstances : function (DomNode1,DomNode2) {
        // dispose child nodes
        var cn = this.childNodes;
        if (cn) {
            // recursively dispose child nodes
            for (var i = 0, sz = cn.length; sz > i; i++) {
                cn[i].$dispose();
            }
            delete this.childNodes;
        }
        this.childNodes = null;

        // delete child nodes from the DOM
        var node = this.node, isInBlock = false, ch, n1 = DomNode1, n2 = DomNode2;
        for (var i = node.childNodes.length - 1; i > -1; i--) {
            ch = node.childNodes[i];
            if (isInBlock) {
                // we are between node1 and node2
                if (ch === n1) {
                    i = -1;
                    break;
                } else {
                    node.removeChild(ch);
                }
            } else {
                // detect node2
                if (ch === n2) {
                    isInBlock = true;
                }
            }
        }
    },

    /**
     * Create a sub-scope object inheriting from the parent' scope
     * @param {Object} ref tthe reference scope (optional - default: this.parent.vscope)
     */
    createSubScope: function(ref) {
        if (!ref) {
            ref=this.parent.vscope;
        }
        return ExpHandler.createSubScope(ref);
    },

    /**
     * Scans the scope tree to determine which scope object is actually handling a given object
     * (Shortcut to ExpHandler.getScopeOwner)
     * @param {String} property the property to look for
     * @param {Object} vscope the current variable scope
     * @return {Object} the scope object or null if not found
     */
    getScopeOwner : function(property, vscope) {
        return ExpHandler.getScopeOwner(property, vscope);
    },

    /**
     * Helper function to get the nth DOM child node of type ELEMENT_NODE
     * @param {Integer} index the position of the element (e.g. 0 for the first element)
     * @retrun {DOMElementNode}
     */
    getElementNode:function(index) {
        if (this.node) {
            var cn=this.node.childNodes, nd, idx=-1;
            var n1=this.node1, n2=this.node2; // for TNode using comments to delimit their content
            if (!n2) {
                n2=null;
            }
            var process=(n1)? false : true;
            for (var i=0;cn.length>i;i++) {
                nd=cn[i];
                if (process) {
                    if (nd===n2) {
                        break;
                    }
                    if (nd.nodeType===1) {
                        // 1 = ELEMENT_NODE
                        idx++;
                        if (idx===index) {
                            return nd;
                        }
                    }
                } else if (nd===n1) {
                    process=true;
                }

            }
        }
        return null;
    },

    /**
     * Return the component attribute type of the current node
     * @return {String} one of the following option:
     *      "ATTELT" if the element is an attribute element (e.g. <@body>)
     *      "CONTENT" if the node is a content element (e.g. <div>)
     *      "INDEFINITE" if the element can be part of eithe an attribute or content collection (e.g. blank text nodes)
     *      "ERROR" if elt mixes attribute and content elements
     */
    getCptAttType: function() {
        // this method must be overridden by child classes
        return "CONTENT";
    },

    /**
     * Analyze the type of tnodes in a collection to determine if they are valid cpt attribute elements
     * @parm nodes {Array} the list of node elements to validate (optional - if not provided this.children is used)
     * @return {String} one of the following option:
     *      "ATTELT" if only attribute elements are found (e.g. <@body>)
     *      "CONTENT" if only content elements are found (e.g. <div>)
     *      "INDEFINITE" if elements found can be either part of cpt att elts collection or content (e.g. blank text nodes)
     *      "ERROR" if attelts are mixed with content elements (in this case an error should be raised)
     */
    getCptContentType: function(nodes) {
        if (!nodes) {
            nodes=this.children;
        }
        if (!nodes) {
            return "INDEFINITE";
        }
        var ct, attFound=false, contentFound=false;
        for (var i=0,sz=nodes.length; sz>i;i++) {
            ct=nodes[i].getCptAttType();

            if (ct==="ATTELT") {
                attFound=true;
                if (contentFound) {
                    return "ERROR";
                }
            } else if (ct==="CONTENT") {
                contentFound=true;
                if (attFound) {
                    return "ERROR";
                }
            } else if (ct==="ERROR") {
                return "ERROR";
            }
        }
        if (attFound) {
            return "ATTELT";
        } else if (contentFound) {
            return "CONTENT";
        } else {
            return "INDEFINITE";
        }
    },

    /**
     * Recursively call the afterDOMInsert method in child nodes.
     */
    afterDOMInsert:function () {
        this.rendered = true;
        if (this.childNodes && this.childNodes.length > 0) {
            for (var i = 0; i < this.childNodes.length; i++) {
                this.childNodes[i].afterDOMInsert();
            }
        }
    }

});

/**
 * Simple attribute - used for static values
 */
var TSimpleAtt = klass({
    /**
     * Simple attribute constructor
     * @param {String} name the name of the attribute - e.g. "class" or "tabIndex"
     * @param {String} value the value of the attribute - e.g. "foo"
     */
    $constructor : function (name, value) {
        this.name = name;
        this.value = value;
    },

    getValue : function (eh, vscope, defvalue) {
        return this.value;
    },

    getExprValues: function(eh, vscope, defvalue) {
        return [this.value];
    }
});

/**
 * Expression-based attribute
 */
var TExpAtt = klass({
    /**
     * Simple attribute constructor
     * @param {String} name the name of the attribute - e.g. "class" or "tabIndex"
     * @param {Array} textcfg the content of the attribute - e.g. ["foo",1,"bar"] where odd items are string and even
     * items are expression ids
     */
    $constructor : function (name, textcfg) {
        this.name = name;
        this.textcfg = textcfg;
    },

    /**
     * Return the value of the attribute for a given context (scope and expression handler)
     */
    getValue : function (eh, vscope, defvalue) {
        var tcfg = this.textcfg, sz = tcfg.length, buf = [];

        // expressions used in custom components may return objects that should not be
        // concatenated to a string:
        if (sz === 2 && tcfg[0] === "") {
            // this is a single expression
            return eh.getValue(tcfg[1], vscope, defvalue);
        }

        for (var i = 0; sz > i; i++) {
            // odd elements are variables
            buf.push(i % 2 ? eh.getValue(tcfg[i], vscope, defvalue) : tcfg[i]);
        }

        return buf.join("");
    },

    /**
     * Returns an array of text values / evaluated expression values
     * @param eh
     * @param vscope
     * @param defvalue
     * @returns {Array}
     */
    getExprValues: function(eh, vscope, defvalue) {
        var textConfig = this.textcfg, result = [];
        for (var i = 0; i < textConfig.length; i++) {
            // odd elements are variables
            result.push(i % 2 ? eh.getValue(textConfig[i], vscope, defvalue) : textConfig[i]);
        }
        return result;
    }
});

/**
 * Expression-based Callback attribute
 */
var TCbAtt = klass({
    /**
     * Simple attribute constructor
     * @param {String} type the type of the event hanlder attribute - e.g. "click"
     * @param {Number} cbArg either the index of the associated callback expression (e.g. 2) or the code to execute in
     * case of HTML handler
     */
    $constructor : function (type, cbArg) {
        this.evtType = type;
        var isHtmlCallback = (typeof cbArg !== 'number');
        if (isHtmlCallback) {
            this.isHtmlCallback = true;
            this.htmlCb = cbArg;
        } else {
            this.expIdx = cbArg;
        }
    },

    /**
     * Executes the callback associated to this event handler This method is called by nodes registered as event
     * listeners through addEventListener
     */
    executeCb : function (evt, eh, vscope) {
        if (this.expIdx) {
            var cbExp = eh.getExpr(this.expIdx);
            if (cbExp) {
                return cbExp.executeCb(evt, eh, vscope);
            }
        }
    }
});

module.exports.TNode = TNode;
module.exports.TSimpleAtt = TSimpleAtt;
module.exports.TExpAtt = TExpAtt;
