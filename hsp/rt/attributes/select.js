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
        optionNode.setAttribute("value", value); // To avoid issues on IE
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
    $constructor : function (nodeInstance) {
        this.nodeInstance = nodeInstance;
        this.node = nodeInstance.node;
        this._lastValues = {};
        this._selectEvents = ["change"];
        nodeInstance.addEventListeners(this._selectEvents);
    },

    $setValue: function (name, value) {
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

    $handleEvent : function (evt) {
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
    _synchronize : function() {
        var _boundName = this._boundName;
        var _boundValue = this.nodeInstance.getAttributeValueInModel(_boundName);
        var node = this.node;

        // First, try to change the select value with the data model one
        if (_getSelectedValue(node) != _boundValue) {
            var selectedIndex = -1;
            var options = node.getElementsByTagName("option");
            for(var i = 0; i < options.length; i++) {
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