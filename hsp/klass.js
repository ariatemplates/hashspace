
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

/**
 * Shortcut to create a JS Object
 * @param {JSON} klassdef the object prototype containing the following special properties
 *    $constructor: {function} the object constructor (optional - a new function is automatically created if not provided)
 *    
 *
 * @return {function} the object constructor
 */
var klass = function(klassdef) {
	var $c=klassdef.$constructor;
	if (!$c) {
		// no constructor is provided - let's create one
		var ext=klassdef.$extends;
		if (ext) {
			$c=function() {
				ext.apply(this,arguments);
			}
		} else {
			$c=new Function();
		}
		klassdef.$constructor=$c;
	}
	if (klassdef.$extends) {
		// create the new prototype from the parent prototype
		if (!klassdef.$extends.prototype) throw new Error("[klass] $extends attribute must be a function");
		var p=createObject(klassdef.$extends.prototype);

		// add prototype properties to the prototype and to the constructor function to allow syntax shortcuts
		// such as ClassA.$constructor()
		for (var k in klassdef) {
			if (klassdef.hasOwnProperty(k)) {
				p[k]=$c[k]=klassdef[k];
			}
		}
		$c.prototype=p;
	} else {
		$c.prototype=klassdef;

		// add prototype properties to the constructor function to allow syntax shortcuts
		// such as ClassA.$constructor()
		for (var k in klassdef) {
			if (klassdef.hasOwnProperty(k)) {
				$c[k]=klassdef[k];
			}
		}
	}

	return $c;
};

// helper function used to create object
function F() {};

/**
 * Polyfill for the browsers that don't support ES5
 */
function createObject(o) {
	if (Object.create) {
		return Object.create(o);
	} else {
		F.prototype=o;
		return new F();
	}
}

klass.createObject=createObject;

var metaDataCounter=0;
/**
 * Generate a unique meta-data prefix
 * Can be used to store object-specific data into another object without
 * much risk of collision (i.e. provided that the object doesn't use properties with
 * the "+XXXX:XXXXXXXX" pattern)
 */
function createMetaDataPrefix() {
	metaDataCounter++;
	return "+"+metaDataCounter+":";
}
klass.createMetaDataPrefix=createMetaDataPrefix;

module.exports=klass;
