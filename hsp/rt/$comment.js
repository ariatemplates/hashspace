
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

// This module contains the comment node
var klass = require("../klass"),
    doc = require("./document"),
    TNode = require("./tnode").TNode;

var $CommentNode = klass({
    $extends : TNode,

    /**
     * Comment node generator.
     * @param {Map<Expression>|int} exps the map of the variables used by the node. 0 is passed if no expression is
     * used
     * @param {String} comment the value of the comment
     */
    $constructor : function (comment) {
        TNode.$constructor.call(this, 0);
        this.comment = comment;
    },

    /**
     * Create the DOM comment element and attach it to the parent
     */
    createNode : function () {
        this.node = doc.createComment(this.comment);
    },

    /**
     * Return the component attribute type of the current node
     * @return {String} one of the following option:
     *      "ATTELT" if the element is an attribute element (e.g. <@body>)
     *      "CONTENT" if the node is a content element (e.g. <div>)
     *      "INDEFINITE" if the element can be part of eithe an attribute or content collection (e.g. blank text nodes)
     *      "ERROR" if elt mixes attribute and content elements
     */
    getCptAttType: function() {
        return "CONTENT";
    }
});

module.exports = $CommentNode;