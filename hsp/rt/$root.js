
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

// This module contains the $Root and $Insert nodes used to instantiate new templates

var klass = require("hsp/klass");
var doc = require("hsp/document");
var json = require("hsp/json");
var PropObserver = require("hsp/propobserver");
var tn = require("hsp/rt/tnode");
var TNode = tn.TNode;
var cptComponent=require("hsp/rt/cptcomponent");

var CPT_TYPES={
    '$CptAttInsert':require("hsp/rt/cptattinsert").$CptAttInsert,
    '$CptComponent':cptComponent.$CptComponent,
    '$CptTemplate':require("hsp/rt/cpttemplate").$CptTemplate
};

var DOCUMENT_FRAGMENT_NODE = 11;

/**
 * Root node - created at the root of each template Contains the listeners requested by the child nodes Is replaced by
 * the $InsertNode (child class) when the template is inserted in another template
 */
var $RootNode = klass({
    $extends : TNode,

    /**
     * Create the root node that will reference a new set of node instances for a new template instance
     * @param {} vscope the variable scope tree (optional for sub-classes)
     * @param {Array|TNode} nodedefs the list of the node generators associated to the template (will be used to
     * recursively generate the child nodes) (optional for sub-classes)
     * @param {Array} argnames the list of the template argument names (optional) - e.g.
     * ["vscope","nodedefs","argnames"]
     * @param {Object} ctlWrapper the controller observer - if any
     * @param {Map} ctlInitAtts the init value of the controller attributes (optional) - e.g.
     * {value:'123',mandatory:true}
     */
    $constructor : function (vscope, nodedefs, argnames, ctlWrapper, ctlInitAtts) {
        if (this.isInsertNode) {
            TNode.$constructor.call(this, this.exps);
        } else {
            TNode.$constructor.call(this, 0);
            var df = doc.createDocumentFragment();
            this.node = df;
            this.root = this;
        }

        // meta-data name for the observer id that will be stored on the target objects
        this.MD_ID = klass.createMetaDataPrefix() + "oid";
        this.propObs = [];
        this.argNames = null;

        if (vscope || nodedefs || argnames || ctlWrapper) {
            this.init(vscope, nodedefs, argnames, ctlWrapper, ctlInitAtts);
        }
    },

    /**
     * Initialize the root node
     * @param {} vscope the variable scope tree
     * @param {Array|TNode} nodedefs the list of the node generators associated to the template (will be used to
     * recursively generate the child nodes)
     * @param {Array} argnames the list of the template argument names (optional) - e.g.
     * ["vscope","nodedefs","argnames"]
     * @param {Object} ctlWrapper the controller observer - if any
     * @param {Map} ctlInitAtts the init value of the controller attributes (optional) - e.g.
     * {value:'123',mandatory:true}
     */
    init : function (vscope, nodedefs, argnames, ctlWrapper, ctlInitAtts) {
        this.vscope = vscope;
        if (ctlWrapper) {
            // attach the controller objects to the node
            this.ctlWrapper = ctlWrapper;
            this.controller = ctlWrapper.cpt;

            // init controller attributes
            this.ctlWrapper.init(ctlInitAtts);
        } else if (this.$constructor === $CptNode) {
            // this is a template insertion - we need to init the vscope
            if (ctlInitAtts) {
                for (var k in ctlInitAtts) {
                    vscope[k] = ctlInitAtts[k];
                }
            }
        }
        var ch = [];
        if (nodedefs.constructor === Array) {
            for (var i = 0, sz = nodedefs.length; sz > i; i++) {
                ch.push(nodedefs[i].createNodeInstance(this));
            }
        } else {
            ch[0] = nodedefs.createNodeInstance(this);
        }
        this.childNodes = ch;
        this.argNames = argnames;
    },

    $dispose : function () {
        // dispose all property observers
        var o;
        for (var i = 0, sz = this.propObs.length; sz > i; i++) {
            o = this.propObs[i];
            delete o.target[this.MD_ID]; // remove the MD marker
            o.$dispose();
        }
        delete this.propObs;
        if (this.ctlWrapper) {
            this.ctlWrapper.$dispose();
            this.ctlWrapper = null;
            this.controller = null;
        }
        TNode.$dispose.call(this);
    },

    /**
     * Create listeners for the variables associated to a specific node instance
     * @param {TNode} ni the node instance that should be notified of the changes
     */
    createExpressionObservers : function (ni) {
        var vs = ni.vscope, eh = ni.eh, op, sz;
        if (!eh)
            return; // no expression is associated to this node
        for (var k in eh.exps) {
            op = eh.exps[k].getObservablePairs(eh, vs);
            if (!op)
                continue;
            sz = op.length;
            if (sz === 1) {
                this.createObjectObserver(ni, op[0][0], op[0][1]);
            } else {
                for (var i = 0; sz > i; i++) {
                    this.createObjectObserver(ni, op[i][0], op[i][1]);
                }
            }
        }
    },

    /**
     * Create or update a PropObserver for one or several property
     * @param {TNode} ni the node instance that should be notified of the changes (i.e. the observer)
     * @param {Object} obj the object holding the property
     * @param {String} prop the property name (optional)
     */
    createObjectObserver : function (ni, obj, prop) {
        var oid = obj[this.MD_ID], obs; // observer id
        if (oid) {
            // observer already exists
            obs = this.propObs[oid - 1];
        } else {
            // observer doesn't exist yet
            obs = new PropObserver(obj);
            var sz = this.propObs.length;
            this.propObs[sz] = obs;
            obs.id = oid = sz + 1; // so that it doesn't start at 0
            obj[this.MD_ID] = oid;
        }
        obs.addObserver(ni, prop); // observe all properties
    },

    /**
     * Remove a PropObserver previously created with createObjectObserver
     * @param {TNode} ni the node instance that should be notified of the changes (i.e. the observer)
     * @param {Object} obj the object holding the property
     * @param {String} prop the property name (optional)
     */
    rmObjectObserver : function (ni, obj, prop) {
        var oid = obj[this.MD_ID]; // observer id
        if (oid) {
            // observer exists
            var obs = this.propObs[oid - 1];
            obs.rmObserver(ni, prop);
        }
    },

    /**
     * Dynamically update the value of one of the arguments used by the template The refresh() method must be called
     * once all updates are done to have the changes propagated in all the template (and sub-templates)
     * @param {integer} argidx the argument index in the template function - 0 is first argument
     * @param {any} argvalue the argument value
     */
    updateArgument : function (argidx, argvalue) {
        json.set(this.vscope["#scope"], this.argNames[argidx], argvalue);
    },

    /**
     * Append this root element to the DOM
     * @param {DOMElement|String} domElt the DOM element to which the template will be appended through the appendChild
     * DOMElement method
     * @param {string|DOMElement} container the HTML container element or its id
     * @param {Boolean} replace if true, the template result will replace the element content - otherwise it will be
     * appended (default: true)
     * @return {$RootNode} the current node to be able to chain actions
     */
    render : function (domElt, replace) {
        var c = domElt; // container
        if (typeof(c) === "string") {
            c = doc.getElementById(c);
            if (c === null) {
                console.error("[hashspace] Template cannot be rendered - Invalid element id: "+domElt);
                return this;
            }
        } else if (!c || !c.appendChild) {
            console.error("[hashspace] Template cannot be rendered - Invalid element: "+domElt);
            return this;
        }
        var df = this.node; // should be a doc fragment
        if (df.nodeType !== DOCUMENT_FRAGMENT_NODE) {
            console.log("[hashspace] root element can only be appended once in the DOM");
        } else {
            if (replace !== false) {
                // remove previous content
                c.innerHTML = "";
            }
            c.appendChild(df);

            // recursively updates all reference to the previous doc fragment node
            this.replaceNodeBy(df, c);
        }
        return this;
    }
});

