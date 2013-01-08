
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

// Element Node used for any standard HTML element (i.e. having attributes and child elements)

var klass=require("hsp/klass"),
	doc=require("hsp/document"),
	TNode=require("hsp/rt/tnode").TNode;

/**
 * Generic element node
 * Add attribute support on top of TNode - used for div, spans, ul, li, h1, etc
 */
var EltNode = klass({
	$extends:TNode,

	/**
	 * EltNode generator
	 * @param {string} tag the tag name to use - e.g. "div"
	 * @param {Map<Expression>|int} exps the map of the variables used by the node. 
	 *   0 is passed if no  expression is used 
	 * @param {Array} attcfg array of the different attributes used on the container
	 * 	 e.g. [{title:"Hello!"}] - cf attribute objects for more info
	 * @param {Array} children list of sub-node generators
	 */
	$constructor:function(tag, exps, attcfg, children) {
		TNode.$constructor.call(this, exps);
		this.tag=tag;
		this.atts=this.createAttList(attcfg);
		if (children && children!==0) {
			this.children=children;
		}
	},

	/**
	 * Create the DOM node element
	 */
	createNode:function() {
		var nd=doc.createElement(this.tag);
		this.node=nd;
		this.refreshAttributes();
	},

	/**
	 * Refresh the node 
	 */
	refresh:function() {
		if (this.adirty) {
			// attributes are dirty
			this.refreshAttributes();
		}
		TNode.refresh.call(this);
	},

	/**
	 * Refresh the node attributes (even if adirty is false)
	 */
	refreshAttributes:function() {
		var nd=this.node, atts=this.atts, att, eh=this.eh, vs=this.vscope;
		this.adirty=false;
		if (!atts) return;

		for (var i=0, sz=this.atts.length;sz>i;i++) {
			att=atts[i];
			if (att.name==="class") {
				// issue on IE8 with the class attribute?
				nd.className=att.getValue(eh,vs,"");
			} else {
				nd.setAttribute(att.name,att.getValue(eh,vs,null));
			}
		}
	}

});

module.exports=EltNode;
