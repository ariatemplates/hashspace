
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

// Basic JSON listener library

/**
 * Name of the listener property used as meta-data
 */
var OBSERVER_PROPERTY="+json:observers";
var EVTOBSERVER_PROPERTY="+json:evtobservers";

/**
 * Notifies JSON listeners that a value on the object they listen to has changed
 * @private
 * @param {Object} container reference to the data holder object - e.g. data.search.preferedCity
 * @param {String} property name of the property - e.g. '$value'
 * @param {Object} change object describing the change made to the property (containing oldValue/newValue if the
 * change was made with setValue)
 * @param {Array} listenerToExclude (optional) potential listener callback belonging to the object that raised the
 * @param {string} chgtype the type of change - "updated" or "new"
 * change and which doesn't want to be notified
 */
function notifyObservers (container, property, newval, oldval, chgtype, chgeset) {
    // retrieve listeners for this node and its parents
    // arguments given to the callback
    var ln=container[OBSERVER_PROPERTY];
    if (ln) {
        // call the listeners
        var elt;
        if (!chgeset) {
        	chgeset=[{type:chgtype, object:container, name:property, newValue:newval, oldValue:oldval}];
        }
        for (var i=0,sz=ln.length;sz>i;i++) {
        	elt=ln[i];
        	if (elt.constructor===Function) elt(chgeset);
        	// else elt is not a function!
        }
    }
};