/**
 * Return the object referenced by the path given as argument
 * @param path {Array} an array giving the path of the object. The first element can be undefined or can be the
 * reference to the root path object in the original context - e.g. [lib,"lib","NbrField"]. If the first element is null
 * or undefined, the path should be extracted from the scope object
 * @param scope {Object} the scope object from with the object should be extracted if the first path element is not
 * defined
 */
var getObject = exports.getObject = function (path, scope) {
    var root = path[0], o = null, sz = path.length;
    if (root === undefined || root === null || typeof(root)==='string') {
        if (scope && sz > 1) {
            o = scope[path[1]];
        }
        if (o === undefined || o === null) {
            return null;
        }
    } else {
        o = root;
    }

    if (sz > 2) {
        for (var i = 2; sz > i; i++) {
            o = o[path[i]];
        }
    }
    return o;
};

/**
 * Insert node Allows to insert the content generated by another template
 */
var $InsertNode = klass({
    $extends : $RootNode,

    /**
     * $InsertNode generator
     * @param {Map<Expression>|int} exps the map of the expressions used by the node. 0 is passed if no expression is
     * used
     * @param {int} the index of the expression referencing the template
     */
    $constructor : function (exps, expIdx) {
        this.isInsertNode = true;
        this.isDOMless = true;
        this.exps = exps; // used by the $RootNode constructor
        $RootNode.$constructor.call(this);
        this.expIdx = expIdx;
    },

    $dispose : function () {
        $RootNode.$dispose.call(this);
        delete this.exps;
    },

    /**
     * Create a node instance referencing the current node as base class As the $InsertNode is DOMless it will not
     * create a DOM node for itself - but will create nodes for its children instead (through the $RootNode of the
     * template process function)
     * @return {TNode} the new node instance
     */
    createNodeInstance : function (parent) {
        var ni = TNode.createNodeInstance.call(this, parent);

        // get the expression associated to the insert node
        var v = ni.eh.getExpr(ni.expIdx);
        if (v && v.getFuncRef) {
            // get the function reference used by the insert expression
            v = v.getFuncRef(ni.vscope, null);

            ni.func = v.fn;
            ni.tplArgs = v.args;

            ni.isTemplate = (ni.func.isTemplate === true);
            if (ni.isTemplate) {
                // sub-template insertion
                ni.func.apply(ni, ni.getArguments());
            } else {
                // JS function call
                // so we have to manage a text node instead of a sub-template
                ni.isDOMless = false;
                ni.node = doc.createTextNode(ni.getContent());
                ni.parent.node.appendChild(ni.node);
            }

        } else {
            console.log("[$InsertNode] Invalid template function");
        }

        return ni;
    },

    /**
     * Calculates and return the insert arguments in the current vscope
     */
    getArguments : function () {
        var tplArgs = this.tplArgs, args = [], eh = this.eh;
        for (var i = 0, sz = tplArgs.length; sz > i; i += 2) {
            if (tplArgs[i]) {
                // arg is an expression
                args.push(eh.getValue(tplArgs[i + 1], this.vscope, null));
            } else {
                // arg is a literal value
                args.push(tplArgs[i + 1]);
            }
        }
        return args;
    },

    /**
     * Calculates the content of the insert text node when it is not a sub-template
     */
    getContent : function () {
        if (!this.isTemplate) {
            return this.func.apply({}, this.getArguments());
        }
        return "";
    },

    /**
     * Refresh the sub-template arguments and the child nodes, if needed
     */
    refresh : function () {
        if (this.adirty) {
            // the variables of the insert statement have changed
            // (i.e. the arguments of the sub-templates)
            // so we have to update the vscope of the sub-template (which is different from the vscope of the parent's
            // node)

            if (this.isTemplate) {
                var pscope = this.parent.vscope; // parent scope used to determine the new arguments values
                var tplArgs = this.tplArgs, eh = this.eh;
                for (var i = 0, idx = 0, sz = tplArgs.length; sz > i; i += 2, idx++) {
                    if (tplArgs[i]) {
                        // arg is an expression
                        this.updateArgument(idx, eh.getValue(tplArgs[i + 1], pscope, null));
                    }
                }
            } else {
                // is JS function
                this.node.nodeValue = this.getContent();
            }
            this.adirty = false;
        }
        TNode.refresh.call(this);
    }
});

