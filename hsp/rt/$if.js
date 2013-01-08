
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

// If condition node

var klass=require("hsp/klass"),
	doc=require("hsp/document"),
	TNode=require("hsp/rt/tnode").TNode;

/**
 * If node
 * Implements the if conditional statement. Adds a children2 collection that corresponds to the else block
 */
var $IfNode = klass({
	$extends:TNode,

	/**
	 * IfNode generator
	 * @param {Map<Expression>|int} exps the map of the variables used by the node. 
	 *   0 is passed if no  expression is used 
	 * @param {Integer} condexp the index of the condition expression - e.g. 1
	 * @param {Array} children list of sub-node generators - 0 may be passed if there is not child nodes
	 * @param {Array} children2 list of sub-node generators for the else statemetn - 0 may be passed if there is not child nodes
	 */
	$constructor:function(exps, condexp, children, children2) {
		TNode.$constructor.call(this, exps);
		this.isDOMless=true;
		// the if node has no container DOM elements - however its childNodes collection references 
		// the nodes that it creates
		this.lastConditionValue=false;
		this.isDOMempty=true;
		this.condexpidx=condexp;
		if (children && children!==0) {
			this.children=children;
		}
		if (children2 && children2!==0) {
			this.children2=children2;
		}
	},

	/**
	 * Create a node instance referencing the current node as base class
	 * As the $IfNode is DOMless it will not create a DOM node for itself - but will create
	 * nodes for its children instead
	 * @return {TNode} the new node instance
	 */
	createNodeInstance:function(parent) {
		var ni=TNode.createNodeInstance.call(this,parent);
		var nd=ni.node; // same as parent node in this case
		ni.node1=doc.createComment("# if");
		ni.node2=doc.createComment("# /if");
		nd.appendChild(ni.node1);
		nd.appendChild(ni.node2);
		ni.createChildNodeInstances(ni.getConditionValue());
		return ni;
	},

	/**
	 * Delete and re-create the child node instances
	 * Must be called on a node instance
	 * @param {boolean} condition the value of the condition to consider
	 */
	createChildNodeInstances:function(condition) {
		this.lastConditionValue=condition; 

		if (!this.isDOMempty) {
			// dispose child nodes
			var cn=this.childNodes;
			if (cn) {
				// recursively dispose child nodes
				for (var i=0, sz=cn.length;sz>i;i++) {
					cn[i].$dispose();
				}
				delete this.childNodes;
			}
			this.childNodes=null;

			// delete child nodes from the DOM
			var node=this.node, isInBlock=false, ch, n1=this.node1, n2=this.node2;
			for (var i=node.childNodes.length-1;i>-1;i--) {
				ch=node.childNodes[i];
				if (isInBlock) {
					// we are between node1 and node2
					if (ch===n1) {
						i=-1;
						break;
					} else {
						node.removeChild(ch);
					}
				} else {
					// detect node2
					if (ch===n2) {
						isInBlock=true;
					}
				}
			}
			this.isDOMempty=true;
		}

		// evalutate condition expression to determine which children collection to use (i.e. if or  block)
		
		var ch=condition? this.children : this.children2;
		// create child nodes
		if (ch) {
			// the if node has no container DOM elements - however its childNodes collection references 
			// the nodes that it creates
			var sz=ch.length, n;
			if (sz>0) {
				this.childNodes=[];
				var df=doc.createDocumentFragment();
				this.node=df; // use a doc fragment to create the new node instead of the parent node
				for (var i=0;sz>i;i++) {
					n=ch[i].createNodeInstance(this);
					this.childNodes.push(n);
				}
				this.node=this.parent.node; // remove doc fragment reference
				this.node.insertBefore(df,this.node2);
				this.isDOMempty=false;
			}
		}

	},

	/**
	 * Processes the current condition value
	 **/
	getConditionValue:function() {
		var condition=false;
		if (this.eh) condition=this.eh.getValue(this.condexpidx, this.vscope, false);
		return condition? true : false; // cast to a boolean to be able to compare new and old confition values
	},

	/**
	 * Refresh the node 
	 * If the if condition has changed, delete previous child nodes and create those corresponding to the else
	 * statement. Otherwise performs the regular recursive refresh
	 */
	refresh:function() {
		var cond=this.getConditionValue();
		if (cond!==this.lastConditionValue) {
			this.createChildNodeInstances(cond);
			this.cdirty=false;
		} else {
			// default behaviour
			TNode.refresh.call(this);
		}
	}
});

module.exports=$IfNode;