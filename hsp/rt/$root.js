
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

var klass=require("hsp/klass"),
	doc=require("hsp/document"),
	json=require("hsp/json"),
	PropObserver=require("hsp/propobserver"),
	tn=require("hsp/rt/tnode"),
	TNode=tn.TNode;

var DOCUMENT_FRAGMENT_NODE=11;

/**
 * Root node - created at the root of each template
 * Contains the listeners requested by the child nodes
 * Is replaced by the $InsertNode (child class) when the template is inserted in another template
 */
var $RootNode = klass({
	$extends:TNode,

	/**
	 * Create the root node that will reference a new set of node instances for a new template instance
	 * @param {} vscope the variable scope tree (optional for sub-classes)
	 * @param {Array|TNode} nodedefs the list of the node generators associated to the template
	 *			(will be used to recursively generate the child nodes) (optional for sub-classes)
	 * @param {Array} argnames the list of the template argument names (optional) - e.g. ["vscope","nodedefs","argnames"]
	 */
	$constructor:function(vscope, nodedefs, argnames) {
		if (this.isInsertNode){
			TNode.$constructor.call(this,this.exps);
		} else {
			TNode.$constructor.call(this,0);
			var df=doc.createDocumentFragment();
			this.node=df;
			this.root=this;
		}
		
		// meta-data name for the observer id that will be stored on the target objects
		this.MD_ID=klass.createMetaDataPrefix()+"oid";
		this.propObs=[];
		this.argNames=null;

		if (vscope || nodedefs || argnames) {
			this.init(vscope, nodedefs, argnames);
		}
	},

	/**
	 * Initialize the root node
	 * @param {} vscope the variable scope tree
	 * @param {Array|TNode} nodedefs the list of the node generators associated to the template
	 *			(will be used to recursively generate the child nodes)
	 * @param {Array} argnames the list of the template argument names (optional) - e.g. ["vscope","nodedefs","argnames"]
	 */
	init:function(vscope, nodedefs, argnames) {
		this.vscope=vscope;
		var ch=[];
		if (nodedefs.constructor===Array) {
			for (var i=0,sz=nodedefs.length;sz>i;i++) {
				ch.push(nodedefs[i].createNodeInstance(this))
			}
		} else {
			ch[0]=nodedefs.createNodeInstance(this);
		}
		this.childNodes=ch;
		this.argNames=argnames;
	},

	$dispose:function() {
		// dispose all property observers
		var o;
		for (var i=0, sz=this.propObs.length;sz>i;i++) {
			o=this.propObs[i];
			delete o.target[this.MD_ID]; // remove the MD marker
			o.$dispose();
		}
		delete this.propObs;

		TNode.$dispose.call(this);
	},

	/**
	 * Create listeners for the variables associated to a specific node instance
	 * @param {TNode} ni the node instance that should be notified of the changes
	 */
	createExpressionObservers:function(ni) {
		var e, vs=ni.vscope, eh=ni.eh;
		if (!eh) return; // no expression is associated to this node
		for (var k in eh.exps) {
			e=eh.exps[k];
			if (e.bound===true) {
				// create or reuse prop observer for this expression
				var nm=e.onm? e.onm : e.root;
				var t=vs[nm]; // target object
				if (!t) continue;
				var pp=e.pnm? e.pnm : e.path[0];
				this.createObjectObserver(ni,t,pp);			
			}
		}
	},

	/**
	 * Create or update a PropObserver for one or several property
	 * @param {TNode} ni the node instance that should be notified of the changes (i.e. the observer)
	 * @param {Object} obj the object holding the property
	 * @param {String} prop the property name (optional)
	 */
	createObjectObserver:function(ni,obj,prop) {
		var oid=obj[this.MD_ID]; // observer id
		if (oid) {
			// observer already exists
			obs=this.propObs[oid-1];
		} else {
			// observer doesn't exist yet
			obs=new PropObserver(obj);
			sz=this.propObs.length;
			this.propObs[sz]=obs;
			obs.id=oid=sz+1; // so that it doesn't start at 0
			obj[this.MD_ID]=oid;
		}
		obs.addObserver(ni,prop); // observe all properties
	},

	/**
	 * Remove a PropObserver previously created with createObjectObserver
	 * @param {TNode} ni the node instance that should be notified of the changes (i.e. the observer)
	 * @param {Object} obj the object holding the property
	 * @param {String} prop the property name (optional)
	 */
	rmObjectObserver:function(ni,obj,prop) {
		var oid=obj[this.MD_ID]; // observer id
		if (oid) {
			// observer exists
			obs=this.propObs[oid-1];
			obs.rmObserver(ni,prop);
		}
	},

	/**
	 * Dynamically update the value of one of the arguments used by the template
	 * The refresh() method must be called once all updates are done to have the changes
	 * propagated in all the template (and sub-templates)
	 * @param {integer} argidx the argument index in the template function - 0 is first argument
	 * @param {any} argvalue the argument value
	 */
	updateArgument:function(argidx, argvalue) {
		json.set(this.vscope["#scope"], this.argNames[argidx], argvalue);
	},

	/**
	 * Append this root element to the DOM
	 * @param {DOMElement} domElt the DOM element to which the template will be appended through the appendChild DOMElement method
	 */
	appendToDOM:function(domElt) {
		var df=this.node; // should be a doc fragment
		if (df.nodeType !== DOCUMENT_FRAGMENT_NODE) {
			console.log("[hashspace] root element can only be appended once in the DOM");
		} else {
			domElt.appendChild(df);	
			
			// recursively updates all reference to the previous doc fragment node
			this.replaceNodeBy(df,domElt);
		}
	}	
});

