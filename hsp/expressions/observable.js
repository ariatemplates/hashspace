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

var evaluator = require('./evaluator');

/**
 * Get all the observable pairs for a given expression. Observable pairs
 * are usually input to model-change-observing utilities (ex. Object.observe).
 *
 * An observable pair is a 2-element array where the first element is an
 * object to observe and the second element corresponds to a property name
 * on an object to observe (null indicates that all properties should be observed).
 *
 * Some examples:
 * '"foo"' => []
 * 'foo' => [[scope, 'foo']]
 * 'foo.bar' => [[scope, 'foo'], [scope.foo, 'bar']]
 * 'foo.bar()' => [[scope, 'foo'], [scope.foo, null]]
 *
 * Please note that function calls are tricky since we don't have any reliable
 * way of determining (from an expression) what a given function could use
 * to produce its results (and - as a consequence - what should be observed).
 *
 * @param tree - parsed tree for a given expression
 * @param scope
 */
module.exports = function getObservablePairs(tree, scope) {

    var partialResult, leftValue;

    if (tree instanceof Array) {
        partialResult = [];
        if (tree.length > 0) {
            for (var i = 0; i < tree.length; i++) {
                partialResult = partialResult.concat(getObservablePairs(tree[i], scope));
            }
        }
        return partialResult;
    }

    if (tree.a === 'literal') {
        return [];
    } else if (tree.a === 'idn') {
        //TODO: deal with "parent scopes" (traverse up using +parent) => should it be done here?
        return [[scope, tree.v]];
    } else if (tree.a === 'unr') {
        return getObservablePairs(tree.l, scope);
    } else if (tree.a === 'bnr') {
        partialResult = getObservablePairs(tree.l, scope);
        if (tree.v === '.') {
            //for . we need to observe _value_ of the left-hand side
            leftValue = evaluator(tree.l, scope);
            return leftValue ? partialResult.concat([[leftValue, tree.r.v]]) : partialResult;
        } if (tree.v === '(') { //function call on a scope
            return [[scope, null]].concat(getObservablePairs(tree.r, scope));
        } else {
            //any other binary operator
            return partialResult.concat(getObservablePairs(tree.r, scope));
        }
    } else if (tree.a === 'tnr') {
        partialResult = getObservablePairs(tree.l, scope);
        if (tree.v === '(') { // function call on an object
            partialResult = partialResult.concat([ [evaluator(tree.l, scope), null]]);
        } else {
            partialResult = partialResult.concat(getObservablePairs(tree.r, scope));
        }
        return partialResult.concat(getObservablePairs(tree.othr, scope));
    } else {
        throw new Error('unknown entry' + JSON.stringify(tree));
    }
};