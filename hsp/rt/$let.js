
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

// This module contains the log node
var klass = require("../klass"),
    $set = require("../$set"),
    doc = require("./document"),
    TNode = require("./tnode").TNode,
    exmanipulator = require("../expressions/manipulator");

var LetNode = klass({
    $extends : TNode,

    /**
     * Log node generator ex: {log scope}
     * @param {Map<Expression>} expressions that, when evaluated, will create new variables
     */
    $constructor : function (exps) {
        TNode.$constructor.call(this, exps);
        var exp = this.eh.getExpr(1); //there is only one expression for the let block
        var trees = exp.isMultiStatement ? exp.ast : [exp.ast];
        this.expTrees = [];

        /*
         * The logic below splits the comma-separated expressions into individual
         * expressions and prepares a collection of 2-element arrays where the first
         * element is a variable name to be assigned and the second one - expression
         * manipulator that knows how to get value of the right-hand side.
         */
        for (var i = 0; i < trees.length; i++) {
            this.expTrees.push([trees[i].l.v, exmanipulator(exps[0], trees[i].r)]);
        }
    },

    /**
     * Create the DOM node element and attach it to the parent
     */
    createNode : function () {
        this.node = doc.createComment("{let}");
        this.updateScope();
    },

    /**
     * Observer callback called when one of the bound variables used by the node expressions changes
     */
    onPropChange : function (chge) {
        // update scope variables
        this.updateScope();
        TNode.onPropChange.call(this, chge);
    },

    /**
     * Process the information to be logged and push it to the log output (browser console by default)
     */
    updateScope : function () {
        var expts = this.expTrees;
        for (var i = 0; i < expts.length; i++) {
            $set(this.vscope, expts[i][0], expts[i][1].getValue(this.vscope, undefined));
        }
    }
});


module.exports=LetNode;

