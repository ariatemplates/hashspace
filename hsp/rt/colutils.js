/*
 * Copyright 2014 Amadeus s.a.s.
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
  * This files gathers a list of utilities that are useful to sort,
  * filter or paginate collections in hashspace
  * These utils are published in hsp.global
  */

var log = require("./log"),
    klass = require("../klass"),
    $set = require("../$set");

/**
 * This function returns a sorted copy of an array.
 * It is typically meant to be used as a pipe modifier in a {foreach} statement
 * @param {Array} array the original array
 * @param {Function|String} expression the expression indicating how the sort should be performed
 *   it can be of 2 types:
 *     - a function that will be used as Array.sort() argument - so it needs to return something that
 *       can be compared with the >, < or == operators
 *     - a string representing an item property that will be used to sort (e.g. "name")
 * @param {Boolean} reverse if true the order will be reversed (default: false)
 */
var orderBy = exports.orderBy = function (array, expression, reverse) {
    var arr, sortFn, sortProp=null, reverse=(reverse===true);
    if (array.constructor!==Array) {
        log.error("[orderBy()] array argument must be of type Array");
        return [];
    }
    // clone array
    arr = array.slice(0);

    if (expression.constructor===Function) {
        sortFn=expression;
    } else if (expression.constructor===String && expression!=='') {
        sortProp=expression;
    } else {
        log.error("[orderBy()] Invalid expression argument: "+expression);
        return arr;
    }
    // create sortFn if sortProp is used
    if (sortProp) {
        sortFn=function(a,b) {
            var v1=a[sortProp], v2=b[sortProp];
            v1 = v1? v1 : "";
            v2 = v2? v2 : "";
            if (v1>v2) {
                return 1;
            } else {
                return v1==v2? 0 : -1;
            }
        };
    }
    // adapt sortFn if reverse
    var sfn=sortFn;
    if (reverse) {
        sfn=function(a,b) {
            return sortFn(a,b) * -1;
        };
    }
    return arr.sort(sfn);
};

/**
 * Sort processors that can keep sorting state (e.g. ascending, descending or none)
 * and that exposes simple method to be used in pipe expressions
 */
var Sorter = exports.Sorter = klass({
    /**
     * Sorter constructor
     * @param {Object} options a JSON object with the following properties:
     *   - {String} sortProperty: a property name corresponding to the item property to sort on through the apply() method
     *   - {Function} sortFunction: a function to use to sort the collection passed to apply()
     *        Note: either property or sortfunction must be provided - they will be internally passed as expression 
     *        to the orderBy() function. If both are provided sortFunction is used and property is ignored.
     *   - {String} states: a string representing the possible sorting states. This string must be composed 
     *        of the following letters:
     *           - "A" for ascending sort
     *           - "D" for descending sort
     *           - "N" for no sort (i.e. keep original order)
     *        As such using "NAD" (default) means that first sort order will be None, then Ascending, then Descending
     *        The sort order can be changed through the nextState() or setState() methods 
     */
    $constructor:function(options) {
        var sfn=this.sortFunction=options.sortFunction;
        var pp=this.sortProperty=options.property;
        this.state="N"; // default state in case of error
        this.states=["N"];

        // validate options
        if (sfn) {
            if (sfn.constructor!==Function) {
                return log.error("[Sorter] Sort function must be a function: "+sfn);
            }
        } else if (pp) {
            if (pp.constructor!==String) {
                return log.error("[Sorter] Sort property must be a string: "+pp);
            }
        }

        var ost=options.states, states=[], ch;
        if (ost && ost.constructor!==String) {
            log.error("[Sorter] states option must be a string: "+ost);
            ost="NAD";
        } else {
            ost= ost? ost.toUpperCase() : "NAD"; // NAD is the default states value
        }
        for (var i=0;ost.length>i;i++) {
            ch=ost.charAt(i);
            if (!ch.match(/[NAD]/)) {
                log.error("[Sorter] Invalid state code: "+ch);
            } else {
                states.push(ch);
            }
        }
        this.state=states[0];
        this.states=states;
    },
    /**
     * Apply the sort on a given array
     * @param {Array} array the array to sort
     * @return {Array} a sorted copy of the array
     */
    apply:function(array) {
        if (array.constructor!==Array) {
            log.error("[Sorter.apply()] array argument must be of type Array");
            return [];
        }
        if (this.state==="N") {
            return array.slice(0); // clone
        } else {
            var reverse=(this.state==="D"), expr=this.sortFunction? this.sortFunction : this.sortProperty;
            return orderBy(array,expr,reverse);
        }
    },

    /**
     * Moves the state to the next possible value, according to the states options (e.g. "NAD")
     */
    nextState:function() {
        var states=this.states, next=states[0], st=this.state;
        for (var i=0;states.length-1>i;i++) {
            if (states[i]===st) {
                next=states[i+1];
                break;
            }
        }
        $set(this,"state",next);
    },

    /**
     * Set the sorter state to a given state - that must be defined in the states options (e.g. "D" in "ADN")
     */
    setState:function(state) {
        // check that state is valid (must iterate as indexOf() in part of ES5)
        var found=false, states=this.states;
        for (var i=0;states.length>i;i++) {
            if (states[i]===state) {
                found=true;
                break;
            }
        }
        if (!found) {
            log.error("[Sorter.setState] state argument '"+state+"' is not part of the possible states '"+this.states.join('')+"'");
        } else {
            $set(this,"state",state);
        }
    }
});

/*
 * Register all module exports to the hashspace global object
 * @param {Object} global the hashspace global object
 */
exports.setGlobal = function(global) {
    global.orderBy=orderBy;
    global.Sorter=Sorter;
};
