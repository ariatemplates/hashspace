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
    $constructor : function (nodeInstance) {
        this.nodeInstance = nodeInstance;
        this.node = nodeInstance.node;
        this._lastValues = {};
        // note: when the input event is properly implemented we don't need to listen to keyup
        // but IE8 and IE9 don't implement it completely - thus the need for keyup
        this._inputEvents = ["click", "focus", "input", "keyup", "change"];
        nodeInstance.addEventListeners(this._inputEvents);
    },

    $setValue: function (name, value) {
        if (name === "value") {
            // value attribute must be changed directly as the node attribute is only used for the default value
            if (this.node.type === "radio") {
                this.node.value = value;
            }
        }
        this._lastValues[name] = value;
    },

    $onAttributesRefresh: function() {
        var lastValue = typeof this._lastValues["model"] === "undefined"? this._lastValues["value"]: this._lastValues["model"];
        var lastValueAsString = '' + lastValue;
        if (this.node.type === "radio") {
            var currentValueAsString = '' + this.node.value;
            this.node.checked = (lastValueAsString === currentValueAsString);
        } else if (this.node.type === "checkbox") {
            var currentValueAsString = '' + this.node.checked;
            if (lastValueAsString !== currentValueAsString) {
                this.node.checked = !this.node.checked;
            }
        } else if (lastValueAsString != this.node.value) {
            //only update if value is changing
            this.node.value = lastValue;
        }
    },

    $handleEvent : function (evt) {
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