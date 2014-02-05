
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
var OBSERVER_PROPERTY = "+json:observers";


// Original array methods
var AP=Array.prototype;
var $splice=AP.splice;
var $push=AP.push;
var $shift=AP.shift;
var $pop=AP.pop;
var $reverse=AP.reverse;
var $sort=AP.sort;
var $unshift=AP.unshift;

/**
 * Override Array splice to detect changes an trigger observer callbacks - same arguments as Array.splice:
 * cf. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
 **/
Array.prototype.splice=function(index, howMany) {
    // Note change set doesn't comply with object.observe specs (should be a list of change descriptors)
    // but we don't need a more complex implementation for hashspace
    if (this[OBSERVER_PROPERTY]) {
        // this array is observed
        var sz1 = this.length;
        var res = $splice.apply(this, arguments), sz2 = this.length;
        // NB: splice is not a valid change type according to Object.observe spec
        var chgset=[changeDesc(this, index, null, null, "splice")];
        if (sz1 !== sz2) {
            chgset.push(changeDesc(this, "length", sz2, sz1, "updated"));
        }
        callObservers(this, chgset);
        return res;
    } else {
        return $splice.apply(this, arguments);
    }
};

/**
 * Same as splice but with an array argument to pass all items that need to be inserted as an array and not as
 * separate arguments
 **/
Array.prototype.splice2=function (index, howMany, arrayArg) {
    var sz1 = this.length;
    if (!arrayArg) {
        arrayArg = [];
    }
    arrayArg.splice(0, 0, index, howMany);
    var res = $splice.apply(this, arrayArg);
    if (this[OBSERVER_PROPERTY]) {
        var sz2 = this.length;
        // NB: splice is not a valid change type according to Object.observe spec
        var chgset=[changeDesc(this, index, null, null, "splice")];
        if (sz1 !== sz2) {
            chgset.push(changeDesc(this, "length", sz2, sz1, "updated"));
        }
        callObservers(this, chgset);
    }
    return res;
};

/**
 * Mutates an array by appending the given elements and returning the new length of the array (same as Array.push)
 * Uses indefinite optional arguments: push(array, element1[, ...[, elementN]])
 * @param element1, ..., elementN
 */
Array.prototype.push=function () {
    if (this[OBSERVER_PROPERTY]) {
        // this array is observed
        var a = arguments, asz = a.length, sz1 = this.length, arg, sz2, chgset = [];
        if (asz < 1) {
            return sz1;
        }
        if (asz == 1) {
            sz2 = $push.call(this,a[0]);
            chgset.push(changeDesc(this, sz1, a[0], null, "new"));
        } else {
            for (var i = 0; asz > i; i++) {
                arg = a[i];
                chgset[asz - i - 1] = {
                    type : "new",
                    object : this,
                    name : (sz1 + i),
                    newValue : arg
                };
            }
            sz2 = $push.apply(this, a);
        }
        if (sz1 !== sz2) {
            chgset.push(changeDesc(this, "length", sz2, sz1, "updated"));
        }
        callObservers(this, chgset);
        return sz2;
    } else {
        return $push.apply(this, arguments);
    }
};

/**
 * Removes the first element from an array and returns that element. This method changes the length of the array.
 */
Array.prototype.shift = function () {
    // Note change set doesn't comply with object.observe specs - same as for splice
    if (this[OBSERVER_PROPERTY]) {
        var sz1 = this.length;
        var res = $shift.call(this);
        var sz2 = this.length;
        var chgset=[changeDesc(this, 0, null, null, "shift")];
        if (sz1 !== sz2) {
            chgset.push(changeDesc(this, "length", sz2, sz1, "updated"));
        }
        callObservers(this, chgset);
        return res;
    } else {
        return $shift.call(this);
    }
};

/**
 * Adds one or more elements to the beginning of an array and returns the new length of the array.
 * e.g. arr.unshift(element1, ..., elementN)
 */
Array.prototype.unshift = function () {
    if (this[OBSERVER_PROPERTY]) {
        var sz1 = this.length;
        $unshift.apply(this,arguments);
        var sz2 = this.length;
        var chgset=[changeDesc(this, 0, null, null, "unshift")];
        if (sz1 !== sz2) {
            chgset.push(changeDesc(this, "length", sz2, sz1, "updated"));
        }
        callObservers(this, chgset);
        return sz2;
    } else {
        return $unshift.apply(this,arguments);
    }
};

/**
 * Removes the last element from an array and returns that value to the caller.
 */
