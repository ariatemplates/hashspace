
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

var klass = require("../klass"), json = require("../json");

var ExpHandler = klass({
    /**
     * Expression handler Used by all node to access the expressions linked to their properties Note: the same
     * ExpHandler instance is shared by all node instances, this is why vscope is passed as argument to the getValue
     * functions, and not as argument of the constructor
     * @param {Map<expressionDefinition>} edef list of variable managed by this handler e.g. {e1:[1,2,"person","name"]} >
     * the e1 variable refers to person.name, composed of 2 path fragments ("person" and "name") and is bound to the
     * data model
     * Possible expression types are:
     * 0: unbound data ref - e.g. {e1:[0,1,"item_key"]}
     * 1: bound data ref - e.g. {e1:[1,2,"person","name"]}
     * 2: literal data ref - e.g. {e1:[2,2,person,"name"]}
     * 3: function call - e.g. {e1:[3,2,"ctl","deleteItem",1,2,1,0]}
     * 4: function call literal- e.g. {e1:[4,1,myfunc,1,2,1,0]}
     * 5: literal value - e.g. {e1:[5,"some value"]}
     * 6: function expression - e.g. {e1:[6,function(a0,a1){return a0+a1;},2,3]}
     */
    $constructor : function (edef) {
        this.exps = {};

        // initialize the exps map to support a fast accessor function
        var v, etype, exp = null; // onm=object name
        for (var key in edef) {
            v = edef[key];
            if (v.constructor === Array) {
                etype = v[0];
                if (etype === 5) {
                    // literal value expression
                    exp = new LiteralExpr(v);
                } else if (etype === 0 || etype === 1 || etype === 2) {
                    // simple expressions
                    exp = new DataRefExpr(v);
                } else if (etype === 3 || etype === 4) {
                    // function call expression
                    exp = new FuncRefExpr(v);
                } else if (etype === 6) {
                    // function expression
                    exp = new FuncExpr(v, this);
                } else {
                    console.warn("Unsupported expression type: " + etype);
                }
                if (exp)
                    this.exps[key] = exp;
            } else {
                // check other types of variables - e.g. callback
                console.warn("Unsupported expression definition: " + v);
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
    }
});

module.exports = ExpHandler;

/**
 * Little class representing literal expressions 5: literal value - e.g. {e1:[5,"some value"]}
 */
var LiteralExpr = klass({
    /**
     * Class constructor
     * @param {Array} desc the expression descriptor - e.g. [5,"some value"]
     */
    $constructor : function (desc) {
        this.value = desc[1];
    },

    getValue : function (vscope, eh, defvalue) {
        return this.value;
    },

    /**
     * Return the list of [object,property] pairs that have to be observed null should be returned if nothing should be
     * observed (i.e. unbound property)
     * @see $RootNode.createExpressionObservers
     */
    getObservablePairs : function (eh, vscope) {
        return null;
    }
});

/**
 * Little class representing a path expression: 0: unbound data ref - e.g. {e1:[0,1,"item_key"]} 1: bound data ref -
 * e.g. {e1:[1,2,"person","name"]} 2: literal data ref - e.g. {e1:[2,2,person,"name"]}
 */
var DataRefExpr = klass({
    bound : false, // default bound value

    /**
     * Class constructor
     * @param {Array} desc the expression descriptor - e.g. [1,2,"person","name"]
     */
    $constructor : function (desc) {
        var etype = desc[0], pl = desc[1], isLiteral = (etype === 2 || etype === 4), root, path = [], ppl; // pl: path
                                                                                                            // length
        if (!isLiteral) {
            // e.g. {e1:[0,1,"item_key"]} >> this is a scope variable
            root = "#scope";
            path = desc.slice(2, pl + 2);
            ppl = pl;
        } else {
            root = desc[2];
            path = desc.slice(3, pl + 2);
            ppl = pl - 1;
        }

        this.bound = (etype === 1); // literal data ref are considered unbound
        this.isLiteral = isLiteral;
        this.root = root;
        this.path = path;
        this.ppLength = ppl; // property path length
    },

    /**
     * Get the value associated to the expression in a given scope
     */
    getValue : function (vscope, eh, defvalue) {
        var v = this.isLiteral ? this.root : vscope[this.root], ppl = this.ppLength;

        if (typeof v == "undefined") {
            // root not found
            return defvalue;
        }

        if (ppl === 1) {
            // short path for std use case
            v = v[this.path[0]];
        } else {
            var p = this.path;
            for (var i = 0; ppl > i; i++) {
                v = v[p[i]];
                if (v === undefined) {
                    return defvalue;
                }
            }
        }

        return (v !== undefined) ? v : defvalue;
    },

    /**
     * Set the value in the data object referenced by the current expression in the current vscope This method shall be
     * used by input elements to push DOM value changes in the data model
     */
    setValue : function (vscope, value) {
        if (this.isLiteral && this.ppLength <= 0) {
            console.warn("[DataRefExpr.setValue] Global literal values cannot be updated from the DOM - please use object referenes");
        } else {
            var v = this.isLiteral ? this.root : vscope[this.root], ppl = this.ppLength, goahead = true;
            if (ppl < 1) {
                return; // this case should not occur
            }
            for (var i = 0; ppl - 1 > i; i++) {
                v = v[this.path[i]];
                if (v === undefined) {
                    goahead = false;
                    break;
                }
            }
            if (goahead) {
                json.set(v, this.path[ppl - 1], value);
            }
        }
    },

    /**
     * Return the list of [object,property] pairs that have to be observed null should be returned if nothing should be
     * observed (i.e. unbound property)
     * @see $RootNode.createExpressionObservers
     */
    getObservablePairs : function (eh, vscope) {
        if (!this.bound) {
            return null;
        }
        var ppl = this.ppLength;
        if (ppl < 1) {
            return null; // this case should not occur
        }
        var v = this.isLiteral ? this.root : vscope[this.root];
        if (v === undefined) {
            return null;
        }
        if (ppl === 1) {
            // optimize standard case
            return [[v, this.path[0]]];
        } else {
            var r = [], p = this.path, pp;
            for (var i = 0; ppl > i; i++) {
                pp = p[i];
                r.push([v, pp]);
                v = v[pp];
                if (v === undefined) {
                    break;
                }
            }
            return r;
        }
    }

});

/**
 * Class representing a function reference expression (can be used for event handler callbacks or for text or
 * sub-template insertion) 3: callback expression - e.g. {e1:[3,2,"ctl","deleteItem",1,2,1,0]} 4: callback literal -
 * e.g. {e1:[4,1,myfunc,1,2,1,0]}
 */
var FuncRefExpr = klass({
    $extends : DataRefExpr,
    /**
     * Class constructor
     * @param {Array} desc the expression descriptor - e.g. [1,2,"person","getDetails",0,"arg1"]
     */
    $constructor : function (desc) {
        // call parent constructor
        DataRefExpr.$constructor.call(this, desc);
        var argIdx = desc[1] + 2;
        if (desc.length > argIdx) {
            this.args = desc.slice(argIdx);
        } else {
            this.args = null;
        }
    },

    /**
     * Return a value object associated to the function reference if the callback reference leads to an undefined
     * function, the defvalue argument is returned e.g. {fn:[object ref],scope:[object ref],args:[argument array]} -
     * args and scope properties can be null
     */
    getFuncRef : function (vscope, defvalue) {
        var v = this.isLiteral ? this.root : vscope[this.root], ppl = this.ppLength, scope = null;
        if (!v) {
            // root not found
            return defvalue;
        }

        if (ppl === 1) {
            // short path for std use case
            scope = v;
            v = v[this.path[0]];
            if (v === undefined) {
                return defvalue;
            }
        } else {
            var p = this.path;
            for (var i = 0; ppl > i; i++) {
                scope = v;
                v = v[p[i]];
                if (v === undefined) {
                    return defvalue;
                }
            }
        }
        return {
            fn : v,
            scope : scope,
            args : this.args
        };
    },

    /**
     * Get the value associated to the expression in a given scope
     */
    getValue : function (vscope, eh, defvalue) {
        var res = this.executeCb({}, eh, vscope);
        return (res === undefined) ? defvalue : res;
    },

    /**
     * Execute Callback method of the Callback expressions
     */
    executeCb : function (evt, eh, vscope) {
        var v = this.getFuncRef(vscope, null);

        var fn;
        if (!v) {
            // TODO add more info about callback (debugging)
            return console.log("[hashspace event handler] Invalid callback context");
        } else {
            fn = v.fn;

            if (!fn || fn.constructor !== Function) {
                // TODO add more info about callback (debugging)
                return console.log("[hashspace event handler] Invalid callback function");
            }
        }

        // process argument list
        var cbargs = [];
        var evt1 = vscope["event"];
        vscope["event"] = evt;

        var args = this.args;
        if (args) {
            for (var i = 0, sz = args.length; sz > i; i += 2) {
                if (args[i] === 0) {
                    // this is a literal argument
                    cbargs.push(args[i + 1]);
                } else {
                    // this is an expression;
                    cbargs.push(eh.getValue(args[i + 1], vscope, null));
                }
            }
        }
        // set back original event in the scope
        if (evt1 === undefined) {
            delete vscope["event"];
        } else {
            vscope["event"] = evt1;
        }

        return fn.apply(v.scope, cbargs);
    },

    /**
     * Return the list of [object,property] pairs that have to be observed null should be returned if nothing should be
     * observed (i.e. unbound property)
     * @see $RootNode.createExpressionObservers
     */
    getObservablePairs : function (eh, vscope) {
        // call the parent method for the method root
        var r = DataRefExpr.getObservablePairs.call(this, eh, vscope);

        // get the observable pairs for each of the function arguments

        return r;
    }
});

/**
 * Class representing a function expression (used to represent a javascript expression such as {person.age+1}) 6:
 * function expression - e.g. {e1:[6,function(a0,a1){return a0+a1;},2,3]}
 */
var FuncExpr = klass({
    /**
     * Class constructor
     * @param {Array} desc the expression descriptor - e.g. [6,function(a0,a1){return a0+a1;},2,3]
     */
    $constructor : function (desc, exphandler) {
        // call parent constructor
        this.fn = desc[1];
        this.eh = exphandler;
        var argLength = desc.length - 2;
        if (argLength > 0) {
            this.args = desc.slice(2);
        } else {
            this.args = null;
        }
    },

    /**
     * Return the value processed by the function expression if one of the argument is undefined and leads to an invalid
     * execution, the defvalue argument is returned
     */
    getValue : function (vscope, eh, defvalue) {
        if (!this.args) {
            try {
                return this.fn.call({});
            } catch (ex) {
                return defvalue;
            }
        } else {
            var argvalues = [];
            for (var i = 0, sz = this.args.length; sz > i; i++) {
                argvalues[i] = this.eh.getValue(this.args[i], vscope, null);
            }
            try {
                var r = this.fn.apply({}, argvalues);
                return r;
            } catch (ex) {
                return defvalue;
            }

        }
    },

    /**
     * Return the list of [object,property] pairs that have to be observed null should be returned if nothing should be
     * observed (i.e. unbound property)
     * @see $RootNode.createExpressionObservers
     */
    getObservablePairs : function (eh, vscope) {
        // TODO return observable pairs for each of the function aguments
        return null;
    }
});
