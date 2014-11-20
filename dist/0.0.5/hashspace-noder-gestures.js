(function(define) {
    define("hsp/gestures/touchEvent.js", [], function(module, global) {
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
                touchstart: "touchstart",
                touchend: "touchend",
                touchmove: "touchmove"
            };
            var touch = "ontouchstart" in window || window.DocumentTouch && window.document instanceof window.DocumentTouch;
            if (!touch) {
                map = {
                    touchstart: "mousedown",
                    touchend: "mouseup",
                    touchmove: "mousemove"
                };
            }
            // IE10 special events
            if (window.navigator.msPointerEnabled) {
                map = {
                    touchstart: "MSPointerDown",
                    touchend: "MSPointerUp",
                    touchmove: "MSPointerMove"
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
        exports.getPositions = function(event) {
            var result = [];
            if (event.touches && event.touches[0] || event.changedTouches && event.changedTouches[0]) {
                for (var i = 0; i < event.touches.length; i++) {
                    result.push({
                        x: event.touches[i].pageX ? event.touches[i].pageX : event.touches[i].clientX,
                        y: event.touches[i].pageY ? event.touches[i].pageY : event.touches[i].clientY
                    });
                }
                if (event.type == touchEventMap.touchend) {
                    for (var i = 0; i < event.changedTouches.length; i++) {
                        result.push({
                            x: event.changedTouches[i].pageX ? event.changedTouches[i].pageX : event.changedTouches[i].clientX,
                            y: event.changedTouches[i].pageY ? event.changedTouches[i].pageY : event.changedTouches[i].clientY
                        });
                    }
                }
            } else {
                result.push({
                    x: event.pageX ? event.pageX : event.clientX,
                    y: event.pageY ? event.pageY : event.clientY
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
        exports.getFingerIndex = function(event) {
            var result = 0;
            // IE10 case
            if (window.navigator.msPointerEnabled) {
                result = event.isPrimary ? 0 : 1;
            } else {
                if (event.touches || event.changedTouches) {
                    if (event.changedTouches.length > 1) {
                        result = 100 + event.changedTouches.length;
                    } else if (event.type == touchEventMap.touchend) {
                        result = event.touches.length + event.changedTouches.length - 1;
                    } else {
                        var changedX = event.changedTouches[0].pageX ? event.changedTouches[0].pageX : event.changedTouches[0].clientX;
                        var changedY = event.changedTouches[0].pageY ? event.changedTouches[0].pageY : event.changedTouches[0].clientY;
                        for (var i = 0; i < event.touches.length; i++) {
                            if (changedX == (event.touches[i].pageX ? event.touches[i].pageX : event.touches[i].clientX) && changedY == (event.touches[i].pageY ? event.touches[i].pageY : event.touches[i].clientY)) {
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
            target: "srcElement",
            type: "type",
            clientX: "clientX",
            clientY: "clientY",
            altKey: "altKey",
            ctrlKey: "ctrlKey",
            shiftKey: "shiftKey",
            pageX: "pageX",
            pageY: "pageY",
            relatedTarget: "relatedTarget",
            button: "button",
            direction: "direction",
            distance: "distance",
            duration: "duration",
            startX: "startX",
            startY: "startY",
            endX: "endX",
            endY: "endY",
            detail: "detail",
            wheelDelta: "wheelDelta",
            wheelDeltaX: "wheelDeltaX",
            wheelDeltaY: "wheelDeltaY",
            screenX: "screenX",
            screenY: "screenY",
            touches: "touches",
            changedTouches: "changedTouches",
            targetTouches: "targetTouches",
            isPrimary: "isPrimary"
        };
        // Map of special event types
        var specialTypes = {
            focusin: "focus",
            focusout: "blur",
            dommousescroll: "mousewheel",
            webkitanimationstart: "animationstart",
            oanimationstart: "animationstart",
            msanimationstart: "animationstart",
            webkitanimationiteration: "animationiteration",
            oanimationiteration: "animationiteration",
            msanimationiteration: "animationiteration",
            webkitanimationend: "animationend",
            oanimationend: "animationend",
            msanimationend: "animationend",
            webkittransitionend: "transitionend",
            otransitionend: "transitionend",
            mstransitionend: "transitionend"
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
            var isGecko = ua.indexOf("gecko") > -1;
            var isIE8orLess = false;
            if (/msie[\/\s]((?:\d+\.?)+)/.test(ua)) {
                var version = RegExp.$1;
                var ieVersion = parseInt(version, 10);
                if (ieVersion >= 7) {
                    var detectedIEVersion = window.document.documentMode || 7;
                    if (detectedIEVersion != ieVersion) {
                        ieVersion = detectedIEVersion;
                    }
                }
                isIE8orLess = ieVersion <= 8;
            }
            var fakeEvent = {};
            var evt = {
                type: type
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
            if (fakeEvent.type == "keydown" || fakeEvent.type == "keyup") {
                fakeEvent.keyCode = evt.keyCode;
                fakeEvent.isSpecialKey = fakeEvent.isSpecialKey(this.keyCode, evt);
            } else if (fakeEvent.type == "keypress") {
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
                    }
                    /*
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
            fakeEvent.preventDefault = !evt.preventDefault ? function(stopPropagation) {
                fakeEvent.hasPreventDefault = true;
                evt.returnValue = false;
                if (stopPropagation === true) {
                    fakeEvent.stopPropagation();
                }
            } : function(stopPropagation) {
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
            fakeEvent.stopPropagation = !evt.stopPropagation ? function() {
                fakeEvent.hasStopPropagation = true;
                evt.cancelBubble = true;
            } : function() {
                fakeEvent.hasStopPropagation = true;
                evt.stopPropagation();
            };
            /**
     * Needs to be here in order to access the closure variable 'evt'
     * @private
     */
            fakeEvent._dispose = function() {
                evt = null;
                fakeEvent.preventDefault = null;
                fakeEvent.stopPropagation = null;
            };
            fakeEvent.type = type;
            fakeEvent.target = target;
            return fakeEvent;
        };
    });
    define("hsp/gestures/gesture.js", [ "../klass", "./touchEvent" ], function(module, global) {
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
        var klass = require("../klass");
        var touchEvent = require("./touchEvent");
        var Gesture = klass({
            /**
     * Defines the number of touch for the gesture.
     */
            NB_TOUCHES: 1,
            /**
     * Constructor.
     */
            $constructor: function(nodeInstance, callback) {
                /**
         * Reference to the target
         * @type HTMLElement
         */
                this.target = nodeInstance.node;
                /**
         * Reference to the event handler
         * @type Function
         */
                this.callback = callback;
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
                if (this.callbackMap) {
                    this._disconnectTouchEvents();
                }
                this.callbackMap = null;
            },
            /**
     * Connects touch events.
     * @private
     */
            _connectTouchEvents: function() {
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
            _disconnectTouchEvents: function() {
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
            _getInitialListenersList: function() {
                return [];
            },
            /**
     * Returns the list of listeners to be attached when the gesture is started, and detached when the gesture is
     * finished.
     * @protected
     * @return {Object} the list of listeners.
     */
            _getAdditionalListenersList: function() {
                return [];
            },
            /**
     * Returns the map of fake events to be raised during the gesture lifecycle. Format: {start: "start_event_name",
     * move: "move_event_name", end : "end_event_name", cancel: "cancel_event_name"}
     * @protected
     * @return {Object} the map of listeners.
     */
            _getFakeEventsMap: function() {
                return {};
            },
            /**
     * Generic start point for a gesture: unregisters initial listeners, registers additional listeners, set initial
     * data, optional fake event raised
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _gestureStart: function(event, extraData) {
                if (!this.__validateNbTouches(event)) {
                    return null;
                }
                this._disconnectTouchEvents();
                this.startData = {
                    positions: touchEvent.getPositions(event),
                    time: new Date().getTime()
                };
                this.currentData = null;
                this._connectAdditionalTouchEvents();
                if (this._getFakeEventsMap().start) {
                    return this._raiseFakeEvent(event, this._getFakeEventsMap().start, extraData);
                } else {
                    return event.returnValue != null ? event.returnValue : !event.defaultPrevented;
                }
            },
            /**
     * Generic optional move: manages intermediate states during the gesture
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _gestureMove: function(event, extraData) {
                if (!this.__validateNbTouches(event)) {
                    return null;
                }
                this.currentData = {
                    positions: touchEvent.getPositions(event),
                    time: new Date().getTime()
                };
                if (this._getFakeEventsMap().move) {
                    return this._raiseFakeEvent(event, this._getFakeEventsMap().move, extraData);
                } else {
                    return event.returnValue != null ? event.returnValue : !event.defaultPrevented;
                }
            },
            /**
     * Generic success end point for the gesture: final fake event raised, additional listeners unregistered,
     * initial listeners attached again.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _gestureEnd: function(event, extraData) {
                if (!this.__validateNbTouches(event)) {
                    return null;
                }
                this._disconnectAdditionalTouchEvents();
                this._connectTouchEvents();
                this.currentData = {
                    positions: touchEvent.getPositions(event),
                    time: new Date().getTime()
                };
                if (this._getFakeEventsMap().end) {
                    return this._raiseFakeEvent(event, this._getFakeEventsMap().end, extraData);
                } else {
                    return event.returnValue != null ? event.returnValue : !event.defaultPrevented;
                }
            },
            /**
     * Generic failure end point for the gesture: optional fake event raised, additional listeners unregistered,
     * initial listeners attached again.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _gestureCancel: function(event, extraData) {
                this._disconnectAdditionalTouchEvents();
                this._connectTouchEvents();
                this.currentData = {
                    positions: touchEvent.getPositions(event),
                    time: new Date().getTime()
                };
                if (this._getFakeEventsMap().cancel) {
                    return this._raiseFakeEvent(event, this._getFakeEventsMap().cancel, extraData);
                } else {
                    return event.returnValue != null ? event.returnValue : !event.defaultPrevented;
                }
            },
            /**
     * Registers the listeners added during the gesture lifecycle, once the gesture is started.
     * @private
     */
            _connectAdditionalTouchEvents: function() {
                var map = this._getAdditionalListenersList();
                for (var i = 0; i < map.length; i++) {
                    this._addListener(map[i].evt, map[i].cb);
                }
            },
            /**
     * Unregisters the listeners added during the gesture lifecycle.
     * @private
     */
            _disconnectAdditionalTouchEvents: function() {
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
            _addListener: function(eventName, cb) {
                this.callbackMap[eventName] = cb;
                var addEL = this.target.addEventListener !== undefined;
                if (!addEL) {
                    var self = this;
                    this._attachEventFn = function(evt) {
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
            handleEvent: function(evt) {
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
            _removeListener: function(eventName, cb) {
                this.callbackMap[eventName] = null;
                var rmEL = this.target.removeEventListener !== undefined;
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
            _raiseFakeEvent: function(event, name, extraData) {
                var target = event.target ? event.target : event.srcElement;
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
                        fakeEvent.duration = new Date().getTime() - this.startData.time;
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
                this.callback(fakeEvent);
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
            _calculateDistance: function(x1, y1, x2, y2) {
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
            __validateNbTouches: function(event) {
                var fingerIndex = touchEvent.getFingerIndex(event);
                return this.NB_TOUCHES == 1 && fingerIndex === 0 || this.NB_TOUCHES == 2 && fingerIndex >= 0;
            }
        });
        module.exports.Gesture = Gesture;
    });
    define("hsp/gestures/doubleTap.js", [ "../rt", "../klass", "./touchEvent", "./gesture" ], function(module, global) {
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
        var hsp = require("../rt");
        var klass = require("../klass");
        var touchEvent = require("./touchEvent");
        var Gesture = require("./gesture").Gesture;
        var DoubleTap = klass({
            $extends: Gesture,
            /**
     * The move tolerance to validate the gesture.
     * @type Integer
     */
            MARGIN: 10,
            /**
     * The delay between the taps.
     * @type Integer
     */
            BETWEEN_DELAY: 200,
            /**
     * Initial listeners for the DoubleTap gesture.
     * @protected
     */
            _getInitialListenersList: function() {
                return [ {
                    evt: this.touchEventMap.touchstart,
                    cb: this._doubleTapStart.bind(this)
                } ];
            },
            /**
     * Additional listeners for the DoubleTap gesture.
     * @protected
     */
            _getAdditionalListenersList: function() {
                return [ {
                    evt: this.touchEventMap.touchmove,
                    cb: this._doubleTapMove.bind(this)
                }, {
                    evt: this.touchEventMap.touchend,
                    cb: this._doubleTapEnd.bind(this)
                } ];
            },
            /**
     * The fake events raised during the DoubleTap lifecycle.
     * @protected
     */
            _getFakeEventsMap: function() {
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
            _doubleTapStart: function(event) {
                var status = this._gestureStart(event);
                if (status == null) {
                    if (this.timerId) {
                        //Gesture already started so it has to be cancelled if multi-touch.
                        return this._doubleTapCancel(event);
                    } else {
                        return event.returnValue != null ? event.returnValue : !event.defaultPrevented;
                    }
                }
                if (this.timerId) {
                    //Second tap starting
                    clearTimeout(this.timerId);
                    return status;
                } else {
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
            _doubleTapMove: function(event) {
                var position = touchEvent.getPositions(event);
                if (this.MARGIN >= this._calculateDistance(this.startData.positions[0].x, this.startData.positions[0].y, position[0].x, position[0].y)) {
                    var status = this._gestureMove(event);
                    return status == null ? this._doubleTapCancel(event) : status;
                } else {
                    return this._doubleTapCancel(event);
                }
            },
            /**
     * DoubleTap end mgmt: gesture ends if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _doubleTapEnd: function(event) {
                var status = this._gestureEnd(event);
                if (status == null) {
                    return this._doubleTapCancel(event);
                } else if (this.timerId) {
                    //Second tap ending, fake event raised
                    this.timerId = null;
                    return this._raiseFakeEvent(event, this._getFakeEventsMap().finalize);
                } else {
                    //First tap ending, timer created to wait for second tap
                    var _this = this;
                    var eventCopy = {};
                    for (var i in event) {
                        eventCopy[i] = event[i];
                    }
                    this.timerId = setTimeout(function() {
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
            _doubleTapCancel: function(event) {
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
        module.exports.register = function() {
            hsp.registerCustomAttributes([ "ondoubletap", "ondoubletapstart", "ondoubletapcancel" ], DoubleTap);
        };
    });
    define("hsp/gestures/drag.js", [ "../rt", "../klass", "./touchEvent", "./gesture" ], function(module, global) {
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
        var hsp = require("../rt");
        var klass = require("../klass");
        var touchEvent = require("./touchEvent");
        var Gesture = require("./gesture").Gesture;
        var Drag = klass({
            $extends: Gesture,
            /**
     * Initial listeners for the Drag gesture.
     * @protected
     */
            _getInitialListenersList: function() {
                return [ {
                    evt: this.touchEventMap.touchstart,
                    cb: this._dragStart.bind(this)
                } ];
            },
            /**
     * Additional listeners for the Drag gesture.
     * @protected
     */
            _getAdditionalListenersList: function() {
                return [ {
                    evt: this.touchEventMap.touchmove,
                    cb: this._dragMove.bind(this)
                }, {
                    evt: this.touchEventMap.touchend,
                    cb: this._dragEnd.bind(this)
                } ];
            },
            /**
     * The fake events raised during the Drag lifecycle.
     * @protected
     */
            _getFakeEventsMap: function() {
                return {
                    dragstart: "dragstart",
                    dragmove: "dragmove",
                    dragend: "drag",
                    cancel: "dragcancel"
                };
            },
            /**
     * Drag start mgmt: gesture is started if only one touch, first fake event to be fired with the first move.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _dragStart: function(event) {
                var alreadyStarted = this.currentData != null;
                var status = this._gestureStart(event);
                if (status == null && alreadyStarted) {
                    // if the gesture has already started, it has to be cancelled
                    this.currentData = {
                        positions: touchEvent.getPositions(event),
                        time: new Date().getTime()
                    };
                    return this._raiseFakeEvent(event, this._getFakeEventsMap().cancel);
                } else {
                    return status == null ? event.returnValue != null ? event.returnValue : !event.defaultPrevented : status;
                }
            },
            /**
     * Tap move mgmt: gesture starts/continues if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _dragMove: function(event) {
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
                    return alreadyStarted ? this._gestureCancel(event) : event.returnValue != null ? event.returnValue : !event.defaultPrevented;
                }
            },
            /**
     * Drag end mgmt: gesture ends if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _dragEnd: function(event) {
                var alreadyStarted = this.currentData != null;
                var status = this._gestureEnd(event);
                if (alreadyStarted) {
                    return status == null ? event.returnValue != null ? event.returnValue : !event.defaultPrevented : this._raiseFakeEvent(event, this._getFakeEventsMap().dragend);
                } else {
                    return event.returnValue != null ? event.returnValue : !event.defaultPrevented;
                }
            }
        });
        module.exports.register = function() {
            hsp.registerCustomAttributes([ "ondrag", "ondragstart", "ondragmove", "ondragcancel" ], Drag);
        };
    });
    define("hsp/gestures/longPress.js", [ "../rt", "../klass", "./touchEvent", "./gesture" ], function(module, global) {
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
        var hsp = require("../rt");
        var klass = require("../klass");
        var touchEvent = require("./touchEvent");
        var Gesture = require("./gesture").Gesture;
        var LongPress = klass({
            $extends: Gesture,
            /**
     * The move tolerance to validate the gesture.
     * @type Integer
     */
            MARGIN: 10,
            /**
     * The duration for the press.
     * @type Integer
     */
            PRESS_DURATION: 1e3,
            /**
     * Initial listeners for the LongPress gesture.
     * @protected
     */
            _getInitialListenersList: function() {
                return [ {
                    evt: this.touchEventMap.touchstart,
                    cb: this._longPressStart.bind(this)
                } ];
            },
            /**
     * Additional listeners for the LongPress gesture.
     * @protected
     */
            _getAdditionalListenersList: function() {
                return [ {
                    evt: this.touchEventMap.touchmove,
                    cb: this._longPressMove.bind(this)
                }, {
                    evt: this.touchEventMap.touchend,
                    cb: this._longPressCancel.bind(this)
                } ];
            },
            /**
     * The fake events raised during the Tap lifecycle.
     * @protected
     */
            _getFakeEventsMap: function() {
                return {
                    start: "longpressstart",
                    finalize: "longpress",
                    cancel: "longpresscancel"
                };
            },
            /**
     * LongPress start mgmt: gesture is started if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _longPressStart: function(event) {
                var status = this._gestureStart(event);
                if (status != null) {
                    var _this = this;
                    var eventCopy = {};
                    for (var i in event) {
                        eventCopy[i] = event[i];
                    }
                    this.timerId = setTimeout(function() {
                        _this._longPressFinalize(eventCopy);
                    }, this.PRESS_DURATION);
                    return status;
                } else {
                    if (this.timerId) {
                        return this._longPressCancel(event);
                    } else {
                        return event.returnValue != null ? event.returnValue : !event.defaultPrevented;
                    }
                }
            },
            /**
     * LongPress move mgmt: gesture continues if only one touch and if the move is within margins.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _longPressMove: function(event) {
                var position = touchEvent.getPositions(event);
                if (this.MARGIN >= this._calculateDistance(this.startData.positions[0].x, this.startData.positions[0].y, position[0].x, position[0].y)) {
                    var status = this._gestureMove(event);
                    return status == null ? this._longPressCancel(event) : status;
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
            _longPressCancel: function(event) {
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
            _longPressFinalize: function(event) {
                if (this.timerId) {
                    clearTimeout(this.timerId);
                    this.timerId = null;
                }
                this._gestureEnd(event);
                this._raiseFakeEvent(event, this._getFakeEventsMap().finalize);
            }
        });
        module.exports.register = function() {
            hsp.registerCustomAttributes([ "onlongpress", "onlongpressstart", "onlongpresscancel" ], LongPress);
        };
    });
    define("hsp/gestures/pinch.js", [ "../rt", "../klass", "./touchEvent", "./gesture" ], function(module, global) {
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
        var hsp = require("../rt");
        var klass = require("../klass");
        var touchEvent = require("./touchEvent");
        var Gesture = require("./gesture").Gesture;
        var Pinch = klass({
            $extends: Gesture,
            /**
     * Defines the number of touch for the gesture.
     */
            NB_TOUCHES: 2,
            /**
     * Initial listeners for the Pinch gesture.
     * @protected
     */
            _getInitialListenersList: function() {
                return [ {
                    evt: this.touchEventMap.touchstart,
                    cb: this._pinchStart.bind(this)
                } ];
            },
            /**
     * Additional listeners for the Pinch gesture.
     * @protected
     */
            _getAdditionalListenersList: function() {
                return [ {
                    evt: this.touchEventMap.touchmove,
                    cb: this._pinchMove.bind(this)
                }, {
                    evt: this.touchEventMap.touchend,
                    cb: this._pinchEnd.bind(this)
                } ];
            },
            /**
     * The fake events raised during the Pinch lifecycle.
     * @protected
     */
            _getFakeEventsMap: function() {
                return {
                    start: "pinchstart",
                    move: "pinchmove",
                    end: "pinch",
                    cancel: "pinchcancel"
                };
            },
            /**
     * Pinch start mgmt: gesture is started if only two touches.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _pinchStart: function(event) {
                // Standard touch
                if (event.touches && event.touches.length >= 2) {
                    var positions = touchEvent.getPositions(event);
                    this.primaryPoint = positions[0];
                    this.secondaryPoint = positions[1];
                } else if (event.isPrimary) {
                    this.primaryPoint = touchEvent.getPositions(event)[0];
                } else if (typeof event.isPrimary != "undefined" && event.isPrimary === false) {
                    this.secondaryPoint = touchEvent.getPositions(event)[0];
                }
                if (event.touches && event.touches.length >= 2 || typeof event.isPrimary != "undefined" && event.isPrimary === false) {
                    var dist = this._calculateDistance(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
                    var angle = this.__calculateAngle(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
                    this.initialPinchData = {
                        distance: dist,
                        dVariation: 0,
                        angle: angle
                    };
                    this.lastKnownAngle = angle;
                    return this._gestureStart(event, this.initialPinchData);
                } else {
                    return event.returnValue != null ? event.returnValue : !event.defaultPrevented;
                }
            },
            /**
     * Pinch move mgmt: gesture continues if only two touches.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _pinchMove: function(event) {
                // Standard touch
                if (event.touches && event.touches.length >= 2) {
                    var positions = touchEvent.getPositions(event);
                    this.primaryPoint = positions[0];
                    this.secondaryPoint = positions[1];
                } else if (typeof event.isPrimary != "undefined") {
                    if (event.isPrimary) {
                        this.primaryPoint = touchEvent.getPositions(event);
                    } else {
                        this.secondaryPoint = touchEvent.getPositions(event);
                    }
                } else {
                    this.$raiseEvent({
                        name: "pinchcancel"
                    });
                    return this._gestureCancel(event);
                }
                var currentDist = this._calculateDistance(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
                var currentAngle = this.__calculateAngle(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
                this.lastKnownAngle = currentAngle;
                var currentData = {
                    distance: currentDist,
                    dVariation: currentDist - this.initialPinchData.distance,
                    angle: currentAngle
                };
                return this._gestureMove(event, currentData);
            },
            /**
     * Pinch end mgmt: gesture ends if only two touches.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _pinchEnd: function(event) {
                // Standard touch
                if (event.touches && event.changedTouches && (event.changedTouches.length || 0) + (event.touches.length || 0) >= 2) {
                    var positions = touchEvent.getPositions(event);
                    this.primaryPoint = positions[0];
                    this.secondaryPoint = positions[1];
                }
                // IE10 touch
                if (typeof event.isPrimary != "undefined") {
                    if (event.isPrimary) {
                        this.primaryPoint = touchEvent.getPositions(event);
                    } else {
                        this.secondaryPoint = touchEvent.getPositions(event);
                    }
                }
                if (event.touches && event.changedTouches && (event.changedTouches.length || 0) + (event.touches.length || 0) >= 2 || typeof event.isPrimary != "undefined") {
                    var finalDist = this._calculateDistance(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
                    var finalAngle = this.__calculateAngle(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
                    if (Math.abs(finalAngle - this.lastKnownAngle) > 150) {
                        finalAngle = this.__calculateAngle(this.secondaryPoint.x, this.secondaryPoint.y, this.primaryPoint.x, this.primaryPoint.y);
                    }
                    var finalData = {
                        distance: finalDist,
                        dVariation: finalDist - this.initialPinchData.distance,
                        angle: finalAngle
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
            __calculateAngle: function(x1, y1, x2, y2) {
                return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            }
        });
        module.exports.register = function() {
            hsp.registerCustomAttributes([ "onpinch", "onpinchstart", "onpinchmove", "onpinchcancel" ], Pinch);
        };
    });
    define("hsp/gestures/singleTap.js", [ "../rt", "../klass", "./touchEvent", "./gesture" ], function(module, global) {
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
        var hsp = require("../rt");
        var klass = require("../klass");
        var touchEvent = require("./touchEvent");
        var Gesture = require("./gesture").Gesture;
        var SingleTap = klass({
            $extends: Gesture,
            /**
     * The move tolerance to validate the gesture.
     * @type Integer
     */
            MARGIN: 10,
            /**
     * The delay before validating the gesture, after the end event.
     * @type Integer
     */
            FINAL_DELAY: 250,
            /**
     * Initial listeners for the SingleTap gesture.
     * @protected
     */
            _getInitialListenersList: function() {
                return [ {
                    evt: this.touchEventMap.touchstart,
                    cb: this._singleTapStart.bind(this)
                } ];
            },
            /**
     * Additional listeners for the SingleTap gesture.
     * @protected
     */
            _getAdditionalListenersList: function() {
                return [ {
                    evt: this.touchEventMap.touchmove,
                    cb: this._singleTapMove.bind(this)
                }, {
                    evt: this.touchEventMap.touchend,
                    cb: this._singleTapEnd.bind(this)
                } ];
            },
            /**
     * The fake events raised during the SingleTap lifecycle.
     * @protected
     */
            _getFakeEventsMap: function() {
                return {
                    start: "singletapstart",
                    cancel: "singletapcancel",
                    finalize: "singletap"
                };
            },
            /**
     * SingleTap start mgmt: gesture is started if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _singleTapStart: function(event) {
                if (this.timerId) {
                    // Cancels the current gesture if a start event occurs during the FINAL_DELAY ms period.
                    return this._singleTapFinalCancel(event);
                } else {
                    var status = this._gestureStart(event);
                    return status == null ? event.returnValue != null ? event.returnValue : !event.defaultPrevented : status;
                }
            },
            /**
     * singleTap move mgmt: gesture continues if only one touch and if the move is within margins.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _singleTapMove: function(event) {
                var position = touchEvent.getPositions(event);
                if (this.MARGIN >= this._calculateDistance(this.startData.positions[0].x, this.startData.positions[0].y, position[0].x, position[0].y)) {
                    var status = this._gestureMove(event);
                    return status == null ? this._singleTapCancel(event) : status;
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
            _singleTapEnd: function(event) {
                var status = this._gestureEnd(event);
                if (status != null) {
                    var _this = this;
                    var eventCopy = {};
                    for (var i in event) {
                        eventCopy[i] = event[i];
                    }
                    this.timerId = setTimeout(function() {
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
            _singleTapCancel: function(event) {
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
            _singleTapFinalize: function(event) {
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
            _singleTapFinalCancel: function(event) {
                if (this.timerId) {
                    clearTimeout(this.timerId);
                    this.timerId = null;
                }
                return this._raiseFakeEvent(event, this._getFakeEventsMap().cancel);
            }
        });
        module.exports.register = function() {
            hsp.registerCustomAttributes([ "onsingletap", "onsingletapstart", "onsingletapcancel" ], SingleTap);
        };
    });
    define("hsp/gestures/swipe.js", [ "../rt", "../klass", "./touchEvent", "./gesture" ], function(module, global) {
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
        var hsp = require("../rt");
        var klass = require("../klass");
        var touchEvent = require("./touchEvent");
        var Gesture = require("./gesture").Gesture;
        var Swipe = klass({
            $extends: Gesture,
            /**
     * The move tolerance to validate the gesture.
     * @type Integer
     */
            MARGIN: 20,
            /**
     * Initial listeners for the Swipe gesture.
     * @protected
     */
            _getInitialListenersList: function() {
                return [ {
                    evt: this.touchEventMap.touchstart,
                    cb: this._swipeStart.bind(this)
                } ];
            },
            /**
     * Additional listeners for the Swipe gesture.
     * @protected
     */
            _getAdditionalListenersList: function() {
                return [ {
                    evt: this.touchEventMap.touchmove,
                    cb: this._swipeMove.bind(this)
                }, {
                    evt: this.touchEventMap.touchend,
                    cb: this._swipeEnd.bind(this)
                } ];
            },
            /**
     * The fake events raised during the Swipe lifecycle.
     * @protected
     */
            _getFakeEventsMap: function() {
                return {
                    start: "swipestart",
                    move: "swipemove",
                    end: "swipe",
                    cancel: "swipecancel"
                };
            },
            /**
     * Swipe start mgmt: gesture is started if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _swipeStart: function(event) {
                var status = this._gestureStart(event);
                if (status != null) {
                    return status;
                } else {
                    return event.returnValue != null ? event.returnValue : !event.defaultPrevented;
                }
            },
            /**
     * Swipe move mgmt: gesture continues if only one touch and if the move is within margins.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _swipeMove: function(event) {
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
            _swipeEnd: function(event) {
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
            _swipeCancel: function(event) {
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
            _getRoute: function(startPosition, endPosition) {
                var directionX = endPosition.x - startPosition.x;
                var directionY = endPosition.y - startPosition.y;
                var absDirectionX = Math.abs(directionX);
                var absDirectionY = Math.abs(directionY);
                var vertical = absDirectionY >= absDirectionX && absDirectionX <= this.MARGIN;
                var horizontal = absDirectionX > absDirectionY && absDirectionY <= this.MARGIN;
                if (vertical) {
                    return {
                        direction: directionY < 0 ? "up" : "down",
                        distance: absDirectionY,
                        startX: startPosition.x,
                        startY: startPosition.y,
                        endX: endPosition.x,
                        endY: endPosition.y
                    };
                }
                if (horizontal) {
                    return {
                        direction: directionX < 0 ? "left" : "right",
                        distance: absDirectionX,
                        startX: startPosition.x,
                        startY: startPosition.y,
                        endX: endPosition.x,
                        endY: endPosition.y
                    };
                }
                return false;
            }
        });
        module.exports.register = function() {
            hsp.registerCustomAttributes([ "onswipe", "onswipestart", "onswipemove", "onswipecancel" ], Swipe);
        };
    });
    define("hsp/gestures/tap.js", [ "../rt", "../klass", "./touchEvent", "./gesture" ], function(module, global) {
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
        var hsp = require("../rt");
        var klass = require("../klass");
        var touchEvent = require("./touchEvent");
        var Gesture = require("./gesture").Gesture;
        var Tap = klass({
            $extends: Gesture,
            /**
     * The move tolerance to validate the gesture.
     * @type Integer
     */
            MARGIN: 10,
            /**
     * Initial listeners for the Tap gesture.
     * @protected
     */
            _getInitialListenersList: function() {
                return [ {
                    evt: this.touchEventMap.touchstart,
                    cb: this._tapStart.bind(this)
                } ];
            },
            /**
     * Additional listeners for the Tap gesture.
     * @protected
     */
            _getAdditionalListenersList: function() {
                return [ {
                    evt: this.touchEventMap.touchmove,
                    cb: this._tapMove.bind(this)
                }, {
                    evt: this.touchEventMap.touchend,
                    cb: this._tapEnd.bind(this)
                } ];
            },
            /**
     * The fake events raised during the Tap lifecycle.
     * @protected
     */
            _getFakeEventsMap: function() {
                return {
                    start: "tapstart",
                    end: "tap",
                    cancel: "tapcancel"
                };
            },
            /**
     * Tap start mgmt: gesture is started if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _tapStart: function(event) {
                var status = this._gestureStart(event);
                return status == null ? event.returnValue != null ? event.returnValue : !event.defaultPrevented : status;
            },
            /**
     * Tap move mgmt: gesture continues if only one touch and if the move is within margins.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
            _tapMove: function(event) {
                var position = touchEvent.getPositions(event);
                if (this.MARGIN >= this._calculateDistance(this.startData.positions[0].x, this.startData.positions[0].y, position[0].x, position[0].y)) {
                    var status = this._gestureMove(event);
                    return status == null ? this._gestureCancel(event) : status;
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
            _tapEnd: function(event) {
                var status = this._gestureEnd(event);
                return status == null ? this._gestureCancel(event) : event.returnValue != null ? event.returnValue : !event.defaultPrevented;
            }
        });
        module.exports.register = function() {
            hsp.registerCustomAttributes([ "ontap", "ontapstart", "ontapcancel" ], Tap);
        };
    });
    define("hsp/gestures/index.js", [ "./doubleTap", "./drag", "./longPress", "./pinch", "./singleTap", "./swipe", "./tap" ], function(module, global) {
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
        var doubleTap = require("./doubleTap");
        var drag = require("./drag");
        var longPress = require("./longPress");
        var pinch = require("./pinch");
        var singleTap = require("./singleTap");
        var swipe = require("./swipe");
        var tap = require("./tap");
        module.exports.register = function() {
            doubleTap.register();
            drag.register();
            longPress.register();
            pinch.register();
            singleTap.register();
            swipe.register();
            tap.register();
        };
    });
})(noder.define);