
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

var klass=require("hsp/klass");

var ExpHandler = klass({
	/**
	 * Expression handler
	 * Used by all node to access the expressions linked to their properties
	 * Note: the same ExpHandler instance is shared by all node instances, this is why vscope is passed
	 * as argument to the getValue functions, and not as argument of the constructor
	 * @param {Map<expressionDefinition>} edef list of variable managed by this handler
	 *   e.g. {e1:[1,"person","name"]} > the e1 variable refers to person.name and is bound to the data model
	 * 
	 * Possible expression types are
	 *  0: unbound data ref 	- e.g. {e1:[0,0,"item_key"]}
	 *  1: bound data ref 		- e.g. {e1:[1,"person","name"]}
	 *  2: literal data ref
	 *  3: callback expression 	- e.g. {e1:[3,"ctl","deleteItem",1,2,1,0]}
	 *  4: callback literal 	- e.g. {e1:[4,myfunc,1,2,1,0]}
	 *  5: literal value 		- e.g. {e1:[5,"some value"]}
	 */
	$constructor:function(edef) {
		this.exps={};

		// initialize the exps map to support a fast accessor function
		var v, onm, etype, exp=null; // onm=object name
		for (var key in edef) {
			v=edef[key];
			if (v.constructor===Array) {
				etype=v[0];
				if (etype===5) {
					// literal value expression
					this.exps[key]={
						value:v[1],
						getValue:ExpHandlerGV_Literal
					}
					continue;
				} 

				onm=v[1];
				if (onm===0) {
					// this is a scope variable - so must be attached to the current scope object
					// "#scope" is a special keyword to reference the current scope object in the vscope stack
					onm="#scope"; 
				} 
				if (etype<2) {
					// basic "object.property" expression
					exp={
						bound:(etype===1),
						onm:onm,	// object name
						pnm:v[2],	// property name
						getValue:ExpHandlerGV_ObjProperty
					}
				} else if (etype===2) {
					// function expression
					console.log("function expression are not supported yet");
				} else if (etype===3) {
					// callback expression
					// e.g. onclick="{ctl.deleteItem(doc,doc_key)}" - compiled as: {e1:[3,"ctl","deleteItem",1,2,1,0]}
					var args=null;
					if (v.length>3) args=v.slice(3);
					exp={
						onm:onm,	// object name
						pnm:v[2], 	// function name = property name
						args:args,
						executeCb:ExpHandlerEC_Callback
					}
				} else if (etype===4) {
					// function call literal - e.g. {e1:[4,myfunc,1,2,1,0]}
					var args=null;
					if (v.length>2) args=v.slice(2);
					exp={
						fn:v[1],
						args:args,
						executeCb:ExpHandlerEC_Callback,
						getValue:ExpHandlerGV_GlobalFunction
					}
				} else {
					console.log("Unsupported expression type: "+etype);
				}
				if (exp) this.exps[key]=exp;
			} else {
				// check other types of variables - e.g. callback
				console.log("Unsupported variable definition: "+v);
			}
		}
	},

	/**
     * Return the value of an expression
     */
	getValue:function(eIdx, vscope, defvalue) {
		return this.exps["e"+eIdx].getValue(vscope, defvalue);
	},

	/**
	 * Return an expression from its index
	 */
	getExpr:function(eIdx) {
		return this.exps["e"+eIdx];
	}
});

/**
 * Value getter for object properties 
 */
function ExpHandlerGV_ObjProperty(vscope, defvalue) {
	// this == var object created in the ExpHandler
	var onm=this.onm, o=vscope[this.onm];
	if (!o) return defvalue;
	var v=o[this.pnm];
	return (v!==undefined)? v : defvalue;
}

/**
 * Value getter for literal expressions 
 */
function ExpHandlerGV_Literal(vscope, defvalue) {
	// this == var object created in the ExpHandler
	return this.value;
}

/**
 * Get Function expression details
 */
function ExpHandlerGV_GlobalFunction(vscope, defvalue) {
	// this == var object created in the ExpHandler
	return {fn:this.fn, args:this.args};
}

/**
 * Execute Callback method of the Callback expressions 
 */
function ExpHandlerEC_Callback(evt, evtType, eh, vscope) {
	// this == var object created in the ExpHandler
	//return this.value;
	var fn=this.fn, onm=this.onm, o=vscope[this.onm];
	if (fn) {
		// we are in a callback literal
		o={};
	} else {
		// we are not in a callback literal
		if (!o) {
			 return console.log("[hashspace event handler] Invalid callback context: "+onm);
		} else {
			fn=o[this.pnm];

			if (!fn || fn.constructor!==Function) {
				console.log("[hashspace event handler] Invalid callback function: "+onm+"."+this.pnm+"(...)");
			}
		}
	}

	// process argument list
	var cbargs=[];
	var e=vscope["event"];
	vscope["event"]=evt;

	var args=this.args;
	if (args) {
		for (var i=0,sz=args.length;sz>i;i+=2) {
			if (args[i]===0) {
				// this is a literal argument
				cbargs.push(args[i+1]);
			} else {
				// this is an expression;
				cbargs.push(eh.getValue(args[i+1],vscope,null));
			}
		}
	}
	if (e===undefined) {
		delete vscope["event"]
	} else {
		vscope["event"]=e;	
	}


	if (fn && fn.constructor===Function) {
		fn.apply(o,cbargs);
	}
}

module.exports=ExpHandler;
