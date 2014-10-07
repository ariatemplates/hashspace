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
    ONUPDATE_TIMER : 500,

    $constructor : function (nodeInstance, callback) {
        this.callback = callback;
        this._inputEvents = ["input", "keyup", "change"];
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

    $handleEvent : function (event) {
        if (this._inputEvents.indexOf(event.type) > -1) {
            this._clearTimer();
            var _this = this;
            this.timerId = setTimeout(function () {
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
