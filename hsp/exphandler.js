
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
	 *   e.g. {v1:["person","name"]} > the v1 variable refers to person.name
	 */
	$constructor:function(edef) {
		this.exps={};

		// initialize the exps map to support a fast accessor function
		var v, onm; // onm=object name
		for (var key in edef) {
			v=edef[key];
			if (v.constructor===Array) {
				// basic "object.property" expression
				onm=v[1];
				if (onm===0) {
					// this is a scope variable - so must be attached to the current scope object
					// "#scope" is a special keyword to reference the current scope object in the vscope stack
					onm="#scope"; 
				} 
				this.exps[key]={
					bound:(v[0]===1),
					onm:onm,	// object name
					pnm:v[2],	// property name
					getValue:ExpHandlerGV_ObjProperty
				}
			} else {
				// check other types of variables - e.g. callback
				console.log("Unsupported variable definition: "+v)
			}
		}
	},

	/**
     * Return the value of an expression
     */
	getValue:function(eIdx, vscope, defvalue) {
		return this.exps["e"+eIdx].getValue(vscope, defvalue);
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

module.exports=ExpHandler;
