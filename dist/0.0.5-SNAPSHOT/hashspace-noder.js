(function(define) {
    define("hsp/json.js", [], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        var AP = Array.prototype;
        var $splice = AP.splice;
        var $push = AP.push;
        var $shift = AP.shift;
        var $pop = AP.pop;
        var $reverse = AP.reverse;
        var $sort = AP.sort;
        var $unshift = AP.unshift;
        /**
 * Override Array splice to detect changes an trigger observer callbacks - same arguments as Array.splice:
 * cf. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
 **/
        Array.prototype.splice = function(index, howMany) {
            // Note change set doesn't comply with object.observe specs (should be a list of change descriptors)
            // but we don't need a more complex implementation for hashspace
            if (this[OBSERVER_PROPERTY]) {
                // this array is observed
                var sz1 = this.length;
                var res = $splice.apply(this, arguments), sz2 = this.length;
                // NB: splice is not a valid change type according to Object.observe spec
                var chgset = [ changeDesc(this, index, null, null, "splice") ];
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
        Array.prototype.splice2 = function(index, howMany, arrayArg) {
            var sz1 = this.length;
            if (!arrayArg) {
                arrayArg = [];
            }
            arrayArg.splice(0, 0, index, howMany);
            var res = $splice.apply(this, arrayArg);
            if (this[OBSERVER_PROPERTY]) {
                var sz2 = this.length;
                // NB: splice is not a valid change type according to Object.observe spec
                var chgset = [ changeDesc(this, index, null, null, "splice") ];
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
        Array.prototype.push = function() {
            if (this[OBSERVER_PROPERTY]) {
                // this array is observed
                var a = arguments, asz = a.length, sz1 = this.length, arg, sz2, chgset = [];
                if (asz < 1) {
                    return sz1;
                }
                if (asz == 1) {
                    sz2 = $push.call(this, a[0]);
                    chgset.push(changeDesc(this, sz1, a[0], null, "new"));
                } else {
                    for (var i = 0; asz > i; i++) {
                        arg = a[i];
                        chgset[asz - i - 1] = {
                            type: "new",
                            object: this,
                            name: sz1 + i,
                            newValue: arg
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
        Array.prototype.shift = function() {
            // Note change set doesn't comply with object.observe specs - same as for splice
            if (this[OBSERVER_PROPERTY]) {
                var sz1 = this.length;
                var res = $shift.call(this);
                var sz2 = this.length;
                var chgset = [ changeDesc(this, 0, null, null, "shift") ];
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
        Array.prototype.unshift = function() {
            if (this[OBSERVER_PROPERTY]) {
                var sz1 = this.length;
                $unshift.apply(this, arguments);
                var sz2 = this.length;
                var chgset = [ changeDesc(this, 0, null, null, "unshift") ];
                if (sz1 !== sz2) {
                    chgset.push(changeDesc(this, "length", sz2, sz1, "updated"));
                }
                callObservers(this, chgset);
                return sz2;
            } else {
                return $unshift.apply(this, arguments);
            }
        };
        /**
 * Removes the last element from an array and returns that value to the caller.
 */
        Array.prototype.pop = function() {
            // Note change set doesn't comply with object.observe specs - same as for splice
            if (this[OBSERVER_PROPERTY]) {
                var sz1 = this.length;
                var res = $pop.call(this);
                var sz2 = this.length;
                var chgset = [ changeDesc(this, 0, null, null, "pop") ];
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
        Array.prototype.reverse = function() {
            // Note change set doesn't comply with object.observe specs - same as for splice
            var res = $reverse.call(this);
            callObservers(this, [ changeDesc(this, 0, null, null, "reverse") ]);
            return res;
        };
        /**
 * Sort the array content
 */
        Array.prototype.sort = function(sortFunction) {
            // Note change set doesn't comply with object.observe specs - same as for splice
            var res;
            //For IE8 which raises 'JScript object expected' errors when sortFunction is undefined
            if (sortFunction) {
                res = $sort.call(this, sortFunction);
            } else {
                res = $sort.call(this);
            }
            callObservers(this, [ changeDesc(this, 0, null, null, "sort") ]);
            return res;
        };
        /**
 * Return a change descriptor to use for callObservers()
 */
        function changeDesc(object, property, newval, oldval, chgtype) {
            return {
                type: chgtype,
                object: object,
                name: property,
                newValue: newval,
                oldValue: oldval
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
            MD_OBSERVERS: OBSERVER_PROPERTY,
            /**
     * Sets a value in a JSON object (including arrays) and automatically notifies all observers of the change
     */
            $set: function(object, property, value) {
                if (object[OBSERVER_PROPERTY]) {
                    var exists = ownProperty.call(object, property), oldVal = object[property], sz1 = object.length, chgset = null;
                    object[property] = value;
                    if (!exists) {
                        chgset = [ changeDesc(object, property, value, oldVal, "new") ];
                    } else if (oldVal !== value) {
                        // do nothing if the value did not change or was not created:
                        chgset = [ changeDesc(object, property, value, oldVal, "updated") ];
                    }
                    if (object.constructor === Array) {
                        var sz2 = object.length;
                        if (sz1 !== sz2) {
                            if (!chgset) {
                                chgset = [];
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
            $delete: function(object, property, value) {
                if (object[OBSERVER_PROPERTY]) {
                    var existed = ownProperty.call(object, property), oldVal = object[property];
                    delete object[property];
                    if (existed) {
                        var chgset = [ changeDesc(object, property, object[property], oldVal, "deleted") ];
                        callObservers(object, chgset);
                    }
                } else {
                    delete object[property];
                }
            },
            /**
     * Adds an observer to an object.
     */
            observe: function(object, callback) {
                observe(object, callback, OBSERVER_PROPERTY);
            },
            /**
     * Removes a callback from the observer list
     */
            unobserve: function(object, callback) {
                unobserve(object, callback, OBSERVER_PROPERTY);
            }
        };
        module.exports["set"] = module.exports.$set;
        function observe(object, callback, metaProperty) {
            // metaProperty = OBSERVER_PROPERTY || EVTOBSERVER_PROPERTY
            if (typeof object != "object") return;
            if (!object[metaProperty]) object[metaProperty] = [];
            object[metaProperty].push(callback);
        }
        function unobserve(object, callback, metaProperty) {
            // metaProperty = OBSERVER_PROPERTY || EVTOBSERVER_PROPERTY
            if (typeof object != "object") return;
            var obs = object[metaProperty];
            if (!obs) return;
            var elt, res = [];
            for (var i = 0, sz = obs.length; sz > i; i++) {
                elt = obs[i];
                if (elt !== callback) res.push(elt);
            }
            // delete observer property if there is no more observers
            if (res.length === 0) {
                delete object[metaProperty];
            } else {
                object[metaProperty] = res;
            }
        }
    });
    define("hsp/$set.js", [ "./json" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
        var json = require("./json");
        /**
 * Shortcut to json.$set()
 */
        var $set = module.exports = function(object, property, value) {
            return json.$set(object, property, value);
        };
        /**
 * Shortcut to json.$delete()
 */
        $set.del = json.$delete;
        var cachedOperators = {};
        var acceptedOperators = /^([-+*%\/&^|]|<<|>>|>>>)?=$/;
        function createOperator(operator) {
            if (!acceptedOperators.test(operator)) {
                throw new Error("Invalid operator: " + operator);
            }
            /*jshint -W061,-W093 */
            return cachedOperators[operator] = Function("a", "b", "a" + operator + "b;return a;");
        }
        /**
 * Does an assignment operation but also notifies listeners.
 * <code>$set.op(a,b,"+=",c)</code> is equivalent to <code>a[b] += c</code>
 */
        $set.op = function(object, property, operator, value) {
            var opFn = cachedOperators[operator] || createOperator(operator);
            return $set(object, property, opFn(object[property], value));
        };
        /**
 * Increments a property on an object and notifies listeners.
 * <code>$set.inc(a,b)</code> is equivalent to <code>a[b]++</code>
 */
        $set.inc = function(object, property) {
            var previousValue = object[property];
            $set(object, property, previousValue + 1);
            return previousValue;
        };
        /**
 * Decrements a property on an object and notifies listeners.
 * <code>$set.dec(a,b)</code> is equivalent to <code>a[b]--</code>
 */
        $set.dec = function(object, property) {
            var previousValue = object[property];
            $set(object, property, previousValue - 1);
            return previousValue;
        };
    });
    define("hsp/es5.js", [], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        // Add some ECMAScript 5 support for IE 6/7/8
        // all polyfills from Mozilla Developer Network
        // Array.indexOf
        if (!Array.prototype.indexOf) {
            Array.prototype.indexOf = function(searchElement) {
                "use strict";
                if (this == null) {
                    throw new TypeError();
                }
                var t = Object(this);
                var len = t.length >>> 0;
                if (len === 0) {
                    return -1;
                }
                var n = 0;
                if (arguments.length > 1) {
                    n = Number(arguments[1]);
                    if (n != n) {
                        // shortcut for verifying if it's NaN
                        n = 0;
                    } else if (n !== 0 && n != Infinity && n != -Infinity) {
                        n = (n > 0 || -1) * Math.floor(Math.abs(n));
                    }
                }
                if (n >= len) {
                    return -1;
                }
                var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
                for (;k < len; k++) {
                    if (k in t && t[k] === searchElement) {
                        return k;
                    }
                }
                return -1;
            };
        }
        // Function.bind
        if (!Function.prototype.bind) {
            Function.prototype.bind = function(oThis) {
                if (typeof this !== "function") {
                    // closest thing possible to the ECMAScript 5 internal IsCallable function
                    throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
                }
                var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, fNOP = function() {}, fBound = function() {
                    return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
                };
                fNOP.prototype = this.prototype;
                fBound.prototype = new fNOP();
                return fBound;
            };
        }
        // Object.create
        if (typeof Object.create != "function") {
            (function() {
                var F = function() {};
                Object.create = function(o) {
                    if (arguments.length > 1) {
                        throw Error("Second argument not supported");
                    }
                    if (typeof o != "object") {
                        throw TypeError("Argument must be an object");
                    }
                    F.prototype = o;
                    return new F();
                };
            })();
        }
    });
    define("hsp/klass.js", [], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
 * @param {JSON} klassdef the object prototype containing the following special properties $constructor: {function} the
 * object constructor (optional - a new function is automatically created if not provided)
 * @return {function} the object constructor
 */
        var klass = function(klassdef) {
            var $c = klassdef.$constructor;
            if (!$c) {
                // no constructor is provided - let's create one
                var ext = klassdef.$extends;
                if (ext) {
                    $c = function() {
                        ext.apply(this, arguments);
                    };
                } else {
                    $c = new Function();
                }
                klassdef.$constructor = $c;
            }
            if (klassdef.$extends) {
                // create the new prototype from the parent prototype
                if (!klassdef.$extends.prototype) throw new Error("[klass] $extends attribute must be a function");
                var p = Object.create(klassdef.$extends.prototype);
                // add prototype properties to the prototype and to the constructor function to allow syntax shortcuts
                // such as ClassA.$constructor()
                for (var k in klassdef) {
                    if (klassdef.hasOwnProperty(k)) {
                        p[k] = $c[k] = klassdef[k];
                    }
                }
                $c.prototype = p;
            } else {
                $c.prototype = klassdef;
                // add prototype properties to the constructor function to allow syntax shortcuts
                // such as ClassA.$constructor()
                for (var k in klassdef) {
                    if (klassdef.hasOwnProperty(k)) {
                        $c[k] = klassdef[k];
                    }
                }
            }
            return $c;
        };
        var metaDataCounter = 0;
        /**
 * Generate a unique meta-data prefix Can be used to store object-specific data into another object without much risk of
 * collision (i.e. provided that the object doesn't use properties with the "+XXXX:XXXXXXXX" pattern)
 */
        function createMetaDataPrefix() {
            metaDataCounter++;
            return "+" + metaDataCounter + ":";
        }
        klass.createMetaDataPrefix = createMetaDataPrefix;
        module.exports = klass;
    });
    define("hsp/propobserver.js", [ "./klass", "./json" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        var klass = require("./klass");
        var json = require("./json");
        var ALL = "**ALL**";
        /**
 * Property observer - used by $Rootnode to gather all observers for one given object
 */
        var PropObserver = klass({
            $constructor: function(target) {
                this.id = 0;
                // optional id that can be set by the PropObserver user
                this.target = target;
                this.props = {};
                // map of all properties to observe
                var self = this;
                // create the callback to assign to the target through json.observe
                this.callback = function(chglist) {
                    PropObserver_notifyChanges.call(self, chglist);
                };
                json.observe(target, this.callback);
            },
            /**
     * Safely delete all internal dependencies Must be called before deleting the object
     */
            $dispose: function() {
                json.unobserve(this.target, this.callback);
                this.props = null;
                this.callback = null;
                this.target = null;
            },
            /**
     * Add a new observer for a given property
     * @param {object} observer object with a onPropChange() method
     * @param {string} property the property name to observe (optional)
     */
            addObserver: function(observer, property) {
                if (!property) property = ALL;
                var arr = this.props[property];
                if (!arr) {
                    // property is not observed yet
                    arr = [];
                    this.props[property] = arr;
                }
                arr.push(observer);
            },
            /**
     * Remove an observer - previously added with addObserver()
     * @param {object} observer object with a onPropChange() method
     * @param {string} property the property name to observe (optional)
     */
            rmObserver: function(observer, property) {
                if (!property) property = ALL;
                var arr = this.props[property];
                if (arr) {
                    for (var i = 0, sz = arr.length; sz > i; i++) {
                        if (arr[i] === observer) {
                            arr.splice(i, 1);
                            sz -= 1;
                            i -= 1;
                        }
                    }
                    if (arr.length === 0) {
                        this.props[property] = null;
                    }
                }
            }
        });
        /**
 * Notify the change to the registered observers i.e. call their onPropChange method with the change description as
 * parameter
 * @private
 */
        function PropObserver_notifyChanges(chglist) {
            var c;
            for (var i = 0, sz = chglist.length; sz > i; i++) {
                c = chglist[i];
                if (!c) continue;
                // check if we listen to this property
                if (this.props[c.name]) {
                    PropObserver_notifyChange(this, c, c.name);
                }
            }
            if (this.props[ALL]) {
                PropObserver_notifyChange(this, c, ALL);
            }
        }
        function PropObserver_notifyChange(po, chge, chgName) {
            var plist = po.props[chgName];
            for (var j = 0, sz2 = plist.length; sz2 > j; j++) {
                plist[j].onPropChange(chge);
            }
        }
        module.exports = PropObserver;
    });
    define("hsp/rt/log.js", [], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        var loggers = [];
        var validTypes = {
            debug: true,
            error: true,
            warning: true,
            info: true
        };
        /**
 * Analyse log arguments to determine if the last argument is a meta-data argument - cf. log()
 * @param {Array} args array of Object or String - last item may be a meta-data argument
 * @return {Object} structure composed of 2 parts
 *       items: {Object|String} items to be logged
 *       metaData: {Object} - empty object if not found
 */
        function getLogArgs(args) {
            // iterate over args to create a real array
            if (!args || !args.length) {
                return {
                    items: [],
                    metaData: {}
                };
            }
            var items = [], md = {}, itm;
            for (var i = 0, sz = args.length; sz > i; i++) {
                itm = args[i];
                if (i > 0 && i === sz - 1) {
                    // itm could be a meta-data argument
                    if (typeof itm === "object" && itm.type && typeof itm.type === "string" && validTypes[itm.type]) {
                        // this is a meta-data argument
                        md = itm;
                    } else {
                        items[i] = itm;
                    }
                } else {
                    items[i] = itm;
                }
            }
            return {
                items: items,
                metaData: md
            };
        }
        /**
 * Log a message - support an indefinite nbr of arguments such as console.log()
 * Last argument can be an optional object containing meta data associated to the log
 * @param {Object|String} the first piece to log
 * @param {Object|String} the 2nd piece to log
 * ...
 * @param {Object|String} the nth piece to log
 * @parma {Object} context data associated to the message and that can be used by specialized loggers
 *       to better integrate the logs in the calling application. These data should contain all the variables
 *       integrated in the msg argument (for instance to allow for localization in a different language)
 *       The following properties are recommended, and should be considered as reserved keywords 
 *       (i.e. they should not be used for another purpose)
 *           { 
 *               type: {String} Message type: "info", "error", "warning" or "debug" 
 *               id: {String|Number} Unique message identifier       
 *               message: {String} The default message - in english (will be automatically set from the msg argument)
 *               file: {String} File name associated to the message 
 *               dir: {String} Directory path corresponding to the file
 *               code: {String} Some piece of code associated to the message
 *               line: {Number} Line number associated to the message (e.g. for errors)
 *               column: {Number} Column number associated to the message (e.g. for errors)
 *           }
 * NB: what determines if the last argument is an object or the meta-data is the presence of a valid type, and
 *     an argument index > 0
 */
        var log = function() {
            logMsg("debug", arguments, false);
        };
        /**
 * Add a logger to the logger list
 * The logger function will be added to the first position of the logger list, and will have the 
 * possibilty to prevent other loggers to get the message by returning false.
 * @param {Function} logger a logger function that will receive a message object as argument
 *       the message object has the same structure as the 2nd argument of the log() method
 */
        log.addLogger = function(logger) {
            if (logger) {
                loggers.unshift(logger);
            }
        };
        /**
 * Remove a specific logger from the logger list
 */
        log.removeLogger = function(logger) {
            if (loggers && loggers.length) {
                for (var i = 0, sz = loggers.length; sz > i; i++) {
                    if (loggers[i] === logger) {
                        loggers.splice(i, 1);
                        sz -= 1;
                        i -= 1;
                    }
                }
            }
        };
        /**
 * Empty the logger list
 */
        log.removeAllLoggers = function() {
            loggers = [];
        };
        /**
 * Tell how many loggers are registered
 */
        log.getNbrOfLoggers = function() {
            return loggers.length;
        };
        /**
 * Log an error message
 * Same interface as log() but with an error type
 */
        log.error = function() {
            logMsg("error", arguments, true);
        };
        /**
 * Log a warning message
 * Same interface as log() but with a warning type
 */
        log.warning = function() {
            logMsg("warning", arguments, true);
        };
        /**
 * Log an info message
 * Same interface as log() but with an info type
 */
        log.info = function() {
            logMsg("info", arguments, true);
        };
        /**
 * Return the default formatting associated to a message
 * @param {Object} msg the message object - same structure as for the logger argument
 *        cf. addLogger()
 * @return {String} the formatted message
 */
        log.format = function(msg) {
            var out = [];
            out.splice(out.length, 0, "[", msg.type);
            if (msg.file) {
                out.splice(out.length, 0, ": ", msg.file);
            }
            out.splice(out.length, 0, "] ", msg.message);
            if (msg.line || msg.column) {
                out.splice(out.length, 0, " (");
                if (msg.line) {
                    out.splice(out.length, 0, "line:", msg.line);
                }
                if (msg.column) {
                    if (msg.line) {
                        out.splice(out.length, 0, ", column:", msg.column);
                    } else {
                        out.splice(out.length, 0, "column:", msg.column);
                    }
                }
                out.splice(out.length, 0, ")");
            }
            if (msg.code) {
                out.splice(out.length, 0, "\r\n>> ", msg.code);
            }
            return out.join("");
        };
        function logMsg(type, args, forceType) {
            var args = getLogArgs(args);
            var items = args.items, md = args.metaData, sz = items.length, s;
            if (forceType || !md.type) {
                md.type = type;
            }
            if (sz === 0) {
                md.message = "";
            } else if (sz === 1) {
                md.message = formatValue(items[0]);
            } else {
                // translate items to log message and concatenate them
                var out = [];
                for (var i = 0; sz > i; i++) {
                    s = formatValue(items[i]);
                    if (s !== "") {
                        out.push(s);
                    }
                }
                md.message = out.join(" ");
            }
            if (loggers && loggers.length) {
                var stop = false;
                for (var i = 0, sz = loggers.length; sz > i; i++) {
                    stop = !loggers[i](md);
                    if (stop) {
                        break;
                    }
                }
            } else {
                defaultLogger(md);
            }
        }
        function defaultLogger(msg) {
            var methods = {
                info: "info",
                error: "error",
                warning: "warn",
                debug: "log"
            };
            if (typeof console !== undefined) {
                console[methods[msg.type]](log.format(msg));
            }
        }
        /**
 * Sort function
 */
        function lexicalSort(a, b) {
            if (a > b) return 1;
            if (a < b) return -1;
            return 0;
        }
        /**
 * Format a JS entity for the log
 * @param v {Object} the value to format
 * @param depth {Number} the formatting of objects and arrays (default: 1)
 */
        function formatValue(v, depth) {
            if (depth === undefined || depth === null) {
                depth = 1;
            }
            var tp = typeof v, val;
            if (v === null) {
                return "null";
            } else if (v === undefined) {
                return "undefined";
            } else if (tp === "object") {
                if (depth > 0) {
                    var properties = [];
                    if (v.constructor === Array) {
                        for (var i = 0, sz = v.length; sz > i; i++) {
                            val = v[i];
                            if (typeof val === "string") {
                                properties.push(i + ':"' + formatValue(val, depth - 1) + '"');
                            } else {
                                properties.push(i + ":" + formatValue(val, depth - 1));
                            }
                        }
                        return "[" + properties.join(", ") + "]";
                    } else {
                        var keys = [];
                        for (var k in v) {
                            if (k.match(/^\+/)) {
                                // this is a meta-data property
                                continue;
                            }
                            keys.push(k);
                        }
                        // sort keys as IE 8 uses a different order than other browsers
                        keys.sort(lexicalSort);
                        for (var i = 0, sz = keys.length; sz > i; i++) {
                            val = v[keys[i]];
                            if (typeof val === "string") {
                                properties.push(keys[i] + ':"' + formatValue(val, depth - 1) + '"');
                            } else {
                                properties.push(keys[i] + ":" + formatValue(val, depth - 1));
                            }
                        }
                        return "{" + properties.join(", ") + "}";
                    }
                } else {
                    if (v.constructor === Array) {
                        return "Array[" + v.length + "]";
                    } else if (v.constructor === Function) {
                        return "Function";
                    } else {
                        return "Object";
                    }
                }
            } else if (tp === "function") {
                return "Function";
            } else {
                return "" + v;
            }
        }
        module.exports = log;
    });
    define("hsp/rt/document.js", [], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        // Document object wrapper
        // used by the hash_space runtime
        var doc = window.document;
        module.exports.createDocumentFragment = function() {
            return doc.createDocumentFragment();
        };
        module.exports.createElement = function(type) {
            return doc.createElement(type);
        };
        module.exports.createElementNS = function(ns, type) {
            return doc.createElementNS(ns, type);
        };
        module.exports.createTextNode = function(text) {
            return doc.createTextNode(text);
        };
        module.exports.createComment = function(text) {
            return doc.createComment(text);
        };
        module.exports.getElementById = function(eltId) {
            return doc.getElementById(eltId);
        };
        if (doc.createEvent) {
            module.exports.createEvent = function() {
                return doc.createEvent.apply(doc, arguments);
            };
        }
        if (doc.createEventObject) {
            module.exports.createEventObject = function() {
                return doc.createEventObject.apply(doc, arguments);
            };
        }
    });
    define("hsp/expressions/lexer.js", [], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        function isWhitespace(ch) {
            return ch === "	" || ch === "\r" || ch === "\n" || ch === " ";
        }
        function isQuote(ch) {
            return ch === '"' || ch === "'";
        }
        function isDigit(ch) {
            return ch >= "0" && ch <= "9";
        }
        function isIdentifierStart(ch) {
            return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch === "$" || ch === "_";
        }
        function isIdentifierPart(ch) {
            return isIdentifierStart(ch) || isDigit(ch);
        }
        function isOperator(ch) {
            return "+-*/%!|&.,=<>()[]{}?:".indexOf(ch) > -1;
        }
        var opSuffixes = {
            "|": "|",
            "&": "&",
            "=": "=<>!"
        };
        function isSuffixOperator(ch, previous) {
            var validPrevious = opSuffixes[ch];
            return validPrevious && validPrevious.indexOf(previous) > -1;
        }
        /**
 * A lexing function
 * @param input - a string of characters to be tokenised
 * @returns {Array} - an array of token objects with the following properties:
 *  - t: type of token, one of: num (number), idn (identifier), str (string), opr (operator)
 *  - v: value of a token
 *  - f: from where (index) a given token starts in the input
 *  @throws {Error} when an unknown character is detected in the input (ex.: ^)
 */
        module.exports = function(initialInput) {
            var input, EOF = String.fromCharCode(0);
            var result = [];
            var i = 0, current, quote;
            //current is a character that the lexer is currently looking at
            var from, value;
            if (typeof initialInput === "string") {
                //append special EOF token to avoid constant checks for the input end
                input = initialInput + EOF;
                current = input.charAt(0);
                while (current !== EOF) {
                    //reset variables responsible for accumulating results
                    from = i;
                    value = "";
                    if (isWhitespace(current)) {
                        current = input.charAt(++i);
                    } else if (isOperator(current)) {
                        do {
                            value += current;
                            current = input.charAt(++i);
                        } while (isSuffixOperator(current, value.charAt(value.length - 1)));
                        result.push({
                            t: "opr",
                            v: value,
                            f: from
                        });
                    } else if (isIdentifierStart(current)) {
                        do {
                            value += current;
                            current = input.charAt(++i);
                        } while (isIdentifierPart(current));
                        result.push({
                            t: "idn",
                            v: value,
                            f: from
                        });
                    } else if (isQuote(current)) {
                        quote = current;
                        current = input.charAt(++i);
                        //skip the initial quote
                        while (current !== quote && current !== EOF) {
                            if (current === "\\" && input.charAt(i + 1) === quote) {
                                value += quote;
                                current = input.charAt(++i);
                            } else {
                                value += current;
                            }
                            current = input.charAt(++i);
                        }
                        if (isQuote(current)) {
                            result.push({
                                t: "str",
                                v: value,
                                f: from
                            });
                            current = input.charAt(++i);
                        } else {
                            throw new Error('Error parsing "' + initialInput + '": unfinished string at ' + from);
                        }
                    } else if (isDigit(current)) {
                        do {
                            value += current;
                            current = input.charAt(++i);
                        } while (isDigit(current) || current === ".");
                        result.push({
                            t: "num",
                            v: value.indexOf(".") > -1 ? parseFloat(value) : parseInt(value),
                            f: from
                        });
                    } else {
                        throw new Error('Error parsing "' + initialInput + '": unknown token ' + current + " at " + from);
                    }
                }
            }
            return result;
        };
    });
    define("hsp/expressions/parser.js", [ "./lexer" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
        /**
 * Code in this file is based on the work from https://github.com/douglascrockford/TDOP
 * by Douglas Crockford douglas@crockford.com
 */
        var lexer = require("./lexer");
        var SYMBOLS = {};
        var tokens, token, tokenIdx = 0;
        var BaseSymbol = {
            nud: function() {
                throw new Error("Invalid expression - missing operand for the " + this.v + " operator");
            },
            led: function() {
                throw new Error("Missing operator: " + this.v);
            }
        };
        function itself() {
            return this;
        }
        function symbol(id, bp) {
            var s = SYMBOLS[id];
            bp = bp || 0;
            if (s) {
                if (bp >= s.lbp) {
                    s.lbp = bp;
                }
            } else {
                s = Object.create(BaseSymbol);
                s.id = s.v = id;
                s.lbp = bp;
                SYMBOLS[id] = s;
            }
            return s;
        }
        function prefix(id, nud) {
            var s = symbol(id);
            s.nud = nud || function() {
                this.l = expression(70);
                this.a = "unr";
                return this;
            };
            return s;
        }
        function infix(id, bindingPower, led) {
            var s = symbol(id, bindingPower);
            s.led = led || function(left) {
                this.l = left;
                this.r = expression(bindingPower);
                this.a = "bnr";
                return this;
            };
            return s;
        }
        function infixr(id, bp, led) {
            var s = symbol(id, bp);
            s.led = led || function(left) {
                this.l = left;
                this.r = expression(bp - 1);
                this.a = "bnr";
                return this;
            };
            return s;
        }
        var constant = function(s, v) {
            var x = symbol(s);
            x.nud = function() {
                this.v = SYMBOLS[this.id].v;
                this.a = "literal";
                return this;
            };
            x.v = v;
            return x;
        };
        //define "parser rules"
        symbol("(end)");
        symbol("(identifier)").nud = itself;
        symbol("(literal)").nud = itself;
        symbol("]");
        symbol(")");
        symbol("}");
        symbol(",");
        symbol(":");
        constant("true", true);
        constant("false", false);
        constant("null", null);
        prefix("new", function() {
            var args = [];
            this.a = "bnr";
            this.l = expression(70);
            advance("(");
            if (token.v !== ")") {
                while (true) {
                    args.push(expression(0));
                    if (token.id !== ",") {
                        break;
                    }
                    advance(",");
                }
            }
            advance(")");
            this.r = args;
            return this;
        });
        prefix("-");
        prefix("!");
        prefix("(", function() {
            var e = expression(0);
            advance(")");
            return e;
        });
        prefix("[", function() {
            var a = [];
            if (token.id !== "]") {
                while (true) {
                    a.push(expression(0));
                    if (token.id !== ",") {
                        break;
                    }
                    advance(",");
                }
            }
            advance("]");
            this.l = a;
            this.a = "unr";
            return this;
        });
        prefix("{", function() {
            var a = [];
            if (token.id !== "}") {
                while (true) {
                    var n = token;
                    if (n.a !== "idn" && n.a !== "literal") {
                        throw new Error("Bad key.");
                    }
                    advance();
                    advance(":");
                    var v = expression(0);
                    v.key = n.v;
                    a.push(v);
                    if (token.id !== ",") {
                        break;
                    }
                    advance(",");
                }
            }
            advance("}");
            this.l = a;
            this.a = "unr";
            return this;
        });
        infixr("=", 10, function(left) {
            if (left.a === "idn") {
                this.l = left;
                this.l.a = "literal";
                this.r = expression(9);
                this.a = "bnr";
            } else if (left.id === "." || left.id === "[") {
                this.l = left.l;
                this.r = left.r;
                this.othr = expression(9);
                this.a = "tnr";
            } else {
                throw new Error("Invalid left-hand side in assignment: " + left.id);
            }
            return this;
        });
        infix("?", 20, function(left) {
            this.l = left;
            this.r = expression(0);
            advance(":");
            this.othr = expression(0);
            this.a = "tnr";
            return this;
        });
        infixr("&&", 30);
        infixr("||", 30);
        infixr("<", 40);
        infixr(">", 40);
        infixr("<=", 40);
        infixr(">=", 40);
        infixr("==", 40);
        infixr("!=", 40);
        infixr("===", 40);
        infixr("!==", 40);
        infix("+", 50);
        infix("-", 50);
        infix("*", 60);
        infix("/", 60);
        infix("%", 60);
        infix(".", 80, function(left) {
            this.l = left;
            if (token.a !== "idn") {
                throw new Error("Expected a property name, got:" + token.a + " at " + token.f);
            }
            token.a = "literal";
            this.r = token;
            this.a = "bnr";
            advance();
            return this;
        });
        infix("[", 80, function(left) {
            this.l = left;
            this.r = expression(0);
            this.a = "bnr";
            advance("]");
            return this;
        });
        infix("(", 70, function(left) {
            var a = [];
            if (left.id === "." || left.id === "[") {
                this.a = "tnr";
                this.l = left.l;
                this.r = left.r;
                this.othr = a;
            } else {
                this.a = "bnr";
                this.l = left;
                this.r = a;
                if (left.a !== "unr" && left.a !== "idn" && left.id !== "(" && left.id !== "&&" && left.id !== "||" && left.id !== "?") {
                    throw new Error("Expected a variable name: " + JSON.stringify(left));
                }
            }
            if (token.id !== ")") {
                while (true) {
                    a.push(expression(0));
                    if (token.id !== ",") {
                        break;
                    }
                    advance(",");
                }
            }
            advance(")");
            return this;
        });
        infixr("|", 20, function(left) {
            //token points to a pipe function here - check if the next item is equal to :
            this.l = left;
            this.r = expression(20);
            this.a = "tnr";
            this.othr = [];
            while (token.a === "opr" && token.v === ":") {
                advance();
                this.othr.push(expression(20));
            }
            return this;
        });
        function advance(id) {
            var tokenType, o, inputToken, v;
            if (id && token.id !== id) {
                throw new Error("Expected '" + id + "' but '" + token.id + "' found.");
            }
            if (tokenIdx >= tokens.length) {
                token = SYMBOLS["(end)"];
                return;
            }
            inputToken = tokens[tokenIdx];
            tokenIdx += 1;
            v = inputToken.v;
            tokenType = inputToken.t;
            if (tokenType === "idn") {
                o = SYMBOLS[v] || SYMBOLS["(identifier)"];
            } else if (tokenType === "opr") {
                o = SYMBOLS[v];
                if (!o) {
                    throw new Error("Unknown operator: " + v);
                }
            } else if (tokenType === "str" || tokenType === "num") {
                o = SYMBOLS["(literal)"];
                tokenType = "literal";
            } else {
                throw new Error("Unexpected token:" + v);
            }
            token = Object.create(o);
            //token.f  = inputToken.f;
            token.v = v;
            token.a = tokenType;
            return token;
        }
        function expression(rbp) {
            var left;
            var t = token;
            advance();
            left = t.nud();
            while (rbp < token.lbp) {
                t = token;
                advance();
                left = t.led(left);
            }
            return left;
        }
        /**
 * Expression parsing algorithm based on http://javascript.crockford.com/tdop/tdop.html
 * Other useful resources (reading material):
 * http://eli.thegreenplace.net/2010/01/02/top-down-operator-precedence-parsing/
 * http://l-lang.org/blog/TDOP---Pratt-parser-in-pictures/
 * http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
 *
 * @param input {String} - expression to parse
 * @return {Object} - parsed AST
 */
        module.exports = function(input) {
            var expr, exprs = [], previousToken;
            tokens = lexer(input);
            token = undefined;
            tokenIdx = 0;
            if (tokens.length) {
                advance();
                //get the first token
                while (token.id !== "(end)") {
                    expr = expression(0);
                    exprs.push(expr);
                    previousToken = token;
                    if (token.v === ",") {
                        advance(",");
                    }
                }
                if (previousToken.v === ",") {
                    throw new Error("Statement separator , can't be placed at the end of an expression");
                }
                return exprs.length === 1 ? exprs[0] : exprs;
            } else {
                return {
                    f: 0,
                    a: "literal",
                    v: undefined
                };
            }
        };
    });
    define("hsp/expressions/evaluator.js", [], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        function forgivingPropertyAccessor(scope, left, right) {
            return typeof left === "undefined" || left === null ? undefined : left[right];
        }
        var UNARY_OPERATORS = {
            "!": function(scope, right) {
                return !right;
            },
            "-": function(scope, right) {
                return -right;
            },
            "[": function(scope, right) {
                return right;
            },
            //array literal
            "{": function(scope, right) {
                //object literal
                var result = {}, keyVal;
                for (var i = 0; i < right.length; i++) {
                    keyVal = right[i];
                    result[keyVal.k] = keyVal.v;
                }
                return result;
            }
        };
        var BINARY_OPERATORS = {
            "+": function(scope, left, right) {
                return left + right;
            },
            "-": function(scope, left, right) {
                return left - right;
            },
            "*": function(scope, left, right) {
                return left * right;
            },
            "/": function(scope, left, right) {
                return left / right;
            },
            "%": function(scope, left, right) {
                return left % right;
            },
            "<": function(scope, left, right) {
                return left < right;
            },
            ">": function(scope, left, right) {
                return left > right;
            },
            ">=": function(scope, left, right) {
                return left >= right;
            },
            "<=": function(scope, left, right) {
                return left <= right;
            },
            "==": function(scope, left, right) {
                return left == right;
            },
            "!=": function(scope, left, right) {
                return left != right;
            },
            "===": function(scope, left, right) {
                return left === right;
            },
            "!==": function(scope, left, right) {
                return left !== right;
            },
            "||": function(scope, left, right) {
                return left || right;
            },
            "&&": function(scope, left, right) {
                return left && right;
            },
            "(": function(scope, left, right) {
                //function call on a scope
                return left.apply(left, right);
            },
            "new": function(scope, constrFunc, args) {
                //constructor invocation
                var inst = Object.create(constrFunc.prototype);
                Function.prototype.apply.call(constrFunc, inst, args);
                return inst;
            },
            ".": forgivingPropertyAccessor,
            //property access
            "[": forgivingPropertyAccessor,
            //dynamic property access
            "=": function(scope, left, right) {
                return scope[left] = right;
            }
        };
        var TERNARY_OPERATORS = {
            "(": function(scope, target, name, args) {
                //function call on an object
                return typeof target === "undefined" || target === null ? undefined : target[name].apply(target, args);
            },
            "?": function(scope, test, trueVal, falseVal) {
                return test ? trueVal : falseVal;
            },
            "|": function(scope, input, pipeFnOrObj, args, target) {
                //pipe (filter)
                var pipeFn = typeof pipeFnOrObj === "function" ? pipeFnOrObj : pipeFnOrObj["apply"];
                if (pipeFn) {
                    return pipeFn.apply(typeof pipeFnOrObj === "function" ? target : pipeFnOrObj, [ input ].concat(args));
                } else {
                    throw new Error("Pipe expression is neither a function nor an object with the apply() method");
                }
            },
            "=": function(scope, target, property, value) {
                return target[property] = value;
            }
        };
        module.exports = function getTreeValue(tree, scope) {
            var emptyScope = {};
            //empty object for functions that shouldn't be bound to any scope
            var operatorFn, result;
            var parsedVal, argExp, arrayResult;
            if (tree instanceof Array) {
                if (tree.length > 0) {
                    result = new Array(tree.length);
                    for (var i = 0; i < tree.length; i++) {
                        argExp = tree[i];
                        arrayResult = parsedVal = getTreeValue(argExp, scope);
                        if (argExp.key) {
                            arrayResult = {
                                k: argExp.key,
                                v: parsedVal
                            };
                        }
                        result[i] = arrayResult;
                    }
                } else {
                    result = [];
                }
                return result;
            }
            if (tree.a === "literal") {
                result = tree.v;
            } else if (tree.a === "idn") {
                result = scope[tree.v];
            } else if (tree.a === "unr" && UNARY_OPERATORS[tree.v]) {
                operatorFn = UNARY_OPERATORS[tree.v];
                result = operatorFn(scope, getTreeValue(tree.l, scope));
            } else if (tree.a === "bnr" && BINARY_OPERATORS[tree.v]) {
                operatorFn = BINARY_OPERATORS[tree.v];
                result = operatorFn(scope, getTreeValue(tree.l, scope), getTreeValue(tree.r, scope));
            } else if (tree.a === "tnr" && TERNARY_OPERATORS[tree.v]) {
                operatorFn = TERNARY_OPERATORS[tree.v];
                if (tree.v === "|" && (tree.r.v === "." || tree.r.v === "[")) {
                    result = operatorFn(scope, getTreeValue(tree.l, scope), getTreeValue(tree.r, scope), getTreeValue(tree.othr, scope), getTreeValue(tree.r.l, scope));
                } else {
                    result = operatorFn(scope, getTreeValue(tree.l, scope), getTreeValue(tree.r, scope), getTreeValue(tree.othr, scope), emptyScope);
                }
            } else {
                throw new Error('Unknown tree entry of type "' + tree.a + " and value " + tree.v + " in:" + JSON.stringify(tree));
            }
            return result;
        };
    });
    define("hsp/expressions/observable.js", [ "./evaluator" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        var evaluator = require("./evaluator");
        var evaluatorNotNull = function(tree, scope) {
            var result = evaluator(tree, scope);
            if (result == null) {
                throw new Error(tree.v + " is not defined");
            }
            return result;
        };
        /**
 * Get all the observable pairs for a given expression. Observable pairs
 * are usually input to model-change-observing utilities (ex. Object.observe).
 *
 * An observable pair is a 2-element array where the first element is an
 * object to observe and the second element corresponds to a property name
 * on an object to observe (null indicates that all properties should be observed).
 *
 * Some examples:
 * '"foo"' => []
 * 'foo' => [[scope, 'foo']]
 * 'foo.bar' => [[scope, 'foo'], [scope.foo, 'bar']]
 * 'foo.bar()' => [[scope, 'foo'], [scope.foo, null]]
 *
 * Please note that function calls are tricky since we don't have any reliable
 * way of determining (from an expression) what a given function could use
 * to produce its results (and - as a consequence - what should be observed).
 *
 * @param tree - parsed tree for a given expression
 * @param scope
 */
        module.exports = function getObservablePairs(tree, scope) {
            var partialResult, leftValue, rightValue;
            if (tree instanceof Array) {
                partialResult = [];
                if (tree.length > 0) {
                    for (var i = 0; i < tree.length; i++) {
                        partialResult = partialResult.concat(getObservablePairs(tree[i], scope));
                    }
                }
                return partialResult;
            }
            if (tree.a === "literal") {
                return [];
            } else if (tree.a === "idn") {
                //TODO: deal with "parent scopes" (traverse up using +parent) => should it be done here?
                return scope[tree.v] && scope[tree.v] instanceof Array ? [ [ scope, tree.v ], [ scope[tree.v], null ] ] : [ [ scope, tree.v ] ];
            } else if (tree.a === "unr") {
                return getObservablePairs(tree.l, scope);
            } else if (tree.a === "bnr") {
                partialResult = getObservablePairs(tree.l, scope);
                if (tree.v === ".") {
                    //for . we need to observe _value_ of the left-hand side
                    leftValue = evaluator(tree.l, scope);
                    if (leftValue) {
                        partialResult = partialResult.concat([ [ leftValue, tree.r.v ] ]);
                        return leftValue[tree.r.v] instanceof Array ? partialResult.concat([ [ leftValue[tree.r.v], null ] ]) : partialResult;
                    } else {
                        return partialResult;
                    }
                }
                if (tree.v === "(") {
                    //function call on a scope
                    return [ [ scope, null ] ].concat(getObservablePairs(tree.r, scope));
                }
                if (tree.v === "[") {
                    //dynamic property access
                    leftValue = evaluator(tree.l, scope);
                    if (leftValue) {
                        rightValue = evaluator(tree.r, scope);
                        partialResult = partialResult.concat([ [ leftValue, rightValue ] ]);
                        if (leftValue[rightValue] instanceof Array) {
                            partialResult = partialResult.concat([ [ leftValue[rightValue], null ] ]);
                        }
                    }
                    return partialResult.concat(getObservablePairs(tree.r, scope));
                } else {
                    //any other binary operator
                    return partialResult.concat(getObservablePairs(tree.r, scope));
                }
            } else if (tree.a === "tnr") {
                partialResult = getObservablePairs(tree.l, scope);
                if (tree.v === "(") {
                    // function call on an object
                    partialResult = partialResult.concat([ [ evaluatorNotNull(tree.l, scope), null ] ]);
                } else if (tree.v === "|") {
                    // pipe operator is similar to function calls
                    partialResult = partialResult.concat(getObservablePairs(tree.r, scope));
                    var obj = tree.r.v === "." ? tree.r.l : // pipe is a function defined on an object
                    tree.r;
                    // pipe is a function defined on a scope
                    partialResult = partialResult.concat([ [ evaluatorNotNull(obj, scope), null ] ]);
                } else {
                    partialResult = partialResult.concat(getObservablePairs(tree.r, scope));
                }
                return partialResult.concat(getObservablePairs(tree.othr, scope));
            } else {
                throw new Error("unknown entry" + JSON.stringify(tree));
            }
        };
    });
    define("hsp/expressions/manipulator.js", [ "./parser", "./evaluator", "../json" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        var ast = require("./parser");
        var evaluator = require("./evaluator");
        var json = require("../json");
        /**
 * Expressions handling util that can evaluate and manipulate
 * JavaScript-like expressions
 *
 * @param {String} input - expression to handle
 * @return {Object} an object with the methods described below
 */
        module.exports = function(input, inputTree) {
            var tree = inputTree || ast(input);
            //AST needs to have an identifier or binary '.' or '[' at the root to be assignable
            var isAssignable = tree.a === "idn" || tree.a === "bnr" && (tree.v === "." || tree.v === "[");
            return {
                /**
         * Evaluates an expression against a scope
         * @param scope
         * @return {*} - value of an expression in a given scope
         */
                getValue: function(scope, defaultValue) {
                    var val = evaluator(tree, scope);
                    if (typeof defaultValue === "undefined") {
                        return val;
                    } else {
                        return val === undefined || val === null || val != val ? defaultValue : val;
                    }
                },
                /**
         * Sets value of an expression on a scope. Not all expressions
         * are assignable.
         * @param scope - scope that should be modified
         * @param {*} a new value for a given expression and scope
         */
                setValue: function(scope, newValue) {
                    if (!isAssignable) {
                        throw new Error('Expression "' + input + '" is not assignable');
                    }
                    if (tree.a === "idn") {
                        json.set(scope, tree.v, newValue);
                    } else if (tree.a === "bnr") {
                        json.set(evaluator(tree.l, scope), evaluator(tree.r, scope), newValue);
                    }
                },
                isAssignable: isAssignable,
                isMultiStatement: tree instanceof Array
            };
        };
    });
    define("hsp/rt/exphandler.js", [ "../klass", "./log", "../expressions/parser", "../expressions/observable", "../expressions/manipulator" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        var klass = require("../klass"), log = require("./log"), exparser = require("../expressions/parser"), exobservable = require("../expressions/observable"), exmanipulator = require("../expressions/manipulator");
        var ExpHandler = klass({
            /**
     * Expression handler Used by all node to access the expressions linked to their properties Note: the same
     * ExpHandler instance is shared by all node instances, this is why vscope is passed as argument to the getValue
     * functions, and not as argument of the constructor
     * @param {Map<expressionDefinition>} edef list of expressions
     * @param {Boolean} observeTarget if true the targeted data objects will be also observed (e.g. foreach collections) - default:false
     */
            $constructor: function(edef, observeTarget) {
                this.observeTarget = observeTarget === true;
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
            getValue: function(eIdx, vscope, defvalue) {
                return this.exps["e" + eIdx].getValue(vscope, this, defvalue);
            },
            /**
     * Return an expression from its index
     */
            getExpr: function(eIdx) {
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
            getScopeOwner: function(property, vscope) {
                var vs = vscope;
                while (vs) {
                    if (vs.hasOwnProperty(property)) {
                        return vs;
                    } else {
                        vs = vs["+parent"];
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
                vs["$scope"] = vs;
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
            $constructor: function(desc) {
                this.exptext = desc[1];
                this.ast = exparser(desc[1]);
                this.bound = desc.length > 2 ? desc[2] : true;
                this.manipulator = exmanipulator(desc[1], this.ast);
                this.isMultiStatement = this.manipulator.isMultiStatement;
            },
            getValue: function(vscope, eh, defvalue) {
                try {
                    return this.manipulator.getValue(vscope, defvalue);
                } catch (e) {
                    log.warning("Error evaluating expression '" + this.exptext + "': " + e.message);
                }
            },
            setValue: function(vscope, value) {
                if (this.manipulator.isAssignable) {
                    this.manipulator.setValue(vscope, value);
                } else {
                    log.warning(this.exptext + " can't be updated - please use object references");
                }
            },
            executeCb: function(evt, eh, vscope) {
                var cbScope = Object.create(vscope);
                //create a throw-away scope to expose additional identifiers to
                //callback expression
                cbScope.$event = evt;
                return this.getValue(cbScope, eh);
            },
            getObservablePairs: function(eh, vscope) {
                try {
                    return this.bound ? exobservable(this.ast, vscope) : null;
                } catch (e) {
                    log.warning("Error evaluating expression '" + this.exptext + "': " + e.message);
                }
            }
        });
    });
    define("hsp/rt/tnode.js", [ "../rt", "../klass", "./log", "./exphandler" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        var hsp = require("../rt"), klass = require("../klass"), log = require("./log"), ExpHandler = require("./exphandler");
        /**
 * Template node - base class of all nodes
 */
        var TNode = klass({
            node: null,
            // reference to the DOM node object - will be defined on each node instance
            vscope: null,
            // variable scope - will be defined on each node instance
            root: null,
            // reference to the root TNode
            parent: null,
            // parent TNode
            children: null,
            // array of child node generators
            childNodes: null,
            // array of child node instances
            adirty: false,
            // true if some of the node attributes need to be refreshed
            cdirty: false,
            // true if the node contains dirty sub-nodes
            edirty: false,
            // (only used by components) true if one the attribute element is dirty
            htmlCbs: null,
            // array: list of the html callbacks - if any
            nodeNS: null,
            // string: node namespace - if any
            isCptContent: false,
            // tells if a node instance is a child of a component (used to raise edirty flags)
            obsPairs: null,
            // Array of observed [obj, property] pairs associated to this object
            needSubScope: false,
            // true if a dedicated sub-scope should be created for this node
            rendered: false,
            $constructor: function(exps, observeExpTarget) {
                this.isStatic = exps === 0;
                if (!this.isStatic) {
                    // create ExpHandler
                    this.eh = new ExpHandler(exps, observeExpTarget);
                }
            },
            /**
     * Safely remove all cross references
     */
            $dispose: function() {
                var cn = this.childNodes;
                if (cn) {
                    // recursively dispose child nodes
                    for (var i = 0, sz = cn.length; sz > i; i++) {
                        cn[i].$dispose();
                    }
                    delete this.childNodes;
                }
                // TODO delete Expression observers !!!!
                if (this.root) {
                    this.root.rmAllObjectObservers(this);
                }
                // Note: we must not set this.children to null here.
                // Indeed children are usually static (on the constructor) and so children=null should have no
                // effect, except for $CptAttElement where it may be set at at instance level for cpt attributes
                // created by the run-time
                this.obsPairs = null;
                this.htmlCbs = null;
                this.node = null;
                this.parent = null;
                this.root = null;
                this.vscope = null;
                this.atts = null;
                this.evtHandlers = null;
            },
            /**
     * create and set the atts property, which is an array of attribute objects created from the attcfg passed as
     * argument
     * @param {Map} attcfg the attribute configuration - e.g. {"title":"test2","class":["t2",1],"tabIndex":["",2]}
     * @param {Map} ehcfg the event handler configuration - optional - e.g. {"onclick":2}
     */
            createAttList: function(attcfg, ehcfg) {
                if (ehcfg) {
                    var evh = [], cb;
                    for (var k in ehcfg) {
                        cb = new TCbAtt(k, ehcfg[k]);
                        if (cb.isHtmlCallback) {
                            if (!this.htmlCbs) {
                                this.htmlCbs = [];
                            }
                            this.htmlCbs.push(cb);
                        }
                        evh.push(cb);
                    }
                    this.evtHandlers = evh;
                }
                if (attcfg === null || attcfg === 0) return null;
                var atts = [], itm;
                for (var k in attcfg) {
                    if (attcfg.hasOwnProperty(k)) {
                        itm = attcfg[k];
                        if (itm === null) {
                            atts.push(new TSimpleAtt(k, k));
                        } else if (typeof itm == "string") {
                            atts.push(new TSimpleAtt(k, itm));
                        } else if (itm.constructor === Array) {
                            // attribute using a txtcfg structure to reference expressions
                            atts.push(new TExpAtt(k, itm));
                        } else {
                            // unsupported attribute
                            log.error("[TNode] unsupported attribute: " + itm);
                        }
                    }
                }
                this.atts = atts;
            },
            /**
     * Observer callback called when one of the bound variables used by the node expressions changes
     */
            onPropChange: function(chge) {
                // set attribute dirty to true
                var root = this.root;
                if (!this.adirty) {
                    if (this.isCptComponent && this.ctlWrapper) {
                        // change component attribute synchronously to have only one refresh phase
                        this.refreshAttributes();
                    }
                    this.adirty = true;
                    if (this === root) {
                        hsp.refresh.addTemplate(this);
                    }
                }
                // mark parent node as containining dirty children (cdirty)
                if (this.isCptContent) {
                    // parent node is a component
                    this.parent.edirty = true;
                }
                var n = this.parent;
                while (n) {
                    if (n.isCptContent && n.parent) {
                        n.parent.edirty = true;
                    }
                    if (n.cdirty) {
                        // already dirty - stop loop
                        n = null;
                    } else {
                        n.cdirty = true;
                        if (n === root) {
                            hsp.refresh.addTemplate(n);
                        }
                        n = n.parent;
                    }
                }
            },
            /**
     * Create a node instance referencing the current node as base class Create as well the DOM element that will be
     * appended to the parent node DOM element
     * @return {TNode} the new node instance
     */
            createNodeInstance: function(parent) {
                // create node instance referencing the current node as parent in the prototype chain
                var ni = Object.create(this);
                ni.parent = parent;
                if (this.needSubScope) {
                    ni.vscope = ni.createSubScope();
                } else {
                    ni.vscope = parent.vscope;
                }
                ni.nodeNS = parent.nodeNS;
                ni.root = parent.root;
                ni.root.createExpressionObservers(ni);
                if (this.isDOMless) {
                    // if or for nodes
                    ni.node = ni.parent.node;
                } else {
                    ni.createNode();
                    if (ni.parent.node) {
                        ni.parent.node.appendChild(ni.node);
                    }
                    if (this.children) {
                        ni.childNodes = [];
                        for (var i = 0, sz = this.children.length; sz > i; i++) {
                            ni.childNodes[i] = this.children[i].createNodeInstance(ni);
                        }
                    }
                }
                return ni;
            },
            /**
     * Refresh the node By default recursively refresh child nodes - so should be extended by sub-classes if they need
     * more specific logic
     */
            refresh: function() {
                if (this.adirty) {
                    // update observable pairs
                    this.root.updateObjectObservers(this);
                    this.adirty = false;
                }
                if (this.cdirty) {
                    this.cdirty = false;
                    var cn = this.childNodes;
                    if (cn) {
                        for (var i = 0, sz = cn.length; sz > i; i++) {
                            cn[i].refresh();
                        }
                    }
                }
            },
            /**
     * Abstract function that should be implemented by sub-classes
     */
            createNode: function() {},
            /**
     * Recursively replace the DOM node by another node if it matches the preNode passed as argument
     */
            replaceNodeBy: function(prevNode, newNode) {
                if (prevNode === newNode) return;
                if (this.node === prevNode) {
                    this.node = newNode;
                    var cn = this.childNodes;
                    if (cn) {
                        for (var i = 0, sz = cn.length; sz > i; i++) {
                            cn[i].replaceNodeBy(prevNode, newNode);
                        }
                    }
                }
            },
            /**
     * Register the element in the list passed as argument
     * This allows for the component to dynamically rebuild the list of its attribute elements
     * Note: this method is only called when the $if node is used to dynamically create cpt attribute elements
     */
            registerAttElements: function(attElts) {
                var cn = this.childNodes, itm;
                if (cn) {
                    for (var i = 0, sz = cn.length; sz > i; i++) {
                        itm = cn[i];
                        if (!itm.registerAttElements) {
                            if (!itm.isEmptyTextNode) {
                                // invalid content
                                log.error(this + " Statement must not produce invalid attribute elements when used as component content");
                            }
                        } else {
                            itm.registerAttElements(attElts);
                        }
                    }
                }
            },
            /**
     * Remove child nodes, from the chilNodes list and from the DOM
     * This method is used by containers such as the {if} node
     * @param {DOMNode} DomNode1 the dom comment element used to limit the content start
     * @param {DOMNode} DomNode2 the dom comment element used to limit the content end
     */
            removeChildNodeInstances: function(DomNode1, DomNode2) {
                // dispose child nodes
                var cn = this.childNodes;
                if (cn) {
                    // recursively dispose child nodes
                    for (var i = 0, sz = cn.length; sz > i; i++) {
                        cn[i].$dispose();
                    }
                    delete this.childNodes;
                }
                this.childNodes = null;
                // delete child nodes from the DOM
                var node = this.node, isInBlock = false, ch, n1 = DomNode1, n2 = DomNode2;
                for (var i = node.childNodes.length - 1; i > -1; i--) {
                    ch = node.childNodes[i];
                    if (isInBlock) {
                        // we are between node1 and node2
                        if (ch === n1) {
                            i = -1;
                            break;
                        } else {
                            node.removeChild(ch);
                        }
                    } else {
                        // detect node2
                        if (ch === n2) {
                            isInBlock = true;
                        }
                    }
                }
            },
            /**
     * Create a sub-scope object inheriting from the parent' scope
     * @param {Object} ref tthe reference scope (optional - default: this.parent.vscope)
     */
            createSubScope: function(ref) {
                if (!ref) {
                    ref = this.parent.vscope;
                }
                return ExpHandler.createSubScope(ref);
            },
            /**
     * Scans the scope tree to determine which scope object is actually handling a given object
     * (Shortcut to ExpHandler.getScopeOwner)
     * @param {String} property the property to look for
     * @param {Object} vscope the current variable scope
     * @return {Object} the scope object or null if not found
     */
            getScopeOwner: function(property, vscope) {
                return ExpHandler.getScopeOwner(property, vscope);
            },
            /**
     * Helper function to get the nth DOM child node of type ELEMENT_NODE
     * @param {Integer} index the position of the element (e.g. 0 for the first element)
     * @retrun {DOMElementNode}
     */
            getElementNode: function(index) {
                if (this.node) {
                    var cn = this.node.childNodes, nd, idx = -1;
                    var n1 = this.node1, n2 = this.node2;
                    // for TNode using comments to delimit their content
                    if (!n2) {
                        n2 = null;
                    }
                    var process = n1 ? false : true;
                    for (var i = 0; cn.length > i; i++) {
                        nd = cn[i];
                        if (process) {
                            if (nd === n2) {
                                break;
                            }
                            if (nd.nodeType === 1) {
                                // 1 = ELEMENT_NODE
                                idx++;
                                if (idx === index) {
                                    return nd;
                                }
                            }
                        } else if (nd === n1) {
                            process = true;
                        }
                    }
                }
                return null;
            },
            /**
     * Return the component attribute type of the current node
     * @return {String} one of the following option:
     *      "ATTELT" if the element is an attribute element (e.g. <@body>)
     *      "CONTENT" if the node is a content element (e.g. <div>)
     *      "INDEFINITE" if the element can be part of eithe an attribute or content collection (e.g. blank text nodes)
     *      "ERROR" if elt mixes attribute and content elements
     */
            getCptAttType: function() {
                // this method must be overridden by child classes
                return "CONTENT";
            },
            /**
     * Analyze the type of tnodes in a collection to determine if they are valid cpt attribute elements
     * @parm nodes {Array} the list of node elements to validate (optional - if not provided this.children is used)
     * @return {String} one of the following option:
     *      "ATTELT" if only attribute elements are found (e.g. <@body>)
     *      "CONTENT" if only content elements are found (e.g. <div>)
     *      "INDEFINITE" if elements found can be either part of cpt att elts collection or content (e.g. blank text nodes)
     *      "ERROR" if attelts are mixed with content elements (in this case an error should be raised)
     */
            getCptContentType: function(nodes) {
                if (!nodes) {
                    nodes = this.children;
                }
                if (!nodes) {
                    return "INDEFINITE";
                }
                var ct, attFound = false, contentFound = false;
                for (var i = 0, sz = nodes.length; sz > i; i++) {
                    ct = nodes[i].getCptAttType();
                    if (ct === "ATTELT") {
                        attFound = true;
                        if (contentFound) {
                            return "ERROR";
                        }
                    } else if (ct === "CONTENT") {
                        contentFound = true;
                        if (attFound) {
                            return "ERROR";
                        }
                    } else if (ct === "ERROR") {
                        return "ERROR";
                    }
                }
                if (attFound) {
                    return "ATTELT";
                } else if (contentFound) {
                    return "CONTENT";
                } else {
                    return "INDEFINITE";
                }
            },
            /**
     * Recursively call the afterDOMInsert method in child nodes.
     */
            afterDOMInsert: function() {
                this.rendered = true;
                if (this.childNodes && this.childNodes.length > 0) {
                    for (var i = 0; i < this.childNodes.length; i++) {
                        this.childNodes[i].afterDOMInsert();
                    }
                }
            }
        });
        /**
 * Simple attribute - used for static values
 */
        var TSimpleAtt = klass({
            /**
     * Simple attribute constructor
     * @param {String} name the name of the attribute - e.g. "class" or "tabIndex"
     * @param {String} value the value of the attribute - e.g. "foo"
     */
            $constructor: function(name, value) {
                this.name = name;
                this.value = value;
            },
            getValue: function(eh, vscope, defvalue) {
                return this.value;
            },
            getExprValues: function(eh, vscope, defvalue) {
                return [ this.value ];
            }
        });
        /**
 * Expression-based attribute
 */
        var TExpAtt = klass({
            /**
     * Simple attribute constructor
     * @param {String} name the name of the attribute - e.g. "class" or "tabIndex"
     * @param {Array} textcfg the content of the attribute - e.g. ["foo",1,"bar"] where odd items are string and even
     * items are expression ids
     */
            $constructor: function(name, textcfg) {
                this.name = name;
                this.textcfg = textcfg;
            },
            /**
     * Return the value of the attribute for a given context (scope and expression handler)
     */
            getValue: function(eh, vscope, defvalue) {
                var tcfg = this.textcfg, sz = tcfg.length, buf = [];
                // expressions used in custom components may return objects that should not be
                // concatenated to a string:
                if (sz === 2 && tcfg[0] === "") {
                    // this is a single expression
                    return eh.getValue(tcfg[1], vscope, defvalue);
                }
                for (var i = 0; sz > i; i++) {
                    // odd elements are variables
                    buf.push(i % 2 ? eh.getValue(tcfg[i], vscope, defvalue) : tcfg[i]);
                }
                return buf.join("");
            },
            /**
     * Returns an array of text values / evaluated expression values
     * @param eh
     * @param vscope
     * @param defvalue
     * @returns {Array}
     */
            getExprValues: function(eh, vscope, defvalue) {
                var textConfig = this.textcfg, result = [];
                for (var i = 0; i < textConfig.length; i++) {
                    // odd elements are variables
                    result.push(i % 2 ? eh.getValue(textConfig[i], vscope, defvalue) : textConfig[i]);
                }
                return result;
            }
        });
        /**
 * Expression-based Callback attribute
 */
        var TCbAtt = klass({
            /**
     * Simple attribute constructor
     * @param {String} type the type of the event hanlder attribute - e.g. "click"
     * @param {Number} cbArg either the index of the associated callback expression (e.g. 2) or the code to execute in
     * case of HTML handler
     */
            $constructor: function(type, cbArg) {
                this.evtType = type;
                var isHtmlCallback = typeof cbArg !== "number";
                if (isHtmlCallback) {
                    this.isHtmlCallback = true;
                    this.htmlCb = cbArg;
                } else {
                    this.expIdx = cbArg;
                }
            },
            /**
     * Executes the callback associated to this event handler This method is called by nodes registered as event
     * listeners through addEventListener
     */
            executeCb: function(evt, eh, vscope) {
                if (this.expIdx) {
                    var cbExp = eh.getExpr(this.expIdx);
                    if (cbExp) {
                        return cbExp.executeCb(evt, eh, vscope);
                    }
                }
            }
        });
        module.exports.TNode = TNode;
        module.exports.TSimpleAtt = TSimpleAtt;
        module.exports.TExpAtt = TExpAtt;
    });
    define("hsp/rt/$text.js", [ "../klass", "./document", "./tnode" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        // This module contains the text node
        var klass = require("../klass"), doc = require("./document"), TNode = require("./tnode").TNode, TExpAtt = require("./tnode").TExpAtt;
        var $TextNode = klass({
            $extends: TNode,
            /**
     * Text node generator ex: Hello {person.name}!
     * @param {Map<Expression>|int} exps the map of the variables used by the node. 0 is passed if no expression is
     * used
     * @param {Array} textcfg array of the different text chunks that compose the text node e.g. ["Hello ",0,"!"] odd
     * elements are text fragments and even element are variable ids corresponding to t
     */
            $constructor: function(exps, textcfg) {
                TNode.$constructor.call(this, exps);
                this.textcfg = textcfg;
                this.isEmptyTextNode = false;
                if (this.isStatic) {
                    // ensure textcfg is not null
                    if (!textcfg) {
                        this.textcfg = [ "" ];
                        this.isEmptyTextNode = true;
                    } else if (this.textcfg[0].match(/^\s*$/)) {
                        // text node only contains white spaces and can be considered as empty
                        this.isEmptyTextNode = true;
                    }
                }
            },
            /**
     * Create the DOM node element and attach it to the parent
     */
            createNode: function() {
                this.node = doc.createTextNode(this.getContent());
            },
            /**
     * Calculates the text content: resolve all variables and concatenate the cfg values
     * @return {string} the text content associated to the node
     */
            getContent: function() {
                var tcfg = this.textcfg;
                if (this.isStatic) return tcfg[0]; else {
                    return TExpAtt.getValue.call(this, this.eh, this.vscope, "");
                }
            },
            /**
     * Refresh the text node if its properties have changed
     */
            refresh: function() {
                if (this.adirty) {
                    this.node.nodeValue = this.getContent();
                }
                TNode.refresh.call(this);
            },
            /**
     * Return the component attribute type of the current node
     * @return {String} one of the following option:
     *      "ATTELT" if the element is an attribute element (e.g. <@body>)
     *      "CONTENT" if the node is a content element (e.g. <div>)
     *      "INDEFINITE" if the element can be part of eithe an attribute or content collection (e.g. blank text nodes)
     *      "ERROR" if elt mixes attribute and content elements
     */
            getCptAttType: function() {
                return this.isEmptyTextNode ? "INDEFINITE" : "CONTENT";
            }
        });
        module.exports = $TextNode;
    });
    define("hsp/rt/cptwrapper.js", [ "../json", "./log", "../klass" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
        /*
 * Copyright 2013 Amadeus s.a.s.
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
        var json = require("../json"), log = require("./log"), klass = require("../klass");
        function identity(v) {
            return v;
        }
        var ATTRIBUTE_TYPES = {
            "int": {
                defaultValue: 0,
                convert: function(v, attcfg) {
                    var r = parseInt(v, 10);
                    return isNaN(r) ? getDefaultAttValue(attcfg) : r;
                }
            },
            "float": {
                defaultValue: 0,
                convert: function(v, attcfg) {
                    var r = parseFloat(v);
                    return isNaN(r) ? getDefaultAttValue(attcfg) : r;
                }
            },
            "boolean": {
                defaultValue: false,
                convert: function(v, attcfg) {
                    return v === true || v === 1 || v === "1" || v === "true";
                }
            },
            string: {
                defaultValue: "",
                convert: function(v, attcfg) {
                    return v + "";
                }
            },
            object: {
                defaultValue: null,
                convert: identity
            },
            callback: {
                defaultValue: null,
                convert: identity
            },
            template: {
                defaultValue: null,
                convert: identity
            }
        };
        var BINDING_VALUES = {
            none: 0,
            "1-way": 1,
            "2-way": 2
        };
        function getDefaultAttValue(attcfg) {
            // attcfg.type is always set when called from ATTRIBUTE_TYPES.x.convert()
            var d = attcfg.defaultValue, tp = attcfg.type;
            if (d === undefined || tp === "template") {
                return ATTRIBUTE_TYPES[tp].defaultValue;
            } else {
                // ensure default has the right type
                return ATTRIBUTE_TYPES[tp].convert(d, {
                    type: "string"
                });
            }
        }
        /**
 * CptWrapper class CptWrapper objects create, initialize and observe components to detect changes on their properties
 * (or attributes) and call their onAttributeChange() or onPropertyChange() methods Such observers are necessary to
 * avoid having component observing themselves. This way, component can change their own properties through json.set()
 * without recursively being called because of their own changes This is performed by detecting if changes occur in the
 * onXXChange() call stack - if this is the case, CptWrapper will not call the onXXChange() callback again.
 */
        var CptWrapper = klass({
            /**
     * Observer constructor.
     * @param Cptfn {Function} the component constructor
     */
            $constructor: function(Cptfn) {
                if (!Cptfn || Cptfn.constructor !== Function) {
                    log.error("[CptWrapper] Invalid Component constructor!");
                } else {
                    this.cpt = new Cptfn();
                    this.nodeInstance = null;
                    // reference to set the node instance adirty when an attribute changes
                    this.root = null;
                    // reference to the root template node
                    this.initialized = false;
                    this.needsRefresh = true;
                    // update attribute values for simpler processing
                    var atts = this.cpt.$attributes, att, bnd;
                    if (atts) {
                        for (var k in atts) {
                            att = atts[k];
                            if (k.match(/^on/)) {
                                // this is a callback
                                if (!att.type) {
                                    log.error("Attribute type 'callback' should be set to '" + k + "'");
                                } else if (att.type !== "callback") {
                                    log.error("Attribute type 'callback' should be set to '" + k + "' instead of: " + att.type);
                                    att.type = "callback";
                                }
                                continue;
                            }
                            bnd = att.binding;
                            // set the internal _binding value 0=none 1=1-way 2=2-way
                            if (bnd) {
                                bnd = BINDING_VALUES[bnd];
                                if (bnd !== undefined) {
                                    att._binding = bnd;
                                } else {
                                    log.error("Invalid attribute binding value: " + att.binding);
                                    att._binding = 0;
                                }
                            } else {
                                att._binding = 0;
                            }
                            // check type
                            if (att.type) {
                                if (att.type === "callback") {
                                    log.error("Attribute of type 'callback' must start with 'on' - please rename: " + k);
                                } else if (ATTRIBUTE_TYPES[att.type] === undefined) {
                                    log.error("Invalid attribute type: " + att.type);
                                    att.type = "string";
                                }
                            } else {
                                att.type = "string";
                            }
                        }
                    }
                }
            },
            $dispose: function() {
                // unobserve properties and events
                if (this._cptChgeCb) {
                    json.unobserve(this.cpt, this._cptChgeCb);
                    this._cptChgeCb = null;
                }
                var c = this.cpt;
                if (c) {
                    if (c.$dispose) {
                        c.$dispose();
                    }
                    c.nodeInstance = null;
                    this.cpt = null;
                }
                this.nodeInstance = null;
                this.root = null;
            },
            /**
     * Initialize the component by creating the attribute properties on the component instance and initializing the
     * attribute values to their initial value If the component instance has an $init() method it will be called as well
     * @param {Map} initAttributes map of initial value set by the component host
     */
            init: function(initAttributes, parentCtrl) {
                if (this.initialized) {
                    return;
                }
                this.initialized = true;
                var cpt = this.cpt, atts = cpt.$attributes;
                if (!cpt) {
                    return;
                }
                // add $getElement methods
                cpt.$getElement = this.$getElement.bind(this);
                if (atts) {
                    if (!initAttributes) {
                        initAttributes = {};
                    }
                    // initialize attributes
                    var iAtt, att, isAttdefObject, hasType, v, attType;
                    for (var k in atts) {
                        if (cpt[k]) {
                            continue;
                        }
                        att = atts[k];
                        iAtt = initAttributes[k];
                        // determine if attribute definition is an object or a plain value
                        isAttdefObject = typeof atts[k] === "object";
                        hasType = isAttdefObject && atts[k].type;
                        if (hasType) {
                            attType = ATTRIBUTE_TYPES[att.type];
                            if (!attType) {
                                log.error("Invalid component attribute type: " + att.type);
                                attType = ATTRIBUTE_TYPES["string"];
                            }
                        }
                        if (att.type === "callback") {
                            // create an even callback function
                            this.createEventFunction(k.slice(2));
                            cpt[k].isEmpty = iAtt === undefined;
                            continue;
                        } else if (att.type === "template") {
                            v = null;
                        } else {
                            // determine value
                            v = "";
                            if (iAtt !== undefined) {
                                v = iAtt;
                            } else {
                                if (isAttdefObject) {
                                    v = att.defaultValue;
                                    if (v === undefined && hasType) {
                                        v = attType.defaultValue;
                                    }
                                } else {
                                    // attribute directly references the default value
                                    v = att;
                                }
                            }
                            // convert value type if applicable
                            if (hasType) {
                                v = attType.convert(v, att);
                            }
                        }
                        // in the component attribute
                        cpt[k] = v;
                    }
                }
                if (cpt.$init) {
                    // call init if defined on the component
                    cpt.$init(parentCtrl);
                }
                this._cptChgeCb = this.onCptChange.bind(this);
                json.observe(cpt, this._cptChgeCb);
            },
            /**
     * Create an event function on the component controller in order to ease event notification e.g. to raise the
     * 'select' event, developers should simply write in the controller: this.onselect({foo:"bar"});
     */
            createEventFunction: function(evtType) {
                var self = this;
                this.cpt["on" + evtType] = function(evtData) {
                    if (!evtData) {
                        evtData = {};
                    }
                    if (!evtData.type) {
                        evtData.type = evtType;
                    }
                    if (self.nodeInstance && self.nodeInstance.onEvent) {
                        self.nodeInstance.onEvent(evtData);
                    }
                };
            },
            /**
     * Check if not already in event handler stack and call the change event handler
     */
            onCptChange: function(change) {
                var chg = change, cpt = this.cpt;
                if (change.constructor === Array) {
                    if (change.length > 0) {
                        chg = change[0];
                    } else {
                        log.error("[CptNode] Invalid change - nbr of changes: " + change.length);
                        return;
                    }
                }
                this.needsRefresh = true;
                var nm = chg.name;
                // property name
                if (nm === "") {
                    return;
                }
                var callControllerCb = true;
                // true if the onXXXChange() callback must be called on the controller
                var att, isAttributeChange = false;
                if (cpt.$attributes) {
                    att = cpt.$attributes[nm];
                    isAttributeChange = att !== undefined;
                    if (isAttributeChange) {
                        // adapt type if applicable
                        var t = att.type;
                        if (t) {
                            var v = ATTRIBUTE_TYPES[t].convert(chg.newValue, att);
                            chg.newValue = v;
                            cpt[nm] = v;
                        }
                    }
                    if (isAttributeChange && this.nodeInstance) {
                        // notify attribute changes to the node instance (and the host) if attribute has a 2-way binding
                        if (att._binding === 2) {
                            chg.newValue = this.cpt[nm];
                            // attribute value may have been changed by the controller
                            this.nodeInstance.onAttributeChange(chg);
                        }
                    }
                    if (isAttributeChange) {
                        // check if cb must be called depending on binding mode
                        if (att._binding === 0) {
                            callControllerCb = false;
                        }
                    }
                }
                if (callControllerCb) {
                    if (this.processingChange === true) {
                        // don't re-enter the change loop if we are already processing changes
                        return;
                    }
                    this.processingChange = true;
                    try {
                        // calculate the callback name (e.g. onValueChange for the 'value' property)
                        var cbnm = "";
                        if (isAttributeChange) {
                            cbnm = att.onchange;
                        }
                        if (!cbnm) {
                            cbnm = [ "$on", nm.charAt(0).toUpperCase(), nm.slice(1), "Change" ].join("");
                        }
                        if (cpt[cbnm]) {
                            cpt[cbnm].call(cpt, chg.newValue, chg.oldValue);
                        }
                    } finally {
                        this.processingChange = false;
                    }
                }
            },
            /**
     * Method that will be associated to the component controller to allow for finding an element
     * in the DOM generated by its template
     * Note: this method only returns element nodes - i.e. node of type 1 (ELEMENT_NODE)
     * As a consequence $getElement(0) will return the first element, even if a text node is inserted before
     * @param {Integer} index the position of the element (e.g. 0 for the first element)
     * @retrun {DOMElementNode}
     */
            $getElement: function(index) {
                var nd = this.nodeInstance;
                if (!nd) {
                    nd = this.root;
                }
                if (nd) {
                    return nd.getElementNode(index);
                }
                return null;
            },
            /**
     * Call the $refresh() function on the component
     */
            refresh: function() {
                var cpt = this.cpt;
                if (this.needsRefresh) {
                    if (cpt && cpt.$refresh) {
                        cpt.$refresh();
                        this.needsRefresh = false;
                    }
                }
            }
        });
        /**
 * Create a Component wrapper and initialize it correctly according to the attributes passed as arguments
 * @param {Object} cptArgs the component arguments
 *      e.g. { nodeInstance:x, $attributes:{att1:{}, att2:{}}, $content:[] }
 */
        function createCptWrapper(Ctl, cptArgs) {
            var cw = new CptWrapper(Ctl), att, t, v;
            // will also create a new controller instance
            if (cptArgs) {
                var cpt = cw.cpt, ni = cptArgs.nodeInstance;
                if (ni.isCptComponent || ni.isCptAttElement) {
                    // set the nodeInstance reference on the component
                    var $attributes = cptArgs.$attributes, $content = cptArgs.$content;
                    cw.nodeInstance = ni;
                    cw.cpt.nodeInstance = ni;
                    if ($attributes) {
                        for (var k in $attributes) {
                            // set the template attribute value on the component instance
                            if ($attributes.hasOwnProperty(k)) {
                                att = cw.cpt.$attributes[k];
                                t = att.type;
                                v = $attributes[k];
                                if (t && ATTRIBUTE_TYPES[t]) {
                                    // in case of invalid type an error should already have been logged
                                    // a type is defined - so let's convert the value
                                    v = ATTRIBUTE_TYPES[t].convert(v, att);
                                }
                                json.set(cpt, k, v);
                            }
                        }
                    }
                    if ($content) {
                        if (cpt.$content) {
                            log.error(ni + " Component controller cannot use '$content' for another property than child attribute elements");
                        } else {
                            // create the content property on the component instance
                            json.set(cpt, "$content", $content);
                        }
                    }
                }
            }
            return cw;
        }
        exports.CptWrapper = CptWrapper;
        exports.createCptWrapper = createCptWrapper;
    });
    define("hsp/rt/cptcomponent.js", [ "../json", "./log", "./document", "./$text", "./cptwrapper" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
        var json = require("../json"), log = require("./log"), doc = require("./document"), $TextNode = require("./$text"), cptwrapper = require("./cptwrapper");
        var $CptNode, $CptAttElement, TNode;
        // injected through setDependency to avoid circular dependencies
        exports.setDependency = function(name, value) {
            if (name === "$CptAttElement") {
                $CptAttElement = value;
            } else if (name === "$CptNode") {
                $CptNode = value;
            } else if (name === "TNode") {
                TNode = value;
            }
        };
        /**
 * $CptComponent contains methods that will be added to the prototype of all
 * $CptNode node instance that correspond to a component insertion:
 *   <#mywidget foo="bar"/>
 * (i.e. a component using a template with any controller)
 */
        exports.$CptComponent = {
            /**
   * Initialize the component
   * @param {Object} arg
   *     e.g. {template:obj,ctlConstuctor:obj.controllerConstructor}
   *     e.g. {cptattelement:obj,ctlConstuctor:obj.controllerConstructor}
   */
            initCpt: function(arg) {
                this.isCptComponent = true;
                this.ctlConstuctor = arg.ctlConstuctor;
                if (this.template) {
                    // this component is associated to a template
                    this.createPathObservers();
                    this.createCommentBoundaries("cpt");
                    this.createChildNodeInstances();
                    // $init child components
                    this.initChildComponents();
                    this.ctlWrapper.refresh();
                } else if (arg.cptattelement) {
                    // this component is an attribute of another component
                    var cw = cptwrapper.createCptWrapper(this.ctlConstuctor, this.getCptArguments());
                    this.ctlWrapper = cw;
                    this.controller = cw.cpt;
                    if (cw.cpt.tagName) {
                        log.error(this + " 'tagName' is a reserved keyword and cannot be used in component controllers");
                    }
                    cw.cpt.tagName = this.tagName;
                }
            },
            /**
   * Process and retrieve the component arguments that are needed to init the component template
   */
            getCptArguments: function() {
                // determine if cpt supports template arguments
                if (this.template) {
                    // as template can be changed dynamically we have to sync the constructor
                    this.ctlConstuctor = this.template.controllerConstructor;
                }
                var ctlProto = this.ctlConstuctor.prototype;
                this.ctlAttributes = ctlProto.$attributes;
                this.ctlElements = ctlProto.$elements;
                // load template arguments
                this.loadCptAttElements();
                // load child elements before processing the template
                var cptArgs = {
                    nodeInstance: this,
                    $attributes: {},
                    $content: null
                };
                var attributes = cptArgs.$attributes, att;
                if (this.atts) {
                    // some attributes have been passed to this instance - so we push them to cptArgs
                    // so that they are set on the controller when the template are rendered
                    var atts = this.atts, eh = this.eh, pvs = this.vscope, nm;
                    if (atts) {
                        for (var i = 0, sz = this.atts.length; sz > i; i++) {
                            att = atts[i];
                            nm = att.name;
                            if (this.ctlAttributes[nm].type !== "template") {
                                attributes[nm] = att.getValue(eh, pvs, null);
                            }
                        }
                    }
                }
                if (this.tplAttributes) {
                    var tpa = this.tplAttributes;
                    for (var k in tpa) {
                        // set the template attribute value on the controller
                        if (tpa.hasOwnProperty(k)) {
                            attributes[k] = tpa[k];
                        }
                    }
                }
                if (this.childElements) {
                    cptArgs.$content = this.getControllerContent();
                }
                return cptArgs;
            },
            /**
   * Create the child nodes for a dynamic template - this method assumes
   * that node1 and node2 exist
   */
            createChildNodeInstances: function() {
                this.removeChildInstances();
                if (this.template) {
                    // temporarily assign a new node to get the content in a doc fragment
                    this.vscope = this.parent.vscope;
                    // to come back to original state, when the scope has not been changed by the template
                    var targs = this.getTemplateArguments(), cargs = this.getCptArguments();
                    var realNode = this.node;
                    var df = doc.createDocumentFragment();
                    this.node = df;
                    this.template.call(this, targs, cargs);
                    // WARNING: this changes vscope to the template vscope
                    realNode.insertBefore(df, this.node2);
                    this.replaceNodeBy(df, realNode);
                    // recursively remove doc fragment reference
                    // now this.node=realNode
                    this.isDOMempty = false;
                }
            },
            /**
   * Safely cut all dependencies before object is deleted
   * @param {Boolean} localPropOnly if true only local properties will be deleted (optional)
   *        must be used when a new instance is created to adapt to a path change
   */
            $dispose: function(localPropOnly) {
                if (this.ctlWrapper) {
                    this.ctlWrapper.$dispose();
                    this.ctlWrapper = null;
                    this.controller = null;
                }
                this.ctlAttributes = null;
                this.cleanObjectProperties(localPropOnly);
                this.ctlConstuctor = null;
                var tpa = this.tplAttributes;
                if (tpa) {
                    for (var k in tpa) {
                        if (tpa.hasOwnProperty(k)) {
                            tpa[k].$dispose();
                        }
                    }
                }
                var ag = this._attGenerators;
                if (ag) {
                    for (var k in ag) {
                        if (ag.hasOwnProperty(k)) {
                            ag[k].$dispose();
                        }
                    }
                }
                var en = this.attEltNodes;
                if (en) {
                    for (var i = 0, sz = en.length; sz > i; i++) {
                        en[i].$dispose();
                    }
                    this.attEltNodes = null;
                }
            },
            /**
   * Load the component sub-nodes that correspond to template attributes
   */
            loadCptAttElements: function() {
                this.attEltNodes = null;
                this._attGenerators = null;
                // determine the possible template attribute names
                var tpAttNames = {}, ca = this.ctlAttributes, defaultTplAtt = null, lastTplAtt = null, count = 0;
                for (var k in ca) {
                    if (ca.hasOwnProperty(k) && ca[k].type === "template") {
                        // k is defined in the controller attributes collection
                        // so k is a valid template attribute name
                        tpAttNames[k] = true;
                        count++;
                        if (ca[k].defaultContent) {
                            defaultTplAtt = k;
                        }
                        lastTplAtt = k;
                    }
                }
                // if there is only one template attribute it will be automatically considered as default
                if (!defaultTplAtt) {
                    if (count === 1) {
                        defaultTplAtt = lastTplAtt;
                    } else if (count > 1) {
                        // error: a default must be defined
                        log.error(this + " A default content element must be defined when multiple content elements are supported");
                        // use last as default
                        defaultTplAtt = lastTplAtt;
                    }
                }
                // check if a default attribute element has to be created and create it if necessary
                this.manageDefaultAttElt(defaultTplAtt);
                // Analyze node attributes to see if a template attribute is passed as text attribute
                var atts = this.atts, att, nm;
                if (atts) {
                    for (var k in atts) {
                        if (!atts.hasOwnProperty(k)) continue;
                        att = atts[k];
                        nm = att.name;
                        if (tpAttNames[nm]) {
                            // nm is a template attribute passed as text attribute
                            if (this.tplAttributes && this.tplAttributes[nm]) {
                                // already defined: raise an error
                                log.error(this + " Component attribute '" + nm + "' is defined multiple times - please check");
                            } else {
                                // create new tpl Attribute Text Node and add it to the tplAttributes collection
                                if (!att.generator) {
                                    var txtNode;
                                    if (att.value) {
                                        // static value
                                        txtNode = new $TextNode(0, [ "" + att.value ]);
                                    } else {
                                        // dynamic value using expressions
                                        txtNode = new $TextNode(this.exps, atts[k].textcfg);
                                    }
                                    if (!this._attGenerators) {
                                        this._attGenerators = [];
                                    }
                                    att.generator = new $CptAttElement(nm, 0, 0, 0, [ txtNode ]);
                                    // name, exps, attcfg, ehcfg, children
                                    this._attGenerators.push(att.generator);
                                }
                                // generate a real $CptAttElement using the TextNode as child element
                                var ni = att.generator.createNodeInstance(this);
                                ni.isCptContent = true;
                                if (!this.attEltNodes) {
                                    this.attEltNodes = [];
                                }
                                this.attEltNodes.push(ni);
                            }
                        }
                    }
                }
                this.retrieveAttElements();
            },
            /**
   * Check if a default attribute element has to be created and create one if necessary
   */
            manageDefaultAttElt: function(defaultTplAtt) {
                if (!this.children) {
                    return;
                }
                // TODO memoize result at prototype level to avoid processing this multiple times
                var ct = this.getCptContentType(), loadCpts = true;
                if (ct === "ERROR") {
                    loadCpts = false;
                    log.error(this.info + " Component content cannot mix attribute elements with content elements");
                } else if (ct !== "ATTELT") {
                    if (defaultTplAtt) {
                        // ct is CONTENT or INDEFINITE - so we create a default attribute element
                        var catt = new $CptAttElement(defaultTplAtt, 0, 0, 0, this.children);
                        // name, exps, attcfg, ehcfg, children
                        // add this default cpt att element as unique child
                        this.children = [ catt ];
                    } else {
                        // there is no defaultTplAtt
                        loadCpts = false;
                    }
                }
                if (loadCpts) {
                    var ni, cn = this.children, sz = cn.length;
                    if (!this.attEltNodes) {
                        this.attEltNodes = [];
                    }
                    for (var i = 0; sz > i; i++) {
                        if (!cn[i].isEmptyTextNode) {
                            ni = cn[i].createNodeInstance(this);
                            ni.isCptContent = true;
                            this.attEltNodes.push(ni);
                        }
                    }
                }
            },
            /**
   * Retrieve all child attribute elements
   * and update the tplAttributes and childElements collections
   */
            retrieveAttElements: function() {
                var aen = this.attEltNodes;
                if (!aen) {
                    return null;
                }
                var attElts = [], cta = this.ctlAttributes;
                for (var i = 0, sz = aen.length; sz > i; i++) {
                    aen[i].registerAttElements(attElts);
                }
                // check that all elements are valid (i.e. have valid names)
                var nm, elt, ok, elts = [], cte = this.ctlElements ? this.ctlElements : [];
                for (var i = 0, sz = attElts.length; sz > i; i++) {
                    elt = attElts[i];
                    nm = elt.name;
                    ok = true;
                    if (cta && cta[nm]) {
                        // valid tpl attribute
                        if (!this.tplAttributes) {
                            this.tplAttributes = {};
                        }
                        this.tplAttributes[nm] = elt;
                        ok = false;
                    } else {
                        if (!nm) {
                            log.error(this + " Invalid attribute element (unnamed)");
                            ok = false;
                        } else if (!cte[nm]) {
                            log.error(this + " Invalid attribute element: @" + nm);
                            ok = false;
                        }
                    }
                    if (ok) {
                        elts.push(elt);
                    }
                }
                if (elts.length === 0) {
                    elts = null;
                }
                this.childElements = elts;
                return elts;
            },
            /**
   * Initializes the attribute elements of type component that have not been
   * already initialized
   */
            initChildComponents: function() {
                var ce = this.childElements;
                if (!ce || !ce.length) {
                    return;
                }
                var cw;
                for (var i = 0, sz = ce.length; sz > i; i++) {
                    cw = ce[i].ctlWrapper;
                    if (cw && !cw.initialized) {
                        cw.init(null, this.controller);
                    }
                }
            },
            /**
   * If the template instance support some template attributes this method return the
   * template attribute object that corresponds to the name passed as argument
   * This method is called by the CptNode createNodeInstance to determine if a component
   * is of type $CptAttElement
   * Null is returned if there is no attribute corresponding to this name
   */
            getTplAttribute: function(name) {
                var ctlAtts = this.ctlAttributes;
                if (ctlAtts) {
                    return ctlAtts[name];
                }
                return null;
            },
            /**
   * Callback called by the controller observer when the controller raises an event
   */
            onEvent: function(evt) {
                var evh = this.evtHandlers, et = evt.type;
                if (evh) {
                    for (var i = 0, sz = evh.length; sz > i; i++) {
                        if (evh[i].evtType === et) {
                            evh[i].executeCb(evt, this.eh, this.parent.vscope);
                            break;
                        }
                    }
                }
            },
            /**
   * Recursively replace the DOM node by another node if it matches the preNode passed as argument
   */
            replaceNodeBy: function(prevNode, newNode) {
                if (prevNode === newNode) {
                    return;
                }
                TNode.replaceNodeBy.call(this, prevNode, newNode);
                var aen = this.attEltNodes;
                if (aen) {
                    for (var i = 0, sz = aen.length; sz > i; i++) {
                        aen[i].replaceNodeBy(prevNode, newNode);
                    }
                }
            },
            /**
   * Calculate the content array that will be set on component's controller
   */
            getControllerContent: function() {
                var c = [], ce = this.childElements, celts = this.ctlElements, eltType;
                if (ce && ce.length) {
                    for (var i = 0, sz = ce.length; sz > i; i++) {
                        eltType = celts[ce[i].name].type;
                        if (eltType === "component") {
                            c.push(ce[i].controller);
                        } else if (eltType === "template") {
                            c.push(ce[i]);
                        } else {
                            log.error(this + " Invalid element type: " + eltType);
                        }
                    }
                }
                return c.length > 0 ? c : null;
            },
            /**
   * Refresh the sub-template arguments and the child nodes, if needed
   */
            refresh: function() {
                if (this.edirty) {
                    var en = this.attEltNodes;
                    if (en) {
                        for (var i = 0, sz = en.length; sz > i; i++) {
                            en[i].refresh();
                        }
                        // if content changed we have to rebuild childElements
                        this.retrieveAttElements();
                        this.initChildComponents();
                    }
                    // Change content of the controller
                    json.set(this.controller, "$content", this.getControllerContent());
                    this.edirty = false;
                }
                // warning: the following refresh may change the component type and
                // as such ctlWrapper could become null if new component is a template
                $CptNode.refresh.call(this);
                if (this.ctlWrapper) {
                    // refresh cpt through $refresh if need be
                    this.ctlWrapper.refresh();
                }
            },
            /**
   * Refresh the node attributes (even if adirty is false)
   */
            refreshAttributes: function() {
                var atts = this.atts, att, ctlAtt, eh = this.eh, ctl = this.controller, v;
                var vs = this.isCptAttElement ? this.vscope : this.parent.vscope;
                if (atts && ctl && ctl.$attributes) {
                    // this template has a controller
                    // let's propagate the new attribute values to the controller attributes
                    for (var i = 0, sz = this.atts.length; sz > i; i++) {
                        att = atts[i];
                        ctlAtt = ctl.$attributes[att.name];
                        // propagate changes for 1- and 2-way bound attributes
                        if (ctlAtt.type !== "template" && ctlAtt._binding !== 0) {
                            v = att.getValue(eh, vs, null);
                            if (ctlAtt.type === "object" || ctlAtt.type === "array") {
                                json.set(ctl, att.name, v);
                            } else if ("" + v != "" + ctl[att.name]) {
                                // values may have different types - this is why we have to check that values are different to
                                // avoid creating loops
                                json.set(ctl, att.name, v);
                            }
                        }
                    }
                }
            }
        };
    });
    define("hsp/rt/cptattinsert.js", [ "./document" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
        var doc = require("./document");
        /**
 * $CptAttInsert contains methods that will be added to the prototype of all
 * $CptNode node instance that correspond to an insertion of a component attribute
 *  e.g. <#c.body/> used in the template of mycpt that is instanciated as follows:
 *  <#mycpt><#body>foobar</#body></#mycpt>
 * so these cpt nodes are simply insert nodes for an attribute of its parent component
 */
        module.exports.$CptAttInsert = {
            initCpt: function(cptAttElement) {
                // get the $RootNode corresponding to the templat to insert
                this.createPathObservers();
                this.createCommentBoundaries("cptattinsert");
                this.createChildNodeInstances(cptAttElement);
            },
            createChildNodeInstances: function(cptAttElement) {
                if (!this.isDOMempty) {
                    this.removeChildNodeInstances(this.node1, this.node2);
                    this.isDOMempty = true;
                }
                this.cptAttElement = cptAttElement;
                this.childNodes = [];
                var root = this.cptAttElement.getTemplateNode();
                if (root) {
                    // append root as childNode
                    this.childNodes[0] = root;
                    // render in a doc fragment
                    var df = doc.createDocumentFragment();
                    root.render(df, false);
                    this.node.insertBefore(df, this.node2);
                    root.replaceNodeBy(df, this.node);
                    // recursively remove doc fragment reference
                    this.isDOMempty = false;
                }
            },
            /**
   * Safely cut all dependencies before object is deleted
   * @param {Boolean} localPropOnly if true only local properties will be deleted (optional)
   *        must be used when a new instance is created to adapt to a path change
   */
            $dispose: function(localPropOnly) {
                this.cptAllElt = null;
                this.cleanObjectProperties(localPropOnly);
            }
        };
    });
    define("hsp/rt/cpttemplate.js", [ "../json", "./document" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
        var json = require("../json"), doc = require("./document");
        /**
 * $CptTemplate contains methods that will be added to the prototype of all
 * $CptNode node instance that correspond to a template insertion:
 *   <#mytemplate foo="bar"/> 
 * (i.e. a component using a template without any controller)
 */
        module.exports.$CptTemplate = {
            /**
   * Initialize the component
   * @param {Object} arg
   *     e.g. {template:obj,ctlConstuctor:obj.controllerConstructor}
   */
            initCpt: function(arg) {
                // create path observers and comment boundaries
                this.createPathObservers();
                this.createCommentBoundaries("template");
                this.createChildNodeInstances();
                // the component is a template without any controller
                // so we have to observe the template root scope to be able to propagate changes to the parent scope
                this._scopeChgeCb = this.onScopeChange.bind(this);
                json.observe(this.vscope, this._scopeChgeCb);
            },
            /**
   * Create the child nodes for a dynamic template - this method assumes
   * that node1 and node2 exist
   */
            createChildNodeInstances: function() {
                this.removeChildInstances();
                if (this.template) {
                    var args = this.getTemplateArguments();
                    // temporarily assign a new node to get the content in a doc fragment
                    var realNode = this.node;
                    var df = doc.createDocumentFragment();
                    this.node = df;
                    this.template.call(this, args);
                    realNode.insertBefore(df, this.node2);
                    this.replaceNodeBy(df, realNode);
                    // recursively remove doc fragment reference
                    // now this.node=realNode
                    this.isDOMempty = false;
                }
            },
            /**
   * Safely cut all dependencies before object is deleted
   * @param {Boolean} localPropOnly if true only local properties will be deleted (optional)
   *        must be used when a new instance is created to adapt to a path change
   */
            $dispose: function(localPropOnly) {
                this.cleanObjectProperties(localPropOnly);
            },
            /**
   * Callback called by the json observer when the scope changes This callback is only called when the component
   * template has no controller Otherwise the cpt node is automatically set dirty and controller attributes will be
   * refreshed through refresh() - then the controller will directly call onAttributeChange()
   */
            onScopeChange: function(changes) {
                if (changes.constructor === Array) {
                    // cpt observer always return the first element of the array
                    if (changes.length > 0) {
                        this.onAttributeChange(changes[0]);
                    }
                }
            },
            /**
   * Refresh the node attributes (even if adirty is false)
   */
            refreshAttributes: function() {
                var atts = this.atts, att, eh = this.eh, pvs = this.parent.vscope;
                if (atts) {
                    // this template has no controller
                    // let's propagate the new attribute values to the current scope
                    var vscope = this.vscope;
                    for (var i = 0, sz = this.atts.length; sz > i; i++) {
                        att = atts[i];
                        json.set(vscope, att.name, att.getValue(eh, pvs, null));
                    }
                }
            }
        };
    });
    define("hsp/rt/$root.js", [ "../klass", "./log", "./document", "../json", "../propobserver", "./tnode", "./cptcomponent", "./cptattinsert", "./cpttemplate" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        // This module contains the $Root and $Insert nodes used to instantiate new templates
        var klass = require("../klass"), log = require("./log"), doc = require("./document"), json = require("../json"), PropObserver = require("../propobserver"), tn = require("./tnode"), TNode = tn.TNode, cptComponent = require("./cptcomponent");
        var CPT_TYPES = {
            $CptAttInsert: require("./cptattinsert").$CptAttInsert,
            $CptComponent: cptComponent.$CptComponent,
            $CptTemplate: require("./cpttemplate").$CptTemplate
        };
        var DOCUMENT_FRAGMENT_NODE = 11;
        /**
 * Root node - created at the root of each template
 * Contains the listeners requested by the child nodes
 * Is replaced by the $CptNode (child class) when the template is inserted in another template
 */
        var $RootNode = klass({
            $extends: TNode,
            /**
     * Create the root node that will reference a new set of node instances for a new template instance
     * @param {} vscope the variable scope tree (optional for sub-classes)
     * @param {Array|TNode} nodedefs the list of the node generators associated to the template (will be used to
     * recursively generate the child nodes) (optional for sub-classes)
     * @param {Array} argnames the list of the template argument names (optional) - e.g.
     * ["vscope","nodedefs","argnames"]
     * @param {Object} ctlWrapper the controller observer - if any
     * @param {Map} ctlInitAtts the init value of the controller attributes (optional) - e.g.
     * {value:'123',mandatory:true}
     */
            $constructor: function(vscope, nodedefs, argnames, ctlWrapper, ctlInitAtts) {
                if (this.isInsertNode) {
                    TNode.$constructor.call(this, this.exps);
                } else {
                    TNode.$constructor.call(this, 0);
                    var df = doc.createDocumentFragment();
                    this.node = df;
                    this.root = this;
                }
                // meta-data name for the observer id that will be stored on the target objects
                this.MD_ID = klass.createMetaDataPrefix() + "oid";
                this.propObs = [];
                this.argNames = null;
                if (vscope || nodedefs || argnames || ctlWrapper) {
                    this.init(vscope, nodedefs, argnames, ctlWrapper, ctlInitAtts);
                }
            },
            /**
     * Initialize the root node
     * @param {} vscope the variable scope tree
     * @param {Array|TNode} nodedefs the list of the node generators associated to the template (will be used to
     * recursively generate the child nodes)
     * @param {Array} argnames the list of the template argument names (optional) - e.g.
     * ["vscope","nodedefs","argnames"]
     * @param {Object} ctlWrapper the controller observer - if any
     * @param {Map} ctlInitAtts the init value of the controller attributes (optional) - e.g.
     * {value:'123',mandatory:true}
     */
            init: function(vscope, nodedefs, argnames, ctlWrapper, ctlInitAtts) {
                var cw;
                this.vscope = vscope;
                if (ctlWrapper) {
                    // attach the controller objects to the node
                    this.ctlWrapper = cw = ctlWrapper;
                    this.controller = ctlWrapper.cpt;
                    // init controller attributes
                    this.ctlWrapper.root = this;
                    this.ctlWrapper.init(ctlInitAtts);
                } else if (this.$constructor === $CptNode) {
                    // this is a template insertion - we need to init the vscope
                    if (ctlInitAtts) {
                        for (var k in ctlInitAtts) {
                            vscope[k] = ctlInitAtts[k];
                        }
                    }
                }
                var ch = [];
                if (nodedefs.constructor === Array) {
                    for (var i = 0, sz = nodedefs.length; sz > i; i++) {
                        ch.push(nodedefs[i].createNodeInstance(this));
                    }
                } else {
                    ch[0] = nodedefs.createNodeInstance(this);
                }
                if (cw && !cw.nodeInstance) {
                    cw.refresh();
                }
                this.childNodes = ch;
                this.argNames = argnames;
            },
            $dispose: function() {
                // dispose all property observers
                var o;
                for (var i = 0, sz = this.propObs.length; sz > i; i++) {
                    o = this.propObs[i];
                    delete o.target[this.MD_ID];
                    // remove the MD marker
                    o.$dispose();
                }
                this.propObs = null;
                if (this.ctlWrapper) {
                    this.ctlWrapper.$dispose();
                    this.ctlWrapper = null;
                    this.controller = null;
                }
                TNode.$dispose.call(this);
            },
            /**
     * Create listeners for the variables associated to a specific node instance
     * @param {TNode} ni the node instance that should be notified of the changes
     * @param {Object} scope the scope to be used (optional - default: ni.vscope, but is not ok for components)
     */
            createExpressionObservers: function(ni, scope) {
                var vs = scope ? scope : ni.vscope, eh = ni.eh, op, sz;
                if (!eh) return;
                // no expression is associated to this node
                for (var k in eh.exps) {
                    op = eh.exps[k].getObservablePairs(eh, vs);
                    if (!op) continue;
                    sz = op.length;
                    if (sz === 1) {
                        this.createObjectObserver(ni, op[0][0], op[0][1]);
                    } else {
                        ni.obsPairs = op;
                        for (var i = 0; sz > i; i++) {
                            this.createObjectObserver(ni, op[i][0], op[i][1]);
                        }
                    }
                }
            },
            /**
     * Create or update a PropObserver for one or several property
     * @param {TNode} ni the node instance that should be notified of the changes (i.e. the observer)
     * @param {Object} obj the object holding the property
     * @param {String} prop the property name (optional)
     */
            createObjectObserver: function(ni, obj, prop) {
                var oid = obj[this.MD_ID], obs;
                // observer id
                if (oid) {
                    // observer already exists
                    obs = this.propObs[oid - 1];
                } else {
                    // observer doesn't exist yet
                    obs = new PropObserver(obj);
                    var sz = this.propObs.length;
                    this.propObs[sz] = obs;
                    obs.id = oid = sz + 1;
                    // so that it doesn't start at 0
                    obj[this.MD_ID] = oid;
                }
                obs.addObserver(ni, prop);
            },
            /**
     * Remove a PropObserver previously created with createObjectObserver
     * @param {TNode} ni the node instance that should be notified of the changes (i.e. the observer)
     * @param {Object} obj the object holding the property
     * @param {String} prop the property name (optional)
     */
            rmObjectObserver: function(ni, obj, prop) {
                var oid = obj[this.MD_ID];
                // observer id
                if (oid) {
                    // observer exists
                    var obs = this.propObs[oid - 1];
                    obs.rmObserver(ni, prop);
                }
            },
            /**
     * Removes the object observers associated to a node instance
     * @param {TNode} ni the node instance that contained the changes
     */
            rmAllObjectObservers: function(ni) {
                var op = ni.obsPairs;
                if (op) {
                    for (var i = 0, sz = op.length; sz > i; i++) {
                        // remove previous
                        this.rmObjectObserver(ni, op[i][0], op[i][1]);
                    }
                    ni.obsPairs = null;
                }
            },
            /**
     * Update the object observers associated to a node instance
     * @param {TNode} ni the node instance that contained the changes
     */
            updateObjectObservers: function(ni) {
                if (ni.obsPairs) {
                    this.rmAllObjectObservers(ni);
                }
                this.createExpressionObservers(ni);
            },
            /**
     * Dynamically update the value of one of the arguments used by the template The refresh() method must be called
     * once all updates are done to have the changes propagated in all the template (and sub-templates)
     * @param {integer} argidx the argument index in the template function - 0 is first argument
     * @param {any} argvalue the argument value
     */
            updateArgument: function(argidx, argvalue) {
                json.set(this.vscope["$scope"], this.argNames[argidx], argvalue);
            },
            /**
     * Append this root element to the DOM
     * @param {DOMElement|String} domElt the DOM element to which the template will be appended through the appendChild
     * DOMElement method
     * @param {string|DOMElement} container the HTML container element or its id
     * @param {Boolean} replace if true, the template result will replace the element content - otherwise it will be
     * appended (default: true)
     * @return {$RootNode} the current node to be able to chain actions
     */
            render: function(domElt, replace) {
                var c = domElt;
                // container
                if (typeof c === "string") {
                    c = doc.getElementById(c);
                    if (c === null) {
                        log.error("[hashspace] Template cannot be rendered - Invalid element id: " + domElt);
                        return this;
                    }
                } else if (!c || !c.appendChild) {
                    log.error("[hashspace] Template cannot be rendered - Invalid element: " + domElt);
                    return this;
                }
                var df = this.node;
                // should be a doc fragment
                if (df.nodeType !== DOCUMENT_FRAGMENT_NODE) {
                    log.error("[hashspace] root element can only be appended once in the DOM");
                } else {
                    if (replace !== false) {
                        // remove previous content
                        c.innerHTML = "";
                    }
                    c.appendChild(df);
                    // recursively updates all reference to the previous doc fragment node
                    this.replaceNodeBy(df, c);
                }
                var parentNode = c;
                while (parentNode.parentNode) {
                    parentNode = parentNode.parentNode;
                }
                if (parentNode.body) {
                    this.afterDOMInsert();
                }
                return this;
            },
            /**
     * Recursively call the afterDOMInsert method in child nodes and the $onDOMInsert method in the controller, if any.
     */
            afterDOMInsert: function() {
                TNode.afterDOMInsert.call(this);
                if (this.controller && this.controller.$onDOMInsert) {
                    this.controller.$onDOMInsert();
                }
            }
        });
        /**
 * Return the object referenced by the path given as argument
 * @param path {Array} an array giving the path of the object. The first element can be undefined or can be the
 * reference to the root path object in the original context - e.g. [lib,"lib","NbrField"]. If the first element is null
 * or undefined, the path should be extracted from the scope object
 * @param scope {Object} the scope object from with the object should be extracted if the first path element is not
 * defined
 */
        var getObject = exports.getObject = function(path, scope) {
            var root = path[0], o = null, sz = path.length;
            if (root === undefined || root === null || typeof root === "string") {
                if (scope && sz > 1) {
                    o = scope[path[1]];
                }
                if (o === undefined || o === null) {
                    return null;
                }
            } else {
                // scope has priority over the global scope
                if (scope && sz > 1) {
                    o = scope[path[1]];
                }
                if (!o) {
                    o = root;
                }
            }
            if (sz > 2) {
                for (var i = 2; sz > i; i++) {
                    o = o[path[i]];
                }
            }
            return o;
        };
        /**
 * Component node Allows to insert the content generated by a component template
 */
        var $CptNode = klass({
            $extends: $RootNode,
            /**
     * $CptNode generator CptNode can be seen as a mix of InsertNode and EltNode
     * @param {Array} tplPath path to the template object - e.g. [lib,"lib","mytpl"] cf. getObject()
     * @param {Map<Expression>|int} exps the map of the expressions used by the node. 0 is passed if no expression is
     * used
     * @param {Map} attcfg map of the different attributes used on the container e.g. {"title":"Hello!"} - cf attribute
     * objects for more info
     * @param {Map} ehcfg map of the different event hanlder used on the element e.g. {"onclick":1} - where 1 is the
     * expression index associated to the event hanlder callback
     * @param {Array} children list of child node generators - correponding to pseudo components and attribute content
     */
            $constructor: function(tplPath, exps, attcfg, ehcfg, children) {
                this.pathInfo = tplPath.slice(1).join(".");
                // debugging info
                this.info = "[Component: #" + this.pathInfo + "]";
                // debug info
                this.isCptNode = true;
                this.attEltNodes = null;
                // array of element nodes - used to trigger a refresh when elt content changes
                this.tplPath = tplPath;
                this.isInsertNode = true;
                // to ensure $RootNode is creating expression listeners
                this.isDOMless = true;
                this.exps = exps;
                // used by the $RootNode constructor
                this.attcfg = attcfg;
                $RootNode.$constructor.call(this);
                this.createAttList(attcfg, ehcfg);
                this.controller = null;
                // different for each instance
                this.ctlAttributes = null;
                // reference to the controller attributes definition - if any
                this._scopeChgeCb = null;
                // used by component w/o any controller to observe the template scope
                this.template = null;
                // reference to the template object (used by component and templates)
                if (children && children !== 0) {
                    this.children = children;
                }
            },
            /**
     * Default dispose method
     * @param {Boolean} localPropOnly if true only local properties will be deleted (optional)
     *        must be used when a new instance is created to adapt to a path change
     */
            $dispose: function(localPropOnly) {
                this.cleanObjectProperties(localPropOnly);
            },
            /**
     * Removes object properties - helper for $dispose methods
     * @param {Boolean} localPropOnly if true only local properties will be deleted (optional)
     *        must be used when a new instance is created to adapt to a path change
     */
            cleanObjectProperties: function(localPropOnly) {
                this.removePathObservers();
                if (this._scopeChgeCb) {
                    json.unobserve(this.vscope, this._scopeChgeCb);
                    this._scopeChgeCb = null;
                }
                if (localPropOnly !== true) {
                    $RootNode.$dispose.call(this);
                }
                this.exps = null;
                this.controller = null;
                this.ctlAttributes = null;
                this.template = null;
                if (this.node1) {
                    this.node1 = null;
                    this.node2 = null;
                }
            },
            /**
     * Create a node instance referencing the current node as base class As the $CptNode is DOMless it will not create a
     * DOM node for itself - but will create nodes for its children instead (through the $RootNode of the template
     * process function)
     * @return {TNode} the new node instance
     */
            createNodeInstance: function(parent, node1, node2) {
                var ni = null;
                // get the object referenced by the cpt path
                var p = this.getPathData(this.tplPath, parent.vscope), po = p.pathObject;
                // if object is a function this is a template or a component insertion
                if (po) {
                    ni = this.createCptInstance(p.cptType, parent);
                    ni.node1 = node1;
                    ni.node2 = node2;
                    if (p.cptType === "$CptAttInsert") {
                        // this cpt is used to an insert another component passed as attribute
                        ni.initCpt(po);
                    } else {
                        // we are in a template or component cpt
                        this.template = p.pathObject;
                        ni.initCpt({
                            template: po,
                            ctlConstuctor: po.controllerConstructor
                        });
                    }
                }
                if (!ni) {
                    log.error(this.info + " Invalid component reference");
                    // create an element to avoid generating other errors
                    ni = this.createCptInstance("$CptAttInsert", parent);
                }
                return ni;
            },
            /**
     * Calculates the object referenced by the path and the component type
     * @return {Object} object with the following properties:
     *        pathObject: {Object} the object referenced by the path
     *        cptType: {String} one of the following option: "$CptComponent",
     *                 "$CptTemplate", "$CptAttInsert" or "InvalidComponent"
     */
            getPathData: function(path, vscope) {
                // determine the type of this component:
                // - either a template - e.g. <#mytemplate foo="bar"/>
                //   -> instance will extend $CptTemplate
                // - a component with controller - e.g. <#mycpt foo="bar"/>
                //   -> instance will extend $CptComponent
                // - or a attribute element insertion - e.g. <#c.body/>
                //   -> instance will extend $CptAttInsert
                var o = getObject(path, vscope), r = {
                    cptType: "InvalidComponent"
                };
                if (o) {
                    r.pathObject = o;
                    if (typeof o === "function") {
                        if (o.controllerConstructor) {
                            r.cptType = "$CptComponent";
                        } else {
                            r.cptType = "$CptTemplate";
                        }
                    } else if (o.isCptAttElement) {
                        r.cptType = "$CptAttInsert";
                    }
                }
                return r;
            },
            /**
     * Remove all child node instances bewteen node1 and node2
     */
            removeChildInstances: function() {
                if (!this.isDOMempty) {
                    this.removeChildNodeInstances(this.node1, this.node2);
                    this.isDOMempty = true;
                }
            },
            /**
     * Create and return an instance node associated to the component type passed as argument
     * The method dynamically creates a specialized $CptNode object that will be used as prototype
     * of the instance node - this allows to avoid mixing methods and keep code clear
     * @param cptType {string} one of the following: $CptAttInsert / $CptAttElement / $CptComponent / $CptTemplate
     */
            createCptInstance: function(cptType, parent) {
                // build the new type
                var proto1 = CPT_TYPES[cptType];
                var ct = Object.create(this);
                for (var k in proto1) {
                    if (proto1.hasOwnProperty(k)) {
                        ct[k] = proto1[k];
                    }
                }
                this.cptType = cptType;
                // create node instance
                var ni = Object.create(ct);
                ni.vscope = parent.vscope;
                // we don't create new named variable in vscope, so we use the same vscope
                ni.parent = parent;
                ni.nodeNS = parent.nodeNS;
                ni.root = parent.root;
                ni.root.createExpressionObservers(ni);
                ni.node = ni.parent.node;
                return ni;
            },
            /**
     * Create and append the node1 and node2 boundary nodes used to delimit the component content
     * in the parent node
     */
            createCommentBoundaries: function(comment) {
                // only create nodes if they don't already exist (cf. reprocessNodeInstance)
                if (!this.node1 && !this.node2) {
                    var nd = this.node;
                    this.node1 = doc.createComment("# " + comment + " " + this.pathInfo);
                    this.node2 = doc.createComment("# /" + comment + " " + this.pathInfo);
                    nd.appendChild(this.node1);
                    nd.appendChild(this.node2);
                }
            },
            /**
     * Callback called when a controller attribute or a template attribute has changed
     */
            onAttributeChange: function(change) {
                var expIdx = -1;
                // set the new attribute value in the parent vscope to propagate change
                var cfg = this.attcfg[change.name];
                // change.name is the property name
                if (cfg && cfg.constructor === Array && cfg.length === 2 && cfg[0] === "") {
                    // cfg is a text concatenation with an empty prefix - so 2nd element is the expression index
                    expIdx = cfg[1];
                }
                if (expIdx > -1) {
                    var exp = this.eh.getExpr(expIdx), pvs = this.parent.vscope;
                    if (exp.bound && exp.setValue) {
                        var cv = exp.getValue(pvs, this.eh);
                        if (cv !== change.newValue) {
                            // if current value is different, we update it on the scope object that owns it
                            exp.setValue(pvs, change.newValue);
                        }
                    }
                }
            },
            /**
     * Calculates if the current node instance must be replaced by another one
     * if component path changed
     * @return {Object} the new component instance or null if instance doesn't change
     */
            reprocessNodeInstance: function() {
                var p = this.getPathData(this.tplPath, this.parent.vscope);
                if (p.cptType === "InvalidComponent" || p.cptType === this.cptType) {
                    // component is not valid or nature hasn't changed
                    return null;
                }
                // component nature has changed
                var parent = this.parent, ni = this.createNodeInstance(parent, this.node1, this.node2), cn = parent.childNodes;
                // replace current node with ni in the parent collection
                if (ni && cn) {
                    for (var i = 0, sz = cn.length; sz > i; i++) {
                        if (cn[i] === this) {
                            cn[i] = ni;
                            // dispose current object
                            this.$dispose(true);
                            return ni;
                        }
                    }
                }
                return null;
            },
            /**
     * Refresh the sub-template arguments and the child nodes, if needed
     */
            refresh: function() {
                if (this.adirty) {
                    var newNode = this.reprocessNodeInstance();
                    if (newNode) {
                        // component type has changed so current node is obsolete and has been disposed
                        newNode.refresh();
                        return;
                    }
                    // one of the component attribute has been changed - we need to propagate the change
                    // to the template controller
                    // check first if template changed
                    var tplChanged = false;
                    if (this.template) {
                        var tpl = getObject(this.tplPath, this.parent.vscope);
                        tplChanged = tpl !== this.template;
                    } else if (this.cptAttElement) {
                        // check if the cptattinsert path has changed
                        var o = getObject(this.tplPath, this.parent.vscope);
                        if (o.isCptAttElement && o !== this.cptAttElement) {
                            // change the the cptAttElement and refresh the DOM
                            this.createChildNodeInstances(o);
                        }
                    }
                    if (tplChanged) {
                        // check if component nature changed from template to component or opposite
                        this.template = tpl;
                        this.createChildNodeInstances();
                    } else {
                        if (this.refreshAttributes) {
                            this.refreshAttributes();
                            // for component and sub-templates the original vscope is substituted
                            // to the one of the component- or sub-template
                            // so we need to revert to the parent scope to observe the correct objects
                            var vs = this.vscope;
                            this.vscope = this.parent.vscope;
                            this.root.updateObjectObservers(this);
                            this.vscope = vs;
                        }
                    }
                    this.adirty = false;
                }
                TNode.refresh.call(this);
            },
            /**
     * Return the objects referenced by the path - return null if the path is not observable
     */
            getPathObjects: function() {
                var tp = this.tplPath, o, ps = this.parent.vscope, isType0String = typeof tp[0] === "string";
                if (ps[tp[1]]) {
                    // tp[1] exists in the scope - so it has priority
                    o = this.getScopeOwner(tp[1], ps);
                } else if (tp[0] === undefined || tp[0] === null || isType0String) {
                    if (isType0String) {
                        // we have to find the right scope object holding this property
                        o = this.getScopeOwner(tp[0], ps);
                        if (o === null) {
                            // property doesn't exist yet
                            o = ps;
                        }
                    } else {
                        o = ps;
                    }
                }
                if (o) {
                    var sz = tp.length, res = [];
                    res.push(o);
                    for (var i = 1; sz > i; i++) {
                        o = o[tp[i]];
                        if (o === undefined || o === null) {
                            return null;
                        }
                        res.push(o);
                    }
                    return res;
                }
                return null;
            },
            /**
     * Create observers to observe path changes
     * This method is usec by $CptTemplate and $CptComponent
     * @return {Boolean} true if the path can be observed
     */
            createPathObservers: function() {
                var pos = this.getPathObjects();
                if (!pos || !pos.length) {
                    return false;
                }
                var sz = pos.length;
                this._pathChgeCb = this.onPathChange.bind(this);
                for (var i = 0; sz > i; i++) {
                    json.observe(pos[i], this._pathChgeCb);
                }
                this._observedPathObjects = pos;
                return true;
            },
            /**
     * Remove path observers created through createPathObservers()
     */
            removePathObservers: function() {
                var pos = this._observedPathObjects;
                if (pos && pos.length) {
                    for (var i = 0, sz = pos.length; sz > i; i++) {
                        json.unobserve(pos[i], this._pathChgeCb);
                    }
                    this._observedPathObjects = null;
                }
                this._pathChgeCb = null;
            },
            /**
     * Callback called when one of the object of the template path changes
     */
            onPathChange: function() {
                // Warning: this method may be called even if the object referenced by the path didn't change
                // because we observe all the properties of the object on the path - so we need to detect
                // first if one of the objects on the path really changed
                if (!this.parent && !this.root) {
                    return;
                }
                var pos = this.getPathObjects(), opos = this._observedPathObjects;
                var sz = pos ? pos.length : -1;
                var osz = opos ? opos.length : -1;
                var changed = false;
                if (sz === osz && sz !== -1) {
                    // compare arrays
                    for (var i = 0; sz > i; i++) {
                        if (pos[i] !== opos[i]) {
                            changed = true;
                            break;
                        }
                    }
                } else if (sz !== -1) {
                    changed = true;
                }
                if (changed) {
                    this.removePathObservers();
                    this.createPathObservers();
                    this.onPropChange();
                }
            },
            /**
     * Return the collection of template arguments
     * Used by $CptTemplate and $CptComponent instances
     */
            getTemplateArguments: function() {
                var args = {};
                if (this.atts) {
                    var att, pvs = this.parent.vscope;
                    for (var i = 0, sz = this.atts.length; sz > i; i++) {
                        att = this.atts[i];
                        args[att.name] = att.getValue(this.eh, pvs, null);
                    }
                }
                return args;
            }
        });
        /**
 * Component attribute nodes contains attribute elements for the parent component
 */
        var $CptAttElement = klass({
            $extends: $CptNode,
            isCptAttElement: true,
            /**
     * $CptAttElement generator
     */
            $constructor: function(name, exps, attcfg, ehcfg, children) {
                this.name = name;
                this.info = "[Component attribute element: @" + this.name + "]";
                this.tagName = "@" + name;
                $CptNode.$constructor.call(this, [ null, name ], exps, attcfg, ehcfg, children);
                this.isCptAttElement = true;
            },
            $dispose: function() {
                TNode.$dispose.call(this);
            },
            /**
     * Return the component attribute type of the current node
     * @return {String} one of the following option:
     *      "ATTELT" if the element is an attribute element (e.g. <@body>)
     *      "CONTENT" if the node is a content element (e.g. <div>)
     *      "INDEFINITE" if the element can be part of eithe an attribute or content collection (e.g. blank text nodes)
     *      "ERROR" if elt mixes attribute and content elements
     */
            getCptAttType: function() {
                return "ATTELT";
            },
            createNodeInstance: function(parent) {
                var ni;
                // identify this node as a component attribute
                // find parent to check attribute is not used outside any component
                var p = parent, found = false;
                while (p) {
                    if (p.isCptComponent) {
                        found = true;
                        var eltDef = null, attDef = null;
                        if (p.ctlElements) {
                            eltDef = p.ctlElements[this.name];
                        }
                        if (p.ctlAttributes) {
                            attDef = p.ctlAttributes[this.name];
                        }
                        if (!eltDef && !attDef) {
                            // invalid elt
                            log.error(this.info + " Element not supported by its parent component");
                        } else if (eltDef) {
                            var type = eltDef.type;
                            if (type === "template") {
                                ni = TNode.createNodeInstance.call(this, parent);
                            } else if (type === "component") {
                                if (!eltDef.controller) {
                                    log.error(this.info + " Controller property is mandatory for component elements");
                                } else {
                                    // this element is a sub-component - let's create its controller
                                    ni = this.createCptInstance("$CptComponent", parent);
                                    ni.initCpt({
                                        cptattelement: ni,
                                        ctlConstuctor: eltDef.controller,
                                        parentCtrl: p.controller
                                    });
                                }
                            } else {
                                log.error(this.info + " Invalid component element type: " + eltDef.type);
                            }
                        } else if (attDef) {
                            if (attDef.type === "template") {
                                ni = TNode.createNodeInstance.call(this, parent);
                            }
                        }
                        p = null;
                    } else {
                        p = p.parent;
                    }
                }
                if (!found) {
                    log.error(this.info + " Attribute elements cannot be used outside components");
                }
                return ni;
            },
            /**
     * Register the element in the list passed as argument
     * This allows for the component to dynamically rebuild the list of its attribute elements
     */
            registerAttElements: function(attElts) {
                attElts.push(this);
            },
            /**
     * Return the template node that must be inserted by $CptAttInsert
     */
            getTemplateNode: function() {
                return new $RootNode(this.vscope, this.children);
            }
        });
        cptComponent.setDependency("$CptNode", $CptNode);
        cptComponent.setDependency("TNode", TNode);
        cptComponent.setDependency("$CptAttElement", $CptAttElement);
        exports.$RootNode = $RootNode;
        exports.$CptNode = $CptNode;
        exports.$CptAttElement = $CptAttElement;
    });
    define("hsp/rt/colutils.js", [ "./log", "../klass", "../$set" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        var log = require("./log"), klass = require("../klass"), $set = require("../$set");
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
        var orderBy = exports.orderBy = function(array, expression, reverse) {
            var arr, sortFn, sortProp = null, reverse = reverse === true;
            if (array.constructor !== Array) {
                log.error("[orderBy()] array argument must be of type Array");
                return [];
            }
            // clone array
            arr = array.slice(0);
            if (expression.constructor === Function) {
                sortFn = expression;
            } else if (expression.constructor === String && expression !== "") {
                sortProp = expression;
            } else {
                log.error("[orderBy()] Invalid expression argument: " + expression);
                return arr;
            }
            // create sortFn if sortProp is used
            if (sortProp) {
                sortFn = function(a, b) {
                    var v1 = a[sortProp], v2 = b[sortProp];
                    v1 = v1 ? v1 : "";
                    v2 = v2 ? v2 : "";
                    if (v1 > v2) {
                        return 1;
                    } else {
                        return v1 == v2 ? 0 : -1;
                    }
                };
            }
            // adapt sortFn if reverse
            var sfn = sortFn;
            if (reverse) {
                sfn = function(a, b) {
                    return sortFn(a, b) * -1;
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
            $constructor: function(options) {
                var sfn = this.sortFunction = options.sortFunction;
                var pp = this.sortProperty = options.property;
                this.state = "N";
                // default state in case of error
                this.states = [ "N" ];
                // validate options
                if (sfn) {
                    if (sfn.constructor !== Function) {
                        return log.error("[Sorter] Sort function must be a function: " + sfn);
                    }
                } else if (pp) {
                    if (pp.constructor !== String) {
                        return log.error("[Sorter] Sort property must be a string: " + pp);
                    }
                }
                var ost = options.states, states = [], ch;
                if (ost && ost.constructor !== String) {
                    log.error("[Sorter] states option must be a string: " + ost);
                    ost = "NAD";
                } else {
                    ost = ost ? ost.toUpperCase() : "NAD";
                }
                for (var i = 0; ost.length > i; i++) {
                    ch = ost.charAt(i);
                    if (!ch.match(/[NAD]/)) {
                        log.error("[Sorter] Invalid state code: " + ch);
                    } else {
                        states.push(ch);
                    }
                }
                this.state = states[0];
                this.states = states;
            },
            /**
     * Apply the sort on a given array
     * @param {Array} array the array to sort
     * @return {Array} a sorted copy of the array
     */
            apply: function(array) {
                if (array.constructor !== Array) {
                    log.error("[Sorter.apply()] array argument must be of type Array");
                    return [];
                }
                if (this.state === "N") {
                    return array.slice(0);
                } else {
                    var reverse = this.state === "D", expr = this.sortFunction ? this.sortFunction : this.sortProperty;
                    return orderBy(array, expr, reverse);
                }
            },
            /**
     * Moves the state to the next possible value, according to the states options (e.g. "NAD")
     */
            nextState: function() {
                var states = this.states, next = states[0], st = this.state;
                for (var i = 0; states.length - 1 > i; i++) {
                    if (states[i] === st) {
                        next = states[i + 1];
                        break;
                    }
                }
                $set(this, "state", next);
            },
            /**
     * Set the sorter state to a given state - that must be defined in the states options (e.g. "D" in "ADN")
     */
            setState: function(state) {
                // check that state is valid (must iterate as indexOf() in part of ES5)
                var found = false, states = this.states;
                for (var i = 0; states.length > i; i++) {
                    if (states[i] === state) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    log.error("[Sorter.setState] state argument '" + state + "' is not part of the possible states '" + this.states.join("") + "'");
                } else {
                    $set(this, "state", state);
                }
            }
        });
        /*
 * Register all module exports to the hashspace global object
 * @param {Object} global the hashspace global object
 */
        exports.setGlobal = function(global) {
            global.orderBy = orderBy;
            global.Sorter = Sorter;
        };
    });
    define("hsp/rt/$if.js", [ "../klass", "./document", "./tnode" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        // If condition node
        var klass = require("../klass"), doc = require("./document"), tnode = require("./tnode"), TNode = tnode.TNode;
        /**
 * If node Implements the if conditional statement. Adds a children2 collection that corresponds to the else block
 */
        var $IfNode = klass({
            $extends: TNode,
            /**
     * IfNode generator
     * @param {Map<Expression>|int} exps the map of the variables used by the node. 0 is passed if no expression is
     * used
     * @param {Integer} condexp the index of the condition expression - e.g. 1
     * @param {Array} children list of sub-node generators - 0 may be passed if there is not child nodes
     * @param {Array} children2 list of sub-node generators for the else statemetn - 0 may be passed if there is not
     * child nodes
     */
            $constructor: function(exps, condexp, children, children2) {
                TNode.$constructor.call(this, exps);
                this.isDOMless = true;
                // the if node has no container DOM elements - however its childNodes collection references
                // the nodes that it creates
                this.lastConditionValue = false;
                this.isDOMempty = true;
                this.condexpidx = condexp;
                if (children && children !== 0) {
                    this.children = children;
                }
                if (children2 && children2 !== 0) {
                    this.children2 = children2;
                }
            },
            /**
     * Create a node instance referencing the current node as base class As the $IfNode is DOMless it will not create a
     * DOM node for itself - but will create nodes for its children instead
     * @return {TNode} the new node instance
     */
            createNodeInstance: function(parent) {
                var ni = TNode.createNodeInstance.call(this, parent);
                var nd = ni.node;
                // same as parent node in this case
                ni.TYPE = "# if";
                // for debugging purposes
                ni.node1 = doc.createComment("# if");
                ni.node2 = doc.createComment("# /if");
                nd.appendChild(ni.node1);
                nd.appendChild(ni.node2);
                ni.createChildNodeInstances(ni.getConditionValue());
                return ni;
            },
            /**
     * Delete and re-create the child node instances Must be called on a node instance
     * @param {boolean} condition the value of the condition to consider
     */
            createChildNodeInstances: function(condition) {
                this.lastConditionValue = condition;
                if (!this.refScope) {
                    this.refScope = this.vscope;
                }
                if (!this.isDOMempty) {
                    this.removeChildNodeInstances(this.node1, this.node2);
                    this.isDOMempty = true;
                }
                // create new scope
                this.vscope = this.createSubScope(this.refScope);
                // evalutate condition expression to determine which children collection to use (i.e. if or block)
                var ch = condition ? this.children : this.children2;
                // create child nodes
                if (ch) {
                    // the if node has no container DOM elements - however its childNodes collection references
                    // the nodes that it creates
                    var sz = ch.length, n;
                    if (sz > 0) {
                        this.childNodes = [];
                        var df = doc.createDocumentFragment();
                        this.node = df;
                        // use a doc fragment to create the new node instead of the parent node
                        for (var i = 0; sz > i; i++) {
                            n = ch[i].createNodeInstance(this);
                            this.childNodes.push(n);
                        }
                        this.replaceNodeBy(this.node, this.parent.node);
                        // recursively remove doc fragment reference
                        this.node.insertBefore(df, this.node2);
                        if (this.rendered) {
                            this.afterDOMInsert();
                        }
                        this.isDOMempty = false;
                    }
                }
            },
            /**
     * Processes the current condition value
     */
            getConditionValue: function() {
                var condition = false;
                if (this.eh) condition = this.eh.getValue(this.condexpidx, this.vscope, false);
                return condition ? true : false;
            },
            /**
     * Refresh the node If the if condition has changed, delete previous child nodes and create those corresponding to
     * the else statement. Otherwise performs the regular recursive refresh
     */
            refresh: function() {
                var cond = this.getConditionValue(), ch;
                if (cond !== this.lastConditionValue) {
                    this.createChildNodeInstances(cond);
                    this.root.updateObjectObservers(this);
                    this.cdirty = false;
                    // check if one child is dirty
                    if (this.childNodes) {
                        for (var i = 0; this.childNodes.length > i; i++) {
                            ch = this.childNodes[i];
                            if (ch.adirty || ch.cdirty) {
                                this.cdirty = true;
                                break;
                            }
                        }
                    }
                }
                TNode.refresh.call(this);
            },
            /**
     * Return the component attribute type of the current node
     * @return {String} one of the following option:
     *      "ATTELT" if the element is an attribute element (e.g. <@body>)
     *      "CONTENT" if the node is a content element (e.g. <div>)
     *      "INDEFINITE" if the element can be part of eithe an attribute or content collection (e.g. blank text nodes)
     *      "ERROR" if elt mixes attribute and content elements
     */
            getCptAttType: function() {
                // this method must be overridden by child classes
                var t1 = this.getCptContentType(this.children), t2 = this.getCptContentType(this.children2);
                if (t1 === "ERROR" || t2 === "ERROR") {
                    return "ERROR";
                }
                if (t1 === "ATTELT") {
                    if (t2 === "CONTENT") {
                        return "ERROR";
                    } else {
                        // t2 is either ATTELT or INDEFINITE
                        return "ATTELT";
                    }
                } else if (t1 === "CONTENT") {
                    if (t2 === "ATTELT") {
                        return "ERROR";
                    } else {
                        // t2 is either CONTENT or INDEFINITE
                        return "CONTENT";
                    }
                } else if (t1 === "INDEFINITE") {
                    return t2;
                }
            },
            /**
    * Helper function used to give contextual error information
    * @return {String} - e.g. "[Component attribute element: @body]"
    */
            toString: function() {
                return "[If]";
            }
        });
        module.exports = $IfNode;
    });
    define("hsp/rt/$foreach.js", [ "../klass", "./log", "./document", "../json", "./tnode" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        // ForEachNode implementation
        var klass = require("../klass"), log = require("./log"), doc = require("./document"), json = require("../json"), tnode = require("./tnode"), TNode = tnode.TNode;
        /**
 * foreach node Implements the foreach conditional statement that can be used through 3 forms: # foreach (itm in todos) //
 * iteration over an array on the integer indexes - if todos in not an array "in" will be considered as "of" # foreach
 * (itm on todos) // same as Gecko object iteration - i.e. itm is the value of the item, not the key # foreach (itm of
 * todos) // same as Gecko object iteration (i.e. "on" mode), but with an extra hasOwnProperty() validation - so items
 * from the collection prototype will be ignored => memorization trick: On = in for Objects / of is the special on with
 * hasOwnProperty() in all cases the following scope variables will be created: itm the item variable as specfiied in
 * the foreach instruction (can be any valid JS name) itm_key the item key in the collection - maybe a string (for
 * non-array objects) or an integer (for arrays) - note: an explicit value can be passed as argument itm_isfirst
 * indicator telling if this is the first item of the collection (boolean) itm_islast indicator telling if this is the
 * last item of the collection (boolean)
 */
        var $ForEachNode = klass({
            $extends: TNode,
            /**
     * ForEach node contstructor
     * @param {Map<Expression>|int} exps the map of the variables used by the node. 0 is passed if no expression is
     * used
     * @param {String} itemName the name of the item variable that should be created
     * @param {String} itemKeyName the name of the item key that should be used
     * @param {Number} colExpIdx the index of the expression of the collection over which the statement must iterate
     * @param {Array} children list of sub-node generators - 0 may be passed if there is not child nodes
     */
            $constructor: function(exps, itemKeyName, itemName, forType, colExpIdx, children) {
                this.isDOMless = true;
                this.itemName = itemName;
                this.itemKeyName = itemKeyName;
                this.forType = 0;
                // 0=in / 1=of / 2=on
                this.colExpIdx = colExpIdx;
                TNode.$constructor.call(this, exps, true);
                this.displayedCol = null;
                // displayed collection
                this.itemNode = new $ItemNode(children, itemName, itemKeyName);
            },
            $dispose: function() {
                TNode.$dispose.call(this);
                if (this.root && this.displayedCol) {
                    this.root.rmObjectObserver(this, this.displayedCol);
                }
                this.displayedCol = null;
            },
            /**
     * Create a node instance referencing the current node as base class As the $ForEachNode is DOMless it will not
     * create a DOM node for itself - but will create nodes for its children instead
     * @return {TNode} the new node instance
     */
            createNodeInstance: function(parent) {
                var ni = TNode.createNodeInstance.call(this, parent);
                ni.TYPE = "# foreach";
                // for debugging purposes
                var nd = ni.node;
                // same as parent node in this case
                ni.node1 = doc.createComment("# foreach");
                ni.node2 = doc.createComment("# /foreach");
                nd.appendChild(ni.node1);
                var col = ni.eh.getValue(ni.colExpIdx, ni.vscope, null);
                // collection or array
                ni.createChildNodeInstances(col, nd);
                nd.appendChild(ni.node2);
                return ni;
            },
            createChildNodeInstances: function(col, node) {
                var cn, forType = this.forType, itemNode = this.itemNode;
                if (col) {
                    // create an observer on the collection to be notified of the changes (cf. refresh)
                    this.displayedCol = col;
                    this.childNodes = cn = [];
                    if (forType === 0 && col.constructor !== Array) {
                        forType = 1;
                    }
                    if (forType === 0) {
                        // foreach in
                        var sz = col.length;
                        for (var i = 0, idx = 0; sz > i; i++) {
                            if (col[i] != null && col[i] !== undefined) {
                                // null items are ignored
                                cn.push(itemNode.createNodeInstance(this, col[i], idx, idx === 0, idx === sz - 1, node));
                                idx++;
                            }
                        }
                    } else {
                        log.warning("[# foreach] Invalid iteration type: " + forType);
                    }
                }
            },
            /**
     * Refresh the foreach nodes Check if the collection has changed - or i
     */
            refresh: function() {
                if (this.adirty) {
                    // the collection has changed - let's compare the items in the DOM to the new collection
                    var col = this.eh.getValue(this.colExpIdx, this.vscope, null);
                    // collection or array
                    if (col !== this.displayedCol || this.childNodes === null || this.childNodes.length === 0) {
                        // the whole collection has changed
                        this.root.rmObjectObserver(this, this.displayedCol);
                        this.deleteAllItems();
                        var df = doc.createDocumentFragment();
                        this.createChildNodeInstances(col, df);
                        this.node.insertBefore(df, this.node2);
                        // update the node reference recursively on all child nodes
                        for (var i = 0, sz = this.childNodes.length; sz > i; i++) {
                            this.childNodes[i].replaceNodeBy(df, this.node);
                        }
                        if (this.rendered) {
                            this.afterDOMInsert();
                        }
                    } else {
                        // collection is the same but some items have been deleted or created
                        this.updateCollection(col);
                    }
                }
                TNode.refresh.call(this);
            },
            /**
     * Update the DOM of the displayed collection to match the target collection passed as argument
     * @param {Array} target the target collection
     */
            updateCollection: function(target) {
                var current = [], itnm = this.itemName, sz = this.childNodes.length, tsz = target.length;
                for (var i = 0; sz > i; i++) {
                    current[i] = this.childNodes[i].vscope[itnm];
                }
                // iterate over the current items first
                // and compare with the target collection
                var itm, titm, idx, pendingItems = [], domIdx = 0;
                var maxsz = Math.max(sz, tsz);
                for (var i = 0; sz > i; i++) {
                    itm = current[i];
                    if (i < tsz) {
                        titm = target[i];
                        if (titm == null || titm === undefined) {
                            // we should skip this item
                            target.splice(i, 1);
                            pendingItems.splice(i, 1);
                            tsz -= 1;
                            maxsz = Math.max(sz, tsz);
                            i -= 1;
                            continue;
                        }
                    } else {
                        // there is no more target item - delete the current item
                        titm = null;
                        domIdx = this.deleteItem(i, domIdx, false);
                        current.splice(i, 1);
                        i -= 1;
                        // as item has been removed we need to shift back - otherwise we will skip the next item
                        sz -= 1;
                        continue;
                    }
                    if (itm === titm) {
                        // this item doesn't need to be moved
                        continue;
                    }
                    // check if item has not been found in a previous iteration
                    if (pendingItems[i]) {
                        // re-attach pending item in the DOM and in childNodes
                        this.childNodes.splice(i, 0, pendingItems[i]);
                        current.splice(i, 0, pendingItems[i].vscope[itnm]);
                        sz += 1;
                        var nextNode = this.node2;
                        if (i < sz - 1) {
                            nextNode = this.childNodes[i + 1].node1;
                        }
                        pendingItems[i].attachDOMNodesBefore(nextNode);
                        pendingItems[i] = null;
                    } else {
                        // check if current item exists in next targets
                        idx = target.indexOf(itm, i);
                        if (idx > i) {
                            // item will be needed later - let's put it aside
                            pendingItems[idx] = this.childNodes[i];
                            this.childNodes[i].detachDOMNodes(domIdx);
                            this.childNodes.splice(i, 1);
                        } else {
                            // item has to be removed
                            domIdx = this.deleteItem(i, domIdx, false);
                        }
                        // remove item from current array (may have been put in pendingItems list if needed later)
                        current.splice(i, 1);
                        sz -= 1;
                        // check if target exist in next items
                        idx = current.indexOf(titm, i);
                        if (idx >= i) {
                            // item should be moved to current position
                            if (idx != i) {
                                this.moveItem(idx, i, domIdx, false);
                                var tmp = current.splice(idx, 1);
                                current.splice(i, 0, tmp);
                            }
                        } else {
                            // current target item is a new item
                            var ni = this.createItem(titm, i, i === 0, i === maxsz - 1, doc.createDocumentFragment());
                            // attach to the right DOM position
                            var refNode = this.node2;
                            if (this.childNodes[i + 1]) {
                                refNode = this.childNodes[i + 1].node1;
                            }
                            this.node.insertBefore(ni.node, refNode);
                            ni.replaceNodeBy(ni.node, this.node);
                            if (this.rendered) {
                                ni.afterDOMInsert();
                            }
                            // update current array
                            current.splice(i, 0, titm);
                            sz += 1;
                        }
                    }
                }
                // update the item scope variables
                this.resyncItemScopes(0, tsz - 1);
                // if target is bigger than the current collection - we have to create the new items
                if (sz < tsz) {
                    for (var i = sz; tsz > i; i++) {
                        titm = target[i];
                        if (titm == null || titm === undefined) {
                            // we should skip this item
                            target.splice(i, 1);
                            pendingItems.splice(i, 1);
                            tsz -= 1;
                            continue;
                        }
                        if (pendingItems[i]) {
                            // attach pending item to current position
                            this.childNodes.splice(i, 0, pendingItems[i]);
                            pendingItems[i].attachDOMNodesBefore(this.node2);
                            pendingItems[i].updateScope(i, i === 0, i === maxsz - 1);
                            pendingItems[i] = null;
                        } else {
                            // create new item
                            var ni = this.createItem(titm, i, i === 0, i === maxsz - 1, doc.createDocumentFragment());
                            this.node.insertBefore(ni.node, this.node2);
                            if (this.rendered) {
                                ni.afterDOMInsert();
                            }
                            ni.replaceNodeBy(ni.node, this.node);
                        }
                    }
                }
                pendingItems = null;
            },
            /**
     * Delete one of the displayed item
     * @param {Number} idx the item index
     * @param {Number} startIdx the index at which the search should start (optional - default: 0)
     * @param {Boolean} resyncNextItems resynchronize the scope variables (e.g. itm_key) of the next items - optional
     * (default=true)
     * @return the position of the last node removed
     */
            deleteItem: function(idx, startIdx, resyncNextItems) {
                var c = this.childNodes[idx], res = 0;
                if (c) {
                    this.childNodes.splice(idx, 1);
                    // remove nodes from the DOM
                    res = c.detachDOMNodes(startIdx);
                    // dispose child nodes
                    c.$dispose();
                    if (resyncNextItems !== false) {
                        this.resyncItemScopes(idx);
                    }
                }
                return res;
            },
            /**
     * Delete all child items and remove them from the DOM
     */
            deleteAllItems: function() {
                if (this.node.childNodes) {
                    var node = this.node, isInBlock = false, cn = node.childNodes, sz = cn.length, n1 = this.node1, n2 = this.node2;
                    for (var i = 0; sz > i; i++) {
                        var ch = cn[i];
                        if (ch === n1) {
                            isInBlock = true;
                            continue;
                        }
                        if (isInBlock) {
                            // we are between node1 and node2
                            if (ch === n2) {
                                break;
                            }
                            node.removeChild(ch);
                            i -= 1;
                            // removeChild has shift next item by one
                            sz -= 1;
                        }
                    }
                }
                if (this.childNodes) {
                    var cn = this.childNodes;
                    for (var i = 0, sz = cn.length; sz > i; i++) {
                        cn[i].$dispose();
                    }
                    this.childNodes = null;
                }
            },
            /**
     * Moves a displayed item
     * @param {Number} idx the item index
     * @param {Number} newIdx the new - targetted - item index
     * @param {Number} startIdx the index at which the search for nodes should start (optional - internal optimization -
     * default: 0)
     * @param {Boolean} resyncItems resynchronize the scope variables (e.g. itm_key) of the items - optional
     * (default=true)
     */
            moveItem: function(idx, newIdx, startIdx, resyncItems) {
                var cn = this.childNodes, sz = cn.length, ch;
                if (idx === newIdx || idx > sz - 1 || newIdx > sz - 1) return;
                // invalid cases
                // determine the node before which the item should be re-attached
                var nd = this.node2;
                if (newIdx < sz - 1) {
                    nd = cn[newIdx].node1;
                }
                // detach item
                ch = cn[idx];
                cn.splice(idx, 1);
                ch.detachDOMNodes(startIdx);
                // re-attach item
                cn.splice(newIdx, 0, ch);
                ch.attachDOMNodesBefore(nd);
                if (resyncItems !== false) {
                    this.resyncItemScopes(Math.min(idx, newIdx));
                }
            },
            /**
     * Create a new item and insert it in the childNode array
     * @param {Boolean} createDetached if true the nodes will be created as detached nodes - optional - default: false
     */
            createItem: function(colItem, idx, isfirst, islast, parentDOMNode) {
                var n = this.itemNode.createNodeInstance(this, colItem, idx, isfirst, islast, parentDOMNode);
                this.childNodes.splice(idx, 0, n);
                return n;
            },
            /**
     * Re-synchronize item scope variables when foreach items are moved or deleted
     * @param {Number} startIdx the item index where the synchronization should start (optional - default:0)
     * @param {Number} maxIdx the max index that should be considered to compute the itm_islast variable (optional -
     * default: childNodes length)
     */
            resyncItemScopes: function(startIdx, maxIdx) {
                var sz = this.childNodes.length;
                if (!startIdx) startIdx = 0;
                if (maxIdx === undefined) maxIdx = sz - 1;
                for (var i = startIdx; sz > i; i++) {
                    this.childNodes[i].updateScope(i, i === 0, i === maxIdx);
                }
            },
            /**
     * Return the component attribute type of the current node
     * @return {String} one of the following option:
     *      "ATTELT" if the element is an attribute element (e.g. <@body>)
     *      "CONTENT" if the node is a content element (e.g. <div>)
     *      "INDEFINITE" if the element can be part of eithe an attribute or content collection (e.g. blank text nodes)
     *      "ERROR" if elt mixes attribute and content elements
     */
            getCptAttType: function() {
                // this method must be overridden by child classes
                return this.itemNode.getCptAttType();
            },
            /**
    * Helper function used to give contextual error information
    * @return {String} - e.g. "[Component attribute element: @body]"
    */
            toString: function() {
                return "[Foreach]";
            }
        });
        /**
 * Pseudo node acting as a container for each item element
 */
        var $ItemNode = klass({
            $extends: TNode,
            /**
     * ForEach Item node constructor This is a domless node that groups all the tnodes associated to a foreach item
     * @param {Array<TNodes>} the child node generators
     * @param {String} itemName the name of the item variable used in the scope
     */
            $constructor: function(children, itemName, itemKeyName) {
                TNode.$constructor.call(this, 0);
                this.isDOMless = true;
                this.itemName = itemName;
                this.itemKeyName = itemKeyName;
                if (children && children !== 0) {
                    this.children = children;
                }
                this.detachedNodes = null;
            },
            /**
     * Remove DOM dependencies prior to instance deletion
     */
            $dispose: function() {
                TNode.$dispose.call(this);
                this.node1 = null;
                this.node2 = null;
                this.detachedNodes = null;
            },
            /**
     * Create the node instance corresponding to a for loop item
     * @param {TNode} parent the foreach node
     * @param {Object} item the collection item associated to the node
     * @param {Number} key the item index in the collection
     * @param {Boolean} isfirst tells if item is first in the collection
     * @param {Boolean} islast tells if the item is last in the collection
     * @param {DOMElement} parentDOMNode the parent DOM node where the element should be inserted
     */
            createNodeInstance: function(parent, item, key, isfirst, islast, parentDOMNode) {
                var vs = this.createSubScope(parent.vscope), itnm = this.itemName;
                vs[itnm] = item;
                vs[this.itemKeyName] = key;
                vs[itnm + "_isfirst"] = isfirst;
                vs[itnm + "_islast"] = islast;
                var ni = TNode.createNodeInstance.call(this, parent);
                ni.TYPE = "# item";
                // for debugging purposes
                var nd = ni.node;
                ni.vscope = vs;
                ni.node1 = doc.createComment("# item");
                ni.node2 = doc.createComment("# /item");
                if (parentDOMNode) {
                    ni.node = nd = parentDOMNode;
                }
                nd.appendChild(ni.node1);
                if (this.children) {
                    ni.childNodes = [];
                    for (var i = 0, sz = this.children.length; sz > i; i++) {
                        ni.childNodes[i] = this.children[i].createNodeInstance(ni);
                    }
                }
                nd.appendChild(ni.node2);
                return ni;
            },
            /**
     * Detach the nodes corresponding to this item from the DOM
     */
            detachDOMNodes: function(startIdx) {
                if (!startIdx) startIdx = 0;
                var res = startIdx;
                if (!this.node.childNodes) {
                    return res;
                }
                var node = this.node, isInBlock = false, res, ch, sz = node.childNodes.length, n1 = this.node1, n2 = this.node2;
                if (this.detachedNodes) return;
                // already detached
                this.detachedNodes = [];
                for (var i = startIdx; sz > i; i++) {
                    ch = node.childNodes[i];
                    if (ch === n1) {
                        isInBlock = true;
                    }
                    if (isInBlock) {
                        // we are between node1 and node2
                        this.detachedNodes.push(ch);
                        node.removeChild(ch);
                        i -= 1;
                        // removeChild has shift next item by one
                        if (ch === n2) {
                            res = i;
                            break;
                        }
                    }
                }
                return res;
            },
            /**
     * Insert the childNodes DOM nodes before a given node This assumes removeNodesFromDOM() has been called before
     * @param {DOMNode} node the DOM node before which the
     */
            attachDOMNodesBefore: function(node) {
                if (this.detachedNodes) {
                    var dn = this.detachedNodes, sz = dn.length;
                    if (!node || !this.detachedNodes) return;
                    var df = doc.createDocumentFragment();
                    for (var i = 0; sz > i; i++) {
                        df.appendChild(dn[i]);
                    }
                    node.parentNode.insertBefore(df, node);
                }
                this.detachedNodes = null;
            },
            /**
     * Update the scope variables (must be called when an item is moved)
     */
            updateScope: function(key, isfirst, islast) {
                var vs = this.vscope, itnm = this.itemName;
                json.set(vs, this.itemKeyName, key);
                json.set(vs, itnm + "_isfirst", isfirst);
                json.set(vs, itnm + "_islast", islast);
            },
            /**
     * Return the component attribute type of the current node
     * @return {String} one of the following option:
     *      "ATTELT" if the element is an attribute element (e.g. <@body>)
     *      "CONTENT" if the node is a content element (e.g. <div>)
     *      "INDEFINITE" if the element can be part of eithe an attribute or content collection (e.g. blank text nodes)
     *      "ERROR" if elt mixes attribute and content elements
     */
            getCptAttType: function() {
                // this method must be overridden by child classes
                return this.getCptContentType();
            },
            /**
    * Helper function used to give contextual error information
    * @return {String} - e.g. "[Component attribute element: @body]"
    */
            toString: function() {
                return "[Foreach item]";
            }
        });
        module.exports = $ForEachNode;
    });
    define("hsp/rt/browser.js", [], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
 * Checks if a given browser supports svg
 * Based on //http://stackoverflow.com/questions/9689310/which-svg-support-detection-method-is-best
 * @returns {boolean}
 */
        function supportsSvg() {
            return !!window.document.createElementNS && !!window.document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGRect;
        }
        /**
 * A utility with various browser-related routines.
 * Most importantly it contains feature-detection logic.
 */
        module.exports.supportsSvg = supportsSvg;
    });
    define("hsp/rt/attributes/class.js", [ "../../klass" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        var klass = require("../../klass");
        var ClassHandler = klass({
            $constructor: function(nodeInstance) {
                this.nodeInstance = nodeInstance;
                this.previousClasses = null;
            },
            $setValueFromExp: function(name, exprVals) {
                var newClassesArr = [], newClasses, classExpr;
                for (var i = 0; i < exprVals.length; i++) {
                    if (exprVals % 2 || typeof exprVals[i] !== "object") {
                        newClassesArr.push(exprVals[i]);
                    } else {
                        classExpr = exprVals[i];
                        for (var className in classExpr) {
                            if (classExpr.hasOwnProperty(className) && classExpr[className]) {
                                newClassesArr.push(className);
                            }
                        }
                    }
                }
                newClasses = newClassesArr.join(" ");
                var currentClasses = this.nodeInstance.node.className;
                var results = currentClasses && currentClasses.split ? currentClasses.split(" ") : [];
                if (this.previousClasses) {
                    var previousClassesArray = this.previousClasses.split(" ");
                    for (var i = 0; i < previousClassesArray.length; i++) {
                        var index = results.indexOf(previousClassesArray[i]);
                        if (index > -1) {
                            results.splice(index, 1);
                        }
                    }
                }
                if (newClasses != null && newClasses.length > 0) {
                    results.splice(0, 0, newClasses.replace(/^\s+|\s+$/g, "").replace(/\s+/g, " "));
                }
                this.previousClasses = newClasses;
                //Add generated className to the element (issue on IE8 with the class attribute?)
                if (this.nodeInstance.nodeNS) {
                    this.nodeInstance.node.setAttribute("class", results.join(" "));
                } else {
                    this.nodeInstance.node.className = results.join(" ");
                }
            },
            $dispose: function() {
                this.previousClasses = null;
            }
        });
        module.exports = ClassHandler;
    });
    define("hsp/rt/attributes/modelvalue.js", [ "../../klass" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        var klass = require("../../klass");
        var ModelValueHandler = klass({
            $constructor: function(nodeInstance) {
                this.nodeInstance = nodeInstance;
                this.node = nodeInstance.node;
                this._lastValues = {};
                // note: when the input event is properly implemented we don't need to listen to keyup
                // but IE8 and IE9 don't implement it completely - thus the need for keyup
                this._inputEvents = [ "click", "focus", "input", "keyup", "change" ];
                nodeInstance.addEventListeners(this._inputEvents);
            },
            $setValue: function(name, value) {
                if (name === "value") {
                    // value attribute must be changed directly as the node attribute is only used for the default value
                    if (this.node.type === "radio") {
                        this.node.value = value;
                    }
                }
                this._lastValues[name] = value;
            },
            $onAttributesRefresh: function() {
                var lastValue = typeof this._lastValues["model"] === "undefined" ? this._lastValues["value"] : this._lastValues["model"];
                var lastValueAsString = "" + lastValue;
                if (this.node.type === "radio") {
                    var currentValueAsString = "" + this.node.value;
                    this.node.checked = lastValueAsString === currentValueAsString;
                } else if (this.node.type === "checkbox") {
                    var currentValueAsString = "" + this.node.checked;
                    if (lastValueAsString !== currentValueAsString) {
                        this.node.checked = !this.node.checked;
                    }
                } else if (lastValueAsString != this.node.value) {
                    //only update if value is changing
                    this.node.value = lastValue;
                }
            },
            $handleEvent: function(evt) {
                if (this._inputEvents.indexOf(evt.type) > -1) {
                    // push the field value to the data model
                    var value = this.node.value;
                    var type = this.node.type;
                    if (type === "checkbox") {
                        value = this.node.checked;
                    }
                    var isSet = this.nodeInstance.setAttributeValueInModel("model", value);
                    if (!isSet) {
                        this.nodeInstance.setAttributeValueInModel("value", value);
                    }
                }
            },
            $dispose: function() {
                this._inputEvents.length = 0;
            }
        });
        module.exports = ModelValueHandler;
    });
    define("hsp/rt/attributes/select.js", [ "../../klass" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
 * Get the option value depending on its attributes or inner text
 */
        var _getOptionValue = function(optionNode) {
            var value = optionNode.getAttribute("value");
            if (value == null) {
                value = optionNode.getAttribute("label");
                if (value == null) {
                    value = optionNode.innerText || optionNode.textContent;
                }
                optionNode.setAttribute("value", value);
            }
            return value;
        };
        /**
 * Get the selected value of a select
 */
        var _getSelectedValue = function(selectNode) {
            var options = selectNode.getElementsByTagName("option");
            var selectedIndex = selectNode.selectedIndex;
            return selectedIndex > 0 ? _getOptionValue(options[selectedIndex]) : selectNode.value;
        };
        var klass = require("../../klass");
        var SelectHandler = klass({
            $constructor: function(nodeInstance) {
                this.nodeInstance = nodeInstance;
                this.node = nodeInstance.node;
                this._lastValues = {};
                this._selectEvents = [ "change" ];
                nodeInstance.addEventListeners(this._selectEvents);
            },
            $setValue: function(name, value) {
                // Model changes, the value is stored in order to prioritize 'model' on 'value'
                if (name == "model" || name == "value") {
                    this._lastValues[name] = value;
                }
            },
            $onAttributesRefresh: function() {
                var lastValues = this._lastValues;
                var _boundName = this._boundName = lastValues["model"] == null ? "value" : "model";
                var lastValue = lastValues[_boundName];
                if (this._refreshDone && lastValue != _getSelectedValue(this.node)) {
                    this._synchronize();
                }
            },
            $onContentRefresh: function() {
                this._synchronize();
                this._refreshDone = true;
            },
            $handleEvent: function(evt) {
                // Change event, the model value must be handle
                if (this._selectEvents.indexOf(evt.type) > -1) {
                    var value = _getSelectedValue(this.node);
                    var nodeInstance = this.nodeInstance;
                    var isSet = nodeInstance.setAttributeValueInModel("model", value);
                    if (!isSet) {
                        nodeInstance.setAttributeValueInModel("value", value);
                    }
                }
            },
            /**
     * Synchronize the select value with the model,
     * the model value is set to the select first,
     * if it fails, the model value will be updated with the select value
     */
            _synchronize: function() {
                var _boundName = this._boundName;
                var _boundValue = this.nodeInstance.getAttributeValueInModel(_boundName);
                var node = this.node;
                // First, try to change the select value with the data model one
                if (_getSelectedValue(node) != _boundValue) {
                    var selectedIndex = -1;
                    var options = node.getElementsByTagName("option");
                    for (var i = 0; i < options.length; i++) {
                        var option = options[i];
                        if (_getOptionValue(option) == _boundValue) {
                            selectedIndex = i;
                            break;
                        }
                    }
                    if (selectedIndex != -1) {
                        node.selectedIndex = selectedIndex;
                    } else {
                        // Value not available in the options list, so the model needs to be synchronized
                        this.nodeInstance.setAttributeValueInModel(_boundName, _getSelectedValue(node));
                    }
                }
            }
        });
        module.exports = SelectHandler;
    });
    define("hsp/rt/attributes/onupdate.js", [ "../../klass" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        var klass = require("../../klass");
        var OnUpdateHandler = klass({
            ONUPDATE_TIMER: 500,
            $constructor: function(nodeInstance, callback) {
                this.callback = callback;
                this._inputEvents = [ "input", "keyup", "change" ];
                nodeInstance.addEventListeners(this._inputEvents);
                this.timerValue = this.ONUPDATE_TIMER;
                this.timerId = null;
                this.nodeInstance = nodeInstance;
            },
            $setValue: function(name, value) {
                if (name === "update-timeout") {
                    var valueAsNumber = parseInt(value, 10);
                    if (!isNaN(valueAsNumber)) {
                        this.timerValue = valueAsNumber;
                    }
                }
            },
            $handleEvent: function(event) {
                if (this._inputEvents.indexOf(event.type) > -1) {
                    this._clearTimer();
                    var _this = this;
                    this.timerId = setTimeout(function() {
                        _this._onUpdateFinalize(event);
                    }, this.timerValue);
                }
            },
            _onUpdateFinalize: function(event) {
                var eventCopy = {};
                for (var i in event) {
                    eventCopy[i] = event[i];
                }
                eventCopy.type = "update";
                eventCopy.target = this.nodeInstance.node;
                this.callback(eventCopy);
            },
            _clearTimer: function() {
                if (this.timerId) {
                    clearTimeout(this.timerId);
                    this.timerId = null;
                }
            },
            $dispose: function() {
                this._clearTimer();
            }
        });
        module.exports = OnUpdateHandler;
    });
    define("hsp/rt/eltnode.js", [ "../klass", "./browser", "./document", "./tnode", "../rt", "./log", "./attributes/class", "./attributes/modelvalue", "./attributes/select", "./attributes/onupdate" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        // Element Node used for any standard HTML element (i.e. having attributes and child elements)
        var klass = require("../klass");
        var browser = require("./browser");
        var doc = require("./document");
        var TNode = require("./tnode").TNode;
        var hsp = require("../rt");
        var log = require("./log");
        //Loads internal custom attributes
        var ClassHandler = require("./attributes/class");
        hsp.registerCustomAttributes("class", ClassHandler);
        var ModelValueHandler = require("./attributes/modelvalue");
        hsp.registerCustomAttributes([ "model", "value" ], ModelValueHandler, 0, [ "input", "textarea" ]);
        var SelectHandler = require("./attributes/select");
        hsp.registerCustomAttributes([ "model", "value" ], SelectHandler, 0, [ "select" ]);
        var OnUpdateHandler = require("./attributes/onupdate");
        hsp.registerCustomAttributes([ "onupdate", "update-timeout" ], OnUpdateHandler, 0, [ "input", "textarea" ]);
        var booleanAttributes = {
            async: true,
            autofocus: true,
            autoplay: true,
            checked: true,
            controls: true,
            defer: true,
            disabled: true,
            hidden: true,
            ismap: true,
            loop: true,
            multiple: true,
            open: true,
            readonly: true,
            required: true,
            scoped: true,
            selected: true
        };
        function isBooleanAttribute(attrName) {
            return booleanAttributes.hasOwnProperty(attrName);
        }
        /**
 * Generic element node Add attribute support on top of TNode - used for div, spans, ul, li, h1, etc
 */
        var EltNode = klass({
            $extends: TNode,
            /**
     * EltNode generator
     * @param {string} tag the tag name to use - e.g. "div"
     * @param {Map<Expression>|int} exps the map of the variables used by the node. 0 is passed if no expression is
     * used
     * @param {Map} attcfg map of the different attributes used on the container e.g. {"title":"Hello!"} - cf attribute
     * objects for more info
     * @param {Map} ehcfg map of the different event hanlder used on the element e.g. {"onclick":1} - where 1 is the
     * expression index associated to the event hanlder callback
     * @param {Array} children list of sub-node generators
     * @param {Integer} needSubScope tells if a sub-scope must be created (e.g. because of {let} statents) - default: 0 or undefined
     */
            $constructor: function(tag, exps, attcfg, ehcfg, children, needSubScope) {
                TNode.$constructor.call(this, exps);
                this.tag = tag;
                this.createAttList(attcfg, ehcfg);
                if (children && children !== 0) {
                    this.children = children;
                }
                this.needSubScope = needSubScope === 1;
            },
            $dispose: function() {
                var node = this.node;
                if (this._allEvtLsnr) {
                    // remove all event handlers
                    var rmEL = node.removeEventListener !== undefined;
                    // tells if removeEventListener is supported
                    for (var i = 0; i < this._allEvtLsnr.length; i++) {
                        if (rmEL) {
                            node.removeEventListener(this._allEvtLsnr[i], this, false);
                        } else {
                            node.detachEvent("on" + this._allEvtLsnr[i], this._attachEventFn);
                        }
                    }
                }
                this._allEvtLsnr.length = 0;
                if (this._custAttrHandlers) {
                    for (var key in this._custAttrHandlers) {
                        var customHandlers = this._custAttrHandlers[key];
                        for (var i = 0; i < customHandlers.length; i++) {
                            if (customHandlers[i].instance.$dispose) {
                                customHandlers[i].instance.$dispose();
                            }
                        }
                    }
                    this._custAttrHandlers = null;
                    this._custAttrData = null;
                    this._allCustAttrHandlers.length = 0;
                }
                this._attachEventFn = null;
                TNode.$dispose.call(this);
            },
            /**
     * Create a node instance referencing the current node as base class Create as well the DOM element that will be
     * appended to the parent node DOM element
     * @return {TNode} the new node instance
     */
            createNodeInstance: function(parent) {
                var ni = TNode.createNodeInstance.call(this, parent);
                if (ni._allCustAttrHandlers) {
                    for (var i = 0; i < ni._allCustAttrHandlers.length; i++) {
                        var handler = ni._allCustAttrHandlers[i].instance;
                        if (handler.$onContentRefresh) {
                            handler.$onContentRefresh();
                        }
                    }
                }
                return ni;
            },
            /**
     * Create the DOM node element
     */
            createNode: function() {
                this.TYPE = this.tag;
                // for debugging purposes
                var nodeType = null, nodeName = null;
                var node, docFragment, evtHandlers = this.evtHandlers;
                //Holds the list of custonm attributes handlers instantiated for the current EltNode instance
                this._custAttrHandlers = {};
                this._allCustAttrHandlers = [];
                //Holds the values of the custonm attributes of the current EltNode instance
                this._custAttrData = {};
                //Holds the list of all events for which listeners have been added to this node
                this._allEvtLsnr = [];
                if (evtHandlers) {
                    for (var i = 0; i < evtHandlers.length; i++) {
                        this._allEvtLsnr.push(evtHandlers[i].evtType);
                    }
                }
                if (this.tag === "svg") {
                    if (browser.supportsSvg()) {
                        this.nodeNS = "http://www.w3.org/2000/svg";
                    } else {
                        log.error("This browser does not support SVG elements");
                    }
                }
                if (this.nodeNS) {
                    node = doc.createElementNS(this.nodeNS, this.tag);
                } else {
                    if (this.atts && this.atts.length > 0) {
                        node = doc.createElement(this.tag);
                        for (var i = 0; i < this.atts.length; i++) {
                            if (this.atts[i].name === "type") {
                                nodeType = this.atts[i].value;
                            }
                            if (this.atts[i].name === "name") {
                                nodeName = this.atts[i].value;
                            }
                        }
                        if (nodeType || nodeName) {
                            try {
                                if (nodeType) {
                                    node.type = nodeType;
                                }
                                if (nodeName) {
                                    node.name = nodeName;
                                }
                            } catch (ex) {
                                // we have to use a special creation mode as IE doesn't support dynamic type and name change
                                docFragment = doc.createElement("div");
                                docFragment.innerHTML = "<" + this.tag + (nodeType ? " type=" + nodeType : "") + (nodeName ? " name=" + nodeName : "") + " >";
                                node = docFragment.children[0];
                            }
                        }
                    } else {
                        node = doc.createElement(this.tag);
                    }
                }
                this.node = node;
                var addEL = node.addEventListener !== undefined;
                // tells if addEventListener is supported
                if (!addEL) {
                    // create a callback function if addEventListener is not supported
                    var self = this;
                    this._attachEventFn = function(evt) {
                        self.handleEvent(evt);
                    };
                }
                this.refreshAttributes(true);
                // attach event listener and set or updates the event handlers
                if (evtHandlers) {
                    for (var i = 0; i < evtHandlers.length; i++) {
                        var evtHandler = evtHandlers[i];
                        var fullEvtType = "on" + evtHandler.evtType;
                        //Adds custom event handlers (e.g. ontap)
                        var customHandlers = hsp.getCustomAttributeHandlers(fullEvtType, this.tag);
                        if (customHandlers && customHandlers.length > 0) {
                            for (var j = 0; j < customHandlers.length; j++) {
                                var handlerInstance = this._createCustomAttributeHandler(fullEvtType, customHandlers[j]).instance;
                                if (handlerInstance.$setValue) {
                                    handlerInstance.$setValue(fullEvtType, fullEvtType);
                                }
                            }
                        } else {
                            this._allEvtLsnr.push(evtHandler.evtType);
                            if (addEL) {
                                node.addEventListener(evtHandler.evtType, this, false);
                            } else {
                                node.attachEvent("on" + evtHandler.evtType, this._attachEventFn);
                            }
                        }
                    }
                }
            },
            /**
     * Event Listener callback
     */
            handleEvent: function(event) {
                for (var i = 0; i < this._allCustAttrHandlers.length; i++) {
                    var handlerInstance = this._allCustAttrHandlers[i].instance;
                    if (handlerInstance.$handleEvent) {
                        handlerInstance.$handleEvent(event);
                    }
                }
                var evtHandler = this.evtHandlers, result = null;
                if (evtHandler) {
                    for (var i = 0; i < evtHandler.length; i++) {
                        if (evtHandler[i].evtType === event.type) {
                            result = evtHandler[i].executeCb(event, this.eh, this.vscope);
                            break;
                        }
                    }
                }
                if (result === false) {
                    if (event.preventDefault) {
                        event.preventDefault();
                    } else {
                        event.returnValue = false;
                    }
                }
                return result;
            },
            /**
     * Refresh the node
     */
            refresh: function() {
                var cdirtybackup = this.cdirty;
                if (this.adirty) {
                    // attributes are dirty
                    this.refreshAttributes();
                }
                TNode.refresh.call(this);
                if (cdirtybackup && this._allCustAttrHandlers) {
                    for (var i = 0; i < this._allCustAttrHandlers.length; i++) {
                        var handler = this._allCustAttrHandlers[i].instance;
                        if (handler.$onContentRefresh) {
                            handler.$onContentRefresh();
                        }
                    }
                }
            },
            /**
     * Creates a custom attribute handler.
     * @param {String} name the name of the custom attributes.
     * @param {Object} customHandler the handler retrieved from the global repository.
     * @return {Object} the full handler created.
     */
            _createCustomAttributeHandler: function(name, customHandler) {
                var entry = null;
                if (typeof this._custAttrHandlers[name] == "undefined") {
                    this._custAttrHandlers[name] = [];
                }
                //Check if the handler has not yet been instantiated for any of the attributes of the group
                var alreadyInstantiated = false;
                if (this._custAttrHandlers[name]) {
                    for (var k = 0; k < this._custAttrHandlers[name].length; k++) {
                        if (customHandler.handler == this._custAttrHandlers[name][k].klass) {
                            entry = this._custAttrHandlers[name][k];
                            alreadyInstantiated = true;
                            break;
                        }
                    }
                }
                //Instantiates the handler and associate it to all attributes of the group
                if (!alreadyInstantiated) {
                    entry = {
                        klass: customHandler.handler,
                        instance: new customHandler.handler(this, this.handleEvent.bind(this))
                    };
                    for (var l = 0; l < customHandler.names.length; l++) {
                        if (typeof this._custAttrHandlers[customHandler.names[l]] == "undefined") {
                            this._custAttrHandlers[customHandler.names[l]] = [];
                        }
                        this._custAttrHandlers[customHandler.names[l]].push(entry);
                    }
                    this._allCustAttrHandlers.push(entry);
                }
                return entry;
            },
            /**
     * Refresh the node attributes (even if adirty is false)
     * @param {Boolean} isEltCreation a flag indicating if it is the initial attributes refresh
     */
            refreshAttributes: function(isEltCreation) {
                var node = this.node, attributes = this.atts, attribute, expressionHandler = this.eh, vscope = this.vscope, name;
                if (attributes) {
                    for (var i = 0; i < attributes.length; i++) {
                        attribute = attributes[i];
                        name = attribute.name;
                        if (isEltCreation) {
                            //Adds custom attribute handlers (e.g. dropdown)
                            var customHandlers = hsp.getCustomAttributeHandlers(name, this.tag);
                            if (customHandlers && customHandlers.length > 0) {
                                for (var j = 0; j < customHandlers.length; j++) {
                                    this._createCustomAttributeHandler(name, customHandlers[j]);
                                }
                                this._custAttrData[name] = {};
                                if (attribute.textcfg && attribute.textcfg.length === 2 && attribute.textcfg[0] === "") {
                                    this._custAttrData[name].exprIndex = attribute.textcfg[1];
                                }
                            }
                        }
                        //During custom attribute refresh, execute setValue() on the handler only if the value of the attribute has changed.
                        var customHandlers = this._custAttrHandlers[name];
                        if (customHandlers) {
                            var newValue = attribute.getValue(expressionHandler, vscope, null);
                            var stringValueHasChanged = this._custAttrData[name].value !== newValue;
                            var newExprValues = attribute.getExprValues(expressionHandler, vscope, null);
                            for (var j = 0; customHandlers && j < customHandlers.length; j++) {
                                var handlerInstance = customHandlers[j].instance;
                                if (handlerInstance.$setValueFromExp) {
                                    handlerInstance.$setValueFromExp(name, newExprValues);
                                } else if (handlerInstance.$setValue && stringValueHasChanged) {
                                    handlerInstance.$setValue(name, newValue);
                                }
                            }
                            this._custAttrData[name].value = newValue;
                        } else if (isBooleanAttribute(name)) {
                            //this is equivalent to calling sth like: node.required = truthy / falsy;
                            //a browser will remove this attribute if a provided value is falsy
                            //http://www.w3.org/html/wg/drafts/html/master/infrastructure.html#boolean-attributes
                            node[name] = attribute.getValue(expressionHandler, vscope, "");
                        } else {
                            try {
                                node.setAttribute(attribute.name, attribute.getValue(expressionHandler, vscope, null));
                            } catch (e) {}
                        }
                    }
                }
                if (this.htmlCbs) {
                    var cb;
                    for (var i = 0; i < this.htmlCbs.length; i++) {
                        cb = this.htmlCbs[i];
                        node.setAttribute("on" + cb.evtType, cb.htmlCb);
                    }
                }
                for (var i = 0; i < this._allCustAttrHandlers.length; i++) {
                    var handler = this._allCustAttrHandlers[i].instance;
                    if (handler.$onAttributesRefresh) {
                        handler.$onAttributesRefresh();
                    }
                }
            },
            /** API methods for custom attributes **/
            /**
     * Get the attribute value in the data model.
     * @param {String} name the name of the attribute
     * @return {String} the value of the attribute.
     */
            getAttributeValueInModel: function(name) {
                if (this._custAttrData[name]) {
                    var exprIndex = this._custAttrData[name].exprIndex;
                    if (this.eh && typeof exprIndex !== "undefined") {
                        var expression = this.eh.getExpr(exprIndex);
                        if (expression.getValue) {
                            return expression.getValue(this.vscope, this.eh);
                        }
                    }
                }
                return null;
            },
            /**
     * Sets the attribute value in the data model.
     * @param {String} name the name of the attribute
     * @param {String} value the value of the attribute.
     * @return {Boolean} true if the value was successfully set
     */
            setAttributeValueInModel: function(name, value) {
                if (this._custAttrData[name]) {
                    var exprIndex = this._custAttrData[name].exprIndex;
                    if (this.eh && typeof exprIndex !== "undefined") {
                        var expression = this.eh.getExpr(exprIndex);
                        if (expression.setValue && this._custAttrData[name].value !== value) {
                            var currentValue = expression.getValue(this.vscope, this.eh);
                            if (value !== currentValue) {
                                expression.setValue(this.vscope, value);
                                return true;
                            }
                        }
                    }
                }
                return false;
            },
            /**
     * Registers a list of event listeners, they are added to the current element if not already part of the evtHandlers.
     * @param {Array} eventNames the list of events
     */
            addEventListeners: function(eventNames) {
                var isAddEL = this.node.addEventListener !== undefined;
                for (var i = 0; i < eventNames.length; i++) {
                    var eventName = eventNames[i];
                    if (this._allEvtLsnr.indexOf(eventName) === -1) {
                        this._allEvtLsnr.push(eventName);
                        if (isAddEL) {
                            this.node.addEventListener(eventName, this, false);
                        } else {
                            this.node.attachEvent("on" + eventName, this._attachEventFn);
                        }
                    }
                }
            },
            /**
     * Returns the first ancestor with the given custom attribute.
     * @param {String} name of the custom attribute
     * @return {EltNode} the node instance.
     */
            getAncestorByCustomAttribute: function(name) {
                var parent = this.parent;
                while (parent) {
                    if (parent._custAttrHandlers && parent._custAttrHandlers[name]) {
                        break;
                    } else {
                        parent = parent.parent;
                    }
                }
                return parent;
            },
            /**
     * Returns the an array of the custom attribute handler instances for a given custom attribute.
     * @param {String} name of the custom attribute
     * @return {EltNode} the node instance.
     */
            getCustomAttributeHandlers: function(name) {
                var result = [];
                var handlers = this._custAttrHandlers[name];
                if (handlers) {
                    for (var i = 0; i < handlers.length; i++) {
                        result.push(handlers[i].instance);
                    }
                }
                return result;
            }
        });
        module.exports = EltNode;
    });
    define("hsp/rt/$log.js", [ "../klass", "./log", "./document", "./tnode" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        // This module contains the log node
        var klass = require("../klass"), log = require("./log"), doc = require("./document"), TNode = require("./tnode").TNode;
        var LogNode = klass({
            $extends: TNode,
            /**
     * Log node generator ex: {log scope}
     * @param {Map<Expression>|int} exps the map of the variables used by the node. 
     *      0 is passed if no expression is used
     * @param {Array} args array of the expression indexes to log in the log queue
     * @param {Integer} line the line number
     * @param {Integer} column the column number
     */
            $constructor: function(exps, file, dir, line, column) {
                TNode.$constructor.call(this, exps);
                this.file = "";
                var r = file.match(/[^\/\\]+$/);
                if (r && r.length) {
                    this.file = r[0];
                }
                this.dir = dir;
                this.line = line;
                this.column = column;
            },
            /**
     * Create the DOM node element and attach it to the parent
     */
            createNode: function() {
                this.node = doc.createComment("{log}");
                this.processLog();
            },
            /**
     * Process the information to be logged and push it to the log output (browser console by default)
     */
            processLog: function() {
                var exp = this.eh.getExpr(1);
                //there is only one expression for the log block
                var v = exp.getValue(this.vscope, undefined);
                var itms = exp.isMultiStatement ? v : [ v ];
                itms.push({
                    type: "debug",
                    file: this.file,
                    dir: this.dir,
                    line: this.line,
                    column: this.column
                });
                log.apply(null, itms);
            },
            /**
     * Refresh the text node if its properties have changed
     */
            refresh: function() {
                if (this.adirty) {
                    this.processLog();
                }
                TNode.refresh.call(this);
            },
            /**
     * Return the component attribute type of the current node
     * @return {String} one of the following option:
     *      "ATTELT" if the element is an attribute element (e.g. <@body>)
     *      "CONTENT" if the node is a content element (e.g. <div>)
     *      "INDEFINITE" if the element can be part of eithe an attribute or content collection (e.g. blank text nodes)
     *      "ERROR" if elt mixes attribute and content elements
     */
            getCptAttType: function() {
                return "CONTENT";
            }
        });
        module.exports = LogNode;
    });
    define("hsp/rt/$let.js", [ "../klass", "../$set", "./document", "./tnode", "../expressions/manipulator" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        // This module contains the log node
        var klass = require("../klass"), $set = require("../$set"), doc = require("./document"), TNode = require("./tnode").TNode, exmanipulator = require("../expressions/manipulator");
        var LetNode = klass({
            $extends: TNode,
            /**
     * Log node generator ex: {log scope}
     * @param {Map<Expression>} expressions that, when evaluated, will create new variables
     */
            $constructor: function(exps) {
                TNode.$constructor.call(this, exps);
                var exp = this.eh.getExpr(1);
                //there is only one expression for the let block
                var trees = exp.isMultiStatement ? exp.ast : [ exp.ast ];
                this.expTrees = [];
                /*
         * The logic below splits the comma-separated expressions into individual
         * expressions and prepares a collection of 2-element arrays where the first
         * element is a variable name to be assigned and the second one - expression
         * manipulator that knows how to get value of the right-hand side.
         */
                for (var i = 0; i < trees.length; i++) {
                    this.expTrees.push([ trees[i].l.v, exmanipulator(exps[0], trees[i].r) ]);
                }
            },
            /**
     * Create the DOM node element and attach it to the parent
     */
            createNode: function() {
                this.node = doc.createComment("{let}");
                this.updateScope();
            },
            /**
     * Observer callback called when one of the bound variables used by the node expressions changes
     */
            onPropChange: function(chge) {
                // update scope variables
                this.updateScope();
                TNode.onPropChange.call(this, chge);
            },
            /**
     * Process the information to be logged and push it to the log output (browser console by default)
     */
            updateScope: function() {
                var expts = this.expTrees;
                for (var i = 0; i < expts.length; i++) {
                    $set(this.vscope, expts[i][0], expts[i][1].getValue(this.vscope, undefined));
                }
            }
        });
        module.exports = LetNode;
    });
    define("hsp/rt.js", [ "./es5", "./klass", "./rt/log", "./rt/$root", "./rt/cptwrapper", "./rt/colutils", "./rt/$text", "./rt/$if", "./rt/$foreach", "./rt/eltnode", "./rt/$log", "./rt/$let" ], function(module, global) {
        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
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
        require("./es5");
        var klass = require("./klass"), log = require("./rt/log"), $root = require("./rt/$root"), $RootNode = $root.$RootNode, $CptNode = $root.$CptNode, $CptAttElement = $root.$CptAttElement, cptwrapper = require("./rt/cptwrapper"), colutils = require("./rt/colutils");
        var NodeGenerator = klass({
            /**
     * NodeGenerator constructor
     * @param {Array|TNode} nodedefs tree root of node generators created by the template pre-processor
     */
            $constructor: function(nodedefs) {
                this.nodedefs = nodedefs;
            },
            /**
     * Main method called to generate the document fragment associated to a template for a given set of arguments This
     * creates a new set of node instances from the node definitions passed in the ng constructor
     * @param {Array} scopevars the list of the scope variables (actually the template arguments) - e.g.
     * ["person",person] odd indexes correspond to argument values / even indexes correspond to argument names
     * @param {Object} ctlWrapper the controller observer - if any
     * @param {Map} ctlInitAtts the init value of the controller attributes (optional) - e.g.
     * {value:'123',mandatory:true}
     * @param {Object} rootscope the parent root scope object containing the reference to
     * the global objects accessible from the template file scope
     */
            process: function(tplctxt, scopevars, ctlWrapper, ctlInitArgs, rootscope) {
                var vs = rootscope ? Object.create(rootscope) : {}, nm, argNames = [];
                // array of argument names
                if (scopevars) {
                    for (var i = 0, sz = scopevars.length; sz > i; i += 2) {
                        nm = scopevars[i];
                        vs[nm] = scopevars[i + 1];
                        // feed the vscope
                        argNames.push(nm);
                    }
                }
                vs["$scope"] = vs;
                // self reference (used for variables - cf. expression handler)
                var root = null;
                if (tplctxt.$constructor && tplctxt.$constructor === $CptNode) {
                    // we use the component node as root node
                    root = tplctxt;
                    root.init(vs, this.nodedefs, argNames, ctlWrapper, ctlInitArgs);
                } else {
                    root = new $RootNode(vs, this.nodedefs, argNames, ctlWrapper, ctlInitArgs);
                }
                return root;
            }
        });
        var tplRefresh = [];
        // List of templates pending refresh
        var tplTimeoutId = null;
        // Timer id to trigger refresh automatically
        /**
 * Refresh method that automatically refreshes all templates that may haven been impacted by changes in data structures
 * This method is automatically triggered by a setTimeout and doesn't need to be explicitelly called
 */
        var refresh = exports.refresh = function() {
            var t;
            if (tplTimeoutId) {
                clearTimeout(tplTimeoutId);
                tplTimeoutId = null;
            }
            while (t = tplRefresh.shift()) {
                t.refresh();
            }
        };
        var refreshTimeout = function() {
            tplTimeoutId = null;
            refresh();
        };
        var global = exports.global = {};
        colutils.setGlobal(global);
        /**
 * Return the global reference corresponding to a given name
 * This function is used by template to retrieve global references that are first searched in the template module
 * scope, then in the hashspace global object. Null is returned if no reference is found
 * @param {String} name the name of the reference to look for
 * @param {Object} obj the object found in the module scope
 */
        function getGlobalRef(name) {
            var r = global[name];
            if (r === undefined) {
                r = null;
            }
            return r;
        }
        /**
 * Add a template to the list of templates that must be refreshed when all changes are done in the data structures. This
 * is automatically called by the template $Root node (cf. TNode.onPropChange())
 */
        refresh.addTemplate = function(tpl) {
            var idx = tplRefresh.indexOf(tpl);
            if (idx < 0) {
                tplRefresh.push(tpl);
                if (!tplTimeoutId) {
                    tplTimeoutId = setTimeout(refreshTimeout, 0);
                }
            }
        };
        /**
 * Helper to create template functions
 * @param {Array|Object} arg the list of argument names - e.g. ["label", "value"]
 * @param {Function} contentFunction a function returning the structure of the template e.g. function(n,g) { return
 * [n.$text({e1:[0,0,"label"],e2:[1,0,"value"]},["",1,": ",2])] }
 */
        exports.template = function(arg, contentFunction) {
            // closure variables
            var ng = new NodeGenerator(null), args = [], sz = 0, hasController = false, Ctl = null, fileScope;
            if (arg.constructor === Array) {
                sz = arg.length;
                for (var i = 0; sz > i; i++) {
                    args.push(arg[i]);
                    args.push(null);
                }
            } else {
                // this template is associated to a controller
                hasController = true;
                // arg is a controller reference - let's check if it is valid
                Ctl = $root.getObject(arg.ctl);
                var err = null;
                if (Ctl === null) {
                    err = "Undefined component controller: " + arg.ctl.slice(1).join(".");
                } else if (Ctl.constructor !== Function) {
                    err = "Component controller must be a function: " + arg.ctl.slice(1).join(".");
                }
                if (err) {
                    log.error(err);
                    throw err;
                }
                // add the controller reference to the template scope
                args[0] = arg.ref;
            }
            var f = function() {
                var cw = null, cptInitArgs = null;
                if (!ng.nodedefs) {
                    try {
                        var r = contentFunction(nodes);
                        fileScope = r.shift();
                        ng.nodedefs = r;
                    } catch (ex) {
                        // TODO: add template and file name in error description
                        if (ex.constructor === ReferenceError) {
                            throw "Invalid reference: " + (ex.message || ex.description);
                        } else {
                            throw ex;
                        }
                    }
                }
                if (hasController) {
                    cw = cptwrapper.createCptWrapper(Ctl, arguments.length > 1 ? arguments[1] : null);
                    args[1] = cw.cpt;
                } else {
                    for (var i = 0; sz > i; i++) {
                        args[1 + 2 * i] = arguments[i];
                    }
                }
                if (arguments.length > 0) {
                    cptInitArgs = arguments[0];
                }
                return ng.process(this, args, cw, cptInitArgs, fileScope);
            };
            f.isTemplate = true;
            f.controllerConstructor = Ctl;
            return f;
        };
        /**
 * Global registry for custom attributes
 */
        /**
 * The registry as an Array, e.g:
 * [{names: ["ontap", "ontapstart", "ontapcancel"], handler: Tap, priority: 0},
 *  {names: ["dropdown"], handler: CustomDropDown, priority: -2},
 *  {names: ["dropdown"], handler: OtherDropDown, priority: 2}]
 */
        var customAttributesRegistry = [];
        /**
 * Registers a set of custom attributes with a matching handler.
 * @param {Array|String} names the name of the attributes.
 * @param {Object} handler the attribute handler function, which can implement:
 *  - $constructor(nodeInstance, callback): used to create the handler instance.
 *  - $setValue(name, stringValue): called each time the attribute value changed, including when the initial value is set.
 *  - $setValueFromExp(name, expresionValues): called each time the attribute is refreshed, including when the initial value is set.
 *  - $onAttributesRefresh(): called at the end of the attributes'refresh process, i.e. once all attributes have their new value.
 *  - $onContentRefresh(): called when the content of the node holding the custom attribute has been refreshed.
 *  - $handleEvent(event): called when an event for which the custom attribute registered for is fired.
 *  - $dispose(): used to dispose the handler instance. 
 *  It is instanciated on each element node with one of the custom attributes.
 *  WARNING: when $constructor is executed, the node instance tree is not fully built, so links with other nodes (parent, children, siblinngs) must be done in setValue.
 *  WARNING: custom attribute handler should implement only one of $setValue and $setValueFromExp
 * @param {Integer} priority the priority of the handler, default value is 0, the higher the more priority (i.e. higher executed first).
 * @param {Array} tags the list of tags on which the handler will apply, undefined means all.
 */
        exports.registerCustomAttributes = function(names, handler, priority, tags) {
            var customAttributes = names;
            if (names.constructor !== Array) {
                customAttributes = [ names ];
            }
            if (customAttributes && customAttributes.length > 0 && handler) {
                var prio = priority || 0;
                var entry = {
                    names: customAttributes,
                    handler: handler,
                    priority: prio,
                    tags: tags
                };
                customAttributesRegistry.push(entry);
            }
        };
        function _handlerSorter(a, b) {
            return b.priority - a.priority;
        }
        /**
 * Returns the list of custom attributes for an element of type tag.
 * @param {String} name the name of the attribute
 * @param {String} tag the element's tag
 * @return {Array} the list
 */
        exports.getCustomAttributeHandlers = function(name, tag) {
            var results = [];
            for (var i = 0; i < customAttributesRegistry.length; i++) {
                var entry = customAttributesRegistry[i];
                if (entry.names.indexOf(name) > -1 && (typeof entry.tags === "undefined" || entry.tags.indexOf(tag) > -1)) {
                    results.push(entry);
                }
            }
            return results.sort(_handlerSorter);
        };
        /**
 * WARNING: to be executed last!
 * Collection of the node types supported by the NodeGenerator This collection is attached to the Nodegenerator
 * constructor through a nodes property
 */
        var nodes = {};
        var nodeList = [ "$text", require("./rt/$text"), "$if", require("./rt/$if"), "$foreach", require("./rt/$foreach"), "elt", require("./rt/eltnode"), "cpt", $CptNode, "catt", $CptAttElement, "log", require("./rt/$log"), "let", require("./rt/$let") ];
        for (var i = 0, sz = nodeList.length; sz > i; i += 2) {
            createShortcut(nodeList[i], nodeList[i + 1]);
        }
        nodes.g = getGlobalRef;
        /**
 * Create shortcut functions on the nodes collection to simplify the template functions e.g. nodes.$text=function(exps,
 * textcfg) {return new $TextNode(exps, textcfg);}
 */
        function createShortcut(tagName, tagConstructor) {
            nodes[tagName] = function(a1, a2, a3, a4, a5, a6) {
                return new tagConstructor(a1, a2, a3, a4, a5, a6);
            };
        }
    });
})(noder.define);