/**
 * Insert node
 * Allows to insert the content generated by another template
 */
var $InsertNode = klass({
	$extends:$RootNode,

	/**
	 * $InsertNode generator
	 * @param {Map<Expression>|int} exps the map of the expressions used by the node. 
	 *   0 is passed if no  expression is used 
	 * @param {Function} tplfn the template function that should be called
	 * @param {Array} args the array of arguments to pass to the template. Warning: each argument uses 2 items in 
	 * 		this array: the odd item is eiter 0 or 1: 0=arg is a literal value / 1=arg is an expression
	 *                  the even item is the argument value (i.e. value or expression index)
	 */
	$constructor:function(exps, expIdx) {
		this.isInsertNode=true;
		this.isDOMless=true;
		this.exps=exps; // used by the $RootNode constructor 
		$RootNode.$constructor.call(this);
		this.expIdx=expIdx;
	},

	$dispose:function() {
		$RootNode.$dispose.call(this);
		delete this.tplfunction;
		delete this.exps;
	},

	/**
	 * Create a node instance referencing the current node as base class
	 * As the $InsertNode is DOMless it will not create a DOM node for itself - but will create
	 * nodes for its children instead (through the $RootNode of the template process function)
	 * @return {TNode} the new node instance
	 */
	createNodeInstance:function(parent) {
		var ni=TNode.createNodeInstance.call(this,parent);

		var v=ni.eh.getValue(ni.expIdx, ni.vscope, null);
		if (v && v.fn) {
			ni.func=v.fn;
			ni.tplArgs=v.args;
			
			ni.isTemplate=(ni.func.isTemplate===true)
			if (ni.isTemplate) {
				// sub-template insertion
				ni.func.apply(ni,ni.getArguments());
			} else {
				// JS function call
				// so we have to manage a text node instead of a sub-template
				ni.isDOMless=false;
				ni.node=doc.createTextNode(ni.getContent());
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
	getArguments:function() {
		var tplArgs=this.tplArgs, args=[], eh=this.eh;
		for (var i=0, sz=tplArgs.length;sz>i;i+=2) {
			if (tplArgs[i]) {
				// arg is an expression
				args.push(eh.getValue(tplArgs[i+1], this.vscope, null));
			} else {
				// arg is a literal value
				args.push(tplArgs[i+1]);
			}
		}
		return args;
	},

	/**
	 * Calculates the content of the insert text node when it is not a sub-template
	 */
	getContent:function() {
		if (!this.isTemplate) {
			return this.func.apply({},this.getArguments());
		}
		return "";
	},

	/**
	 * Refresh the sub-template arguments and the child nodes, if needed
	 */
	refresh:function() {
		if (this.adirty) {
			// the variables of the insert statement have changed
			// (i.e. the arguments of the sub-templates)
			// so we have to update the vscope of the sub-template (which is different from the vscope of the parent's node)
			
			if (this.isTemplate) {
				var pscope=this.parent.vscope; // parent scope used to determine the new arguments values
				var tplArgs=this.tplArgs, eh=this.eh;
				for (var i=0, idx=0, sz=tplArgs.length;sz>i;i+=2, idx++) {
					if (tplArgs[i]) {
						// arg is an expression
						this.updateArgument(idx,eh.getValue(tplArgs[i+1], pscope, null));
					}
				}
			} else {
				// is JS function
				this.node.nodeValue=this.getContent();
			}
			this.adirty=false;
		}
		TNode.refresh.call(this);
	}
});

module.exports.$RootNode=$RootNode;
module.exports.$InsertNode=$InsertNode;
