
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

// Document object wrapper
// used by the hash_space runtime
var doc = window.document;

module.exports.createDocumentFragment = function () {
    return doc.createDocumentFragment();
};

module.exports.createElement = function (type) {
    return doc.createElement(type);
};

module.exports.createElementNS = function (ns, type) {
    return doc.createElementNS(ns, type);
};

module.exports.createTextNode = function (text) {
    return doc.createTextNode(text);
};

module.exports.createComment = function (text) {
    return doc.createComment(text);
};

module.exports.getElementById = function (eltId) {
    return doc.getElementById(eltId);
};

if (doc.createEvent) {
    module.exports.createEvent = function () {
        return doc.createEvent.apply(doc,arguments);
    };
}

if (doc.createEventObject) {
    module.exports.createEventObject = function () {
        return doc.createEventObject.apply(doc,arguments);
    };
}
