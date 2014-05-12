(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var json = require("./json");

/**
 * Shortcut to json.$set()
 */
var $set = module.exports = function (object, property, value) {
    return json.$set(object, property, value);
};

/**
 * Shortcut to json.$delete()
 */
$set.del = json.$delete;

var cachedOperators = {};
var acceptedOperators = /^([-+*%\/&^|]|<<|>>|>>>)?=$/;

function createOperator (operator) {
    if (!acceptedOperators.test(operator)) {
        throw new Error("Invalid operator: " + operator);
    }
    /*jshint -W061,-W093 */
    return cachedOperators[operator] = Function("a", "b", "a" + operator + "b;return a;");
    /*jshint +W061,+W093*/
}

/**
 * Does an assignment operation but also notifies listeners.
 * <code>$set.op(a,b,"+=",c)</code> is equivalent to <code>a[b] += c</code>
 */
$set.op = function (object, property, operator, value) {
    var opFn = cachedOperators[operator] || createOperator(operator);
    return $set(object, property, opFn(object[property], value));
};

/**
 * Increments a property on an object and notifies listeners.
 * <code>$set.inc(a,b)</code> is equivalent to <code>a[b]++</code>
 */
$set.inc = function (object, property) {
    var previousValue = object[property];
    $set(object, property, previousValue + 1);
    return previousValue;
};

/**
 * Decrements a property on an object and notifies listeners.
 * <code>$set.dec(a,b)</code> is equivalent to <code>a[b]--</code>
 */
$set.dec = function (object, property) {
    var previousValue = object[property];
    $set(object, property, previousValue - 1);
    return previousValue;
};

},{"./json":14}],2:[function(require,module,exports){

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

module.exports.createDocumentFragment = function () {
    return doc.createDocumentFragment();
};

module.exports.createElement = function (type) {
    return doc.createElement(type);
};

module.exports.createElementNS = function (ns, type) {
    return doc.createElementNS(ns, type);
};

module.exports.createTextNode = function (text) {
    return doc.createTextNode(text);
};

module.exports.createComment = function (text) {
    return doc.createComment(text);
};

module.exports.getElementById = function (eltId) {
    return doc.getElementById(eltId);
};

if (doc.createEvent) {
    module.exports.createEvent = function () {
        return doc.createEvent.apply(doc,arguments);
    };
}

if (doc.createEventObject) {
    module.exports.createEventObject = function () {
        return doc.createEventObject.apply(doc,arguments);
    };
}

},{}],3:[function(require,module,exports){

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
    Array.prototype.indexOf = function (searchElement /*, fromIndex */) {
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
            if (n != n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n !== 0 && n != Infinity && n != -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    };
}

// Function.bind
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
            // closest thing possible to the ECMAScript 5 internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, fNOP = function () {}, fBound = function () {
            return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
        };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}

},{}],4:[function(require,module,exports){
var klass = require("../klass");
var touchEvent = require("./touchEvent");
var Gesture = require("./gesture").Gesture;

var DoubleTap = klass({
    $extends : Gesture,

    /**
     * The move tolerance to validate the gesture.
     * @type Integer
     */
    MARGIN : 10,
    /**
     * The delay between the taps.
     * @type Integer
     */
    BETWEEN_DELAY: 200,

    /**
     * Initial listeners for the DoubleTap gesture.
     * @protected
     */
    _getInitialListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchstart,
                    cb : this._doubleTapStart.bind(this)
                }];
    },

    /**
     * Additional listeners for the DoubleTap gesture.
     * @protected
     */
    _getAdditionalListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchmove,
                    cb : this._doubleTapMove.bind(this)
                }, {
                    evt : this.touchEventMap.touchend,
                    cb : this._doubleTapEnd.bind(this)
                }];
    },

    /**
     * The fake events raised during the DoubleTap lifecycle.
     * @protected
     */
    _getFakeEventsMap : function () {
        return {
            doubletapstart: "doubletapstart",
            cancel: "doubletapcancel",
            finalize: "doubletap"
        };
    },

    /**
     * DoubleTap start mgmt: gesture is started if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _doubleTapStart : function (event) {
        var status = this._gestureStart(event);
        if (status == null) {
            if (this.timerId) {
                //Gesture already started so it has to be cancelled if multi-touch.
                return this._doubleTapCancel(event);
            }
            else {
                return (event.returnValue != null)? event.returnValue: !event.defaultPrevented;
            }
        }
        if (this.timerId) {
            //Second tap starting
            clearTimeout(this.timerId);
            return status;
        }
        else {
            //First tap starting
            return this._raiseFakeEvent(event, this._getFakeEventsMap().doubletapstart);
        }
    },

    /**
     * DoubleTap move mgmt: gesture continues if only one touch and if the move is within margins.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _doubleTapMove : function(event) {
        var position = touchEvent.getPositions(event);
        if (this.MARGIN >= this._calculateDistance(this.startData.positions[0].x, this.startData.positions[0].y, position[0].x, position[0].y)) {
            var status = this._gestureMove(event);
            return (status == null)? this._doubleTapCancel(event): status;
        }
        else {
            return this._doubleTapCancel(event);
        }
    },

    /**
     * DoubleTap end mgmt: gesture ends if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _doubleTapEnd : function (event) {
        var status = this._gestureEnd(event);
        if (status == null) {
            return this._doubleTapCancel(event);
        }
        else if (this.timerId) {
            //Second tap ending, fake event raised
            this.timerId = null;
            return this._raiseFakeEvent(event, this._getFakeEventsMap().finalize);
        }
        else {
            //First tap ending, timer created to wait for second tap
            var _this = this;
            var eventCopy = {};
            for (var i in event) {
                eventCopy[i] = event[i];
            }
            this.timerId = setTimeout(function () {
                _this._doubleTapFinalCancel(eventCopy);
            }, this.BETWEEN_DELAY);
            return status;
        }
    },

    /**
     * doubleTap cancellation.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _doubleTapCancel : function (event) {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        return this._gestureCancel(event);
    },

    /**
     * DoubleTap cancellation outside the lifecycle window, used if timer expires between the two taps.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _doubleTapFinalCancel: function(event) {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        return this._raiseFakeEvent(event, this._getFakeEventsMap().cancel);
    }

});

module.exports.DoubleTap = DoubleTap;
},{"../klass":15,"./gesture":6,"./touchEvent":13}],5:[function(require,module,exports){
var klass = require("../klass");
var touchEvent = require("./touchEvent");
var Gesture = require("./gesture").Gesture;

var Drag = klass({
    $extends : Gesture,

    /**
     * Initial listeners for the Drag gesture.
     * @protected
     */
    _getInitialListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchstart,
                    cb : this._dragStart.bind(this)
                }];
    },

    /**
     * Additional listeners for the Drag gesture.
     * @protected
     */
    _getAdditionalListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchmove,
                    cb : this._dragMove.bind(this)
                }, {
                    evt : this.touchEventMap.touchend,
                    cb : this._dragEnd.bind(this)
                }];
    },

    /**
     * The fake events raised during the Drag lifecycle.
     * @protected
     */
    _getFakeEventsMap : function () {
        return {
            dragstart : "dragstart",
            dragmove : "dragmove",
            dragend : "drag",
            cancel : "dragcancel"
        };
    },

    /**
     * Drag start mgmt: gesture is started if only one touch, first fake event to be fired with the first move.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _dragStart : function (event) {
        var alreadyStarted = this.currentData != null;
        var status = this._gestureStart(event);
        if (status == null && alreadyStarted) {
            // if the gesture has already started, it has to be cancelled
            this.currentData = {
                positions : touchEvent.getPositions(event),
                time : (new Date()).getTime()
            };
            return this._raiseFakeEvent(event, this._getFakeEventsMap().cancel);
        } else {
            return status == null
                    ? ((event.returnValue != null) ? event.returnValue : !event.defaultPrevented)
                    : status;
        }
    },

    /**
     * Tap move mgmt: gesture starts/continues if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _dragMove : function (event) {
        var alreadyStarted = this.currentData != null;
        var status = this._gestureMove(event);
        if (status != null) {
            // Gesture starts
            var eventName = this._getFakeEventsMap().dragstart;
            if (alreadyStarted) {
                // Gesture moves
                eventName = this._getFakeEventsMap().dragmove;
            }
            return this._raiseFakeEvent(event, eventName);
        } else {
            this.currentData = null;
            return (alreadyStarted) ? this._gestureCancel(event) : (event.returnValue != null)
                    ? event.returnValue
                    : !event.defaultPrevented;
        }
    },

    /**
     * Drag end mgmt: gesture ends if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _dragEnd : function (event) {
        var alreadyStarted = this.currentData != null;
        var status = this._gestureEnd(event);
        if (alreadyStarted) {
            return (status == null)
                    ? ((event.returnValue != null) ? event.returnValue : !event.defaultPrevented)
                    : this._raiseFakeEvent(event, this._getFakeEventsMap().dragend);
        } else {
            return (event.returnValue != null) ? event.returnValue : !event.defaultPrevented;
        }

    }

});

module.exports.Drag = Drag;
},{"../klass":15,"./gesture":6,"./touchEvent":13}],6:[function(require,module,exports){
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

var klass = require("../klass");
var touchEvent = require("./touchEvent");

var Gesture = klass({
    /**
     * Defines the number of touch for the gesture.
     */
    NB_TOUCHES : 1,

    /**
     * Constructor.
     */
    $constructor : function (target, evthandler) {
        /**
         * Reference to the target
         * @type HTMLElement
         */
        this.target = target;

        /**
         * Reference to the event handler
         * @type HTMLElement
         */
        this.evthandler = evthandler;

        /**
         * Event map uses ./touchEvent for touch event detection.
         * @type Object
         */
        this.touchEventMap = touchEvent.touchEventMap;
        /**
         * A flag indicating whether the starting events are already attached.
         * @type Boolean
         */
        this.eventsAlreadyAttached = false;
        /**
         * The id of the timer associated to the gesture.
         * @type Integer
         */
        this.timerId = null;
        /**
         * The gesture initial data.
         * @type Object
         */
        this.startData = null;
        /**
         * The gesture current data.
         * @type Object
         */
        this.currentData = null;

        this.callbackMap = {};

        this._connectTouchEvents();
    },

    $dispose: function() {
        this._disconnectTouchEvents();
        this.callbackMap = null;
    },

    /**
     * Connects touch events.
     * @private
     */
    _connectTouchEvents : function () {
        if (!this.eventsAlreadyAttached) {
            var map = this._getInitialListenersList();
            for (var i = 0; i < map.length; i++) {
                this._addListener(map[i].evt, map[i].cb);
            }
            this.eventsAlreadyAttached = true;
        }
    },

    /**
     * Disconnects touch events added in _connectTouchEvents.
     * @private
     */
    _disconnectTouchEvents : function () {
        var map = this._getInitialListenersList();
        for (var i = 0; i < map.length; i++) {
            this._removeListener(map[i].evt, map[i].cb);
        }
        this.eventsAlreadyAttached = false;
    },

    /**
     * Returns the list of listeners to be attached when loading the gesture. These listeners are also detached during the gesture, and reattached
     * when it ends or when it is cancelled.
     * @protected
     * @return {Object} the list of listeners.
     */
    _getInitialListenersList : function () {
        return [];
    },

    /**
     * Returns the list of listeners to be attached when the gesture is started, and detached when the gesture is
     * finished.
     * @protected
     * @return {Object} the list of listeners.
     */
    _getAdditionalListenersList : function () {
        return [];
    },

    /**
     * Returns the map of fake events to be raised during the gesture lifecycle. Format: {start: "start_event_name",
     * move: "move_event_name", end : "end_event_name", cancel: "cancel_event_name"}
     * @protected
     * @return {Object} the map of listeners.
     */
    _getFakeEventsMap : function () {
        return {};
    },

    /**
     * Generic start point for a gesture: unregisters initial listeners, registers additional listeners, set initial
     * data, optional fake event raised
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _gestureStart : function (event, extraData) {
        if (!this.__validateNbTouches(event)) {
            return null;
        }
        this._disconnectTouchEvents();
        this.startData = {
            positions : touchEvent.getPositions(event),
            time : (new Date()).getTime()
        };
        this.currentData = null;
        this._connectAdditionalTouchEvents();
        if (this._getFakeEventsMap().start) {
            return this._raiseFakeEvent(event, this._getFakeEventsMap().start, extraData);
        } else {
            return (event.returnValue != null) ? event.returnValue : !event.defaultPrevented;
        }
    },

    /**
     * Generic optional move: manages intermediate states during the gesture
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _gestureMove : function (event, extraData) {
        if (!this.__validateNbTouches(event)) {
            return null;
        }
        this.currentData = {
            positions : touchEvent.getPositions(event),
            time : (new Date()).getTime()
        };
        if (this._getFakeEventsMap().move) {
            return this._raiseFakeEvent(event, this._getFakeEventsMap().move, extraData);
        } else {
            return (event.returnValue != null) ? event.returnValue : !event.defaultPrevented;
        }
    },

    /**
     * Generic success end point for the gesture: final fake event raised, additional listeners unregistered,
     * initial listeners attached again.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _gestureEnd : function (event, extraData) {
        if (!this.__validateNbTouches(event)) {
            return null;
        }
        this._disconnectAdditionalTouchEvents();
        this._connectTouchEvents();
        this.currentData = {
            positions : touchEvent.getPositions(event),
            time : (new Date()).getTime()
        };
        if (this._getFakeEventsMap().end) {
            return this._raiseFakeEvent(event, this._getFakeEventsMap().end, extraData);
        } else {
            return (event.returnValue != null) ? event.returnValue : !event.defaultPrevented;
        }
    },

    /**
     * Generic failure end point for the gesture: optional fake event raised, additional listeners unregistered,
     * initial listeners attached again.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _gestureCancel : function (event, extraData) {
        this._disconnectAdditionalTouchEvents();
        this._connectTouchEvents();
        this.currentData = {
            positions : touchEvent.getPositions(event),
            time : (new Date()).getTime()
        };
        if (this._getFakeEventsMap().cancel) {
            return this._raiseFakeEvent(event, this._getFakeEventsMap().cancel, extraData);
        } else {
            return (event.returnValue != null) ? event.returnValue : !event.defaultPrevented;
        }
    },

    /**
     * Registers the listeners added during the gesture lifecycle, once the gesture is started.
     * @private
     */
    _connectAdditionalTouchEvents : function () {
        var map = this._getAdditionalListenersList();
        for (var i = 0; i < map.length; i++) {
            this._addListener(map[i].evt, map[i].cb);
        }
    },

    /**
     * Unregisters the listeners added during the gesture lifecycle.
     * @private
     */
    _disconnectAdditionalTouchEvents : function () {
        var map = this._getAdditionalListenersList();
        for (var i = 0; i < map.length; i++) {
            this._removeListener(map[i].evt, map[i].cb);
        }
    },

    /**
     * Adds an event listener
     * @param {Object} eventName the event name
     * @param {Object} cb the callback for the event
     * @protected
     */
    _addListener : function (eventName, cb) {
        this.callbackMap[eventName] = cb;
        var addEL = (this.target.addEventListener !== undefined);
        if (!addEL) {
            var self = this;
            this._attachEventFn = function (evt) {
                self.handleEvent(evt);
            };
        }
        if (addEL) {
            this.target.addEventListener(eventName, this, false);
        } else {
            this.target.attachEvent("on" + eventName, this._attachEventFn);
        }
    },

    /**
     * Event Listener callback
     */
    handleEvent : function (evt) {
        if (this.callbackMap[evt.type]) {
            var cb = this.callbackMap[evt.type];
            if (cb) {
                return cb(evt);
            }
        }
        
    },

    /**
     * Removes an event listener
     * @param {String} eventName the event name
     * @param {Object} cb the callback for the event
     * @protected
     */
    _removeListener : function (eventName, cb) {
        this.callbackMap[eventName] = null;
        var rmEL = (this.target.removeEventListener !== undefined);
        if (rmEL) {
            this.target.removeEventListener(eventName, this, false);
        } else {
            this.target.detachEvent("on" + eventName, this._attachEventFn);
        }
    },

    /**
     * Raises a fake event, using Delegate.delegate to accurately delegate the event to the appropriate DOM element.
     * @param {Object} event the original event
     * @param {String} name the fake event name
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _raiseFakeEvent : function (event, name, extraData) {
        var target = (event.target) ? event.target : event.srcElement;
        var fakeEvent = touchEvent.getFakeEvent(name, target);
        if (!event.returnValue) {
            fakeEvent.preventDefault();
        }
        if (event.cancelBubble) {
            fakeEvent.stopPropagation();
        }
        fakeEvent.pageX = event.pageX;
        fakeEvent.pageY = event.pageY;
        fakeEvent.clientX = event.clientX;
        fakeEvent.clientY = event.clientY;
        fakeEvent.touches = event.touches;
        fakeEvent.changedTouches = event.changedTouches;
        fakeEvent.isPrimary = event.isPrimary;
        if (this.startData) {
            if (this.startData.time) {
                fakeEvent.duration = (new Date()).getTime() - this.startData.time;
            }
        }
        if (!extraData) {
            extraData = {};
        }
        extraData.startX = this.startData.positions[0].x;
        extraData.startY = this.startData.positions[0].y;
        var position = touchEvent.getPositions(event);
        extraData.currentX = position[0].x;
        extraData.currentY = position[0].y;
        fakeEvent.detail = extraData;
        this.evthandler.handleEvent(fakeEvent);
        event.cancelBubble = fakeEvent.hasStopPropagation;
        event.returnValue = !fakeEvent.hasPreventDefault;
        return event.returnValue;
    },

    /**
     * Returns the distance between two points.
     * @param {Integer} x1 x of the first point
     * @param {Integer} y1 y of the first point
     * @param {Integer} x2 x of the second point
     * @param {Integer} y2 y of the second point
     * @protected
     * @return {Number} the distance
     */
    _calculateDistance : function (x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },

    /**
     * Validates the event against the number of touches required for the gesture. Rules: - single touch gestures
     * are canceled as soon as multi touch is started. - multi touch gestures need all touch events (IE 10
     * constraint).
     * @param {Object} event the event
     * @private
     * @return {Boolean} true if the event's touches are validated for the current gesture.
     */
    __validateNbTouches : function (event) {
        var fingerIndex = touchEvent.getFingerIndex(event);
        return this.NB_TOUCHES == 1 && fingerIndex === 0 || this.NB_TOUCHES == 2 && fingerIndex >= 0;
    }
});

