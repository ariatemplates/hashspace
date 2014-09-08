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

function forgivingPropertyAccessor(scope, left, right) {
    return typeof left === 'undefined' || left === null ? undefined : left[right];
}

var UNARY_OPERATORS = {
    '!': function (scope, right) { return !right; },
    '-': function (scope, right) { return -right; },
    '[': function (scope, right) { return right; }, //array literal
    '{': function (scope, right) { //object literal

        var result = {}, keyVal;
        for (var i = 0; i < right.length; i++) {
            keyVal = right[i];
            result[keyVal.k] = keyVal.v;
        }

        return result;
    }
};

var BINARY_OPERATORS = {
    '+': function (scope, left, right) { return left + right; },
    '-': function (scope, left, right) { return left - right; },
    '*': function (scope, left, right) { return left * right; },
    '/': function (scope, left, right) { return left / right; },
    '%': function (scope, left, right) { return left % right; },
    '<': function (scope, left, right) { return left < right; },
    '>': function (scope, left, right) { return left > right; },
    '>=': function (scope, left, right) { return left >= right; },
    '<=': function (scope, left, right) { return left <= right; },
    '==': function (scope, left, right) { return left == right; },
    '!=': function (scope, left, right) { return left != right; },
    '===': function (scope, left, right) { return left === right; },
    '!==': function (scope, left, right) { return left !== right; },
    '||': function (scope, left, right) { return left || right; },
    '&&': function (scope, left, right) { return left && right; },
    '(': function (scope, left, right) { //function call on a scope
        return left.apply(left, right);
    },
    'new': function (scope, constrFunc, args) { //constructor invocation
        var inst = Object.create(constrFunc.prototype);
        Function.prototype.apply.call(constrFunc, inst, args);
        return inst;
    },
    '.': forgivingPropertyAccessor, //property access
    '[': forgivingPropertyAccessor,  //dynamic property access
    '=': function(scope, left, right) { return scope[left] = right; }
};

var TERNARY_OPERATORS = {
    '(': function (scope, target, name, args) { //function call on an object
        return typeof target === 'undefined' || target === null ?
            undefined : target[name].apply(target, args);
    },
    '?': function (scope, test, trueVal, falseVal) { return test ? trueVal : falseVal; },
    '|': function (scope, input, pipeFnOrObj, args, target) {  //pipe (filter)
        var pipeFn = typeof pipeFnOrObj === 'function' ? pipeFnOrObj : pipeFnOrObj['apply'];
        if (pipeFn) {
            return pipeFn.apply(typeof pipeFnOrObj === 'function' ? target : pipeFnOrObj, [input].concat(args));
        } else {
            throw new Error('Pipe expression is neither a function nor an object with the apply() method');
        }
    },
    '=': function (scope, target, property, value) {
        return target[property] = value;
    }
};

module.exports = function getTreeValue(tree, scope) {

    var emptyScope = {}; //empty object for functions that shouldn't be bound to any scope
    var operatorFn, result;
    var parsedVal, argExp, arrayResult;

    if (tree instanceof Array) {

        if (tree.length > 0) {
            result = new Array(tree.length);
            for (var i = 0; i < tree.length; i++) {
                argExp = tree[i];
                arrayResult = parsedVal = getTreeValue(argExp, scope);
                if (argExp.key) {
                    arrayResult = {
                        k: argExp.key,
                        v: parsedVal
                    };
                }
                result[i] = arrayResult;
            }
        } else {
            result = [];
        }
        return result;
    }

    if (tree.a === 'literal') {
        result = tree.v;
    } else if (tree.a === 'idn') {
        result = scope[tree.v];
    } else if (tree.a === 'unr' && UNARY_OPERATORS[tree.v]) {
        operatorFn = UNARY_OPERATORS[tree.v];
        result = operatorFn(scope, getTreeValue(tree.l, scope));
    } else if (tree.a === 'bnr' && BINARY_OPERATORS[tree.v]) {
        operatorFn = BINARY_OPERATORS[tree.v];
        result = operatorFn(scope, getTreeValue(tree.l, scope), getTreeValue(tree.r, scope));
    } else if (tree.a === 'tnr' && TERNARY_OPERATORS[tree.v]) {
        operatorFn = TERNARY_OPERATORS[tree.v];
        if (tree.v === '|' && (tree.r.v === '.' || tree.r.v === '[')) {
            result = operatorFn(scope, getTreeValue(tree.l, scope), getTreeValue(tree.r, scope), getTreeValue(tree.othr, scope), getTreeValue(tree.r.l, scope));
        } else {
            result = operatorFn(scope, getTreeValue(tree.l, scope), getTreeValue(tree.r, scope), getTreeValue(tree.othr, scope), emptyScope);
        }
    } else {
        throw new Error('Unknown tree entry of type "'+ tree.a +' and value ' + tree.v + ' in:' + JSON.stringify(tree));
    }

    return result;
};