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

var klass = require("../klass"),
    log = require("./log"),
    exparser = require("../expressions/parser"),
    exobservable = require("../expressions/observable"),
    exmanipulator = require("../expressions/manipulator");

var ExpHandler = klass({
    /**
     * Expression handler Used by all node to access the expressions linked to their properties Note: the same
     * ExpHandler instance is shared by all node instances, this is why vscope is passed as argument to the getValue
     * functions, and not as argument of the constructor
     * @param {Map<expressionDefinition>} edef list of expressions
     * @param {Boolean} observeTarget if true the targeted data objects will be also observed (e.g. foreach collections) - default:false
     */
    $constructor : function (edef,observeTarget) {
        this.observeTarget=(observeTarget===true);
        this.exps = {};

        // initialize the exps map to support a fast accessor function
        var v;
        for (var key in edef) {
            v = edef[key];
            if (v.constructor === Array) {
                this.exps[key] = new PrattExpr(v, this);
            } else {
                // check other types of variables - e.g. callback
                log.warning("Unsupported expression definition: " + v);
            }
        }
    },

    /**
     * Return the value of an expression
     */
    getValue : function (eIdx, vscope, defvalue) {
        return this.exps["e" + eIdx].getValue(vscope, this, defvalue);
    },

    /**
     * Return an expression from its index
     */
    getExpr : function (eIdx) {
        return this.exps["e" + eIdx];
    },

    /**
     * Scans the scope tree to determine which scope object is actually handling a given object
     * This method is necessary to observe the right scope instance
     * (all scope object have a hidden "+parent" property referencing their parent scope)
     * @param {String} property the property to look for
     * @param {Object} vscope the current variable scope
     * @return {Object} the scope object or null if not found
     */
    getScopeOwner : function(property, vscope) {
        var vs=vscope;
        while(vs) {
            if (vs.hasOwnProperty(property)) {
                return vs;
            } else {
                vs=vs["+parent"];
            }
        }
        return null;
    },

    /**
     * Create a sub-scope object inheriting from the parent' scope
     * @param {Object} ref the reference scope
     * @return {Object} sub-scope object extending the ref object
     */
    createSubScope: function(ref) {
        var vs = Object.create(ref);
        vs["scope"] = vs;
        vs["+parent"] = ref;
        return vs;
    }
});

module.exports = ExpHandler;

var PrattExpr = klass({
    /**
     * Class constructor
     * @param {Array} desc the expression descriptor - e.g. [9,"foo+bar.baz()"]
     */
    $constructor : function (desc) {
        this.exptext = desc[1];
        this.ast = exparser(desc[1]);
        this.bound = desc.length > 2 ? desc[2] : true;
        this.manipulator = exmanipulator(desc[1], this.ast);
        this.isMultiStatement = this.manipulator.isMultiStatement;
    },

    getValue : function (vscope, eh, defvalue) {
        try {
            return this.manipulator.getValue(vscope,defvalue);
        } catch (e) {
            log.warning("Error evaluating expression '" + this.exptext + "': " + e.message);
        }
    },

    setValue : function (vscope, value) {
        if (this.manipulator.isAssignable) {
            this.manipulator.setValue(vscope, value);
        } else {
            log.warning(this.exptext + " can't be updated - please use object references");
        }
    },

    executeCb : function (evt, eh, vscope) {
        var cbScope = Object.create(vscope);
        //create a throw-away scope to expose additional identifiers to
        //callback expression
        cbScope.event = evt;

        return this.getValue(cbScope, eh);
    },

    getObservablePairs : function (eh, vscope) {
        return this.bound ? exobservable(this.ast, vscope) : null;
    }
});
