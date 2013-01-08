
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

// Hash Space runtime

require("hsp/es5");
var klass=require("hsp/klass"),
	TNode=require("hsp/rt/tnode").TNode, 
	rt=require("hsp/rt/$root"), 
	$RootNode=rt.$RootNode, 
	$InsertNode=rt.$InsertNode,
	EltNode=require("hsp/rt/eltnode");

var NodeGenerator = klass({
	/**
	 * NodeGenerator constructor
	 * @param {Array|TNode} nodedefs tree root of node generators created by the template pre-processor
	 */
	$constructor:function(nodedefs) {
		this.nodedefs=nodedefs;
	},

	/**
	 * Main method called to generate the document fragment associated to a template for a given set of arguments
	 * This creates a new set of node instances from the node definitions passed in the ng constructor
	 * @param {Array} scopevars the list of the scope variables (actually the template arguments) - e.g. ["person",person]
	 *                odd indexes correspond to argument values / even indexes correspond to argument names
	 */
	process:function(tplctxt, scopevars) {
		var vs={}, nm, argNames=[]; // array of argument names
		if (scopevars) {
			for (var i=0, sz=scopevars.length;sz>i;i+=2) {
				nm=scopevars[i];
				vs[nm]=scopevars[i+1]; // feed the vscope
				argNames.push(nm);
			}
		} 
		vs["#scope"]=vs; // self reference (used for variables - cf. expression handler)
						
		var root=null;
		if (tplctxt.$constructor && tplctxt.$constructor===$InsertNode) {
			// we use the insert node as root node
			root=tplctxt;
			root.init(vs, this.nodedefs, argNames);
		} else {
			root=new $RootNode(vs, this.nodedefs, argNames);
		}

		return root;
	}
});

module.exports.NodeGenerator = NodeGenerator;

/**
 * Collection of the node types supported by the NodeGenerator
 * This collection is attached to the Nodegenerator constructor through a nodes property
 */
var nodes={}
NodeGenerator.nodes=nodes;

var nodeList=[
	"$text",require("hsp/rt/$text"),
	"$if",require("hsp/rt/$if"),
	"$insert",$InsertNode,
	"$foreach",require("hsp/rt/$foreach")
]

for (var i=0, sz=nodeList.length;sz>i;i+=2) {
	createShortcut(nodeList[i],nodeList[i+1]);
}

/**
 * Create shortcut functions on the nodes collection to simplify the template functions
 * e.g.
 * nodes.$text=function(exps, textcfg) {return new $TextNode(exps, textcfg);}
 */
function createShortcut(tagName,tagConstructor) {
	nodes[tagName]=function(a1,a2,a3,a4,a5) {return new tagConstructor(a1,a2,a3,a4,a5);}
}

var elts=["div","span","h1","h2","h3","h4","h5","h6","ul","ol","li","section"];
for (var i=0, sz=elts.length;sz>i;i++) {
	createEltShortcut(elts[i],EltNode);
}

/**
 * Same as createShortcut but for html elements
 */
function createEltShortcut(tagName) {
	nodes[tagName]=function(exps,attcfg,content) {return new EltNode(tagName, exps, attcfg, content);}
}