Array.prototype.pop = function () {
    // Note change set doesn't comply with object.observe specs - same as for splice
    if (this[OBSERVER_PROPERTY]) {
        var sz1 = this.length;
        var res = $pop.call(this);
        var sz2 = this.length;
        var chgset=[changeDesc(this, 0, null, null, "pop")];
        if (sz1 !== sz2) {
            chgset.push(changeDesc(this, "length", sz2, sz1, "updated"));
        }
        callObservers(this, chgset);
        return res;
    } else {
        return $pop.call(this);
    }
};

/**
 * Reverse the array order
 */
Array.prototype.reverse = function () {
    // Note change set doesn't comply with object.observe specs - same as for splice
    var res = $reverse.call(this);
    callObservers(this, [changeDesc(this, 0, null, null, "reverse")]);
    return res;
};

/**
 * Sort the array content
 */
Array.prototype.sort = function (sortFunction) {
    // Note change set doesn't comply with object.observe specs - same as for splice
    var res;
    //For IE8 which raises 'JScript object expected' errors when sortFunction is undefined
    if (sortFunction) {
        res = $sort.call(this, sortFunction);
    }
    else {
        res = $sort.call(this);
    }
    callObservers(this, [changeDesc(this, 0, null, null, "sort")]);
    return res;
};

/**
 * Return a change descriptor to use for callObservers()
 */
function changeDesc(object, property, newval, oldval, chgtype) {
    return {
        type : chgtype,
        object : object,
        name : property,
        newValue : newval,
        oldValue : oldval
    };
}

/**
 * Call all observers for a givent object
 * @param {Object} object reference to the object that is being observed
 * @param {Array} chgeset an array of change descriptors (cf. changeDesc())
 */
function callObservers(object, chgeset) {
    var ln = object[OBSERVER_PROPERTY];
    if (ln) {
        var elt;
        for (var i = 0, sz = ln.length; sz > i; i++) {
            elt = ln[i];
            if (elt.constructor === Function) {
                elt(chgeset);
            }
        }
    }
}

var ownProperty = Object.prototype.hasOwnProperty;

module.exports = {
    MD_OBSERVERS : OBSERVER_PROPERTY,

    /**
     * Sets a value in a JSON object (including arrays) and automatically notifies all observers of the change
     */
    $set : function (object, property, value) {
        if (object[OBSERVER_PROPERTY]) {
            var exists = ownProperty.call(object, property), oldVal = object[property], sz1 = object.length, chgset=null;
            object[property] = value;

            if (!exists) {
                chgset=[changeDesc(object, property, value, oldVal, "new")];
            } else if (oldVal !== value) {
                // do nothing if the value did not change or was not created:
                chgset=[changeDesc(object, property, value, oldVal, "updated")];
            }
            if (object.constructor === Array) {
                var sz2 = object.length;
                if (sz1 !== sz2) {
                    if (!chgset) {
                        chgset=[];
                    }
                    chgset.push(changeDesc(object, "length", sz2, sz1, "updated"));
                }
            }
            if (chgset) {
                callObservers(object, chgset);
            }
        } else {
            object[property] = value;
        }
        return value;
    },

    /**
     * Delete a property in a JSON object and automatically notifies all observers of the change
     */
    $delete : function (object, property, value) {
        if (object[OBSERVER_PROPERTY]) {
            var existed = ownProperty.call(object, property), oldVal = object[property];
            delete object[property];

            if (existed) {
                var chgset=[changeDesc(object, property, object[property], oldVal, "deleted")];
                callObservers(object, chgset);
            }
        } else {
            delete object[property];
        }
    },

    /**
     * Adds an observer to an object.
     */
    observe : function (object, callback) {
        observe(object, callback, OBSERVER_PROPERTY);
    },

    /**
     * Removes a callback from the observer list
     */
    unobserve : function (object, callback) {
        unobserve(object, callback, OBSERVER_PROPERTY);
    }

};

module.exports["set"] = module.exports.$set;

function observe (object, callback, metaProperty) {
    // metaProperty = OBSERVER_PROPERTY || EVTOBSERVER_PROPERTY
    if (typeof(object) != "object")
        return;
    if (!object[metaProperty])
        object[metaProperty] = [];
    object[metaProperty].push(callback);
}

function unobserve (object, callback, metaProperty) {
    // metaProperty = OBSERVER_PROPERTY || EVTOBSERVER_PROPERTY
    if (typeof(object) != "object")
        return;
    var obs = object[metaProperty];
    if (!obs)
        return;
    var elt, res = [];
    for (var i = 0, sz = obs.length; sz > i; i++) {
        elt = obs[i];
        if (elt !== callback)
            res.push(elt);
    }

    // delete observer property if there is no more observers
    if (res.length === 0) {
        delete object[metaProperty]; // TODO remove delete to benefit from v8 optimizations?
    } else {
        object[metaProperty] = res;
    }
}