/**
 * Component node Allows to insert the content generated by a component template
 */
var $CptNode = klass({
    $extends : $RootNode,

    /**
     * $CptNode generator CptNode can be seen as a mix of InsertNode and EltNode
     * @param {Array} tplPath path to the template object - e.g. [lib,"lib","mytpl"] cf. getObject()
     * @param {Map<Expression>|int} exps the map of the expressions used by the node. 0 is passed if no expression is
     * used
     * @param {Map} attcfg map of the different attributes used on the container e.g. {"title":"Hello!"} - cf attribute
     * objects for more info
     * @param {Map} ehcfg map of the different event hanlder used on the element e.g. {"onclick":1} - where 1 is the
     * expression index associated to the event hanlder callback
     * @param {Array} children list of child node generators - correponding to pseudo components and attribute content
     */
    $constructor : function (tplPath, exps, attcfg, ehcfg, children) {
        this.isCptNode = true;
        this.attEltNodes = null; // array of element nodes - used to trigger a refresh when elt content changes
        this.tplPath = tplPath;
        this.isInsertNode = true; // to ensure $RootNode is creating expression listeners
        this.isDOMless = true;
        this.exps = exps; // used by the $RootNode constructor
        this.attcfg = attcfg;
        $RootNode.$constructor.call(this);
        this.createAttList(attcfg, ehcfg);
        this.controller = null; // different for each instance
        this.ctlAttributes = null;// reference to the controller attributes definition - if any
        this._scopeChgeCb = null; // used by component w/o any controller to observe the template scope
        if (children && children !== 0) {
            this.children = children;
        }
    },

    $dispose:function() {
        this.cleanObjectProperties();
    },

    cleanObjectProperties : function () {
        if (this._scopeChgeCb) {
            json.unobserve(this.vscope, this._scopeChgeCb);
            this._scopeChgeCb = null;
        }
        $RootNode.$dispose.call(this);
        this.exps = null;
        this.controller = null;
        this.ctlAttributes = null;
    },

    /**
     * Create a node instance referencing the current node as base class As the $CptNode is DOMless it will not create a
     * DOM node for itself - but will create nodes for its children instead (through the $RootNode of the template
     * process function)
     * @return {TNode} the new node instance
     */
    createNodeInstance : function (parent) {
      var ni=null, vscope=parent.vscope, tp=this.tplPath;

      // determine the type of this component: 
      // - either a template - e.g. <#mytemplate foo="bar"/> 
      //   -> instance will extend $CptTemplate
      // - a component with controller - e.g. <#mycpt foo="bar"/>
      //   -> instance will extend $CptComponent
      // - or a attribute element insertion - e.g. <#c.body/>
      //   -> instance will extend $CptAttInsert

      // get the object referenced by the cpt path
      var obj = getObject(tp, vscope);

      // if object is a function this is a template or a component insertion
      if (obj && typeof(obj) === 'function') {
        if (obj.controllerConstructor) {
          // template uses a controller
          ni=this.createCptInstance("$CptComponent",parent);
        } else {
          ni=this.createCptInstance("$CptTemplate",parent);
        }
        ni.initCpt(obj,$RootNode);
      } else if (obj) {
        if (obj.isCptAttElement) {
          // insert attribute component 
          ni=this.createCptInstance("$CptAttInsert",parent);
          ni.initCpt(obj);
        }
      }

      if (!ni) {
          throw new Error(this+" Invalid component reference");
      }
      return ni;
    },

    /**
     * Create and return an instance node associated to the component type passed as argument
     * The method dynamically creates a specialized $CptNode object that will be used as prototype
     * of the instance node - this allows to avoid mixing methods and keep code clear
     * @param cptType {string} one of the following: $CptAttInsert / $CptAttElement / $CptComponent / $CptTemplate
     */
    createCptInstance:function(cptType,parent) {
        if (!this.cptTypes) {
            this.cptTypes={};
        }
        var ct=this.cptTypes[cptType];
        if (!ct) {
            // build the new type
            var proto1=CPT_TYPES[cptType];
            var proto2 = klass.createObject(this);
            for (var k in proto1) {
                if (proto1.hasOwnProperty(k)) {
                    proto2[k]=proto1[k];
                }
            }

            ct=proto2;
            this.cptTypes[cptType]=ct;
        }

        // create node instance
        var ni=klass.createObject(ct);
        ni.vscope = parent.vscope; // we don't create new named variable in vscope, so we use the same vscope
        ni.parent = parent;
        ni.nodeNS = parent.nodeNS;
        ni.root = parent.root;
        ni.root.createExpressionObservers(ni);
        ni.node = ni.parent.node;
        return ni;
    },
    
    /**
     * Callback called when a controller attribute or a template attriute has changed
     */
    onAttributeChange : function (change) {
        var expIdx = -1;
        // set the new attribute value in the parent scope to propagate change
        var cfg = this.attcfg[change.name]; // change.name is the property name
        if (cfg && cfg.constructor === Array && cfg.length === 2 && cfg[0] === "") {
            // cfg is a text concatenation with an empty prefix - so 2nd element is the expression index
            expIdx = cfg[1];
        }

        if (expIdx > -1) {
            var exp = this.eh.getExpr(expIdx);
            if (exp.bound && exp.setValue) {
                exp.setValue(this.parent.vscope, change.newValue);
            }
        }
    },

    /**
     * Refresh the sub-template arguments and the child nodes, if needed
     */
    refresh : function () {
        if (this.adirty) {
            // one of the component attribute has been changed - we need to propagate the change
            // to the template controller
            if (this.refreshAttributes) {
                this.refreshAttributes();
            }
            this.adirty = false;
        }
        TNode.refresh.call(this);
    },

    /**
    * Helper function used to give contextual error information
    * @return {String} - e.g. "[Component: #foo.bar]"
    */
    toString:function() {
        return "[Component: #"+this.tplPath.slice(1).join(".")+"]";
    }
});

