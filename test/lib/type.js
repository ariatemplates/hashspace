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
 * Utility methods to check types.
 * Taken from Aria Templates: https://github.com/ariatemplates/ariatemplates/blob/master/src/aria/utils/Type.js
 */

/**
 * Check if the value is an array
 * @param {Object} value
 * @return {Boolean} isArray
 */
var isArray = exports.isArray = function (value) {
    return Object.prototype.toString.apply(value) === "[object Array]";
};

/**
 * Check if the value is a string (for example, typeof(new String("my String")) is "object")
 * @param {Object} value
 * @return {Boolean} isString
 */
var isString = exports.isString = function (value) {
    if (typeof(value) === 'string') {
        return true;
    }
    return Object.prototype.toString.apply(value) === "[object String]";
};

/**
 * Check if the value is a RegularExpression
 * @param {Object} value
 * @return {Boolean} isRegExp
 */
exports.isRegExp = function (value) {
    return Object.prototype.toString.apply(value) === "[object RegExp]";
};

/**
 * Check if the value is a number
 * @param {Object} value
 * @return {Boolean} isNumber
 */
exports.isNumber = function (value) {
    if (typeof(value) === 'number') {
        return true;
    }
    return Object.prototype.toString.apply(value) === "[object Number]";
};

/**
 * Check if the value is a js Date
 * @param {Object} value
 * @return {Boolean} isDate
 */
exports.isDate = function (value) {
    return Object.prototype.toString.apply(value) === "[object Date]";
};

/**
 * Check if the value is a boolean
 * @param {Object} value
 * @return {Boolean} isBoolean
 */
exports.isBoolean = function (value) {
    return (value === true || value === false);
};

/**
 * Check if the value is a HTML element
 * @param {Object} object
 * @return {Boolean} isHTMLElement
 */
exports.isHTMLElement = function (object) {
    // http://www.quirksmode.org/dom/w3c_core.html#nodeinformation
    if (object) {
        var nodeName = object.nodeName;
        return object === window || isString(nodeName);
    } else {
        return false;
    }
};

/**
 * Check if the value is an object
 * @param {Object} value
 * @return {Boolean} isObject return false if value is null or undefined.
 */
var isObject = exports.isObject = function (value) {
    // check that the value is not null or undefined, because otherwise,
    // in IE, if value is undefined or null, the toString method returns Object anyway
    if (value) {
        return Object.prototype.toString.apply(value) === "[object Object]";
    } else {
        return false;
    }
};

/**
 * Check if the object is a function
 * @param {Object} value
 * @return {Boolean} isFunction
 */
exports.isFunction = function (value) {
    return Object.prototype.toString.apply(value) === "[object Function]";
};

/**
 * Return true if value is an Object or an Array.
 * @param {Object} value
 * @return {Boolean} isContainer
 */
exports.isContainer = function (value) {
    return isObject(value) || isArray(value);
};