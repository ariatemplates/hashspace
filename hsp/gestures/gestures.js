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
var klass = require("hsp/klass");
var Tap = require("./tap").Tap;
var LongPress = require("./longPress").LongPress;

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
    longpresscancel: {name: "LongPress", klass: LongPress}
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