/**
 * Component attribute nodes contains attribute elements for the parent component
 */
var $CptAttElement = klass({
    $extends : TNode,
    isCptAttElement : true,

    /**
     * $CptAttElement generator 
     */
    $constructor : function (name, exps, attcfg, ehcfg, children) {
        this.name = name;
        this.isDOMless = true;
        this.attcfg = attcfg;
        TNode.$constructor.call(exps);
        this.createAttList(attcfg, ehcfg);
        if (children && children !== 0) {
            this.children = children;
        }
    },

    $dispose:function() {
        TNode.$dispose.call(this);
    },

    /**
     * Tell this node can be found in a component content 
     * other (if false) the component will generate the default component content element
     */
    isValidCptAttElement:function () {
        return true;
    },

    createNodeInstance : function (parent) {
        var ni=TNode.createNodeInstance.call(this,parent);
        // identify this node as a component attribute

        // find parent to check attribute is not used outside any component
        var p=parent, found=false;
        while (p) {
            if (p.isCptComponent) {
                p=null;
                found=true;
            } else {
                p=p.parent;
            }
        }
        if (!found) {
            console.error(this+" Attribute elements cannot be used outside components");
        }
        return ni;
    },

    /**
     * Register the element in the list passed as argument
     * This allows for the component to dynamically rebuild the list of its attribute elements
     */
    registerAttElements:function (attElts) {
        attElts.push(this);
    },

    /**
     * Return the template node that must be inserted by $CptAttInsert
     */
    getTemplateNode:function() {
        return new $RootNode(this.vscope, this.children);
    },

    /**
    * Helper function used to give contextual error information
    * @return {String} - e.g. "[Component attribute element: @body]"
    */
    toString:function() {
        return "[Component attribute element: @"+this.name+"]";
    }
});

cptComponent.setDependency("$CptNode",$CptNode);
cptComponent.setDependency("TNode",TNode);
cptComponent.setDependency("$CptAttElement",$CptAttElement);
module.exports.$RootNode = $RootNode;
module.exports.$InsertNode = $InsertNode;
module.exports.$CptNode = $CptNode;
module.exports.$CptAttElement = $CptAttElement;

