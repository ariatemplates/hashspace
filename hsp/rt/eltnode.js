
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
var ClassHandler = require('./attributes/class');
hsp.registerCustomAttributes("class", ClassHandler);
var ModelValueHandler = require('./attributes/modelvalue');
hsp.registerCustomAttributes(["model", "value"], ModelValueHandler, 0, ["input", "textarea"]);

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
        this.createAttList(attcfg, ehcfg);
        if (children && children !== 0) {
            this.children = children;
        }
        this.needSubScope = (needSubScope===1);
    },

    $dispose : function () {
        var node = this.node;
        if (this._allEvtLsnr) {
            // remove all event handlers
            var rmEL = (node.removeEventListener !== undefined); // tells if removeEventListener is supported

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
    createNodeInstance : function (parent) {
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
    createNode : function () {
        this.TYPE = this.tag; // for debugging purposes
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
                log.error('This browser does not support SVG elements');
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
                        docFragment = doc.createElement('div');
                        docFragment.innerHTML = '<' + this.tag + (nodeType?' type=' + nodeType : '') + (nodeName?' name=' + nodeName : '') + ' >';
                        node = docFragment.children[0];
                    }
                }
            }
            else {
                node = doc.createElement(this.tag);
            }
        }
        this.node = node;

        var addEL = (node.addEventListener !== undefined); // tells if addEventListener is supported
        if (!addEL) {
            // create a callback function if addEventListener is not supported
            var self = this;
            this._attachEventFn = function (evt) {
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
                        var handlerInstance = this._createCustomAttributeHandler(fullEvtType, customHandlers[j], this.handleEvent.bind(this)).instance;
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
    handleEvent : function (event) {
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
            event.preventDefault();
        }
        return result;
    },

    /**
     * Refresh the node
     */
    refresh : function () {
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
     * @param {Function} callback the callback function passed to the handler instance.
     * @return {Object} the full handler created.
     */
    _createCustomAttributeHandler: function (name, customHandler, callback) {
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
            entry = {klass: customHandler.handler, instance: new customHandler.handler(this, callback)};
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
    refreshAttributes : function (isEltCreation) {
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
                        if (attribute.textcfg && attribute.textcfg.length === 2 && attribute.textcfg[0] === '') {
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
                }
                else if (isBooleanAttribute(name)) {
                    //this is equivalent to calling sth like: node.required = truthy / falsy;
                    //a browser will remove this attribute if a provided value is falsy
                    //http://www.w3.org/html/wg/drafts/html/master/infrastructure.html#boolean-attributes
                    node[name] = attribute.getValue(expressionHandler, vscope, "");
                }
                else {
                    try {
                        node.setAttribute(attribute.name, attribute.getValue(expressionHandler, vscope, null));
                    }
                    catch (e) {}
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
     * Sets the attribute value in the data model.
     * @param {String} name the name of the attribute
     * @param {String} value the value of the attribute.
     * @return {Boolean} true if the value was successfully set
     */
    setAttributeValueInModel: function (name, value) {
        if (this._custAttrData[name]) {
            var exprIndex = this._custAttrData[name].exprIndex;
            if (this.eh && typeof exprIndex !== "undefined") {
                var expression = this.eh.getExpr(exprIndex);
                if (expression.setValue && this._custAttrData[name].value !== value ) {
                    var currentValue = expression.getValue(this.vscope, this.eh);
                    if (value !== currentValue) {
                        expression.setValue(this.vscope, value);
                        // force refresh to resync other fields linked to the same data immediately
                        hsp.refresh();
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
        var isAddEL = (this.node.addEventListener !== undefined);
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
            if (parent._custAttrHandlers[name]) {
                break;
            }
            else {
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
        for (var i = 0; i < handlers.length; i++) {
            result.push(handlers[i].instance);
        }
        return result;
    }

});

module.exports = EltNode;
