
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
var gestures = require("../gestures/gestures");
var log = require("./log");

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
     * @param {Integer} needSubScope tells if a sub-scope must be created (e.g. because of {let} statents) - default: 0 or undefined
     */
    $constructor : function (tag, exps, attcfg, ehcfg, children, needSubScope) {
        TNode.$constructor.call(this, exps);
        this.tag = tag;
        this.isInput = (this.tag === "input" || this.tag === "textarea");
        this.createAttList(attcfg, ehcfg);
        if (children && children !== 0) {
            this.children = children;
        }
        this.gesturesEventHandlers = null;
        this.needSubScope = (needSubScope===1);
        this._lastValue = null;
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
        var nodeType = null, nodeName = null;
        var nd, docFragment;

        if (this.tag === "svg") {
            if (browser.supportsSvg()) {
                this.nodeNS = "http://www.w3.org/2000/svg";
            } else {
                log.error('This browser does not support SVG elements');
            }
        }

        if (this.nodeNS) {
            nd = doc.createElementNS(this.nodeNS, this.tag);
        } else {
            if (this.atts && this.atts.length > 0) {

                nd = doc.createElement(this.tag);
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
                            nd.type = nodeType;
                        }
                        if (nodeName) {
                            nd.name = nodeName;
                        }
                    } catch (ex) {
                        // we have to use a special creation mode as IE doesn't support dynamic type and name change
                        docFragment = doc.createElement('div');
                        docFragment.innerHTML = '<' + this.tag + (nodeType?' type=' + nodeType : '') + (nodeName?' name=' + nodeName : '') + ' >';
                        nd = docFragment.children[0];
                    }
                }
            }
            else {
                nd = doc.createElement(this.tag);
            }
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
                // ensure we listen to click, focus and keyup
                var et, inputEvts = ["click","focus","input","keyup"];
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
                if (et==="input" || et==="keyup" || et==="click" || et==="focus") {
                    // push the field value to the data model
                    // note: when the input event is properly implemented we don't need to listen to keyup
                    // but IE8 and IE9 don't implement it completely - thus the need for keyup
                    var v = this.node.value, tp = this.node.type;
                    if (tp === "checkbox") {
                        v = this.node.checked;
                    }
                    if (v!==this._lastValue) {
                        // only set the value in the data model if the value in the field changed
                        this._lastValue = v;
                        var currentValue=exp.getValue(this.vscope,this.eh);
                        //log("[EltNode] handleEvent("+et+"): previous model value:["+currentValue+"] new value (from input):["+v+"]");
                        // if the value is already set no need to set it again and force a resync
                        if (v!==currentValue) {
                            exp.setValue(this.vscope, v);
                            // force refresh to resync other fields linked to the same data immediately
                            hsp.refresh();
                        }
                    }
                }
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
        if (atts) {
            for (var i = 0, sz = this.atts.length; sz > i; i++) {
                att = atts[i];
                if (this.isInput && !this.inputModelExpIdx && (att.name === "value" || att.name === "model")) {
                    if (att.textcfg && att.textcfg.length === 2 && att.textcfg[0] === '') {
                        if (!modelRefs) {
                            modelRefs = [];
                        }
                        modelRefs[att.name] = att.textcfg[1];
                    }
                }
                nm = att.name;
                if (nm === "model") {
                    // this is an hashspace extension attribute
                    continue;
                } else if (isBooleanAttribute(nm)) {
                    //this is equivalent to calling sth like: node.required = truthy / falsy;
                    //a browser will remove this attribute if a provided value is falsy
                    //http://www.w3.org/html/wg/drafts/html/master/infrastructure.html#boolean-attributes
                    nd[nm] = att.getValue(eh, vs, "");
                } else if (nm === "class") {
                    // issue on IE8 with the class attribute?
                    if (this.nodeNS) {
                        nd.setAttribute("class", att.getValue(eh, vs, ""));
                    } else {
                        nd.className = att.getValue(eh, vs, "");
                    }

                } else if (nm === "value") {
                    // value attribute must be changed directly as the node attribute is only used for the default value
                    if (!this.isInput || nd.type === "radio" || nd.type === "button") {
                        nd.value = att.getValue(eh, vs, "");
                    }
                } else {
                    try {
                        nd.setAttribute(att.name, att.getValue(eh, vs, null));
                    }
                    catch (e) {}
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
            var ref = modelRefs["model"];
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
            if (v1 !== this._lastValue) {
                // only set the value if it changed in the model since last sync
                this._lastValue = v1;
                if (nd.type === "radio") {
                    var v2 = '' + nd.value;
                    nd.checked = (v1 === v2);
                } else if (nd.type === "checkbox") {
                    var v2 = '' + nd.checked;
                    if (v1 !== v2) {
                        nd.checked = !nd.checked;
                    }
                } else if (v1!=nd.value) {
                    //only update if value is changing
                    //log("[EltNode] Node value update: current value:["+nd.value+"] new value:["+v1+"]");
                    nd.value = v1;
                }
            }
        }
    }

});

module.exports = EltNode;
