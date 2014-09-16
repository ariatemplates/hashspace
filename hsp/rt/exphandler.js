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
    json = require("../json"),
    exparser = require("../expressions/parser"),
    exobservable = require("../expressions/observable"),
    exmanipulator = require("../expressions/manipulator");

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
     * 7: dynamic data reference - e.g. {e1:[7,2,function(i,a0,a1) {return [a0,a1][i];},2,3]}
     * 9: raw expression to be processed by the pratt parser - e.g. {e1:[9,"foo.bar.baz()"}
     * @param {Boolean} observeTarget if true the targeted data objects will be also observed (e.g. foreach collections) - default:false
     */
    $constructor : function (edef,observeTarget) {
        this.observeTarget=(observeTarget===true);
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
                    exp = new DataRefExpr(v,this);
                } else if (etype === 3 || etype === 4) {
                    // function call expression
                    exp = new FuncRefExpr(v, this);
                } else if (etype === 6) {
                    // function expression
                    exp = new FuncExpr(v, this);
                } else if (etype === 7) {
                    exp = new DynRefExpr(v, this);
                } else if (etype === 9) {
                    exp = new PrattExpr(v, this);
                } else {
                    log.warning("Unsupported expression type: " + etype);
                }
                if (exp)
                    this.exps[key] = exp;
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

/**
 * Little class representing literal expressions 5: literal value - e.g. {e1:[5,"some value"]}
 */
var LiteralExpr = klass({
    bound:false,

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
     * @param {ExpHandler} eh the associated expression handler
     */
    $constructor : function (desc,eh) {
        var etype = desc[0], pl = desc[1], isLiteral = (etype === 2 || etype === 4), root, path = [], ppl; // pl: path
                                                                                                            // length
        if (!isLiteral) {
            // e.g. {e1:[0,1,"item_key"]} >> this is a scope variable
            root = "scope";
            path = desc.slice(2, pl + 2);
            ppl = pl;
        } else {
            root = desc[2];
            path = desc.slice(3, pl + 2);
            ppl = pl - 1;
        }

        this.bound = (etype === 1); // literal data ref are considered unbound
        this.observeTarget=eh.observeTarget && this.bound;
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

        if (v===undefined || v===null) {
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
                if (v === undefined || v===null) {
                    return defvalue;
                }
            }
        }

        return (v===undefined || v===null)? defvalue : v;
    },

    /**
     * Set the value in the data object referenced by the current expression in the current vscope This method shall be
     * used by input elements to push DOM value changes in the data model
     */
    setValue : function (vscope, value) {
        if (this.isLiteral && this.ppLength <= 0) {
            log.warning("[DataRefExpr.setValue] Global literal values cannot be updated from the DOM - please use object referenes");
        } else {
            var v = this.isLiteral ? this.root : vscope[this.root], ppl = this.ppLength, goahead = true;
            if (ppl < 1) {
                return; // this case should not occur
            }
            if (ppl===1) {
                if (!this.isLiteral) {
                    v=ExpHandler.getScopeOwner(this.path[0], vscope);
                }
            } else {
                for (var i = 0; ppl - 1 > i; i++) {
                    v = v[this.path[i]];
                    if (v === undefined || v===null) {
                        goahead = false;
                        break;
                    }
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
        var ppl = this.ppLength, p = this.path;
        if (ppl < 1) {
            return null; // this case should not occur
        }
        var v = this.root, r=null;
        if (!this.isLiteral) {
            v = ExpHandler.getScopeOwner(p[0], vscope);
            if (v===null) {
                // we try to observe a property that has not been created yet
                // and it will be created on the current scope (cf. let)
                v=vscope;
            }
        }
        if (v === undefined || v===null) {
            return null;
        }
        if (ppl === 1) {
            // optimize standard case
            r = [[v, p[0]]];
            v = v[p[0]];
        } else {
            var r = [], pp;
            for (var i = 0; ppl > i; i++) {
                pp = p[i];
                r.push([v, pp]);
                v = v[pp];
                if (v === undefined || v===null) {
                    break;
                }
            }
        }
        if (this.observeTarget && v!==undefined && v!==null) {
            r.push([v,null]);
        }
        return r;
    }

});

/**
 * Class representing a function reference expression (can be used for event handler callbacks or for text or
 * sub-template insertion) 3: callback expression - e.g. {e1:[3,2,"ctl","deleteItem",1,2,1,0]} 4: callback literal -
 * e.g. {e1:[4,1,myfunc,1,2,1,0]}
 */
var FuncRefExpr = klass({
    $extends : DataRefExpr,
    bound : false, // default bound value

    /**
     * Class constructor
     * @param {Array} desc the expression descriptor - e.g. [1,2,"person","getDetails",0,"arg1"]
     */
    $constructor : function (desc,eh) {
        var etype = desc[0];
        // call parent constructor
        DataRefExpr.$constructor.call(this, desc, eh);
        this.bound = (etype === 3); // literal data ref are considered unbound
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
            if (v === undefined || v===null) {
                return defvalue;
            }
        } else {
            var p = this.path;
            for (var i = 0; ppl > i; i++) {
                scope = v;
                v = v[p[i]];
                if (v === undefined || v===null) {
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
        var res = this.executeCb(null, eh, vscope);
        return (res === undefined || res===null) ? defvalue : res;
    },

    /**
     * Execute Callback method of the Callback expressions
     */
    executeCb : function (evt, eh, vscope) {
        var v = this.getFuncRef(vscope, null);

        var fn, info="";
        if (!v) {
            if (this.path && this.path.length>0) {
                info=this.path[0];
            }
            return log.error("[function expression] Invalid reference: "+info);
        } else {
            fn = v.fn;

            if (!fn || !fn.apply || fn.apply.constructor !== Function) {
                info=this.path? this.path.join('.') : "";
                return log.error("[function expression] Object is not a function or has no apply() method: "+info);
            }
        }

        // process argument list
        var cbargs = [];
        var evt1 = vscope["event"];
        vscope["event"] = evt? evt : {};

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

        if (fn.constructor === Function) {
            // if the function call corresponds to an event handler, the function context is the current hashspace scope
            return fn.apply(v.scope, cbargs);
        } else {
            // fn is an object with the apply() method
            return fn.apply.apply(fn,cbargs);
        }
    },

    /**
     * Return the list of [object,property] pairs that have to be observed null should be returned if nothing should be
     * observed (i.e. unbound property)
     * @see $RootNode.createExpressionObservers
     */
    getObservablePairs : function (eh, vscope) {
        // call the parent method for the method root
        var r = DataRefExpr.getObservablePairs.call(this, eh, vscope);

        // add a new pair to observe the object corresponding to the 'this' context of the function
        if (this.bound && r && r.length>=1) {
            var sz=r.length,
                lastRefOwner=r[sz-1][0],
                lastRef=lastRefOwner[r[sz-1][1]];
            if (lastRef.constructor === Function) {
                // lastRef is a function - so we observe all properties of its context
                if (sz>1) {
                    r.push([lastRefOwner,null]);
                }
            } else {
                // lastRef is an object with an apply method - so we observe all properties of this object
                r.push([lastRef,null]);
            }
        }
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
        // Observable pairs are returned by the sub-expressions associated to the function arguments
        return null;
    }
});

/**
 * Class representing a dynamic data reference expression (used for data paths containing dynamic parts with the [] syntax)
 * e.g. {person[person.name].foo} will be represented as:
 * { e1:[7,3,function(i,a0,a1) {return [a0,a1,"foo"][i];},2,3],
 *   e2:[1,1,"person"],
 *   e3:[1,2,"person","name"] }
 * where 7 = expression type
 *       3 = number of fragments in the path ( person + person.name + foo) - NB: first fragment may have the a.b.c form
 *       function(...) = function to get the value of each path fragment
 *       2,3 = index of the subexpressions required to calculate the fragment values
 */
var DynRefExpr = klass({
    /**
     * Class constructor
     * @param {Array} desc the expression descriptor - e.g. [7,3,function(i,a0,a1) {return [a0,a1,"foo"][i];},2,3]
     * @param {ExpHandler} eh the expression handler that manages this expression
     */
    $constructor : function (desc, eh) {
        // call parent constructor
        this.nbrOfFragments = desc[1];
        this.fn = desc[2];
        this.eh = eh;
        this.observeTarget=eh.observeTarget;
        this.opairs = null; // observable pairs (if null == non initialized)
        var argLength = desc.length - 3;
        if (argLength > 0) {
            this.args = desc.slice(3);
        } else {
            this.args = null;
        }
    },


    /**
     * Return the value targeted by this expression for the given scope
     */
    getValue : function (vscope, eh, defvalue) {
        // calculate the value of each argument
        var pfragments=this.getFragments(vscope), op=this.opairs=[];

        if (pfragments===null) {
            return defvalue;
        }

        // calculate the value of each fragment and the resulting value
        var v=null,fragment;
        for (var i = 0; pfragments.length>i; i++) {
            fragment=pfragments[i];
            if (i === 0) {
                v=fragment;
            } else {
                if (typeof v === "object") {
                    op.push([v,fragment]);
                    v=v[fragment];
                } else {
                    return defvalue;
                }
                if (v === undefined || v === null) {
                    return defvalue;
                }
            }
        }
        if (v && this.observeTarget) {
            op.push([v,null]);
        }
        return v;
    },

    /**
     * Process and return the value of the fragments that compose the expression for the given scope
     * @return {Array} the list of fragments (can be empty) - or null if an error occurred
     */
    getFragments:function(vscope) {
        var argvalues=[], pfragments=[];
        if (this.args) {
            for (var i = 0; this.args.length>i; i++) {
                argvalues[i+1] = this.eh.getValue(this.args[i], vscope, null);
            }
        }
        // calculate the value of each fragment and the resulting value
        for (var i = 0; this.nbrOfFragments>i; i++) {
            try {
                argvalues[0]=i;
                pfragments[i]=this.fn.apply({}, argvalues);
            } catch (ex) {
                return null;
            }
        }
        return pfragments;
    },

    /**
     * Set the value in the data object referenced by the current path
     * This method shall be used by input elements to push DOM value changes in the data model
     */
    setValue : function (vscope, value) {
        var pfragments=this.getFragments(vscope);

        if (pfragments.length<2) {
            log.error("[DynRefExpr.setValue] Invalid expression: "+this.fn.toString());
        } else {
            var v,fragment,sz=pfragments.length;
            for (var i = 0; sz-1>i; i++) {
                fragment=pfragments[i];
                if (i === 0) {
                    v=fragment;
                } else {
                    if (typeof v === "object") {
                        v=v[fragment];
                    } else {
                        return;
                    }
                    if (v === undefined || v === null) {
                        return;
                    }
                }
                json.set(v, pfragments[sz-1], value);
            }
        }
    },

    /**
     * Return the list of [object,property] pairs that have to be observed null should be returned if nothing should be
     * observed (i.e. unbound property)
     * @see $RootNode.createExpressionObservers
     */
    getObservablePairs : function (eh, vscope) {
        // get Value also updates the opairs array
        this.getValue(vscope,eh,"");
        return this.opairs;
    }
});