module.exports.Gesture = Gesture;
},{"../klass":15,"./touchEvent":13}],7:[function(require,module,exports){
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
var klass = require("../klass");
var Tap = require("./tap").Tap;
var LongPress = require("./longPress").LongPress;
var SingleTap = require("./singleTap").SingleTap;
var DoubleTap = require("./doubleTap").DoubleTap;
var Swipe = require("./swipe").Swipe;
var Drag = require("./drag").Drag;
var Pinch = require("./pinch").Pinch;
/**
 * Mapping between the event name and the handling class.
 * @type Object
 */
var _gestureMap = {
    tap: {name: "Tap", klass: Tap},
    tapstart: {name: "Tap", klass: Tap},
    tapcancel: {name: "Tap", klass: Tap},
    longpress: {name: "LongPress", klass: LongPress},
    longpressstart: {name: "LongPress", klass: LongPress},
    longpresscancel: {name: "LongPress", klass: LongPress},
    singletap: {name: "SingleTap", klass: SingleTap},
    singletapstart: {name: "SingleTap", klass: SingleTap},
    singletapcancel: {name: "SingleTap", klass: SingleTap},
    doubletap: {name: "DoubleTap", klass: DoubleTap},
    doubletapstart: {name: "DoubleTap", klass: DoubleTap},
    doubletapcancel: {name: "DoubleTap", klass: DoubleTap},
    swipe: {name: "Swipe", klass: Swipe},
    swipestart: {name: "Swipe", klass: Swipe},
    swipemove: {name: "Swipe", klass: Swipe},
    swipecancel: {name: "Swipe", klass: Swipe},
    drag: {name: "Drag", klass: Drag},
    dragstart: {name: "Drag", klass: Drag},
    dragmove: {name: "Drag", klass: Drag},
    dragcancel: {name: "Drag", klass: Drag},
    pinch: {name: "Pinch", klass: Pinch},
    pinchstart: {name: "Pinch", klass: Pinch},
    pinchmove: {name: "Pinch", klass: Pinch},
    pinchcancel: {name: "Pinch", klass: Pinch}
};

/**
 * Utility method to check if an event has to be handled by this gestures module.
 * @param {String} the event name
 * @return {Boolean} the result
 */
exports.isGesture = function(evtName) {
    return typeof _gestureMap[evtName] != "undefined";
};

var Gestures = klass({
    /**
     * The contructor.
     */
    $constructor : function () {
        this.evtHandlers = [];
    },

    /**
     * Starts the right gesture for the event.
     * @param {String} the event name
     * @param {HTMLElement} the event target
     * @param {Object} the delegating event handler
     */
    startGesture : function(evtName, target, evtHandler) {
        var mapping = _gestureMap[evtName];
        if (typeof mapping != "undefined") {
            var alreadyInstanciated = false;
            for (var i = 0, size = this.evtHandlers.length; size > i; i++) {
                if (this.evtHandlers[i].name === mapping.name) {
                    alreadyInstanciated = true;
                    break;
                }
            }
            if (!alreadyInstanciated) {
                this.evtHandlers.push({name: mapping.name, instance: new mapping.klass(target, evtHandler)});
            }
        }
    },

    /**
     * Disposes all created gestures.
     */
    $dispose : function () {
        for (var i = 0, size = this.evtHandlers.length; size > i; i++) {
            this.evtHandlers[i].instance.$dispose();
        }
        this.evtHandlers = null;
    }
});

module.exports.Gestures = Gestures;


},{"../klass":15,"./doubleTap":4,"./drag":5,"./longPress":8,"./pinch":9,"./singleTap":10,"./swipe":11,"./tap":12}],8:[function(require,module,exports){
var klass = require("../klass");
var touchEvent = require("./touchEvent");
var Gesture = require("./gesture").Gesture;

var LongPress = klass({
    $extends : Gesture,

    /**
     * The move tolerance to validate the gesture.
     * @type Integer
     */
    MARGIN : 10,
    /**
     * The duration for the press.
     * @type Integer
     */
    PRESS_DURATION : 1000,

    /**
     * Initial listeners for the LongPress gesture.
     * @protected
     */
    _getInitialListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchstart,
                    cb : this._longPressStart.bind(this)
                }];
    },

    /**
     * Additional listeners for the LongPress gesture.
     * @protected
     */
    _getAdditionalListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchmove,
                    cb : this._longPressMove.bind(this)
                }, {
                    evt : this.touchEventMap.touchend,
                    cb : this._longPressCancel.bind(this)
                }];
    },

    /**
     * The fake events raised during the Tap lifecycle.
     * @protected
     */
    _getFakeEventsMap : function () {
        return {
            start : "longpressstart",
            finalize : "longpress",
            cancel : "longpresscancel"
        };
    },

    /**
     * LongPress start mgmt: gesture is started if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _longPressStart : function (event) {
        var status = this._gestureStart(event);
        if (status != null) {
            var _this = this;
            var eventCopy = {};
            for (var i in event) {
                eventCopy[i] = event[i];
            }
            this.timerId = setTimeout(function () {
                _this._longPressFinalize(eventCopy);
            }, this.PRESS_DURATION);
            return status;
        } else {
            if (this.timerId) {
                return this._longPressCancel(event);
            } else {
                return (event.returnValue != null) ? event.returnValue : !event.defaultPrevented;
            }
        }
    },

    /**
     * LongPress move mgmt: gesture continues if only one touch and if the move is within margins.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _longPressMove : function (event) {
        var position = touchEvent.getPositions(event);
        if (this.MARGIN >= this._calculateDistance(this.startData.positions[0].x, this.startData.positions[0].y, position[0].x, position[0].y)) {
            var status = this._gestureMove(event);
            return (status == null) ? this._longPressCancel(event) : status;
        } else {
            return this._longPressCancel(event);
        }
    },

    /**
     * LongPress cancellation, occurs if wrong start or move (see above), or if an end event occurs before the end.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _longPressCancel : function (event) {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        return this._gestureCancel(event);
    },

    /**
     * LongPress finalization by firing the fake "longpress" event
     * @param {Object} event the original event
     * @protected
     */
    _longPressFinalize : function (event) {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        this._gestureEnd(event);
        this._raiseFakeEvent(event, this._getFakeEventsMap().finalize);
    }

});

module.exports.LongPress = LongPress;
},{"../klass":15,"./gesture":6,"./touchEvent":13}],9:[function(require,module,exports){
var klass = require("../klass");
var touchEvent = require("./touchEvent");
var Gesture = require("./gesture").Gesture;

var Pinch = klass({
    $extends : Gesture,

    /**
     * Defines the number of touch for the gesture.
     */
    NB_TOUCHES : 2,

    /**
     * Initial listeners for the Pinch gesture.
     * @protected
     */
    _getInitialListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchstart,
                    cb : this._pinchStart.bind(this)
                }];
    },

    /**
     * Additional listeners for the Pinch gesture.
     * @protected
     */
    _getAdditionalListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchmove,
                    cb : this._pinchMove.bind(this)
                }, {
                    evt : this.touchEventMap.touchend,
                    cb : this._pinchEnd.bind(this)
                }];
    },

    /**
     * The fake events raised during the Pinch lifecycle.
     * @protected
     */
    _getFakeEventsMap : function () {
        return {
            start : "pinchstart",
            move : "pinchmove",
            end : "pinch",
            cancel : "pinchcancel"
        };
    },

    /**
     * Pinch start mgmt: gesture is started if only two touches.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _pinchStart : function (event) {
        // Standard touch
        if (event.touches && event.touches.length >= 2) {
            var positions = touchEvent.getPositions(event);
            this.primaryPoint = positions[0];
            this.secondaryPoint = positions[1];
        }
        // IE10 primary touch
        else if (event.isPrimary) {
            this.primaryPoint = touchEvent.getPositions(event)[0];
        }
        // IE10 secondary touch
        else if (typeof event.isPrimary != 'undefined' && event.isPrimary === false) {
            this.secondaryPoint = touchEvent.getPositions(event)[0];
        }
        if (event.touches && event.touches.length >= 2 || typeof event.isPrimary != 'undefined'
                && event.isPrimary === false) {
            var dist = this._calculateDistance(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
            var angle = this.__calculateAngle(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
            this.initialPinchData = {
                distance : dist,
                dVariation : 0,
                angle : angle
            };
            this.lastKnownAngle = angle;
            return this._gestureStart(event, this.initialPinchData);
        } else {
            return (event.returnValue != null) ? event.returnValue : !event.defaultPrevented;
        }
    },

    /**
     * Pinch move mgmt: gesture continues if only two touches.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _pinchMove : function (event) {
        // Standard touch
        if (event.touches && event.touches.length >= 2) {
            var positions = touchEvent.getPositions(event);
            this.primaryPoint = positions[0];
            this.secondaryPoint = positions[1];
        }
        // IE 10 touch
        else if (typeof event.isPrimary != 'undefined') {
            if (event.isPrimary) {
                this.primaryPoint = touchEvent.getPositions(event);
            } else {
                this.secondaryPoint = touchEvent.getPositions(event);
            }
        } else {
            this.$raiseEvent({
                name : "pinchcancel"
            });
            return this._gestureCancel(event);
        }
        var currentDist = this._calculateDistance(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
        var currentAngle = this.__calculateAngle(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
        this.lastKnownAngle = currentAngle;
        var currentData = {
            distance : currentDist,
            dVariation : (currentDist - this.initialPinchData.distance),
            angle : currentAngle
        };
        return this._gestureMove(event, currentData);

    },

    /**
     * Pinch end mgmt: gesture ends if only two touches.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _pinchEnd : function (event) {
        // Standard touch
        if (event.touches && event.changedTouches
                && (event.changedTouches.length || 0) + (event.touches.length || 0) >= 2) {
            var positions = touchEvent.getPositions(event);
            this.primaryPoint = positions[0];
            this.secondaryPoint = positions[1];
        }
        // IE10 touch
        if (typeof event.isPrimary != 'undefined') {
            if (event.isPrimary) {
                this.primaryPoint = touchEvent.getPositions(event);
            } else {
                this.secondaryPoint = touchEvent.getPositions(event);
            }
        }
        if (event.touches && event.changedTouches
                && (event.changedTouches.length || 0) + (event.touches.length || 0) >= 2
                || typeof event.isPrimary != 'undefined') {
            var finalDist = this._calculateDistance(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
            var finalAngle = this.__calculateAngle(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
            if (Math.abs(finalAngle - this.lastKnownAngle) > 150) {
                finalAngle = this.__calculateAngle(this.secondaryPoint.x, this.secondaryPoint.y, this.primaryPoint.x, this.primaryPoint.y);
            }
            var finalData = {
                distance : finalDist,
                dVariation : (finalDist - this.initialPinchData.distance),
                angle : finalAngle
            };
            return this._gestureEnd(event, finalData);
        } else {
            return this._gestureCancel(event);
        }
    },

    /**
     * Returns the angle of the line defined by two points, and the x axes.
     * @param {Integer} x1 x of the first point
     * @param {Integer} y1 y of the first point
     * @param {Integer} x2 x of the second point
     * @param {Integer} y2 y of the second point
     * @private
     * @return {Number} the angle in degrees ]-180; 180]
     */
    __calculateAngle : function (x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    }

});

