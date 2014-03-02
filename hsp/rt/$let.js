
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
var klass = require("hsp/klass"),
    $set = require("hsp/$set"),
    doc = require("hsp/document"),
    TNode = require("hsp/rt/tnode").TNode;

var LetNode = klass({
    $extends : TNode,

    /**
     * Log node generator ex: {log scope}
     * @param {Map<Expression>|int} exps the map of the variables used by the node. 
     *      0 is passed if no expression is used
     * @param {Array} args array of the variable name, expression index associated to this statement
     *      e.g. ['aVarName',1,'anotherName',2]
     */
    $constructor : function (exps, args) {
        TNode.$constructor.call(this, exps);
        this.args = args;
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
        var args=this.args, eh=this.eh, v;
        if (args) {
            for (var i=0, sz=args.length;sz>i;i+=2) {
                v=eh.getValue(args[i+1], this.vscope, undefined);
                $set(this.vscope,args[i],v);
            }
        }
    },

    /**
     * Tell this node can be found in a component content
     */
    isValidCptAttElement:function () {
        return true;
    }
});


module.exports=LetNode;