module.exports={
	MD_OBSERVERS:OBSERVER_PROPERTY,

	/**
	 * Sets a value in a JSON object (including arrays) and automatically notifies all observers of the change
	 */
	set:function(object, property, value) {
		if (typeof(object)!=='object') {
			console.log("[json.set] Invalid object used to set a value");
			return;
		}
		var exists = object.hasOwnProperty(property);
    var oldVal = object[property];
    var sz1 = object.length;
    object[property] = value;

    if (!exists) {
    	notifyObservers(object, property, value, oldVal, "new");
    } else if (oldVal !== value) {
    	// do nothing if the value did not change or was not created:
    	notifyObservers(object, property, value, oldVal, "updated");
    }
    if (object.constructor===Array) {
    	var sz2=object.length;
    	if (sz1!==sz2) {
    		notifyObservers(object, "length", sz2, sz1, "updated");
    	}
    } 
    return value;
	},

	/**
	 * Mutates an array by appending the given elements and returning the new length of the array (same as Array.push)
	 * Uses indefinite optional arguments: push(array, element1[, ...[, elementN]])
	 * @param {Array} array the array on which the splice should be performed
	 * @param element1, ..., elementN
	 */
	push:function(array) {
		var a=arguments, asz=a.length, sz=array.length, arg , res;
		if (asz<2) {
			return sz;
		}
		if (sz===undefined || !array.push) {
			console.log("[json.push] Invalid array used to push a new value");
			return;
		}

		if (asz==2) {
			res=array.push(a[1]);
			notifyObservers(array, sz, a[1], null, "new");
		} else {
			var args=[], chgeset=[], idx;
			for (var i=1;asz>i;i++) {
				idx=i-1;
				args[idx]=arg=a[i];
				chgeset[asz-1-i]={type:"new", object:array, name:(sz+idx), newValue:args[idx]};
			}
			res=Array.prototype.push.apply(array,args);
			notifyObservers(array, null, null, null, null, chgeset);
		}
		var sz2=array.length;
		if (sz!==sz2) {
			notifyObservers(array, "length", sz2, sz, "updated");
		}
		return res;
	},

	/**
	 * Changes the content of an array, adding new elements while removing old elements. (same as Array.splice)
	 * Uses indefinite optional arguments: splice (array, index , howMany[, element1[, ...[, elementN]]])
	 * @param {Array} array the array on which the splice should be performed
	 * @param {Number} index the index at which to start changing the array. If negative, will begin that many elements from the end
	 * @param {Number} howMany An integer indicating the number of old array elements to remove. 
	 *                 If howMany is 0, no elements are removed. In this case, you should specify at least one new element
	 * @param element1, ..., elementN The elements to add to the array. If you don't specify any elements, splice simply removes elements from the array
	 * @return {Array} An array containing the removed elements. If only one element is removed, an array of one element is returned.
	 */
	splice:function(array, index, howMany) {
		// Note change set doesn't comply with object.observe specs (should be a list of change descriptors) 
		// but we don't need a more complex implementation for hashspace
		var a=arguments, args=[], sz1=array.length;;
		for (var i=1;a.length>i;i++) args.push(a[i]);

		res=Array.prototype.splice.apply(array,args);
		var sz2=array.length;

		notifyObservers(array, index, null, null, "splice"); // NB: splice is not a valid change type according to Object.observe spec
		if (sz1!==sz2) {
			notifyObservers(array, "length", sz2, sz1, "updated");
		}
		return res;
	},

	/**
	 * Same as splice but with an array argument to pass all items that need to be inserted as an array and not as separate arguments
	 * @param {Array} arrayArg the items that must be inserted at the index position
	 */
	splice2:function(array, index, howMany, arrayArg) {
		var sz1=array.length;
		if (!arrayArg) {
			arrayArg=[];
		} 
		arrayArg.splice(0,0,index,howMany);
		res=Array.prototype.splice.apply(array,arrayArg);
		var sz2=array.length;

		notifyObservers(array, index, null, null, "splice"); // NB: splice is not a valid change type according to Object.observe spec
		if (sz1!==sz2) {
			notifyObservers(array, "length", sz2, sz1, "updated");
		}
		return res;
	},

	/**
	 * Removes the first element from an array and returns that element. This method changes the length of the array.
	 * @param {Array} array the array on which the shift should be performed
	 */
	shift:function(array) {
		// Note change set doesn't comply with object.observe specs - same as for splice
		var sz1=array.length;
		res=array.shift();
		var sz2=array.length;
		notifyObservers(array, 0, null, null, "shift");
		if (sz1!==sz2) {
			notifyObservers(array, "length", sz2, sz1, "updated");
		}
		return res;
	},

	/**
	 * Removes the last element from an array and returns that value to the caller.
	 * @param {Array} array the array on which the shift should be performed
	 */
	pop:function(array) {
		// Note change set doesn't comply with object.observe specs - same as for splice
		var sz1=array.length;
		res=array.pop();
		var sz2=array.length;
		notifyObservers(array, 0, null, null, "pop");
		if (sz1!==sz2) {
			notifyObservers(array, "length", sz2, sz1, "updated");
		}
		return res;
	},

	/**
	 * Adds an observer to an object.
	 */
	observe:function(object, callback) {
		observe(object, callback, OBSERVER_PROPERTY);
	},

	/** 
	 * Removes a callback from the observer list
	 */
	unobserve:function(object, callback) {
		unobserve(object, callback, OBSERVER_PROPERTY);
	},

	/**
	 * Adds an event observer to an object.
	 */
	observeEvents:function(object, callback) {
		observe(object, callback, EVTOBSERVER_PROPERTY);
	},

	/** 
	 * Removes a callback from the event observer list
	 */
	unobserveEvents:function(object, callback) {
		unobserve(object, callback, EVTOBSERVER_PROPERTY);
	},

	/**
	 * Raise an event associated to an object
	 */
	raiseEvent:function(object, eventName, eventArg) {
		var ln=object[EVTOBSERVER_PROPERTY];
    if (ln) {
        // call the listeners
        var elt, evt={name:eventName, object:object, argument:eventArg};
        for (var i=0,sz=ln.length;sz>i;i++) {
        	elt=ln[i];
        	if (elt.constructor===Function) elt(evt);
        	// else elt is not a function!
        }
    }
	}

}

function observe(object, callback, metaProperty) {
	// metaProperty = OBSERVER_PROPERTY || EVTOBSERVER_PROPERTY
	if (typeof(object)!="object") return;
		if (!object[metaProperty]) object[metaProperty]=[];
		object[metaProperty].push(callback);
}

function unobserve(object, callback, metaProperty) {
	// metaProperty = OBSERVER_PROPERTY || EVTOBSERVER_PROPERTY
	if (typeof(object)!="object") return;
	var obs=object[metaProperty];
	if (!obs) return;
	var elt, res=[];
	for (var i=0, sz=obs.length;sz>i;i++) {
		elt=obs[i];
		if (elt!==callback) res.push(elt);
	}

	// delete observer property if there is no more observers
	if (res.length==0) {
		delete object[metaProperty]; // TODO remove delete to benefit from v8 optimizations?
	} else {
		object[metaProperty]=res;
	}
}