module.exports.Pinch = Pinch;
},{"../klass":15,"./gesture":6,"./touchEvent":13}],10:[function(require,module,exports){
var klass = require("../klass");
var touchEvent = require("./touchEvent");
var Gesture = require("./gesture").Gesture;

var SingleTap = klass({
    $extends : Gesture,

    /**
     * The move tolerance to validate the gesture.
     * @type Integer
     */
    MARGIN : 10,

    /**
     * The delay before validating the gesture, after the end event.
     * @type Integer
     */
    FINAL_DELAY : 250,

    /**
     * Initial listeners for the SingleTap gesture.
     * @protected
     */
    _getInitialListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchstart,
                    cb : this._singleTapStart.bind(this)
                }];
    },

    /**
     * Additional listeners for the SingleTap gesture.
     * @protected
     */
    _getAdditionalListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchmove,
                    cb : this._singleTapMove.bind(this)
                }, {
                    evt : this.touchEventMap.touchend,
                    cb : this._singleTapEnd.bind(this)
                }];
    },

    /**
     * The fake events raised during the SingleTap lifecycle.
     * @protected
     */
    _getFakeEventsMap : function () {
        return {
            start : "singletapstart",
            cancel : "singletapcancel",
            finalize : "singletap"
        };
    },

    /**
     * SingleTap start mgmt: gesture is started if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _singleTapStart : function (event) {
        if (this.timerId) {
            // Cancels the current gesture if a start event occurs during the FINAL_DELAY ms period.
            return this._singleTapFinalCancel(event);
        } else {
            var status = this._gestureStart(event);
            return (status == null)
                    ? (event.returnValue != null) ? event.returnValue : !event.defaultPrevented
                    : status;
        }
    },

    /**
     * singleTap move mgmt: gesture continues if only one touch and if the move is within margins.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _singleTapMove : function (event) {
        var position = touchEvent.getPositions(event);
        if (this.MARGIN >= this._calculateDistance(this.startData.positions[0].x, this.startData.positions[0].y, position[0].x, position[0].y)) {
            var status = this._gestureMove(event);
            return (status == null) ? this._singleTapCancel(event) : status;
        } else {
            return this._singleTapCancel(event);
        }
    },

    /**
     * SingleTap end mgmt: if only one touch, the gesture will be finalized FINAL_DELAY ms later, if no start event
     * in between.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _singleTapEnd : function (event) {
        var status = this._gestureEnd(event);
        if (status != null) {
            var _this = this;
            var eventCopy = {};
            for (var i in event) {
                eventCopy[i] = event[i];
            }
            this.timerId = setTimeout(function () {
                _this._singleTapFinalize(eventCopy);
            }, this.FINAL_DELAY);
            return status;
        } else {
            return this._singleTapCancel(event);
        }
    },

    /**
     * SingleTap cancellation.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _singleTapCancel : function (event) {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        return this._gestureCancel(event);
    },

    /**
     * SingleTap finalization by firing the fake "singletap" event
     * @param {Object} event the original event
     * @protected
     */
    _singleTapFinalize : function (event) {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        this._raiseFakeEvent(event, this._getFakeEventsMap().finalize);
    },

    /**
     * SingleTap cancellation outside the lifecycle window.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _singleTapFinalCancel : function (event) {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        return this._raiseFakeEvent(event, this._getFakeEventsMap().cancel);
    }

});

module.exports.SingleTap = SingleTap;
},{"../klass":15,"./gesture":6,"./touchEvent":13}],11:[function(require,module,exports){
var klass = require("../klass");
var touchEvent = require("./touchEvent");
var Gesture = require("./gesture").Gesture;

var Swipe = klass({
    $extends : Gesture,

    /**
     * The move tolerance to validate the gesture.
     * @type Integer
     */
    MARGIN : 20,

    /**
     * Initial listeners for the Swipe gesture.
     * @protected
     */
    _getInitialListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchstart,
                    cb : this._swipeStart.bind(this)
                }];
    },

    /**
     * Additional listeners for the Swipe gesture.
     * @protected
     */
    _getAdditionalListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchmove,
                    cb : this._swipeMove.bind(this)
                }, {
                    evt : this.touchEventMap.touchend,
                    cb : this._swipeEnd.bind(this)
                }];
    },

    /**
     * The fake events raised during the Swipe lifecycle.
     * @protected
     */
    _getFakeEventsMap : function () {
        return {
            start : "swipestart",
            move : "swipemove",
            end : "swipe",
            cancel : "swipecancel"
        };
    },

    /**
     * Swipe start mgmt: gesture is started if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _swipeStart : function (event) {
        var status = this._gestureStart(event);
        if (status != null) {
            return status;
        } else {
            return (event.returnValue != null) ? event.returnValue : !event.defaultPrevented;
        }

    },

    /**
     * Swipe move mgmt: gesture continues if only one touch and if the move is within margins.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _swipeMove : function (event) {
        var route = this._getRoute(this.startData.positions[0], touchEvent.getPositions(event)[0]);
        if (route) {
            var status = this._gestureMove(event, route);
            if (status != null) {
                return status;
            } else {
                return this._swipeCancel(event);
            }
        } else {
            return this._swipeCancel(event);
        }
    },

    /**
     * Swipe end mgmt: gesture ends if only one touch and if the end is within margins.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _swipeEnd : function (event) {
        var route = this._getRoute(this.startData.positions[0], touchEvent.getPositions(event)[0]);
        if (route) {
            var status = this._gestureEnd(event, route);
            if (status != null) {
                return status;
            } else {
                return this._swipeCancel(event);
            }
        } else {
            return this._swipeCancel(event);
        }
    },

    /**
     * SingleTap cancellation.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _swipeCancel : function (event) {
        return this._gestureCancel(event);
    },

    /**
     * Returns the direction and the distance of the swipe. Direction: left, right, up, down. Distance: positive
     * integer measured from touchstart and touchend. Will return false if the gesture is not a swipe.
     * @param {Object} startPosition contains the x,y position of the start of the gesture
     * @param {Object} startPosition contains the current x,y position of the gesture
     * @public
     * @return {Object} contains the direction and distance
     */
    _getRoute : function (startPosition, endPosition) {
        var directionX = endPosition.x - startPosition.x;
        var directionY = endPosition.y - startPosition.y;
        var absDirectionX = Math.abs(directionX);
        var absDirectionY = Math.abs(directionY);
        var vertical = ((absDirectionY >= absDirectionX) && (absDirectionX <= this.MARGIN));
        var horizontal = ((absDirectionX > absDirectionY) && (absDirectionY <= this.MARGIN));
        if (vertical) {
            return {
                "direction" : (directionY < 0) ? "up" : "down",
                "distance" : absDirectionY,
                "startX" : startPosition.x,
                "startY" : startPosition.y,
                "endX" : endPosition.x,
                "endY" : endPosition.y
            };
        }
        if (horizontal) {
            return {
                "direction" : (directionX < 0) ? "left" : "right",
                "distance" : absDirectionX,
                "startX" : startPosition.x,
                "startY" : startPosition.y,
                "endX" : endPosition.x,
                "endY" : endPosition.y
            };
        }
        return false;
    }

});

module.exports.Swipe = Swipe;
},{"../klass":15,"./gesture":6,"./touchEvent":13}],12:[function(require,module,exports){
var klass = require("../klass");
var touchEvent = require("./touchEvent");
var Gesture = require("./gesture").Gesture;

var Tap = klass({
    $extends : Gesture,

    /**
     * The move tolerance to validate the gesture.
     * @type Integer
     */
    MARGIN : 10,

    /**
     * Initial listeners for the Tap gesture.
     * @protected
     */
    _getInitialListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchstart,
                    cb : this._tapStart.bind(this)
                }];
    },

    /**
     * Additional listeners for the Tap gesture.
     * @protected
     */
    _getAdditionalListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchmove,
                    cb : this._tapMove.bind(this)
                }, {
                    evt : this.touchEventMap.touchend,
                    cb : this._tapEnd.bind(this)
                }];
    },

    /**
     * The fake events raised during the Tap lifecycle.
     * @protected
     */
    _getFakeEventsMap : function () {
        return {
            start : "tapstart",
            end : "tap",
            cancel : "tapcancel"
        };
    },

    /**
     * Tap start mgmt: gesture is started if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _tapStart : function (event) {
        var status = this._gestureStart(event);
        return (status == null)
                ? ((event.returnValue != null) ? event.returnValue : !event.defaultPrevented)
                : status;
    },

    /**
     * Tap move mgmt: gesture continues if only one touch and if the move is within margins.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _tapMove : function (event) {
        var position = touchEvent.getPositions(event);
        if (this.MARGIN >= this._calculateDistance(this.startData.positions[0].x, this.startData.positions[0].y, position[0].x, position[0].y)) {
            var status = this._gestureMove(event);
            return (status == null) ? this._gestureCancel(event) : status;
        } else {
            return this._gestureCancel(event);
        }
    },

    /**
     * Tap end mgmt: gesture ends if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _tapEnd : function (event) {
        var status = this._gestureEnd(event);
        return (status == null) ? this._gestureCancel(event) : (event.returnValue != null)
                ? event.returnValue
                : !event.defaultPrevented;
    }

});

module.exports.Tap = Tap;
},{"../klass":15,"./gesture":6,"./touchEvent":13}],13:[function(require,module,exports){
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
 * Event utility to handle touch device detection.
 * Taken from Aria Templates: https://github.com/ariatemplates/ariatemplates/blob/master/src/aria/touch/Event.js
 */
 
 
/**
 * Utility method to determine if the device is touch capable, if not the touch event properties are updated
 * with (legacy) mouse events.
 * @private
 */
function __touchDetection() {
    var map = {
        "touchstart" : "touchstart",
        "touchend" : "touchend",
        "touchmove" : "touchmove"
    };
    var touch = (('ontouchstart' in window) || window.DocumentTouch && window.document instanceof window.DocumentTouch);
    if (!touch) {
        map = {
            "touchstart" : "mousedown",
            "touchend" : "mouseup",
            "touchmove" : "mousemove"
        };
    }

    // IE10 special events
    if (window.navigator.msPointerEnabled) {
        map = {
            "touchstart" : "MSPointerDown",
            "touchend" : "MSPointerUp",
            "touchmove" : "MSPointerMove"
        };
    }
    return map;
}

/**
 * The event mapping, can be overwritten in __touchDetection() method.
 * @type Object
 */
var touchEventMap = exports.touchEventMap = __touchDetection();

/**
 * Utility method to get the coordinates of all touches of an event.
 * @param {Object} the event
 * @public
 * @return {Object} an array of coordinates
 */
exports.getPositions = function (event) {
    var result = [];
    if (event.touches && event.touches[0] || event.changedTouches && event.changedTouches[0]) {
        for (var i = 0; i < event.touches.length; i++) {
            result.push({
                x : (event.touches[i].pageX) ? event.touches[i].pageX : event.touches[i].clientX,
                y : (event.touches[i].pageY) ? event.touches[i].pageY : event.touches[i].clientY
            });
        }
        if (event.type == touchEventMap.touchend) {
            for (var i = 0; i < event.changedTouches.length; i++) {
                result.push({
                    x : (event.changedTouches[i].pageX)
                            ? event.changedTouches[i].pageX
                            : event.changedTouches[i].clientX,
                    y : (event.changedTouches[i].pageY)
                            ? event.changedTouches[i].pageY
                            : event.changedTouches[i].clientY
                });
            }
        }
    } else {
        result.push({
            x : (event.pageX) ? event.pageX : event.clientX,
            y : (event.pageY) ? event.pageY : event.clientY
        });
    }
    return result;
};

/**
 * Utility method to get the index of the finger triggering the event.
 * @param {Object} the event
 * @public
 * @return {Object} the index, starting from 0. Special case: 10n means that n fingers were used at the same
 * time.
 */
exports.getFingerIndex = function (event) {
    var result = 0;
    // IE10 case
    if (window.navigator.msPointerEnabled) {
        result = event.isPrimary ? 0 : 1;
    }
    // General case (webkit, firefox, opera, ...)
    else {
        if (event.touches || event.changedTouches) {
            if (event.changedTouches.length > 1) {
                result = 100 + event.changedTouches.length;
            } else if (event.type == touchEventMap.touchend) {
                result = event.touches.length + event.changedTouches.length - 1;
            } else {
                var changedX = (event.changedTouches[0].pageX)
                        ? event.changedTouches[0].pageX
                        : event.changedTouches[0].clientX;
                var changedY = (event.changedTouches[0].pageY)
                        ? event.changedTouches[0].pageY
                        : event.changedTouches[0].clientY;
                for (var i = 0; i < event.touches.length; i++) {
                    if (changedX == ((event.touches[i].pageX)
                            ? event.touches[i].pageX
                            : event.touches[i].clientX)
                            && changedY == ((event.touches[i].pageY)
                                    ? event.touches[i].pageY
                                    : event.touches[i].clientY)) {
                        result = i;
                        break;
                    }
                }
            }
        }
    }
    return result;
};

//Rest of the code taken from https://github.com/ariatemplates/ariatemplates/blob/master/src/aria/DomEvent.js

// Map of W3C/IE event properties
var eventMap = {
    "target" : "srcElement",
    "type" : "type",
    "clientX" : "clientX",
    "clientY" : "clientY",
    "altKey" : "altKey",
    "ctrlKey" : "ctrlKey",
    "shiftKey" : "shiftKey",
    "pageX" : "pageX",
    "pageY" : "pageY",
    "relatedTarget" : "relatedTarget",
    "button" : "button",
    "direction" : "direction",
    "distance" : "distance",
    "duration" : "duration",
    "startX" : "startX",
    "startY" : "startY",
    "endX" : "endX",
    "endY" : "endY",
    "detail" : "detail",
    "wheelDelta" : "wheelDelta",
    "wheelDeltaX" : "wheelDeltaX",
    "wheelDeltaY" : "wheelDeltaY",
    "screenX" : "screenX",
    "screenY" : "screenY",
    "touches" : "touches",
    "changedTouches" : "changedTouches",
    "targetTouches" : "targetTouches",
    "isPrimary" : "isPrimary"
};

// Map of special event types
var specialTypes = {
    focusin : "focus",
    focusout : "blur",
    dommousescroll : "mousewheel",
    webkitanimationstart : "animationstart",
    oanimationstart : "animationstart",
    msanimationstart : "animationstart",
    webkitanimationiteration : "animationiteration",
    oanimationiteration : "animationiteration",
    msanimationiteration : "animationiteration",
    webkitanimationend : "animationend",
    oanimationend : "animationend",
    msanimationend : "animationend",
    webkittransitionend : "transitionend",
    otransitionend : "transitionend",
    mstransitionend : "transitionend"
};

/**
 * Checks to see if the type requested is a special type (as defined by the specialTypes hash), and (if so) returns
 * @param {String} type The type to look up
 */
function getType(type) {
    type = type.toLowerCase();
    return specialTypes[type] || type;
}

/**
 * Returns an object with appropriate
 * @param {String} type
 * @param {HTMLElement} target
 */
