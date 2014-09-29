
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
var klass = require("../klass"),
    log = require("./log"),
    doc = require("./document"),
    json = require("../json"),
    PropObserver = require("../propobserver"),
    tn = require("./tnode"),
    TNode = tn.TNode,
    cptComponent=require("./cptcomponent");

var CPT_TYPES={
    '$CptAttInsert':require("./cptattinsert").$CptAttInsert,
    '$CptComponent':cptComponent.$CptComponent,
    '$CptTemplate':require("./cpttemplate").$CptTemplate
};

var DOCUMENT_FRAGMENT_NODE = 11;

/**
 * Root node - created at the root of each template 
 * Contains the listeners requested by the child nodes 
 * Is replaced by the $CptNode (child class) when the template is inserted in another template
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
        var cw;
        this.vscope = vscope;
        if (ctlWrapper) {
            // attach the controller objects to the node
            this.ctlWrapper = cw = ctlWrapper;
            this.controller = ctlWrapper.cpt;

            // init controller attributes
            this.ctlWrapper.root=this;
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
        if (cw && !cw.nodeInstance) {
            cw.refresh(); // first refresh
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
        this.propObs=null;
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
     * @param {Object} scope the scope to be used (optional - default: ni.vscope, but is not ok for components)
     */
    createExpressionObservers : function (ni,scope) {
        var vs = scope? scope : ni.vscope, eh = ni.eh, op, sz;
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
                ni.obsPairs = op;
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
     * Removes the object observers associated to a node instance
     * @param {TNode} ni the node instance that contained the changes
     */
    rmAllObjectObservers : function (ni) {
        var op=ni.obsPairs;
        if (op) {
            for (var i = 0, sz=op.length; sz > i; i++) {
                // remove previous
                this.rmObjectObserver(ni, op[i][0], op[i][1]);
            }
            ni.obsPairs=null;
        }
    },

    /**
     * Update the object observers associated to a node instance
     * @param {TNode} ni the node instance that contained the changes
     */
    updateObjectObservers : function (ni) {
        if (ni.obsPairs) {
            this.rmAllObjectObservers(ni);
        }
        this.createExpressionObservers(ni);
    },

    /**
     * Dynamically update the value of one of the arguments used by the template The refresh() method must be called
     * once all updates are done to have the changes propagated in all the template (and sub-templates)
     * @param {integer} argidx the argument index in the template function - 0 is first argument
     * @param {any} argvalue the argument value
     */
    updateArgument : function (argidx, argvalue) {
        json.set(this.vscope["$scope"], this.argNames[argidx], argvalue);
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
                log.error("[hashspace] Template cannot be rendered - Invalid element id: "+domElt);
                return this;
            }
        } else if (!c || !c.appendChild) {
            log.error("[hashspace] Template cannot be rendered - Invalid element: "+domElt);
            return this;
        }
        var df = this.node; // should be a doc fragment
        if (df.nodeType !== DOCUMENT_FRAGMENT_NODE) {
            log.error("[hashspace] root element can only be appended once in the DOM");
        } else {
            if (replace !== false) {
                // remove previous content
                c.innerHTML = "";
            }
            c.appendChild(df);

            // recursively updates all reference to the previous doc fragment node
            this.replaceNodeBy(df, c);
        }
        this._triggersAfterRender(this);
        return this;
    },

    /**
     * Recursively triggers the $afterRender method in all controllers of the TNode root and its children.
     * @param {TNode} the root
     */
    _triggersAfterRender:function (tnode) {
        if (tnode.childNodes && tnode.childNodes.length > 0) {
            for (var i = 0; i < tnode.childNodes.length; i++) {
                this._triggersAfterRender(tnode.childNodes[i]);
            }
        }
        if (tnode.controller && tnode.controller.$afterRender) {
            tnode.controller.$afterRender();
        }
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
        // scope has priority over the global scope
        if (scope && sz>1) {
            o = scope[path[1]];
        }
        if (!o) {
            o = root;
        }
    }

    if (sz > 2) {
        for (var i = 2; sz > i; i++) {
            o = o[path[i]];
        }
    }
    return o;
};

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
        this.pathInfo=tplPath.slice(1).join("."); // debugging info
        this.info="[Component: #"+this.pathInfo+"]"; // debug info
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
        this.template = null; // reference to the template object (used by component and templates)
        if (children && children !== 0) {
            this.children = children;
        }
    },

    /**
     * Default dispose method
     * @param {Boolean} localPropOnly if true only local properties will be deleted (optional)
     *        must be used when a new instance is created to adapt to a path change
     */
    $dispose:function(localPropOnly) {
        this.cleanObjectProperties(localPropOnly);
    },

    /**
     * Removes object properties - helper for $dispose methods
     * @param {Boolean} localPropOnly if true only local properties will be deleted (optional)
     *        must be used when a new instance is created to adapt to a path change
     */
    cleanObjectProperties : function (localPropOnly) {
        this.removePathObservers();
        if (this._scopeChgeCb) {
            json.unobserve(this.vscope, this._scopeChgeCb);
            this._scopeChgeCb = null;
        }
        if (localPropOnly!==true) {
            $RootNode.$dispose.call(this);
        }
        this.exps = null;
        this.controller = null;
        this.ctlAttributes = null;
        this.template = null;
        if (this.node1) {
            this.node1=null;
            this.node2=null;
        }
    },

    /**
     * Create a node instance referencing the current node as base class As the $CptNode is DOMless it will not create a
     * DOM node for itself - but will create nodes for its children instead (through the $RootNode of the template
     * process function)
     * @return {TNode} the new node instance
     */
    createNodeInstance : function (parent,node1,node2) {
        var ni=null;

        // get the object referenced by the cpt path
        var p = this.getPathData(this.tplPath, parent.vscope), po=p.pathObject;

        // if object is a function this is a template or a component insertion
        if (po) {
            ni=this.createCptInstance(p.cptType, parent);
            ni.node1=node1;
            ni.node2=node2;

            if (p.cptType==="$CptAttInsert") {
                // this cpt is used to an insert another component passed as attribute 
                ni.initCpt(po);
            } else {
                // we are in a template or component cpt
                this.template=p.pathObject;
                ni.initCpt({template:po,ctlConstuctor:po.controllerConstructor});
            }
        }

        if (!ni) {
            log.error(this.info+" Invalid component reference");
            // create an element to avoid generating other errors
            ni=this.createCptInstance("$CptAttInsert",parent);
        }
        
        return ni;
    },

    /**
     * Calculates the object referenced by the path and the component type
     * @return {Object} object with the following properties:
     *        pathObject: {Object} the object referenced by the path
     *        cptType: {String} one of the following option: "$CptComponent", 
     *                 "$CptTemplate", "$CptAttInsert" or "InvalidComponent"
     */
    getPathData:function(path, vscope) {
        // determine the type of this component: 
        // - either a template - e.g. <#mytemplate foo="bar"/> 
        //   -> instance will extend $CptTemplate
        // - a component with controller - e.g. <#mycpt foo="bar"/>
        //   -> instance will extend $CptComponent
        // - or a attribute element insertion - e.g. <#c.body/>
        //   -> instance will extend $CptAttInsert

        var o = getObject(path, vscope), r={cptType:"InvalidComponent"};
        if (o) {
            r.pathObject=o;
            if (typeof(o) === 'function') {
                if (o.controllerConstructor) {
                    r.cptType="$CptComponent";
                } else {
                    r.cptType="$CptTemplate";
                }
            } else if (o.isCptAttElement) {
                r.cptType="$CptAttInsert";
            }
        }
        return r;
    },

    /**
     * Remove all child node instances bewteen node1 and node2
     */
    removeChildInstances:function() {
        if (!this.isDOMempty) {
          this.removeChildNodeInstances(this.node1,this.node2);
          this.isDOMempty = true;
        }
    },

    /**
     * Create and return an instance node associated to the component type passed as argument
     * The method dynamically creates a specialized $CptNode object that will be used as prototype
     * of the instance node - this allows to avoid mixing methods and keep code clear
     * @param cptType {string} one of the following: $CptAttInsert / $CptAttElement / $CptComponent / $CptTemplate
     */
    createCptInstance:function(cptType,parent) {
        // build the new type
        var proto1=CPT_TYPES[cptType];
        var ct = Object.create(this);
        for (var k in proto1) {
            if (proto1.hasOwnProperty(k)) {
                ct[k]=proto1[k];
            }
        }
        this.cptType=cptType;

        // create node instance
        var ni = Object.create(ct);
        ni.vscope = parent.vscope; // we don't create new named variable in vscope, so we use the same vscope
        ni.parent = parent;
        ni.nodeNS = parent.nodeNS;
        ni.root = parent.root;
        ni.root.createExpressionObservers(ni);
        ni.node = ni.parent.node;
        return ni;
    },

    /**
     * Create and append the node1 and node2 boundary nodes used to delimit the component content
     * in the parent node
     */
    createCommentBoundaries:function(comment) {
        // only create nodes if they don't already exist (cf. reprocessNodeInstance)
        if (!this.node1 && !this.node2) {
            var nd=this.node;
            this.node1 = doc.createComment("# "+comment+" "+this.pathInfo);
            this.node2 = doc.createComment("# /"+comment+" "+this.pathInfo);
            nd.appendChild(this.node1);
            nd.appendChild(this.node2);
        }
    },
    
    /**
     * Callback called when a controller attribute or a template attribute has changed
     */
    onAttributeChange : function (change) {
        var expIdx = -1;
        // set the new attribute value in the parent vscope to propagate change
        var cfg = this.attcfg[change.name]; // change.name is the property name
        if (cfg && cfg.constructor === Array && cfg.length === 2 && cfg[0] === "") {
            // cfg is a text concatenation with an empty prefix - so 2nd element is the expression index
            expIdx = cfg[1];
        }

        if (expIdx > -1) {
            var exp = this.eh.getExpr(expIdx), pvs=this.parent.vscope;
            if (exp.bound && exp.setValue) {
                var cv=exp.getValue(pvs,this.eh);
                if (cv!==change.newValue) {
                    // if current value is different, we update it on the scope object that owns it
                    exp.setValue(pvs, change.newValue);
                }
            }
        }
    },

    /**
     * Calculates if the current node instance must be replaced by another one
     * if component path changed
     * @return {Object} the new component instance or null if instance doesn't change
     */
    reprocessNodeInstance:function() {
        var p = this.getPathData(this.tplPath, this.parent.vscope);
        if (p.cptType === "InvalidComponent"|| p.cptType===this.cptType) {
            // component is not valid or nature hasn't changed
            return null;
        }

        // component nature has changed
        var parent=this.parent,
            ni=this.createNodeInstance(parent,this.node1,this.node2),
            cn = parent.childNodes;

        // replace current node with ni in the parent collection
        if (ni && cn) {
            for (var i = 0, sz = cn.length; sz > i; i++) {
                if (cn[i]===this) {
                    cn[i]=ni;
                    // dispose current object
                    this.$dispose(true);
                    return ni;
                }
            }
        }
        return null;
    },

    /**
     * Refresh the sub-template arguments and the child nodes, if needed
     */
    refresh : function () {
        if (this.adirty) {
            var newNode=this.reprocessNodeInstance();
            if (newNode) {
                // component type has changed so current node is obsolete and has been disposed
                newNode.refresh();
                return;
            }
            // one of the component attribute has been changed - we need to propagate the change
            // to the template controller

            // check first if template changed
            var tplChanged=false;
            if (this.template) {
                var tpl=getObject(this.tplPath, this.parent.vscope);
                tplChanged = (tpl!==this.template);
            } else if (this.cptAttElement) {
                // check if the cptattinsert path has changed
                var o=getObject(this.tplPath, this.parent.vscope);
                if (o.isCptAttElement && o!==this.cptAttElement) {
                    // change the the cptAttElement and refresh the DOM
                    this.createChildNodeInstances(o);
                }
            }

            if (tplChanged) {
                // check if component nature changed from template to component or opposite
                this.template=tpl;
                this.createChildNodeInstances();
            } else {
                if (this.refreshAttributes) {
                    this.refreshAttributes();
                    // for component and sub-templates the original vscope is substituted 
                    // to the one of the component- or sub-template
                    // so we need to revert to the parent scope to observe the correct objects
                    var vs=this.vscope;
                    this.vscope=this.parent.vscope;
                    this.root.updateObjectObservers(this);
                    this.vscope=vs;
                }
            }
            this.adirty = false;
        }
        TNode.refresh.call(this);
    },

    /**
     * Return the objects referenced by the path - return null if the path is not observable
     */
    getPathObjects : function() {
        var tp=this.tplPath, o, ps=this.parent.vscope, isType0String=(typeof(tp[0])==='string');

        if (ps[tp[1]]) {
            // tp[1] exists in the scope - so it has priority
            o=this.getScopeOwner(tp[1],ps);
        } else if (tp[0]===undefined || tp[0]===null || isType0String) {
            if (isType0String) {
                // we have to find the right scope object holding this property
                o=this.getScopeOwner(tp[0],ps);
                if (o===null) {
                    // property doesn't exist yet
                    o=ps;
                }
            } else {
                o=ps;
            }
        }
        if (o) {
            var sz=tp.length, res=[];
            res.push(o);

            for (var i=1;sz>i;i++) {
                o=o[tp[i]];
                if (o===undefined || o===null) {
                    return null;
                }
                res.push(o);
            }
            return res;
        }
        return null;
    },

    /**
     * Create observers to observe path changes
     * This method is usec by $CptTemplate and $CptComponent
     * @return {Boolean} true if the path can be observed
     */
    createPathObservers : function() {
        var pos=this.getPathObjects();
        if (!pos || !pos.length) {
            return false;
        }
        var sz=pos.length;

        this._pathChgeCb = this.onPathChange.bind(this);
    
        for (var i=0;sz>i;i++) {
            json.observe(pos[i], this._pathChgeCb);
        }
        this._observedPathObjects=pos;
        return true;
    },

    /**
     * Remove path observers created through createPathObservers()
     */
    removePathObservers : function() {
        var pos=this._observedPathObjects;
        if (pos && pos.length) {
            for (var i=0,sz=pos.length;sz>i;i++) {
                json.unobserve(pos[i], this._pathChgeCb);
            }
            this._observedPathObjects=null;
        }
        this._pathChgeCb = null;
    },

    /**
     * Callback called when one of the object of the template path changes
     */
    onPathChange : function() {
        // Warning: this method may be called even if the object referenced by the path didn't change
        // because we observe all the properties of the object on the path - so we need to detect
        // first if one of the objects on the path really changed
        if (!this.parent && !this.root) {
            return; // object has been disposed, but notification callback is still in the call stack
        }
        var pos = this.getPathObjects(), opos=this._observedPathObjects;
        var sz = pos? pos.length : -1;
        var osz = opos? opos.length : -1;
        var changed=false;
        if (sz===osz && sz!==-1) {
            // compare arrays
            for (var i=0;sz>i;i++) {
                if (pos[i]!==opos[i]) {
                    changed=true;
                    break;
                }
            }
        } else if (sz!==-1) {
            changed=true;
        }
        if (changed) {
            this.removePathObservers();
            this.createPathObservers();
            this.onPropChange(); // set node dirty
        }
    },

    /**
     * Return the collection of template arguments
     * Used by $CptTemplate and $CptComponent instances
     */
    getTemplateArguments: function() {
        var args = {};
        if (this.atts) {
            var att, pvs = this.parent.vscope;
            for (var i = 0, sz = this.atts.length; sz > i; i++) {
                att = this.atts[i];
                args[att.name] = att.getValue(this.eh, pvs, null);
            }
        }
        return args;
    }
});

