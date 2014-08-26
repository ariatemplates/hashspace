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

var ast = require('./parser');
var evaluator = require('./evaluator');

/**
 * Expressions handling util that can evaluate and manipulate
 * JavaScript-like expressions
 *
 * @param {String} input - expression to handle
 * @return {Object} an object with the methods described below
 */
module.exports = function(input, inputTree) {
    var tree = inputTree || ast(input);
    //AST needs to have an identifier or binary '.' or '[' at the root to be assignable
    var isAssignable = tree.a === 'idn' || (tree.a === 'bnr' && (tree.v === '.' || tree.v === '['));

    return {
        /**
         * Evaluates an expression against a scope
         * @param scope
         * @return {*} - value of an expression in a given scope
         */
        getValue: function(scope, defaultValue) {
            var val = evaluator(tree, scope);
            if( typeof defaultValue === 'undefined') {
                return val;
            } else {
                return (val === undefined || val === null || val != val) ? defaultValue : val;
            }
        },
        /**
         * Sets value of an expression on a scope. Not all expressions
         * are assignable.
         * @param scope - scope that should be modified
         * @param {*} a new value for a given expression and scope
         */
        setValue: function(scope, newValue) {
            if (!isAssignable) {
               throw new Error('Expression "' + input + '" is not assignable');
            }

            if (tree.a === 'idn') {
                scope[tree.v] = newValue;
            } else if (tree.a === 'bnr') {
                evaluator(tree.l, scope)[tree.r.v] = newValue;
            }
        },
        isAssignable : isAssignable
    };
};