exports.getFakeEvent = function(type, target) {
    var ua = window.navigator ? window.navigator.userAgent.toLowerCase() : "";
    var isGecko = ua.indexOf('gecko') > -1;
    var isIE8orLess = false;
    if (/msie[\/\s]((?:\d+\.?)+)/.test(ua)) {
        var version = RegExp.$1;
        var ieVersion = parseInt(version, 10);
        if (ieVersion >= 7) {
            var detectedIEVersion = window.document.documentMode || 7;
            if (detectedIEVersion != ieVersion) {
                ieVersion = detectedIEVersion ;
            }
        }
        isIE8orLess = ieVersion <= 8;
    }

    var fakeEvent = {};
    var evt = {
        type : type
    };
    

    // initialize the object property - cf. eventMap
    if (isIE8orLess && window.event) {

        evt = window.event;
        // create all object properties from the map
        for (var k in eventMap) {
            if (eventMap.hasOwnProperty(k)) {
                fakeEvent[k] = evt[eventMap[k]];
            }
        }
        if (evt.type == "mouseout") {
            fakeEvent.relatedTarget = evt["toElement"];
        } else if (evt.type == "mouseover") {
            fakeEvent.relatedTarget = evt["fromElement"];
        }
        // TODO: convert evt.button values (not the same in IE/Safari/FF)
    } else {
        // W3C event - duplicate event values
        for (var k in eventMap) {
            if (eventMap.hasOwnProperty(k)) {
                fakeEvent[k] = evt[k];
            }
        }
    }

    fakeEvent.type = getType(evt.type);
    // TODO keyCode / charCode should be homogenized between IE and other browsers
    // What must be implemented: (cf. http://www.quirksmode.org/js/keys.html)
    // keyCode=keyboard key code (e.g. 'A' and 'a' have the same key code: 65)
    // charCode=ASCII value of the resulting character (i.e. 'A'=65 'a'=97
    fakeEvent.charCode = 0;
    fakeEvent.keyCode = 0;
    if (fakeEvent.type == 'keydown' || fakeEvent.type == 'keyup') {
        fakeEvent.keyCode = evt.keyCode;
        fakeEvent.isSpecialKey = fakeEvent.isSpecialKey(this.keyCode, evt);
    } else if (fakeEvent.type == 'keypress') {
        // In case of a keypress event the "keycode"
        // is different from the keyup or keydown situation
        // We use keyCode OR charCode to calculate it
        var baseKeyCode = evt.keyCode || evt.charCode;

        /*
         * We need to calculate the corresponding keycode ... On gecko browsers, charcode is usually used and
         * has the same value as the non-gecko keycode version For special keys such as TAB, ENTER, DELETE,
         * BACKSPACE, ARROWS, function keys ... the evt.keycode is valid, should be used, without any offset
         * applied. So if evt.keyCode is defined on gecko browsers we have to skip applying an offset to the
         * keycode
         */
        var skipOffset = isGecko && evt.keyCode;
        fakeEvent.keyCode = baseKeyCode;

        if (!skipOffset) {

            // default
            fakeEvent.keyCode = baseKeyCode;

            // before 32 > strange chars
            // 32 > space, stays the same
            if (baseKeyCode > 32 && baseKeyCode < 38) {
                fakeEvent.keyCode = baseKeyCode + 16;
            }
            /*
             * if (baseKeyCode == 38) { this.keyCode = 55; } if (baseKeyCode == 39) { this.keyCode = 56; } if
             * (baseKeyCode == 40) { this.keyCode = 57; } if (baseKeyCode == 41) { this.keyCode = 48; }
             */
            if (baseKeyCode > 41 && baseKeyCode < 48) {
                // / to * range
                fakeEvent.keyCode = baseKeyCode + 64;
            }
            if (baseKeyCode > 47 && baseKeyCode < 58) {
                // 0 to 9 range
                fakeEvent.keyCode = baseKeyCode + 48;
            } /*
            * if (baseKeyCode == 58) { this.keyCode = 59; } // 59 > 59 if (baseKeyCode == 60) {
            * this.keyCode = 188; } if (baseKeyCode == 61) { this.keyCode = 107; } if (baseKeyCode == 62) {
            * this.keyCode = 190; } if (baseKeyCode == 62) { this.keyCode = 191; } if (baseKeyCode == 64) {
            * this.keyCode = 50; }
            */
            // 65 -> 90 A - Z

            if (baseKeyCode > 96 && baseKeyCode < 123) {
                // 'a' to 'z' range - transform to 65-90 range
                fakeEvent.keyCode = baseKeyCode - 32;
            }
        }
        fakeEvent.charCode = baseKeyCode;

        fakeEvent.isSpecialKey = fakeEvent.isSpecialKey(this.keyCode, evt);
    }

    /**
     * Stop propagation for this event. Should not be modified directly (use the stopPropagation method).
     * @type Boolean
     */
    fakeEvent.hasStopPropagation = false;

    /**
     * Prevent default for this event. Should not be modified directly (use the preventDefault method).
     * @type Boolean
     */
    fakeEvent.hasPreventDefault = false;

    /**
     * Cancel any default action associated with the event
     * @param {Boolean} stopPropagation tells if event propagation must also be stopped - default: false
     * @method
     */
    fakeEvent.preventDefault = !evt.preventDefault ? function (stopPropagation) {
        fakeEvent.hasPreventDefault = true;
        evt.returnValue = false;
        if (stopPropagation === true) {
            fakeEvent.stopPropagation();
        }
    } : function (stopPropagation) {
        fakeEvent.hasPreventDefault = true;
        evt.preventDefault();
        if (stopPropagation === true) {
            fakeEvent.stopPropagation();
        }
    };

    /**
     * Prevent the event from bubbling
     * @method
     */
    fakeEvent.stopPropagation = !evt.stopPropagation ? function () {
        fakeEvent.hasStopPropagation = true;
        evt.cancelBubble = true;
    } : function () {
        fakeEvent.hasStopPropagation = true;
        evt.stopPropagation();
    };

    /**
     * Needs to be here in order to access the closure variable 'evt'
     * @private
     */
    fakeEvent._dispose = function () {
        evt = null;
        fakeEvent.preventDefault = null;
        fakeEvent.stopPropagation = null;
    };

    fakeEvent.type = type;
    fakeEvent.target = target;
    return fakeEvent;
};
},{}],14:[function(require,module,exports){

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

},{}],15:[function(require,module,exports){

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
var klass = function (klassdef) {
    var $c = klassdef.$constructor;
    if (!$c) {
        // no constructor is provided - let's create one
        var ext = klassdef.$extends;
        if (ext) {
            $c = function () {
                ext.apply(this, arguments);
            };
        } else {
            $c = new Function();
        }
        klassdef.$constructor = $c;
    }
    if (klassdef.$extends) {
        // create the new prototype from the parent prototype
        if (!klassdef.$extends.prototype)
            throw new Error("[klass] $extends attribute must be a function");
        var p = createObject(klassdef.$extends.prototype);

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

// helper function used to create object
function F () {}

/**
 * Create an empty object that extend another object through prototype inheritance
 */
function createObject (o) {
    if (Object.create) {
        return Object.create(o);
    } else {
        F.prototype = o;
        return new F();
    }
}

klass.createObject = createObject;

var metaDataCounter = 0;
/**
 * Generate a unique meta-data prefix Can be used to store object-specific data into another object without much risk of
 * collision (i.e. provided that the object doesn't use properties with the "+XXXX:XXXXXXXX" pattern)
 */
function createMetaDataPrefix () {
    metaDataCounter++;
    return "+" + metaDataCounter + ":";
}
klass.createMetaDataPrefix = createMetaDataPrefix;

module.exports = klass;

},{}],16:[function(require,module,exports){

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
    $constructor : function (target) {
        this.id = 0; // optional id that can be set by the PropObserver user
        this.target = target;
        this.props = {}; // map of all properties to observe
        var self = this;

        // create the callback to assign to the target through json.observe
        this.callback = function (chglist) {
            PropObserver_notifyChanges.call(self, chglist);
        };
        json.observe(target, this.callback);
    },
    /**
     * Safely delete all internal dependencies Must be called before deleting the object
     */
    $dispose : function () {
        json.unobserve(this.target, this.callback);
        this.props=null;
        this.callback=null;
        this.target=null;
    },
    /**
     * Add a new observer for a given property
     * @param {object} observer object with a onPropChange() method
     * @param {string} property the property name to observe (optional)
     */
    addObserver : function (observer, property) {
        if (!property)
            property = ALL;
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
    rmObserver : function (observer, property) {
        if (!property)
            property = ALL;
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
                this.props[property]=null;
            }
        }
    }
});

/**
 * Notify the change to the registered observers i.e. call their onPropChange method with the change description as
 * parameter
 * @private
 */
function PropObserver_notifyChanges (chglist) {
    var c;
    for (var i = 0, sz = chglist.length; sz > i; i++) {
        c = chglist[i];
        if (!c)
            continue;
        // check if we listen to this property
        if (this.props[c.name]) {
            PropObserver_notifyChange(this, c, c.name);
        }
    }
    if (this.props[ALL]) {
        PropObserver_notifyChange(this, c, ALL);
    }
}

function PropObserver_notifyChange (po, chge, chgName) {
    var plist = po.props[chgName];

    for (var j = 0, sz2 = plist.length; sz2 > j; j++) {
        plist[j].onPropChange(chge);
    }
}

module.exports = PropObserver;

},{"./json":14,"./klass":15}],17:[function(require,module,exports){

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
var klass = require("./klass"),
    log = require("./rt/log"),
    $root = require("./rt/$root"),
    $RootNode = $root.$RootNode,
    $CptNode = $root.$CptNode,
    $CptAttElement = $root.$CptAttElement,
    cptwrapper = require("./rt/cptwrapper");


var NodeGenerator = klass({
    /**
     * NodeGenerator constructor
     * @param {Array|TNode} nodedefs tree root of node generators created by the template pre-processor
     */
    $constructor : function (nodedefs) {
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
     */
    process : function (tplctxt, scopevars, ctlWrapper, ctlInitArgs) {
        var vs = {}, nm, argNames = []; // array of argument names
        if (scopevars) {
            for (var i = 0, sz = scopevars.length; sz > i; i += 2) {
                nm = scopevars[i];
                vs[nm] = scopevars[i + 1]; // feed the vscope
                argNames.push(nm);
            }
        }
        vs["scope"] = vs; // self reference (used for variables - cf. expression handler)

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

var tplRefresh = []; // List of templates pending refresh
var tplTimeoutId = null; // Timer id to trigger refresh automatically

/**
 * Refresh method that automatically refreshes all templates that may haven been impacted by changes in data structures
 * This method is automatically triggered by a setTimeout and doesn't need to be explicitelly called
 */
var refresh = module.exports.refresh = function () {
    var t;
    if (tplTimeoutId) {
        clearTimeout(tplTimeoutId);
        tplTimeoutId = null;
    }
    while (t = tplRefresh.shift()) {
        t.refresh();
    }
};

var refreshTimeout = function () {
    tplTimeoutId = null;
    refresh();
};

/**
 * Add a template to the list of templates that must be refreshed when all changes are done in the data structures. This
 * is automatically called by the template $Root node (cf. TNode.onPropChange())
 */
refresh.addTemplate = function (tpl) {
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
 * @param {Function} contentFunction a function returning the structure of the template e.g. function(n) { return
 * [n.$text({e1:[0,0,"label"],e2:[1,0,"value"]},["",1,": ",2])] }
 */
module.exports.template = function (arg, contentFunction) {
    // closure variables
    var ng = new NodeGenerator(null), args = [], sz = 0, hasController = false, Ctl = null;
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

    var f = function () {
        var cw = null, cptInitArgs = null;
        if (!ng.nodedefs) {
            try {
                ng.nodedefs = contentFunction(nodes);
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
            cw=cptwrapper.createCptWrapper(Ctl, arguments.length>1? arguments[1] : null);
            args[1] = cw.cpt;
        } else {
            for (var i = 0; sz > i; i++) {
                args[1 + 2 * i] = arguments[i];
            }
        }
        if (arguments.length > 0) {
            cptInitArgs = arguments[0];
        }
        return ng.process(this, args, cw, cptInitArgs);
    };
    f.isTemplate = true;
    f.controllerConstructor = Ctl;
    return f;
};



/**
 * Collection of the node types supported by the NodeGenerator This collection is attached to the Nodegenerator
 * constructor through a nodes property
 */
var nodes = {};

var nodeList = [
    "$text", require("./rt/$text"),
    "$if", require("./rt/$if"),
    "$foreach", require("./rt/$foreach"),
    "elt", require("./rt/eltnode"),
    "cpt", $CptNode,
    "catt", $CptAttElement,
    "log", require("./rt/$log"),
    "let", require("./rt/$let")
];

for (var i = 0, sz = nodeList.length; sz > i; i += 2) {
    createShortcut(nodeList[i], nodeList[i + 1]);
}

/**
 * Create shortcut functions on the nodes collection to simplify the template functions e.g. nodes.$text=function(exps,
 * textcfg) {return new $TextNode(exps, textcfg);}
 */
function createShortcut (tagName, tagConstructor) {
    nodes[tagName] = function (a1, a2, a3, a4, a5, a6) {
        return new tagConstructor(a1, a2, a3, a4, a5, a6);
    };
}

},{"./es5":3,"./klass":15,"./rt/$foreach":18,"./rt/$if":19,"./rt/$let":20,"./rt/$log":21,"./rt/$root":22,"./rt/$text":23,"./rt/cptwrapper":27,"./rt/eltnode":28,"./rt/log":30}],18:[function(require,module,exports){

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
var klass = require("../klass"),
    log = require("./log"),
    doc = require("../document"),
    json = require("../json"),
    tnode = require("./tnode"),
    TNode = tnode.TNode;

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
    $extends : TNode,

    /**
     * ForEach node contstructor
     * @param {Map<Expression>|int} exps the map of the variables used by the node. 0 is passed if no expression is
     * used
     * @param {String} itemName the name of the item variable that should be created
     * @param {String} itemKeyName the name of the item key that should be used
     * @param {Number} colExpIdx the index of the expression of the collection over which the statement must iterate
     * @param {Array} children list of sub-node generators - 0 may be passed if there is not child nodes
     */
    $constructor : function (exps, itemKeyName, itemName, forType, colExpIdx, children) {
        this.isDOMless = true;
        this.itemName = itemName;
        this.itemKeyName = itemKeyName;
        this.forType = 0; // 0=in / 1=of / 2=on
        this.colExpIdx = colExpIdx;

        TNode.$constructor.call(this, exps, true);
        this.displayedCol = null; // displayed collection

        this.itemNode = new $ItemNode(children, itemName, itemKeyName); // will be used as generator for each childNode
                                                                        // instance
    },

    $dispose : function () {
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
    createNodeInstance : function (parent) {
        var ni = TNode.createNodeInstance.call(this, parent);
        ni.TYPE = "# foreach"; // for debugging purposes
        var nd = ni.node; // same as parent node in this case
        ni.node1 = doc.createComment("# foreach");
        ni.node2 = doc.createComment("# /foreach");
        nd.appendChild(ni.node1);

        var col = ni.eh.getValue(ni.colExpIdx, ni.vscope, null); // collection or array
        ni.createChildNodeInstances(col, nd);

        nd.appendChild(ni.node2);
        return ni;
    },

    createChildNodeInstances : function (col, node) {
        var cn, forType = this.forType, itemNode = this.itemNode;
        if (col) {
            // create an observer on the collection to be notified of the changes (cf. refresh)
            this.displayedCol = col;

            this.childNodes = cn = [];
            if (forType === 0 && col.constructor !== Array) {
                forType = 1; // "in" can only be used on arrays as iterates with integer indexes
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
                log.warning("[# foreach] Invalid iteration type: "+forType);
            }
        }
    },

    /**
     * Refresh the foreach nodes Check if the collection has changed - or i
     */
    refresh : function () {
        if (this.adirty) {
            // the collection has changed - let's compare the items in the DOM to the new collection
            var col = this.eh.getValue(this.colExpIdx, this.vscope, null); // collection or array

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

                // TODO delete and recreate foreach items on a doc fragment
                // Note: updateCollection could be used as well in this case - but when the whole collection
                // is changed, it is likely that all items are different - and as such the creation
                // through the doc fragment is faster
            } else {
                // collection is the same but some items have been deleted or created
                this.updateCollection(col);
            }
        }
        TNode.refresh.call(this); // refresh the child nodes if needed
    },

    /**
     * Update the DOM of the displayed collection to match the target collection passed as argument
     * @param {Array} target the target collection
     */
    updateCollection : function (target) {
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
                i -= 1; // as item has been removed we need to shift back - otherwise we will skip the next item
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
    deleteItem : function (idx, startIdx, resyncNextItems) {
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
    deleteAllItems : function () {
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
                    i -= 1; // removeChild has shift next item by one
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
    moveItem : function (idx, newIdx, startIdx, resyncItems) {
        var cn = this.childNodes, sz = cn.length, ch;
        if (idx === newIdx || idx > sz - 1 || newIdx > sz - 1)
            return; // invalid cases

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
    createItem : function (colItem, idx, isfirst, islast, parentDOMNode) {
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
    resyncItemScopes : function (startIdx, maxIdx) {
        var sz = this.childNodes.length;
        if (!startIdx)
            startIdx = 0;
        if (maxIdx === undefined)
            maxIdx = sz - 1;
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
    toString:function() {
        return "[Foreach]"; // todo add collection description
    }

});

/**
 * Pseudo node acting as a container for each item element
 */
var $ItemNode = klass({
    $extends : TNode,

    /**
     * ForEach Item node constructor This is a domless node that groups all the tnodes associated to a foreach item
     * @param {Array<TNodes>} the child node generators
     * @param {String} itemName the name of the item variable used in the scope
     */
    $constructor : function (children, itemName, itemKeyName) {
        TNode.$constructor.call(this, 0);
        this.isDOMless = true;
        this.itemName = itemName;
        this.itemKeyName = itemKeyName;
        if (children && children !== 0) {
            this.children = children;
        }
        this.detachedNodes = null; // Array of nodes that have been detached
    },

    /**
     * Remove DOM dependencies prior to instance deletion
     */
    $dispose : function () {
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
    createNodeInstance : function (parent, item, key, isfirst, islast, parentDOMNode) {
        var vs = this.createSubScope(parent.vscope), itnm = this.itemName;
        vs[itnm] = item;
        vs[this.itemKeyName] = key;
        vs[itnm + "_isfirst"] = isfirst;
        vs[itnm + "_islast"] = islast;

        var ni = TNode.createNodeInstance.call(this, parent);
        ni.TYPE = "# item"; // for debugging purposes
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
    detachDOMNodes : function (startIdx) {
        if (!startIdx)
            startIdx = 0;
        var res = startIdx;
        if (!this.node.childNodes) {
            return res;
        }
        var node = this.node, isInBlock = false, res, ch, sz = node.childNodes.length, n1 = this.node1, n2 = this.node2;
        if (this.detachedNodes)
            return; // already detached
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
                i -= 1; // removeChild has shift next item by one

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
    attachDOMNodesBefore : function (node) {
        if (this.detachedNodes) {
            var dn = this.detachedNodes, sz = dn.length;
            if (!node || !this.detachedNodes)
                return;

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
    updateScope : function (key, isfirst, islast) {
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
    toString:function() {
        return "[Foreach item]"; // todo add index
    }

});

module.exports = $ForEachNode;

},{"../document":2,"../json":14,"../klass":15,"./log":30,"./tnode":31}],19:[function(require,module,exports){

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
var klass = require("../klass"),
    doc = require("../document"),
    tnode = require("./tnode"),
    TNode = tnode.TNode;

/**
 * If node Implements the if conditional statement. Adds a children2 collection that corresponds to the else block
 */
var $IfNode = klass({
    $extends : TNode,

    /**
     * IfNode generator
     * @param {Map<Expression>|int} exps the map of the variables used by the node. 0 is passed if no expression is
     * used
     * @param {Integer} condexp the index of the condition expression - e.g. 1
     * @param {Array} children list of sub-node generators - 0 may be passed if there is not child nodes
     * @param {Array} children2 list of sub-node generators for the else statemetn - 0 may be passed if there is not
     * child nodes
     */
    $constructor : function (exps, condexp, children, children2) {
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
    createNodeInstance : function (parent) {
        var ni = TNode.createNodeInstance.call(this, parent);
        var nd = ni.node; // same as parent node in this case
        ni.TYPE = "# if"; // for debugging purposes
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
    createChildNodeInstances : function (condition) {
        this.lastConditionValue = condition;
        if (!this.refScope) {
            this.refScope=this.vscope; // reference scope - may be different from parent for component content
        }

        if (!this.isDOMempty) {
            this.removeChildNodeInstances(this.node1,this.node2);
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
                this.node = df; // use a doc fragment to create the new node instead of the parent node
                for (var i = 0; sz > i; i++) {
                    n = ch[i].createNodeInstance(this);
                    this.childNodes.push(n);
                }
                this.replaceNodeBy(this.node, this.parent.node); // recursively remove doc fragment reference
                this.node.insertBefore(df, this.node2);
                this.isDOMempty = false;
            }
        }

    },

    /**
     * Processes the current condition value
     */
    getConditionValue : function () {
        var condition = false;
        if (this.eh)
            condition = this.eh.getValue(this.condexpidx, this.vscope, false);
        return condition ? true : false; // cast to a boolean to be able to compare new and old confition values
    },

    /**
     * Refresh the node If the if condition has changed, delete previous child nodes and create those corresponding to
     * the else statement. Otherwise performs the regular recursive refresh
     */
    refresh : function () {
        var cond = this.getConditionValue(), ch;
        if (cond !== this.lastConditionValue) {
            this.createChildNodeInstances(cond);
            this.root.updateObjectObservers(this);

            this.cdirty = false;

            // check if one child is dirty
            if (this.childNodes) {
                for (var i=0;this.childNodes.length>i;i++) {
                    ch=this.childNodes[i];
                    if (ch.adirty || ch.cdirty) {
                        this.cdirty=true;
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
        var t1=this.getCptContentType(this.children), t2=this.getCptContentType(this.children2);
        if (t1==="ERROR" || t2==="ERROR") {
            return "ERROR";
        }
        if (t1==="ATTELT") {
            if (t2==="CONTENT") {
                return "ERROR";
            } else {
                // t2 is either ATTELT or INDEFINITE
                return "ATTELT";
            }
        } else if (t1==="CONTENT") {
            if (t2==="ATTELT") {
                return "ERROR";
            } else {
                // t2 is either CONTENT or INDEFINITE
                return "CONTENT";
            }
        } else if (t1==="INDEFINITE") {
            return t2;
        }
    },

    /**
    * Helper function used to give contextual error information
    * @return {String} - e.g. "[Component attribute element: @body]"
    */
    toString:function() {
        return "[If]"; // todo add condition description or parent component name
    }
});

module.exports = $IfNode;
},{"../document":2,"../klass":15,"./tnode":31}],20:[function(require,module,exports){

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
var klass = require("../klass"),
    $set = require("../$set"),
    doc = require("../document"),
    TNode = require("./tnode").TNode;

var LetNode = klass({
    $extends : TNode,

    /**
     * Log node generator ex: {log scope}
     * @param {Map<Expression>|int} exps the map of the variables used by the node. 
     *      0 is passed if no expression is used
     * @param {Array} args array of the variable name, expression index associated to this statement
     *      e.g. ['aVarName',1,'anotherName',2]
     */
    $constructor : function (exps, args) {
        TNode.$constructor.call(this, exps);
        this.args = args;
    },

    /**
     * Create the DOM node element and attach it to the parent
     */
    createNode : function () {
        this.node = doc.createComment("{let}");
        this.updateScope();
    },

    /**
     * Observer callback called when one of the bound variables used by the node expressions changes
     */
    onPropChange : function (chge) {
        // update scope variables
        this.updateScope();
        TNode.onPropChange.call(this, chge);
    },

    /**
     * Process the information to be logged and push it to the log output (browser console by default)
     */
    updateScope : function () {
        var args=this.args, eh=this.eh, v;
        if (args) {
            for (var i=0, sz=args.length;sz>i;i+=2) {
                v=eh.getValue(args[i+1], this.vscope, undefined);
                $set(this.vscope,args[i],v);
            }
        }
    }
});


module.exports=LetNode;


},{"../$set":1,"../document":2,"../klass":15,"./tnode":31}],21:[function(require,module,exports){

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
var klass = require("../klass"),
    log = require("./log"),
    doc = require("../document"),
    TNode = require("./tnode").TNode;

var LogNode = klass({
    $extends : TNode,

    /**
     * Log node generator ex: {log scope}
     * @param {Map<Expression>|int} exps the map of the variables used by the node. 
     *      0 is passed if no expression is used
     * @param {Array} args array of the expression indexes to log in the log queue
     * @param {Integer} line the line number
     * @param {Integer} column the column number
     */
    $constructor : function (exps, args, file, dir, line, column) {
        TNode.$constructor.call(this, exps);
        this.file='';
        var r=file.match(/[^\/\\]+$/);
        if (r && r.length) {
            this.file=r[0];
        }
        this.dir=dir;
        this.line=line;
        this.column=column;
        this.args = args;
    },

    /**
     * Create the DOM node element and attach it to the parent
     */
    createNode : function () {
        this.node = doc.createComment("{log}");
        this.processLog();
    },

    /**
     * Process the information to be logged and push it to the log output (browser console by default)
     */
    processLog : function () {
        var itms=[], args=this.args, eh=this.eh, v;
        if (this.args) {
            for (var i=0, sz=args.length;sz>i;i++) {
                v=eh.getValue(args[i], this.vscope, undefined);
                itms.push(v);
            }
            itms.push({type:'debug',file:this.file,dir:this.dir,line:this.line,column:this.column});
            log.apply(null,itms);
        }
    },

    /**
     * Refresh the text node if its properties have changed
     */
    refresh : function () {
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
        return "CONTENT"; // TODO could be INDEFINITE but must be validated first
    }
});


module.exports=LogNode;


},{"../document":2,"../klass":15,"./log":30,"./tnode":31}],22:[function(require,module,exports){

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
var klass = require("../klass"),
    log = require("./log"),
    doc = require("../document"),
    json = require("../json"),
    PropObserver = require("../propobserver"),
    tn = require("./tnode"),
    TNode = tn.TNode,
    cptComponent=require("./cptcomponent");

var CPT_TYPES={
    '$CptAttInsert':require("./cptattinsert").$CptAttInsert,
    '$CptComponent':cptComponent.$CptComponent,
    '$CptTemplate':require("./cpttemplate").$CptTemplate
};

var DOCUMENT_FRAGMENT_NODE = 11;

/**
 * Root node - created at the root of each template 
 * Contains the listeners requested by the child nodes 
 * Is replaced by the $CptNode (child class) when the template is inserted in another template
 */
var $RootNode = klass({
    $extends : TNode,

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
    $constructor : function (vscope, nodedefs, argnames, ctlWrapper, ctlInitAtts) {
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
    init : function (vscope, nodedefs, argnames, ctlWrapper, ctlInitAtts) {
        var cw;
        this.vscope = vscope;
        if (ctlWrapper) {
            // attach the controller objects to the node
            this.ctlWrapper = cw = ctlWrapper;
            this.controller = ctlWrapper.cpt;

            // init controller attributes
            this.ctlWrapper.root=this;
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
            cw.refresh(); // first refresh
        }
        this.childNodes = ch;
        this.argNames = argnames;
    },

    $dispose : function () {
        // dispose all property observers
        var o;
        for (var i = 0, sz = this.propObs.length; sz > i; i++) {
            o = this.propObs[i];
            delete o.target[this.MD_ID]; // remove the MD marker
            o.$dispose();
        }
        this.propObs=null;
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
    createExpressionObservers : function (ni,scope) {
        var vs = scope? scope : ni.vscope, eh = ni.eh, op, sz;
        if (!eh)
            return; // no expression is associated to this node
        for (var k in eh.exps) {
            op = eh.exps[k].getObservablePairs(eh, vs);
            if (!op)
                continue;
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
    createObjectObserver : function (ni, obj, prop) {
        var oid = obj[this.MD_ID], obs; // observer id
        if (oid) {
            // observer already exists
            obs = this.propObs[oid - 1];
        } else {
            // observer doesn't exist yet
            obs = new PropObserver(obj);
            var sz = this.propObs.length;
            this.propObs[sz] = obs;
            obs.id = oid = sz + 1; // so that it doesn't start at 0
            obj[this.MD_ID] = oid;
        }
        obs.addObserver(ni, prop); // observe all properties
    },

    /**
     * Remove a PropObserver previously created with createObjectObserver
     * @param {TNode} ni the node instance that should be notified of the changes (i.e. the observer)
     * @param {Object} obj the object holding the property
     * @param {String} prop the property name (optional)
     */
    rmObjectObserver : function (ni, obj, prop) {
        var oid = obj[this.MD_ID]; // observer id
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
    rmAllObjectObservers : function (ni) {
        var op=ni.obsPairs;
        if (op) {
            for (var i = 0, sz=op.length; sz > i; i++) {
                // remove previous
                this.rmObjectObserver(ni, op[i][0], op[i][1]);
            }
            ni.obsPairs=null;
        }
    },

    /**
     * Update the object observers associated to a node instance
     * @param {TNode} ni the node instance that contained the changes
     */
    updateObjectObservers : function (ni) {
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
    updateArgument : function (argidx, argvalue) {
        json.set(this.vscope["scope"], this.argNames[argidx], argvalue);
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
    render : function (domElt, replace) {
        var c = domElt; // container
        if (typeof(c) === "string") {
            c = doc.getElementById(c);
            if (c === null) {
                log.error("[hashspace] Template cannot be rendered - Invalid element id: "+domElt);
                return this;
            }
        } else if (!c || !c.appendChild) {
            log.error("[hashspace] Template cannot be rendered - Invalid element: "+domElt);
            return this;
        }
        var df = this.node; // should be a doc fragment
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
        this._triggersAfterRender(this);
        return this;
    },

    /**
     * Recursively triggers the $afterRender method in all controllers of the TNode root and its children.
     * @param {TNode} the root
     */
    _triggersAfterRender:function (tnode) {
        if (tnode.childNodes && tnode.childNodes.length > 0) {
            for (var i = 0; i < tnode.childNodes.length; i++) {
                this._triggersAfterRender(tnode.childNodes[i]);
            }
        }
        if (tnode.controller && tnode.controller.$afterRender) {
            tnode.controller.$afterRender();
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
var getObject = exports.getObject = function (path, scope) {
    var root = path[0], o = null, sz = path.length;

    if (root === undefined || root === null || typeof(root)==='string') {
        if (scope && sz > 1) {
            o = scope[path[1]];
        }
        if (o === undefined || o === null) {
            return null;
        }
    } else {
        // scope has priority over the global scope
        if (scope && sz>1) {
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
    $extends : $RootNode,

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
    $constructor : function (tplPath, exps, attcfg, ehcfg, children) {
        this.pathInfo=tplPath.slice(1).join("."); // debugging info
        this.info="[Component: #"+this.pathInfo+"]"; // debug info
        this.isCptNode = true;
        this.attEltNodes = null; // array of element nodes - used to trigger a refresh when elt content changes
        this.tplPath = tplPath;
        this.isInsertNode = true; // to ensure $RootNode is creating expression listeners
        this.isDOMless = true;
        this.exps = exps; // used by the $RootNode constructor
        this.attcfg = attcfg;
        $RootNode.$constructor.call(this);
        this.createAttList(attcfg, ehcfg);
        this.controller = null; // different for each instance
        this.ctlAttributes = null;// reference to the controller attributes definition - if any
        this._scopeChgeCb = null; // used by component w/o any controller to observe the template scope
        this.template = null; // reference to the template object (used by component and templates)
        if (children && children !== 0) {
            this.children = children;
        }
    },

    $dispose:function() {
        this.cleanObjectProperties();
    },

    cleanObjectProperties : function () {
        this.removePathObservers();
        if (this._scopeChgeCb) {
            json.unobserve(this.vscope, this._scopeChgeCb);
            this._scopeChgeCb = null;
        }
        $RootNode.$dispose.call(this);
        this.exps = null;
        this.controller = null;
        this.ctlAttributes = null;
        this.template = null;
        if (this.node1) {
            this.node1=null;
            this.node2=null;
        }
    },

    /**
     * Create a node instance referencing the current node as base class As the $CptNode is DOMless it will not create a
     * DOM node for itself - but will create nodes for its children instead (through the $RootNode of the template
     * process function)
     * @return {TNode} the new node instance
     */
    createNodeInstance : function (parent) {
      var ni=null, vscope=parent.vscope, tp=this.tplPath;

      // determine the type of this component: 
      // - either a template - e.g. <#mytemplate foo="bar"/> 
      //   -> instance will extend $CptTemplate
      // - a component with controller - e.g. <#mycpt foo="bar"/>
      //   -> instance will extend $CptComponent
      // - or a attribute element insertion - e.g. <#c.body/>
      //   -> instance will extend $CptAttInsert

      // get the object referenced by the cpt path
      var obj = getObject(tp, vscope);

      // if object is a function this is a template or a component insertion
      if (obj && typeof(obj) === 'function') {
        this.template=obj;

        if (obj.controllerConstructor) {
          // template uses a controller
          ni=this.createCptInstance("$CptComponent",parent);
        } else {
          ni=this.createCptInstance("$CptTemplate",parent);
        }
        ni.initCpt({template:obj,ctlConstuctor:obj.controllerConstructor});
      } else if (obj) {
        if (obj.isCptAttElement) {
          // insert attribute component 
          ni=this.createCptInstance("$CptAttInsert",parent);
          ni.initCpt(obj);
        }
      }

      if (!ni) {
          log.error(this.info+" Invalid component reference");
          // create an element to avoid generating other errors
          ni=this.createCptInstance("$CptAttInsert",parent);
      }
      return ni;
    },

    /**
     * Create and return an instance node associated to the component type passed as argument
     * The method dynamically creates a specialized $CptNode object that will be used as prototype
     * of the instance node - this allows to avoid mixing methods and keep code clear
     * @param cptType {string} one of the following: $CptAttInsert / $CptAttElement / $CptComponent / $CptTemplate
     */
    createCptInstance:function(cptType,parent) {
        if (!this.cptTypes) {
            this.cptTypes={};
        }
        var ct=this.cptTypes[cptType];
        if (!ct) {
            // build the new type
            var proto1=CPT_TYPES[cptType];
            var proto2 = klass.createObject(this);
            for (var k in proto1) {
                if (proto1.hasOwnProperty(k)) {
                    proto2[k]=proto1[k];
                }
            }

            ct=proto2;
            this.cptTypes[cptType]=ct;
        }

        // create node instance
        var ni=klass.createObject(ct);
        ni.vscope = parent.vscope; // we don't create new named variable in vscope, so we use the same vscope
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
    createCommentBoundaries:function(comment) {
        var nd=this.node;
        this.node1 = doc.createComment("# "+comment+" "+this.pathInfo);
        this.node2 = doc.createComment("# /"+comment+" "+this.pathInfo);
        nd.appendChild(this.node1);
        nd.appendChild(this.node2);
    },
    
    /**
     * Callback called when a controller attribute or a template attribute has changed
     */
    onAttributeChange : function (change) {
        var expIdx = -1;
        // set the new attribute value in the parent vscope to propagate change
        var cfg = this.attcfg[change.name]; // change.name is the property name
        if (cfg && cfg.constructor === Array && cfg.length === 2 && cfg[0] === "") {
            // cfg is a text concatenation with an empty prefix - so 2nd element is the expression index
            expIdx = cfg[1];
        }

        if (expIdx > -1) {
            var exp = this.eh.getExpr(expIdx), pvs=this.parent.vscope;
            if (exp.bound && exp.setValue) {
                var cv=exp.getValue(pvs,this.eh);
                if (cv!==change.newValue) {
                    // if current value is different, we update it on the scope object that owns it
                    var vs=this.parent.getScopeOwner(exp.path[0],pvs);
                    exp.setValue(vs, change.newValue);
                }
            }
        }
    },

    /**
     * Refresh the sub-template arguments and the child nodes, if needed
     */
    refresh : function () {
        if (this.adirty) {
            // one of the component attribute has been changed - we need to propagate the change
            // to the template controller

            // check first if template changed
            var tplChanged=false;
            if (this.template) {
                var tpl=getObject(this.tplPath, this.parent.vscope);
                tplChanged = (tpl!==this.template);
            } else if (this.cptAttElement) {
                // check if the cptattinsert path has changed
                var o=getObject(this.tplPath, this.parent.vscope);
                if (o.isCptAttElement && o!==this.cptAttElement) {
                    // change the the cptAttElement and refresh the DOM
                    this.createChildNodeInstances(o);
                }
            }

            if (tplChanged) {
                this.template=tpl;
                this.createChildNodeInstances();
            } else {
                if (this.refreshAttributes) {
                    this.refreshAttributes();
                    // for component and sub-templates the original vscope is substituted 
                    // to the one of the component- or sub-template
                    // so we need to revert to the parent scope to observe the correct objects
                    var vs=this.vscope;
                    this.vscope=this.parent.vscope;
                    this.root.updateObjectObservers(this);
                    this.vscope=vs;
                }
            }
            this.adirty = false;
        }
        TNode.refresh.call(this);
    },

    /**
     * Return the objects referenced by the path - return null if the path is not observable
     */
    getPathObjects : function() {
        var tp=this.tplPath, o, ps=this.parent.vscope, isType0String=(typeof(tp[0])==='string');

        if (ps[tp[1]]) {
            // tp[1] exists in the scope - so it has priority
            o=this.getScopeOwner(tp[1],ps);
        } else if (tp[0]===undefined || tp[0]===null || isType0String) {
            if (isType0String) {
                // we have to find the right scope object holding this property
                o=this.getScopeOwner(tp[0],ps);
                if (o===null) {
                    // property doesn't exist yet
                    o=ps;
                }
            } else {
                o=ps;
            }
        }
        if (o) {
            var sz=tp.length, res=[];
            res.push(o);

            for (var i=1;sz>i;i++) {
                o=o[tp[i]];
                if (o===undefined || o===null) {
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
    createPathObservers : function() {
        var pos=this.getPathObjects();
        if (!pos || !pos.length) {
            return false;
        }
        var sz=pos.length;

        this._pathChgeCb = this.onPathChange.bind(this);
    
        for (var i=0;sz>i;i++) {
            json.observe(pos[i], this._pathChgeCb);
        }
        this._observedPathObjects=pos;
        return true;
    },

    /**
     * Remove path observers created through createPathObservers()
     */
    removePathObservers : function() {
        var pos=this._observedPathObjects;
        if (pos && pos.length) {
            for (var i=0,sz=pos.length;sz>i;i++) {
                json.unobserve(pos[i], this._pathChgeCb);
            }
            this._observedPathObjects=null;
        }
        this._pathChgeCb = null;
    },

    /**
     * Callback called when one of the object of the template path changes
     */
    onPathChange : function() {
        // Warning: this method may be called even if the object referenced by the path didn't change
        // because we observe all the properties of the object on the path - so we need to detect
        // first if one of the objects on the path really changed
        if (!this.parent && !this.root) {
            return; // object has been disposed, but notification callback is still in the call stack
        }
        var pos = this.getPathObjects(), opos=this._observedPathObjects;
        var sz = pos? pos.length : -1;
        var osz = opos? opos.length : -1;
        var changed=false;
        if (sz===osz && sz!==-1) {
            // compare arrays
            for (var i=0;sz>i;i++) {
                if (pos[i]!==opos[i]) {
                    changed=true;
                    break;
                }
            }
        } else if (sz!==-1) {
            changed=true;
        }
        if (changed) {
            this.removePathObservers();
            this.createPathObservers();
            this.onPropChange(); // set node dirty
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
    $extends : $CptNode,
    isCptAttElement : true,

    /**
     * $CptAttElement generator 
     */
    $constructor : function (name, exps, attcfg, ehcfg, children) {
        this.name = name;
        this.info = "[Component attribute element: @"+this.name+"]";
        this.tagName = "@"+name;
        $CptNode.$constructor.call(this,[null,name], exps, attcfg, ehcfg, children);
        this.isCptAttElement=true;
    },

    $dispose:function() {
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

    createNodeInstance : function (parent) {
        var ni;
        // identify this node as a component attribute

        // find parent to check attribute is not used outside any component
        var p=parent, found=false;
        while (p) {
            if (p.isCptComponent) {
                found=true;
                var eltDef=null, attDef=null;
                if (p.ctlElements) {
                    eltDef=p.ctlElements[this.name];
                }
                if (p.ctlAttributes) {
                    attDef=p.ctlAttributes[this.name];
                }
                
                if (!eltDef && !attDef) {
                    // invalid elt
                    log.error(this.info+" Element not supported by its parent component");
                } else if (eltDef) {
                    var type=eltDef.type;
                    if (type==="template") {
                        ni=TNode.createNodeInstance.call(this,parent);
                    } else if (type==="component") {
                        if (!eltDef.controller) {
                            log.error(this.info+" Controller property is mandatory for component elements");
                        } else {
                            // this element is a sub-component - let's create its controller
                            ni=this.createCptInstance("$CptComponent",parent);
                            ni.initCpt({cptattelement:ni,ctlConstuctor:eltDef.controller,parentCtrl:p.controller});
                        }
                    } else {
                        log.error(this.info+" Invalid component element type: "+eltDef.type);
                    }
                } else if (attDef) {
                    if (attDef.type==="template") {
                        ni=TNode.createNodeInstance.call(this,parent);
                    }
                }
                p=null;
            } else {
                p=p.parent;
            }
        }
        if (!found) {
            log.error(this.info+" Attribute elements cannot be used outside components");
        }
        return ni;
    },

    /**
     * Register the element in the list passed as argument
     * This allows for the component to dynamically rebuild the list of its attribute elements
     */
    registerAttElements:function (attElts) {
        attElts.push(this);
    },

    /**
     * Return the template node that must be inserted by $CptAttInsert
     */
    getTemplateNode:function() {
        return new $RootNode(this.vscope, this.children);
    }
});

cptComponent.setDependency("$CptNode",$CptNode);
cptComponent.setDependency("TNode",TNode);
cptComponent.setDependency("$CptAttElement",$CptAttElement);
exports.$RootNode = $RootNode;
exports.$CptNode = $CptNode;
exports.$CptAttElement = $CptAttElement;


},{"../document":2,"../json":14,"../klass":15,"../propobserver":16,"./cptattinsert":24,"./cptcomponent":25,"./cpttemplate":26,"./log":30,"./tnode":31}],23:[function(require,module,exports){

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
var klass = require("../klass"),
    doc = require("../document"),
    TNode = require("./tnode").TNode,
    TExpAtt = require("./tnode").TExpAtt;

var $TextNode = klass({
    $extends : TNode,

    /**
     * Text node generator ex: Hello {person.name}!
     * @param {Map<Expression>|int} exps the map of the variables used by the node. 0 is passed if no expression is
     * used
     * @param {Array} textcfg array of the different text chunks that compose the text node e.g. ["Hello ",0,"!"] odd
     * elements are text fragments and even element are variable ids corresponding to t
     */
    $constructor : function (exps, textcfg) {
        TNode.$constructor.call(this, exps);

        this.textcfg = textcfg;
        this.isEmptyTextNode = false;
        if (this.isStatic) {
            // ensure textcfg is not null
            if (!textcfg) {
                this.textcfg = [""];
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
    createNode : function () {
        this.node = doc.createTextNode(this.getContent());
    },

    /**
     * Calculates the text content: resolve all variables and concatenate the cfg values
     * @return {string} the text content associated to the node
     */
    getContent : function () {
        var tcfg = this.textcfg;
        if (this.isStatic)
            return tcfg[0]; // return fast on simple case
        else {
            return TExpAtt.getValue.call(this, this.eh, this.vscope, "");
        }
    },

    /**
     * Refresh the text node if its properties have changed
     */
    refresh : function () {
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
        return (this.isEmptyTextNode)? "INDEFINITE" : "CONTENT";
    }
});

module.exports = $TextNode;
},{"../document":2,"../klass":15,"./tnode":31}],24:[function(require,module,exports){
var doc = require("../document");

/**
 * $CptAttInsert contains methods that will be added to the prototype of all
 * $CptNode node instance that correspond to an insertion of a component attribute
 *  e.g. <#c.body/> used in the template of mycpt that is instanciated as follows:
 *  <#mycpt><#body>foobar</#body></#mycpt>
 * so these cpt nodes are simply insert nodes for an attribute of its parent component
 */
module.exports.$CptAttInsert = {
  initCpt:function(cptAttElement) {
    // get the $RootNode corresponding to the templat to insert
    this.createPathObservers();
    this.createCommentBoundaries("cptattinsert");
    this.createChildNodeInstances(cptAttElement);
  },

  createChildNodeInstances:function(cptAttElement) {
    if (!this.isDOMempty) {
        this.removeChildNodeInstances(this.node1,this.node2);
        this.isDOMempty = true;
    }

    this.cptAttElement=cptAttElement;
    this.childNodes=[];
    var root=this.cptAttElement.getTemplateNode();
    if (root) {
        // append root as childNode
        this.childNodes[0]=root;

        // render in a doc fragment
        var df = doc.createDocumentFragment();
        root.render(df,false);

        this.node.insertBefore(df, this.node2);
        root.replaceNodeBy(df, this.node); // recursively remove doc fragment reference
        this.isDOMempty = false;
      }
  },

  /**
   * Safely cut all dependencies before object is deleted
   */
  $dispose:function() {
    this.cptAllElt=null;
    this.cleanObjectProperties();
  }
};

},{"../document":2}],25:[function(require,module,exports){
var json = require("../json"),
    log = require("./log"),
    doc = require("../document"),
    $TextNode = require("./$text"),
    cptwrapper = require("./cptwrapper");

var $CptNode,$CptAttElement, TNode; // injected through setDependency to avoid circular dependencies

exports.setDependency=function(name,value) {
  if (name==="$CptAttElement") {
    $CptAttElement=value;
  } else if (name==="$CptNode") {
    $CptNode=value;
  } else if (name==="TNode") {
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
  initCpt:function(arg) {
    this.isCptComponent = true;
    this.ctlConstuctor=arg.ctlConstuctor;

    if (this.template) {
      // this component is associated to a template
      var needCommentNodes=(this.createPathObservers() || this.ctlConstuctor.$refresh);

      if (needCommentNodes) {
        this.createCommentBoundaries("cpt");
        this.createChildNodeInstances();
      } else {
        // WARNING: this changes the original vscope to the template vscope
        this.template.call(this, this.getTemplateArguments(), this.getCptArguments());
      }

      // $init child components
      this.initChildComponents();
      this.ctlWrapper.refresh(); // first refresh
    } else if (arg.cptattelement) {
      // this component is an attribute of another component
      var cw=cptwrapper.createCptWrapper(this.ctlConstuctor, this.getCptArguments());
      this.ctlWrapper=cw;
      this.controller=cw.cpt;
      if (cw.cpt.tagName) {
          log.error(this+" 'tagName' is a reserved keyword and cannot be used in component controllers");
      }
      cw.cpt.tagName=this.tagName;
      // NB the controller $init has not been called yet - this will be done once the parent component has initialized
    }
  },

  /**
   * Process and retrieve the component arguments that are needed to init the component template
   */
  getCptArguments:function() {
    // determine if cpt supports template arguments
    if (this.template) {
      // as template can be changed dynamically we have to sync the constructor
      this.ctlConstuctor=this.template.controllerConstructor;
    }
    var ctlProto=this.ctlConstuctor.prototype;
    this.ctlAttributes=ctlProto.attributes;
    this.ctlElements=ctlProto.elements;

    // load template arguments
    this.loadCptAttElements();

    // load child elements before processing the template
    var cptArgs={
      nodeInstance:this,
      attributes:{},
      content:null
    };
    var attributes=cptArgs.attributes, att;

    if (this.atts) {
      // some attributes have been passed to this instance - so we push them to cptArgs
      // so that they are set on the controller when the template are rendered
      var atts = this.atts, eh = this.eh, pvs = this.vscope, nm;
      if (atts) {
        for (var i = 0, sz = this.atts.length; sz > i; i++) {
          att = atts[i];
          nm = att.name;
          if (this.ctlAttributes[nm].type!=="template") {
            attributes[nm]=att.getValue(eh, pvs, null);
          }
        }
      }
    }

    if (this.tplAttributes) {
      var tpa=this.tplAttributes;
      for (var k in tpa) {
        // set the template attribute value on the controller
        if (tpa.hasOwnProperty(k)) {
          attributes[k]=tpa[k];
        }
      }
    }
    if (this.childElements) {
      cptArgs.content=this.getControllerContent();
    }
    return cptArgs;
  },

  /**
   * Create the child nodes for a dynamic template - this method assumes
   * that node1 and node2 exist
   */
  createChildNodeInstances : function () {
      if (!this.isDOMempty) {
          this.removeChildNodeInstances(this.node1,this.node2);
          this.isDOMempty = true;
      }

      if (this.template) {
        // temporarily assign a new node to get the content in a doc fragment
        this.vscope=this.parent.vscope; // to come back to original state, when the scope has not been changed by the template
        var targs=this.getTemplateArguments(), cargs=this.getCptArguments();
        var realNode = this.node;
        var df = doc.createDocumentFragment();
        this.node = df;
        this.template.call(this, targs, cargs); // WARNING: this changes vscope to the template vscope

        realNode.insertBefore(df, this.node2);
        this.replaceNodeBy(df , realNode); // recursively remove doc fragment reference
        // now this.node=realNode
        this.isDOMempty = false;
      }
  },

  /**
   * Safely cut all dependencies before object is deleted
   */
  $dispose:function() {
    if (this.ctlWrapper) {
      this.ctlWrapper.$dispose();
      this.ctlWrapper=null;
      this.controller=null;
    }
    this.ctlAttributes=null;
    this.cleanObjectProperties();
    this.ctlConstuctor=null;
    var tpa=this.tplAttributes;
    if (tpa) {
      for (var k in tpa) {
        if (tpa.hasOwnProperty(k)) {
          tpa[k].$dispose();
        }
      }
    }
    var ag=this._attGenerators;
    if (ag) {
      for (var k in ag) {
        if (ag.hasOwnProperty(k)) {
          ag[k].$dispose();
        }
      }
    }
    var en=this.attEltNodes;
    if (en) {
      for (var i=0,sz=en.length; sz>i; i++) {
        en[i].$dispose();
      }
      this.attEltNodes=null;
    }
  },

  /**
   * Load the component sub-nodes that correspond to template attributes
   */
  loadCptAttElements : function () {
    this.attEltNodes=null;
    this._attGenerators=null;

    // determine the possible template attribute names
    var tpAttNames={}, ca=this.ctlAttributes, defaultTplAtt=null, lastTplAtt=null, count=0;
    for (var k in ca) {
      if (ca.hasOwnProperty(k) && ca[k].type==="template") {
        // k is defined in the controller attributes collection
        // so k is a valid template attribute name
        tpAttNames[k]=true;
        count++;
        if (ca[k].defaultContent) {
          defaultTplAtt=k;
        }
        lastTplAtt=k;
      }
    }

    // if there is only one template attribute it will be automatically considered as default
    if (!defaultTplAtt) {
      if (count===1) {
        defaultTplAtt=lastTplAtt;
      } else if (count>1) {
        // error: a default must be defined
        log.error(this+" A default content element must be defined when multiple content elements are supported");
        // use last as default
        defaultTplAtt=lastTplAtt;
      }
    }

    // check if a default attribute element has to be created and create it if necessary
    this.manageDefaultAttElt(defaultTplAtt);

    // Analyze node attributes to see if a template attribute is passed as text attribute
    var atts=this.atts, att, nm;
    if (atts) {
      for (var k in atts) {
        if (!atts.hasOwnProperty(k)) continue;
        att=atts[k];
        nm=att.name;
        if (tpAttNames[nm]) {
          // nm is a template attribute passed as text attribute
          if (this.tplAttributes && this.tplAttributes[nm]) {
            // already defined: raise an error
            
            log.error(this+" Component attribute '" + nm + "' is defined multiple times - please check");
          } else {
            // create new tpl Attribute Text Node and add it to the tplAttributes collection
            if (!att.generator) {
              var txtNode;
              if (att.value) {
                // static value
                txtNode = new $TextNode(0,[""+att.value]);
              } else {
                // dynamic value using expressions
                txtNode = new $TextNode(this.exps,atts[k].textcfg);
              }
              if (!this._attGenerators) {
                this._attGenerators = [];
              }
              att.generator = new $CptAttElement(nm,0,0,0,[txtNode]); // name, exps, attcfg, ehcfg, children
              this._attGenerators.push(att.generator);
            }
            // generate a real $CptAttElement using the TextNode as child element
            var ni=att.generator.createNodeInstance(this);
            ni.isCptContent=true;
            if (!this.attEltNodes) {
              this.attEltNodes=[];
            }
            this.attEltNodes.push(ni);
            // attribute elements will automatically register through registerAttElement()
          }
        }
      }
    }

    this.retrieveAttElements();
  },

  /**
   * Check if a default attribute element has to be created and create one if necessary
   */
  manageDefaultAttElt:function (defaultTplAtt) {
    if (!this.children) {
      return;
    }

    // TODO memoize result at prototype level to avoid processing this multiple times
    var ct=this.getCptContentType(), loadCpts=true;

    if (ct==="ERROR") {
      loadCpts=false;
      log.error(this.info+" Component content cannot mix attribute elements with content elements");
    } else if (ct!=="ATTELT") {
      if (defaultTplAtt) {
        // ct is CONTENT or INDEFINITE - so we create a default attribute element
        var catt=new $CptAttElement(defaultTplAtt,0,0,0,this.children); // name, exps, attcfg, ehcfg, children

        // add this default cpt att element as unique child
        this.children=[catt];
      } else {
        // there is no defaultTplAtt
        loadCpts=false;
      }
    }

    if (loadCpts) {
      var ni, cn=this.children, sz=cn.length;
      if (!this.attEltNodes) {
        this.attEltNodes=[];
      }
      for (var i=0;sz>i;i++) {
        if (!cn[i].isEmptyTextNode) {
          ni=cn[i].createNodeInstance(this);
          ni.isCptContent=true;
          this.attEltNodes.push(ni);
          // attribute elements will automatically register through registerAttElement()
        }
      }
    }
  },

  /**
   * Retrieve all child attribute elements
   * and update the tplAttributes and childElements collections
   */
  retrieveAttElements:function() {
    var aen=this.attEltNodes;
    if (!aen) {
      return null;
    }
    var attElts=[], cta=this.ctlAttributes;
    for (var i=0,sz=aen.length; sz>i;i++) {
      aen[i].registerAttElements(attElts);
    }
    // check that all elements are valid (i.e. have valid names)
    var nm, elt, ok, elts=[], cte=this.ctlElements? this.ctlElements : [];
    for (var i=0,sz=attElts.length; sz>i; i++) {
      elt=attElts[i];
      nm=elt.name;
      ok=true;
      if (cta && cta[nm]) {
        // valid tpl attribute
        if (!this.tplAttributes) {
          this.tplAttributes={};
        }
        this.tplAttributes[nm]=elt;
        ok = false;
      } else {
        if (!nm) {
          log.error(this+" Invalid attribute element (unnamed)");
          ok=false;
        } else if (!cte[nm]) {
          log.error(this+" Invalid attribute element: @"+nm);
          ok=false;
        }
      }
      if (ok) {
        elts.push(elt);
      }
    }
    if (elts.length===0) {
      elts=null;
    }
    this.childElements=elts;
    return elts;
  },

  /**
   * Initializes the attribute elements of type component that have not been
   * already initialized
   */
  initChildComponents:function() {
    var ce=this.childElements;
    if (!ce || !ce.length) {
      return;
    }
    var cw;
    for (var i=0,sz=ce.length;sz>i;i++) {
      cw=ce[i].ctlWrapper;
      if (cw && !cw.initialized) {
        cw.init(null,this.controller);
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
  getTplAttribute : function (name) {
    var ctlAtts=this.ctlAttributes;
    if (ctlAtts) {
      return ctlAtts[name];
    }
    return null;
  },

  /**
   * Callback called by the controller observer when the controller raises an event
   */
  onEvent : function (evt) {
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
  replaceNodeBy : function (prevNode, newNode) {
      if (prevNode === newNode) {
          return;
      }
      TNode.replaceNodeBy.call(this,prevNode, newNode);
      var aen=this.attEltNodes;
      if (aen) {
          for (var i=0,sz=aen.length; sz>i;i++) {
              aen[i].replaceNodeBy(prevNode, newNode);
          }
      }
  },

  /**
   * Calculate the content array that will be set on component's controller
   */
  getControllerContent:function() {
    var c=[], ce=this.childElements, celts=this.ctlElements, eltType;
    if (ce && ce.length) {
      for (var i=0, sz=ce.length;sz>i;i++) {
        eltType=celts[ce[i].name].type;
        if (eltType==="component") {
          c.push(ce[i].controller);
        } else if (eltType==="template") {
          c.push(ce[i]);
        } else {
          log.error(this+" Invalid element type: "+eltType);
        }
      }
    }
    return c.length>0? c : null;
  },

  /**
   * Refresh the sub-template arguments and the child nodes, if needed
   */
  refresh : function () {
      if (this.edirty) {
          var en=this.attEltNodes;
          if (en) {
              for (var i=0,sz=en.length; sz>i; i++) {
                  en[i].refresh();
              }
              // if content changed we have to rebuild childElements
              this.retrieveAttElements();
              this.initChildComponents();
          }
          // Change content of the controller
          json.set(this.controller,"content",this.getControllerContent());

          this.edirty=false;
      }
      $CptNode.refresh.call(this);
      // refresh cpt through $refresh if need be
      this.ctlWrapper.refresh();
  },

  /**
   * Refresh the node attributes (even if adirty is false)
   */
  refreshAttributes : function () {
    var atts = this.atts, att, ctlAtt, eh = this.eh, ctl = this.controller, v;
    var vs = this.isCptAttElement? this.vscope : this.parent.vscope;
    if (atts && ctl && ctl.attributes) {
      // this template has a controller
      // let's propagate the new attribute values to the controller attributes
      for (var i = 0, sz = this.atts.length; sz > i; i++) {
        att = atts[i];
        ctlAtt = ctl.attributes[att.name];
        // propagate changes for 1- and 2-way bound attributes
        if (ctlAtt.type!=="template" && ctlAtt._binding !== 0) {
          v = att.getValue(eh, vs, null);
          if (ctlAtt.type==="object" || ctlAtt.type==="array") {
            json.set(ctl, att.name, v);
          } else if ('' + v != '' + ctl[att.name]) {
            // values may have different types - this is why we have to check that values are different to
            // avoid creating loops
            json.set(ctl, att.name, v);
          }
        }
      }
    }
  }
};

},{"../document":2,"../json":14,"./$text":23,"./cptwrapper":27,"./log":30}],26:[function(require,module,exports){
var json = require("../json"),
    doc = require("../document");

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
  initCpt:function(arg) {
    // determine if template path can change dynamically
    var isDynamicTpl=this.createPathObservers();

    if (isDynamicTpl) {
      this.createCommentBoundaries("template");
      this.createChildNodeInstances();
    } else {
      arg.template.call(this, this.getTemplateArguments());
    }

    // the component is a template without any controller
    // so we have to observe the template root scope to be able to propagate changes to the parent scope
    this._scopeChgeCb = this.onScopeChange.bind(this);
    json.observe(this.vscope, this._scopeChgeCb);
  },

  /**
   * Create the child nodes for a dynamic template - this method assumes
   * that node1 and node2 exist
   */
  createChildNodeInstances : function () {
      if (!this.isDOMempty) {
          this.removeChildNodeInstances(this.node1,this.node2);
          this.isDOMempty = true;
      }

      if (this.template) {
        var args = this.getTemplateArguments();

        // temporarily assign a new node to get the content in a doc fragment
        var realNode = this.node;
        var df = doc.createDocumentFragment();
        this.node = df;
        this.template.call(this, args);

        realNode.insertBefore(df, this.node2);
        this.replaceNodeBy(df , realNode); // recursively remove doc fragment reference
        // now this.node=realNode
        this.isDOMempty = false;
      }
  },

  /**
   * Safely cut all dependencies before object is deleted
   */
  $dispose:function() {
    this.cleanObjectProperties();
  },

  /**
   * Callback called by the json observer when the scope changes This callback is only called when the component
   * template has no controller Otherwise the cpt node is automatically set dirty and controller attributes will be
   * refreshed through refresh() - then the controller will directly call onAttributeChange()
   */
  onScopeChange : function (changes) {
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
  refreshAttributes : function () {
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

},{"../document":2,"../json":14}],27:[function(require,module,exports){
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

var json = require("../json"),
    log = require("./log"),
    klass = require("../klass");

function identity(v) {
    return v;
}

var ATTRIBUTE_TYPES = {
    "int" : {
        defaultValue : 0,
        convert : function (v, attcfg) {
            var r = parseInt(v, 10);
            return isNaN(r) ? getDefaultAttValue(attcfg) : r;
        }
    },
    "float" : {
        defaultValue : 0,
        convert : function (v, attcfg) {
            var r = parseFloat(v);
            return isNaN(r) ? getDefaultAttValue(attcfg) : r;
        }
    },
    "boolean" : {
        defaultValue : true,
        convert : function (v, attcfg) {
            return v === true || v === 1 || v === '1' || v === 'true';
        }
    },
    "string" : {
        defaultValue : '',
        convert : function (v, attcfg) {
            return v + '';
        }
    },
    "object" : {
        defaultValue : null,
        convert : identity
    },
    "callback" : {
        defaultValue : null,
        convert : identity
    },
    "template" : {
        defaultValue : null,
        convert : identity
    }
};

var BINDING_VALUES = {
    "none" : 0,
    "1-way" : 1,
    "2-way" : 2
};

function getDefaultAttValue (attcfg) {
    // attcfg.type is always set when called from ATTRIBUTE_TYPES.x.convert()
    var d = attcfg.defaultValue, tp=attcfg.type;
    if (d === undefined || tp==="template") {
        return ATTRIBUTE_TYPES[tp].defaultValue;
    } else {
        // ensure default has the right type
        return ATTRIBUTE_TYPES[tp].convert(d, {
            type : 'string'
        });
    }
}

/**
 * CptWrapper class CptWrapper objects create, initializae and observe components to detect changes on their properties
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
    $constructor : function (Cptfn) {
        if (!Cptfn || Cptfn.constructor !== Function) {
            log.error("[CptWrapper] Invalid Component constructor!");
        } else {
            this.cpt = new Cptfn();
            this.nodeInstance = null; // reference to set the node instance adirty when an attribute changes
            this.root=null; // reference to the root template node
            this.initialized = false;
            this.needsRefresh = true;

            // update attribute values for simpler processing
            var atts = this.cpt.attributes, att, bnd;
            if (atts) {
                for (var k in atts) {
                    att = atts[k];
                    if (k.match(/^on/)) {
                        // this is a callback
                        if (!att.type) {
                            log.error("Attribute type 'callback' should be set to '" + k + "'");
                        } else if (att.type !== "callback") {
                            log.error("Attribute type 'callback' should be set to '" + k + "' instead of: "
                                    + att.type);
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
                            att.type = 'string';
                        }
                    } else {
                        att.type = 'string';
                    }
                }
            }
        }
    },

    $dispose : function () {
        // unobserve properties and events
        if (this._cptChgeCb) {
            json.unobserve(this.cpt, this._cptChgeCb);
            this._cptChgeCb = null;
        }
        var c=this.cpt;
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
    init : function (initAttributes,parentCtrl) {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        var cpt = this.cpt, atts = cpt.attributes;
        if (!cpt) {
            return; // just in case
        }

        // add $getElement methods
        cpt.$getElement=this.$getElement.bind(this);

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
                isAttdefObject = (typeof(atts[k]) === 'object');
                hasType = (isAttdefObject && atts[k].type);
                if (hasType) {
                    attType = ATTRIBUTE_TYPES[att.type];
                    if (!attType) {
                        log.error("Invalid component attribute type: " + att.type);
                        attType = ATTRIBUTE_TYPES['string'];
                    }
                }
                if (att.type === "callback") {
                    // create an even callback function
                    this.createEventFunction(k.slice(2));
                    cpt[k].isEmpty=(iAtt===undefined);
                    continue;
                } else if (att.type === "template") {
                    v=null;
                } else {
                    // determine value
                    v = '';
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
                            v = att; // todo clone objects
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
    createEventFunction : function (evtType) {
        var self = this;
        this.cpt["on" + evtType] = function (evtData) {
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
    onCptChange : function (change) {
        var chg = change, cpt = this.cpt;
        if (change.constructor === Array) {
            if (change.length > 0) {
                chg = change[0];
            } else {
                log.error('[CptNode] Invalid change - nbr of changes: '+change.length);
                return;
            }
        }
        this.needsRefresh=true;
        var nm = chg.name; // property name
        if (nm === "") {
            return; // doesn't make sens (!)
        }

        var callControllerCb = true; // true if the onXXXChange() callback must be called on the controller

        var att, isAttributeChange = false;
        if (cpt.attributes) {
            att = cpt.attributes[nm];
            isAttributeChange = (att !== undefined);
            if (isAttributeChange) {
                // adapt type if applicable
                var t = att.type;
                if (t) {
                    var v = ATTRIBUTE_TYPES[t].convert(chg.newValue, att);
                    chg.newValue = v;
                    cpt[nm] = v; // change is already raised, no need to trigger another one through json.set()
                }
            }

            if (isAttributeChange && this.nodeInstance) {
                // notify attribute changes to the node instance (and the host) if attribute has a 2-way binding
                if (att._binding === 2) {
                    chg.newValue = this.cpt[nm]; // attribute value may have been changed by the controller
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
                var cbnm='';
                if (isAttributeChange) {
                    cbnm=att.onchange;
                }
                if (!cbnm) {
                    cbnm = ["on", nm.charAt(0).toUpperCase(), nm.slice(1), "Change"].join('');
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
    $getElement:function(index) {
        var nd=this.nodeInstance;
        if (!nd) {
            nd=this.root;
        }
        if (nd) {
            return nd.getElementNode(index);
        }
        return null;
    },

    /**
     * Call the $refresh() function on the component
     */
    refresh:function() {
        var cpt=this.cpt;
        if (this.needsRefresh) {
            if (cpt && cpt.$refresh) {
                cpt.$refresh();
                this.needsRefresh=false;
            }
        }
    }
});

/**
 * Create a Component wrapper and initialize it correctly according to the attributes passed as arguments
 * @param {Object} cptArgs the component arguments
 *      e.g. { nodeInstance:x, attributes:{att1:{}, att2:{}}, content:[] }
 */
function createCptWrapper(Ctl, cptArgs) {
    var cw = new CptWrapper(Ctl), att, t, v; // will also create a new controller instance
    if (cptArgs) {
        var cpt=cw.cpt, ni=cptArgs.nodeInstance;
        if (ni.isCptComponent || ni.isCptAttElement) {
            // set the nodeInstance reference on the component
            var attributes=cptArgs.attributes, content=cptArgs.content;
            cw.nodeInstance = ni;
            cw.cpt.nodeInstance = ni;

            if (attributes) {
                for (var k in attributes) {
                    
                    // set the template attribute value on the component instance
                    if (attributes.hasOwnProperty(k)) {
                        att=cw.cpt.attributes[k];
                        t=att.type;
                        v=attributes[k];

                        if (t && ATTRIBUTE_TYPES[t]) {
                            // in case of invalid type an error should already have been logged
                            // a type is defined - so let's convert the value
                            v=ATTRIBUTE_TYPES[t].convert(v, att);
                        }
                        json.set(cpt,k,v);
                    }
                }
            }

            if (content) {
                if (cpt.content) {
                  log.error(ni+" Component controller cannot use 'content' for another property than child attribute elements");
                } else {
                  // create the content property on the component instance
                  json.set(cpt,"content",content);
                }
            }
        }
    }
    return cw;
}

exports.CptWrapper = CptWrapper;
exports.createCptWrapper=createCptWrapper;

},{"../json":14,"../klass":15,"./log":30}],28:[function(require,module,exports){

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
var doc = require("../document");
var TNode = require("./tnode").TNode;
var hsp = require("../rt");
var gestures = require("../gestures/gestures");
//var log = require("./log");

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
        var nd;
        if (this.tag === "svg") {
            this.nodeNS = "http://www.w3.org/2000/svg";
        }
        if (this.nodeNS) {
            nd = doc.createElementNS(this.nodeNS, this.tag);
        } else {
            if (this.atts && this.atts.length > 0) {
                var nodeType = null;
                var nodeName = null;
                for (var i = 0; i < this.atts.length; i++) {
                    if (this.atts[i].name === "type") {
                        nodeType = this.atts[i].value;
                    }
                    if (this.atts[i].name === "name") {
                        nodeName = this.atts[i].value;
                    }
                }
                if (nodeType || nodeName) {
                    // we have to use a special creation mode as IE doesn't support dynamic type and name change
                    try {
                      nd = doc.createElement('<' + this.tag + (nodeType?' type=' + nodeType : '') + (nodeName?' name=' + nodeName : '') + ' >');
                    } catch (ex) {
                        nd = doc.createElement(this.tag);
                        if (nodeType) {
                            nd.type = nodeType;
                        }
                        if (nodeName) {
                            nd.name = nodeName;
                        }
                    }
                } else {
                    nd = doc.createElement(this.tag);
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
                    if (!this.isInput || nd.type === "radio") {
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

},{"../document":2,"../gestures/gestures":7,"../klass":15,"../rt":17,"./tnode":31}],29:[function(require,module,exports){
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
    json = require("../json");

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
        var vs = klass.createObject(ref);
        vs["scope"] = vs;
        vs["+parent"] = ref;
        return vs;
    }
});

module.exports = ExpHandler;

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
        var res = this.executeCb({}, eh, vscope);
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

            if (!fn || fn.constructor !== Function) {
                info=this.path? this.path.join('.') : "";
                return log.error("[function expression] Object is not a function: "+info);
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

        // add a new pair to observe the object corresponding to the 'this' context of the function
        if (this.bound && r && r.length>1) {
            r.push([r[r.length-1][0],null]);
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

},{"../json":14,"../klass":15,"./log":30}],30:[function(require,module,exports){
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

var loggers=[];

var validTypes={
    "debug":true,
    "error":true,
    "warning":true,
    "info":true
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
        return {items:[],metaData:{}};
    }
    var items=[], md={}, itm;
    for (var i=0, sz=args.length; sz>i; i++) {
        itm=args[i];
        if (i>0 && i===sz-1) {
            // itm could be a meta-data argument
            if (typeof(itm)==="object" && itm.type && typeof(itm.type)==="string" && validTypes[itm.type]) {
                // this is a meta-data argument
                md=itm;
            } else {
                items[i]=itm;
            }
        } else {
            items[i]=itm;
        }
    }
    return {items:items,metaData:md};
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
var log=function() {
    logMsg("debug", arguments, false);
};

/**
 * Add a logger to the logger list
 * The logger function will be added to the first position of the logger list, and will have the 
 * possibilty to prevent other loggers to get the message by returning false.
 * @param {Function} logger a logger function that will receive a message object as argument
 *       the message object has the same structure as the 2nd argument of the log() method
 */
log.addLogger=function (logger) {
    if (logger) {
        loggers.unshift(logger);
    }
};

/**
 * Remove a specific logger from the logger list
 */
log.removeLogger=function (logger) {
    if (loggers && loggers.length) {
        for (var i=0,sz=loggers.length;sz>i;i++) {
            if (loggers[i]===logger) {
                loggers.splice(i,1);
                sz-=1;
                i-=1;
            }
        }
    }
};

/**
 * Empty the logger list
 */
log.removeAllLoggers=function () {
    loggers=[];
};

/**
 * Tell how many loggers are registered
 */
log.getNbrOfLoggers=function() {
    return loggers.length;
};

/**
 * Log an error message
 * Same interface as log() but with an error type
 */
log.error=function() {
    logMsg("error", arguments, true);
};

/**
 * Log a warning message
 * Same interface as log() but with a warning type
 */
log.warning=function() {
    logMsg("warning", arguments, true);
};

/**
 * Log an info message
 * Same interface as log() but with an info type
 */
log.info=function() {
    logMsg("info", arguments, true);
};

/**
 * Return the default formatting associated to a message
 * @param {Object} msg the message object - same structure as for the logger argument
 *        cf. addLogger()
 * @return {String} the formatted message
 */
log.format=function (msg) {
    var out=[];
    out.splice(out.length,0,"[",msg.type);
    if (msg.file) {
        out.splice(out.length,0,": ",msg.file);
    }
    out.splice(out.length,0,"] ",msg.message);
    if (msg.line || msg.column) {
        out.splice(out.length,0," (");
        if (msg.line) {
            out.splice(out.length,0,"line:",msg.line);
        }
        if (msg.column) {
            if (msg.line) {
                out.splice(out.length,0,", column:",msg.column);
            } else {
                out.splice(out.length,0,"column:",msg.column);
            }
        }
        out.splice(out.length,0,")");
    }
    if (msg.code) {
        out.splice(out.length,0,"\r\n>> ", msg.code);
    }
    return out.join("");
};

function logMsg(type,args,forceType) {
    var args=getLogArgs(args);
    var items=args.items, md=args.metaData, sz=items.length, s;

    if (forceType || !md.type) {
        md.type=type;
    }

    if (sz===0) {
        md.message='';
    } else if (sz===1) {
        md.message=formatValue(items[0]);
    } else {
        // translate items to log message and concatenate them
        var out=[];
        for (var i=0;sz>i;i++) {
            s=formatValue(items[i]);
            if (s!=='') {
                out.push(s);
            }
        }
        md.message=out.join(' ');
    }

    if (loggers && loggers.length) {
        var stop=false;
        for (var i=0,sz=loggers.length;sz>i;i++) {
            stop=!loggers[i](md);
            if (stop) {
                break;
            }
        }
    } else {
        defaultLogger(md);
    }
}

function defaultLogger(msg) {
    var methods={
        "info":"info",
        "error":"error",
        "warning":"warn",
        "debug":"log"
    };

    if (typeof(console)!==undefined) {
        console[methods[msg.type]](log.format(msg));
    }
}

/**
 * Sort function
 */
function lexicalSort(a,b) {
    if (a>b) return 1;
    if (a<b) return -1;
    return 0;
}

/**
 * Format a JS entity for the log
 * @param v {Object} the value to format
 * @param depth {Number} the formatting of objects and arrays (default: 1)
 */
function formatValue(v,depth) {
    if (depth===undefined || depth===null) {
        depth=1;
    }
    var tp=typeof(v), val;
    if (v===null) {
        return "null";
    } else if (v===undefined) {
        return "undefined";
    } else if (tp==='object') {
        if (depth>0) {
            var properties=[];
            if (v.constructor===Array) {
                for (var i=0,sz=v.length;sz>i;i++) {
                    val=v[i];
                    if (typeof(val)==='string') {
                        properties.push(i+':"'+formatValue(val,depth-1)+'"');
                    } else {
                        properties.push(i+":"+formatValue(val,depth-1));
                    }
                }
                return "["+properties.join(", ")+"]";
            } else {
                var keys=[];
                for (var k in v) {
                    if (k.match(/^\+/)) {
                        // this is a meta-data property
                        continue;
                    }
                    keys.push(k);
                }
                // sort keys as IE 8 uses a different order than other browsers
                keys.sort(lexicalSort);

                for (var i=0,sz=keys.length;sz>i;i++) {
                    val=v[keys[i]];
                    if (typeof(val)==='string') {
                        properties.push(keys[i]+':"'+formatValue(val,depth-1)+'"');
                    } else {
                        properties.push(keys[i]+':'+formatValue(val,depth-1));
                    }
                }
                return "{"+properties.join(", ")+"}";
            }
        } else {
            if (v.constructor===Array) {
                return "Array["+v.length+"]";
            } else if (v.constructor===Function) {
                return "Function";
            } else {
                return "Object";
            }
        }
    } else if (tp==='function') {
        return "Function";
    } else {
        return ''+v;
    }
}

module.exports = log;

},{}],31:[function(require,module,exports){

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

var hsp = require("../rt"),
    klass = require("../klass"),
    log = require("./log"),
    ExpHandler = require("./exphandler");

/**
 * Template node - base class of all nodes
 */
var TNode = klass({
    node : null, // reference to the DOM node object - will be defined on each node instance
    vscope : null, // variable scope - will be defined on each node instance
    root : null, // reference to the root TNode
    parent : null, // parent TNode
    children : null, // array of child node generators
    childNodes : null,// array of child node instances
    adirty : false, // true if some of the node attributes need to be refreshed
    cdirty : false, // true if the node contains dirty sub-nodes
    edirty : false, // (only used by components) true if one the attribute element is dirty
    htmlCbs : null, // array: list of the html callbacks - if any
    nodeNS : null, // string: node namespace - if any
    isCptContent : false, // tells if a node instance is a child of a component (used to raise edirty flags)
    obsPairs : null,      // Array of observed [obj, property] pairs associated to this object
    needSubScope : false, // true if a dedicated sub-scope should be created for this node

    $constructor : function (exps,observeExpTarget) {
        this.isStatic = (exps === 0);
        if (!this.isStatic) {
            // create ExpHandler
            this.eh = new ExpHandler(exps,observeExpTarget);
        }
    },

    /**
     * Safely remove all cross references
     */
    $dispose : function () {
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
    createAttList : function (attcfg, ehcfg) {
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

        if (attcfg === null || attcfg === 0)
            return null;
        var atts = [], itm;
        for (var k in attcfg) {
            if (attcfg.hasOwnProperty(k)) {
                itm = attcfg[k];
                if (itm === null) {
                    atts.push(new TSimpleAtt(k, k));
                } else if (typeof(itm) == "string") {
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
    onPropChange : function (chge) {
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
            this.parent.edirty=true;
        }

        var n = this.parent;
        while (n) {
            if (n.isCptContent && n.parent) {
                n.parent.edirty=true;
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
    createNodeInstance : function (parent) {
        // create node instance referencing the current node as parent in the prototype chain
        var ni = klass.createObject(this);
        ni.parent = parent;
        if (this.needSubScope) {
            ni.vscope = ni.createSubScope();
        } else {
            ni.vscope = parent.vscope; // we don't create new named variable in vscope, so we use the same vscope
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
    refresh : function () {
        if (this.adirty) {
            // update observable pairs
            this.root.updateObjectObservers(this);
            this.adirty = false; // adirty should not be set to false anywhere else unless updateObjectObservers is not required
        }
        if (this.cdirty) {
            var cn = this.childNodes;
            if (cn) {
                for (var i = 0, sz = cn.length; sz > i; i++) {
                    cn[i].refresh();
                }
            }
            this.cdirty = false;
        }
    },

    /**
     * Abstract function that should be implemented by sub-classes
     */
    createNode : function () {},

    /**
     * Recursively replace the DOM node by another node if it matches the preNode passed as argument
     */
    replaceNodeBy : function (prevNode, newNode) {
        if (prevNode === newNode)
            return;
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
    registerAttElements:function (attElts) {
        var cn=this.childNodes, itm;
        if (cn) {
            for (var i=0, sz=cn.length; sz>i; i++) {
                itm=cn[i];
                if (!itm.registerAttElements) {
                    if (!itm.isEmptyTextNode){
                        // invalid content
                        log.error(this+" Statement must not produce invalid attribute elements when used as component content");
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
    removeChildNodeInstances : function (DomNode1,DomNode2) {
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
            ref=this.parent.vscope;
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
    getScopeOwner : function(property, vscope) {
        return ExpHandler.getScopeOwner(property, vscope);
    },

    /**
     * Helper function to get the nth DOM child node of type ELEMENT_NODE
     * @param {Integer} index the position of the element (e.g. 0 for the first element)
     * @retrun {DOMElementNode}
     */
    getElementNode:function(index) {
        if (this.node) {
            var cn=this.node.childNodes, nd, idx=-1;
            var n1=this.node1, n2=this.node2; // for TNode using comments to delimit their content
            if (!n2) {
                n2=null;
            }
            var process=(n1)? false : true;
            for (var i=0;cn.length>i;i++) {
                nd=cn[i];
                if (process) {
                    if (nd===n2) {
                        break;
                    }
                    if (nd.nodeType===1) {
                        // 1 = ELEMENT_NODE
                        idx++;
                        if (idx===index) {
                            return nd;
                        }
                    }
                } else if (nd===n1) {
                    process=true;
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
            nodes=this.children;
        }
        if (!nodes) {
            return "INDEFINITE";
        }
        var ct, attFound=false, contentFound=false;
        for (var i=0,sz=nodes.length; sz>i;i++) {
            ct=nodes[i].getCptAttType();

            if (ct==="ATTELT") {
                attFound=true;
                if (contentFound) {
                    return "ERROR";
                }
            } else if (ct==="CONTENT") {
                contentFound=true;
                if (attFound) {
                    return "ERROR";
                }
            } else if (ct==="ERROR") {
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
    $constructor : function (name, value) {
        this.name = name;
        this.value = value;
    },

    getValue : function (eh, vscope, defvalue) {
        return this.value;
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
    $constructor : function (name, textcfg) {
        this.name = name;
        this.textcfg = textcfg;
    },

    /**
     * Return the value of the attribute for a given context (scope and expression handler)
     */
    getValue : function (eh, vscope, defvalue) {
        var tcfg = this.textcfg, sz = tcfg.length, buf = [];

        // expressions used in custom components may return objects that should not be
        // concatenated to a string:
        if (sz === 2 && tcfg[0] === "") {
            // this is a single expression
            return eh.getValue(tcfg[1], vscope, defvalue);
        }

        for (var i = 0; sz > i; i++) {
            // odd elements are variables
            if (i % 2)
                buf.push(eh.getValue(tcfg[i], vscope, defvalue));
            else
                buf.push(tcfg[i]);
        }
        return buf.join("");
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
    $constructor : function (type, cbArg) {
        this.evtType = type;
        var isHtmlCallback = (typeof cbArg !== 'number');
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
    executeCb : function (evt, eh, vscope) {
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

},{"../klass":15,"../rt":17,"./exphandler":29,"./log":30}]},{},[17])