/**
 * Component attribute nodes contains attribute elements for the parent component
 */
var $CptAttElement = klass({
    $extends : $CptNode,
    isCptAttElement : true,

    /**
     * $CptAttElement generator 
     */
    $constructor : function (name, exps, attcfg, ehcfg, children) {
        this.name = name;
        this.info = "[Component attribute element: @"+this.name+"]";
        this.tagName = "@"+name;
        $CptNode.$constructor.call(this,[null,name], exps, attcfg, ehcfg, children);
        this.isCptAttElement=true;
    },

    $dispose:function() {
        TNode.$dispose.call(this);
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
        return "ATTELT";
    },

    createNodeInstance : function (parent) {
        var ni;
        // identify this node as a component attribute

        // find parent to check attribute is not used outside any component
        var p=parent, found=false;
        while (p) {
            if (p.isCptComponent) {
                found=true;
                var eltDef=null, attDef=null;
                if (p.ctlElements) {
                    eltDef=p.ctlElements[this.name];
                }
                if (p.ctlAttributes) {
                    attDef=p.ctlAttributes[this.name];
                }
                
                if (!eltDef && !attDef) {
                    // invalid elt
                    log.error(this.info+" Element not supported by its parent component");
                } else if (eltDef) {
                    var type=eltDef.type;
                    if (type==="template") {
                        ni=TNode.createNodeInstance.call(this,parent);
                    } else if (type==="component") {
                        if (!eltDef.controller) {
                            log.error(this.info+" Controller property is mandatory for component elements");
                        } else {
                            // this element is a sub-component - let's create its controller
                            ni=this.createCptInstance("$CptComponent",parent);
                            ni.initCpt({cptattelement:ni,ctlConstuctor:eltDef.controller,parentCtrl:p.controller});
                        }
                    } else {
                        log.error(this.info+" Invalid component element type: "+eltDef.type);
                    }
                } else if (attDef) {
                    if (attDef.type==="template") {
                        ni=TNode.createNodeInstance.call(this,parent);
                    }
                }
                p=null;
            } else {
                p=p.parent;
            }
        }
        if (!found) {
            log.error(this.info+" Attribute elements cannot be used outside components");
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
    }
});

cptComponent.setDependency("$CptNode",$CptNode);
cptComponent.setDependency("TNode",TNode);
cptComponent.setDependency("$CptAttElement",$CptAttElement);
exports.$RootNode = $RootNode;
exports.$CptNode = $CptNode;
exports.$CptAttElement = $CptAttElement;

