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

var ClassHandler = klass({
    $constructor : function (nodeInstance) {
        this.nodeInstance = nodeInstance;
        this.previousClasses = null;
    },

    $setValueFromExp: function (name, exprVals) {
        var newClassesArr = [], newClasses, classExpr;

        for (var i = 0; i < exprVals.length; i++) {
            if (exprVals % 2 || typeof exprVals[i] !== 'object') {
                newClassesArr.push(exprVals[i]);
            } else {
                classExpr = exprVals[i];
                for (var className in classExpr) {
                    if (classExpr.hasOwnProperty(className) && classExpr[className]) {
                        newClassesArr.push(className);
                    }
                }
            }
        }
        newClasses = newClassesArr.join(' ');

        var currentClasses = this.nodeInstance.node.className;
        var results = currentClasses && currentClasses.split? currentClasses.split(' '): [];
        if (this.previousClasses) {
            var previousClassesArray = this.previousClasses.split(' ');
            for (var i = 0; i < previousClassesArray.length; i++) {
                var index = results.indexOf(previousClassesArray[i]);
                if (index > -1) {
                    results.splice(index, 1);
                }
            }
        }
        if (newClasses != null && newClasses.length > 0) {
            results.splice(0, 0, newClasses.replace(/^\s+|\s+$/g, '').replace(/\s+/g,' '));
        }
        this.previousClasses = newClasses;
        
        //Add generated className to the element (issue on IE8 with the class attribute?)
        if (this.nodeNS) {
            this.nodeInstance.node.setAttribute("class", results.join(' '));
        } else {
            this.nodeInstance.node.className = results.join(' ');
        }
    },

    $dispose: function() {
        this.previousClasses = null;
    }
});

module.exports = ClassHandler;