
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
var klass = require("hsp/klass");
var doc = require("hsp/document");
var TNode = require("hsp/rt/tnode").TNode;
var hsp = require("hsp/rt");
var gestures = require("hsp/gestures/gestures");

/**
 * Generic element node Add attribute support on top of TNode - used for div, spans, ul, li, h1, etc
 */
var EltNode = klass({
    $extends : TNode,

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
     */
    $constructor : function (tag, exps, attcfg, ehcfg, children) {
        TNode.$constructor.call(this, exps);
        this.tag = tag;
        this.isInput = (this.tag === "input");
        this.createAttList(attcfg, ehcfg);
        if (children && children !== 0) {
            this.children = children;
        }
        this.gesturesEventHandlers = null;
    },

    $dispose : function () {
        var evh = this.evtHandlers, nd = this.node;
        if (this.isInput) {
            this.inputModelExpIdx = null;
        }
        if (evh) {
            // remove all event handlers
            var rmEL = (nd.removeEventListener !== undefined); // tells if removeEventListener is supported

            for (var i = 0, sz = evh.length; sz > i; i++) {
                if (rmEL) {
                    nd.removeEventListener(evh[i].evtType, this, false);
                } else {
                    nd.detachEvent("on" + evh[i].evtType, this._attachEventFn);
                }
            }
        }
        if (this.gesturesEventHandlers) {
            this.gesturesEventHandlers.$dispose();
            this.gesturesEventHandlers = null;
        }
        this._attachEventFn = null;
        TNode.$dispose.call(this);
    },

    /**
     * Create the DOM node element
     */
    createNode : function () {
        this.TYPE = this.tag; // for debugging purposes
        var nd;
        if (this.tag === "svg") {
            this.nodeNS = "http://www.w3.org/2000/svg";
        }
        if (this.nodeNS) {
            nd = doc.createElementNS(this.nodeNS, this.tag);
        } else {
            nd = doc.createElement(this.tag);
        }
        this.node = nd;
        this.refreshAttributes();

        // attach event listener
        var evh = this.evtHandlers, hnd;
        var addEL = (nd.addEventListener !== undefined); // tells if addEventListener is supported
        if (evh || this.isInput) {
            if (!addEL) {
                // create a callback function if addEventListener is not supported
                var self = this;
                this._attachEventFn = function (evt) {
                    self.handleEvent(evt);
                };
            }

            var evts = {};
            // set or updates the event handlers
            if (evh) {
                for (var i = 0, sz = evh.length; sz > i; i++) {
                    hnd = evh[i];
                    if (gestures.isGesture(hnd.evtType)) {
                        if (this.gesturesEventHandlers == null) {
                            this.gesturesEventHandlers = new gestures.Gestures();
                        }
                        this.gesturesEventHandlers.startGesture(hnd.evtType, nd, this);
                    } else {
                        evts[hnd.evtType] = true;
                        if (addEL) {
                            nd.addEventListener(hnd.evtType, this, false);
                        } else {
                            nd.attachEvent("on" + hnd.evtType, this._attachEventFn);
                        }
                    }
                }
            }

            if (this.isInput) {
                // ensure we listen to click, keydown and keyup
                var et, inputEvts = ["click", "keydown", "keyup"];
                for (var idx in inputEvts) {
                    et = inputEvts[idx];
                    if (!evts[et]) {
                        if (addEL) {
                            nd.addEventListener(et, this, false);
                        } else {
                            nd.attachEvent("on" + et, this._attachEventFn);
                        }
                    }
                }
            }
        }

    },

    /**
     * Event Listener callback
     */
    handleEvent : function (evt) {
        var evh = this.evtHandlers, et = evt.type, result = null;

        // if the element is an input tag we synchronize the value
        if (this.isInput && this.inputModelExpIdx) {
            var exp = this.eh.getExpr(this.inputModelExpIdx);
            if (exp.setValue) {
                var v = this.node.value, tp = this.node.type;
                if (tp === "checkbox") {
                    v = this.node.checked;
                }
                this._lastValue = v; // to avoid refreshing the field and move the cursor
                exp.setValue(this.vscope, v);
                hsp.refresh(); // to force synchronous change
            }
        }

        if (evh) {
            for (var i = 0, sz = evh.length; sz > i; i++) {
                if (evh[i].evtType === et) {
                    result = evh[i].executeCb(evt, this.eh, this.vscope);
                    break;
                }
            }
        }
        if (result === false) {
            evt.preventDefault();
        }
        return result;
    },

    /**
     * Refresh the node
     */
    refresh : function () {
        if (this.adirty) {
            // attributes are dirty
            this.refreshAttributes();
        }
        TNode.refresh.call(this);
    },

    /**
     * Refresh the node attributes (even if adirty is false)
     */
    refreshAttributes : function () {
        var nd = this.node, atts = this.atts, att, eh = this.eh, vs = this.vscope, nm, modelRefs = null;
        this.adirty = false;

        if (atts) {
            for (var i = 0, sz = this.atts.length; sz > i; i++) {
                att = atts[i];
                if (this.isInput && !this.inputModelExpIdx && (att.name === "value" || att.name === "#model")) {
                    if (att.textcfg && att.textcfg.length === 2 && att.textcfg[0] === '') {
                        if (!modelRefs) {
                            modelRefs = [];
                        }
                        modelRefs[att.name] = att.textcfg[1];
                    }
                }
                nm = att.name;
                if (nm.match(/^#/)) {
                    // this is an hashspace extension attribute
                    if (nm === "#model") {
                        continue;
                    }

                } else if (nm === "class") {
                    // issue on IE8 with the class attribute?
                    if (this.nodeNS) {
                        nd.setAttribute("class", att.getValue(eh, vs, ""));
                    } else {
                        nd.className = att.getValue(eh, vs, "");
                    }

                } else if (nm === "value") {
                    // value attribute must be changed directly as the node attribute is only used for the default value
                    if (!this.isInput || nd.type === "radio") {
                        nd.value = att.getValue(eh, vs, "");
                    }
                } else {
                    nd.setAttribute(att.name, att.getValue(eh, vs, null));
                }
            }
        }

        if (this.htmlCbs) {
            var cb;
            for (var i = 0, sz = this.htmlCbs.length; sz > i; i++) {
                cb = this.htmlCbs[i];
                nd.setAttribute("on" + cb.evtType, cb.htmlCb);
            }
        }

        if (modelRefs) {
            // set the inputModelExpIdx property that reference the expression index to use for the model binding
            var ref = modelRefs["#model"];
            if (!ref) {
                ref = modelRefs["value"];
            }
            if (ref) {
                this.inputModelExpIdx = ref;
            }
        }

        if (this.inputModelExpIdx) {
            // update the checked state (must be done at the end as the value attribute may not have been set)
            var exp = this.eh.getExpr(this.inputModelExpIdx), v1 = '' + exp.getValue(vs, this.eh, "");
            if (nd.type === "radio") {
                var v2 = '' + nd.value;
                nd.checked = (v1 === v2);
            } else if (nd.type === "checkbox") {
                var v2 = '' + nd.checked;
                if (v1 !== v2) {
                    nd.checked = !nd.checked;
                }
            } else {
                if (this._lastValue !== v1) {
                    nd.value = v1;
                }
                this._lastValue = null;
            }
        }

    }

});

module.exports = EltNode;
