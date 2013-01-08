
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

var klass=require("hsp/klass"),
	ExpHandler=require("hsp/exphandler");

/**
 * Template node - base class of all nodes
 */
var TNode=klass({
	node:null,		// reference to the DOM node object - will be defined on each node instance
	vscope:null,	// variable scope - will be defined on each node instance
	root:null,		// reference to the root TNode
	parent:null,	// parent TNode
	children:null,	// array of child node generators
	childNodes:null,// array of child node instances
	adirty:false,	// true if some of the node attributes need to be refreshed
	cdirty:false,	// true if the node contains dirty sub-nodes

	$constructor:function(exps) {
		this.isStatic=(exps===0);
		if (!this.isStatic) {
			// create ExpHandler
			this.eh=new ExpHandler(exps);
		}
	},

	/**
	 * Safely remove all cross references
	 */
	$dispose:function() {
		var cn=this.childNodes;
		if (cn) {
			// recursively dispose child nodes
			for (var i=0, sz=cn.length;sz>i;i++) {
				cn[i].$dispose();
			}
			delete this.childNodes;
		}

		delete this.node;
		delete this.parent;
		delete this.root;
		delete this.vscope;
		delete this.children;
	},

	/**
	 * create and return an array of attribute objects from the attcfg passed as argument
	 * @param {object} attcfg the attribute configuration - e.g. {"title":"test2","class":["t2",1],"tabIndex":["",2]}
	 */
	createAttList:function(attcfg) {
		if (attcfg===null || attcfg===0) return null;
		var atts=[], itm;
		for (var k in attcfg) {
			if (attcfg.hasOwnProperty(k)) {
				itm=attcfg[k];
				if (typeof(itm)=="string") {
					atts.push(new TSimpleAtt(k,itm));
				} else if (itm.constructor===Array) {
					// attribute using a txtcfg structure to reference expressions
					atts.push(new TExpAtt(k,itm));
				} else {
					// unsupported attribute
					console.log("[TNode] unsupported attribute: "+itm)
				}
			}
		}
		return atts;
	},

	/**
	 * Observer callback called when one of the bound variables used by the node
	 * expressions changes
	 */ 
	onPropChange:function(chge) {
		// set attribute dirty to true
		this.adirty=true;

		// mark parent node as containining dirty children (cdirty)

		var n=this.parent;
		while(n) {
			if (n.cdirty) {
				// already dirty - stop loop
				n=null;
			} else {
				n.cdirty=true;
				n=n.parent;
			}
		}
	},

	/**
	 * Create a node instance referencing the current node as base class
	 * Create as well the DOM element that will be appended to the parent node DOM element
	 * @return {TNode} the new node instance
	 */
	createNodeInstance:function(parent) {
		// create node instance referencing the current node as parent in the prototype chain
		var ni=klass.createObject(this);
		ni.vscope=parent.vscope; // we don't create new named variable in vscope, so we use the same vscope
		ni.parent=parent;
		ni.root=parent.root;
		ni.root.createExpressionObservers(ni);

		if (this.isDOMless){
			// if or for nodes
			ni.node=ni.parent.node;
		} else {
			ni.createNode();
			ni.parent.node.appendChild(ni.node);

			if (this.children) {
				ni.childNodes=[];
				for (var i=0, sz=this.children.length;sz>i;i++) {
					ni.childNodes[i]=this.children[i].createNodeInstance(ni);
				}
			}
		}

		return ni;
	},

	/**
	 * Refresh the node 
	 * By default recursively refresh child nodes - so should be extended by sub-classes 
	 * if they need more specific logic
	 */
	refresh:function() {
		if (this.cdirty) {
			var cn=this.childNodes;
			if (cn) {
				for (var i=0, sz=cn.length;sz>i;i++) {
					cn[i].refresh();
				}
			}
			this.cdirty=false;
		}
	},

	/**
	 * Abstract function that should be implemented by sub-classes
	 */
	createNode:function() {}
});

/**
 * Simple attribute - used for static values
 */
TSimpleAtt = klass({
	/**
	 * Simple attribute constructor
	 * @param {String} name the name of the attribute - e.g. "class" or "tabIndex"
	 * @param {String} value the value of the attribute - e.g. "foo"
	 */
	$constructor:function(name, value) {
		this.name=name;
		this.value=value;
	},

	getValue:function(eh, vscope, defvalue) {
		return this.value;
	}
});

/**
 * Expression-based attribute
 */
TExpAtt = klass({
	/**
	 * Simple attribute constructor
	 * @param {String} name the name of the attribute - e.g. "class" or "tabIndex"
	 * @param {Array} textcfg the content of the attribute - e.g. ["foo",1,"bar"]
	 *   where odd items are string and even items are expression ids
	 */
	$constructor:function(name, textcfg) {
		this.name=name;
		this.textcfg=textcfg;
	},

	/**
	 * Return the value of the attribute for a given context (scope and expression handler)
	 */
	getValue:function(eh, vscope, defvalue) {
		var tcfg=this.textcfg, sz=tcfg.length, buf=[];
		for (var i=0;sz>i;i++) {
			// odd elements are variables
			if (i%2) buf.push(eh.getValue(tcfg[i], vscope, defvalue));
			else buf.push(tcfg[i]);
		}
		return buf.join("");
	}
});


module.exports.TNode=TNode;
module.exports.TSimpleAtt=TSimpleAtt;
module.exports.TExpAtt=TExpAtt;
