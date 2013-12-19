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