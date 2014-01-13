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

var preIncDec = {
    "++" : "+=",
    "--" : "-="
};

var postIncDec = {
    "++" : "inc",
    "--" : "dec"
};

module.exports = function (ast, options) {
    options = options || {};
    var UglifyJS = options["uglify-js"] || require("uglify-js");

    function getPropertyName (propAccess) {
        if (propAccess instanceof UglifyJS.AST_Dot) {
            return new UglifyJS.AST_String({
                value : propAccess.property
            });
        } else {
            return propAccess.property;
        }
    }

    function createCallRuntimeMethod (method, args, originalNode) {
        var $setRef = new UglifyJS.AST_SymbolRef({
            name : "$set"
        });
        var res = new UglifyJS.AST_Call({
            expression : method == "$set" ? $setRef : new UglifyJS.AST_Dot({
                expression : $setRef,
                property : method
            }),
            args : args
        });
        res.formatInfo = {
            before : (method == "$set" ? method : "$set." + method) + "(",
            middle : args,
            after : ")",
            originalStartPos : originalNode.start.pos,
            originalEndPos : originalNode.end.endpos
        };
        return res;
    }

    var createRequire = function () {
        var res = new UglifyJS.AST_Var({
            definitions : [new UglifyJS.AST_VarDef({
                name : new UglifyJS.AST_SymbolVar({
                    name : "$set"
                }),
                value : new UglifyJS.AST_Call({
                    expression : new UglifyJS.AST_SymbolRef({
                        name : "require"
                    }),
                    args : [new UglifyJS.AST_String({
                        value : "hsp/$set"
                    })]
                })
            })]
        });
        res.formatInfo = {
            before : res.print_to_string(),
            middle : [],
            after : "; ",
            originalStartPos : 0,
            originalEndPos : 0
        };
        return res;
    };

    function replaceAssignment (node, aDotB) {
        if (node.operator == "=") {
            return createCallRuntimeMethod("$set", [aDotB.expression, getPropertyName(aDotB), node.right], node);
        } else {
            return createCallRuntimeMethod("op", [aDotB.expression, getPropertyName(aDotB), new UglifyJS.AST_String({
                        value : node.operator
                    }), node.right], node);
        }
        return node;
    }

    function replacePostIncDec (node, aDotB) {
        return createCallRuntimeMethod(postIncDec[node.operator], [aDotB.expression, getPropertyName(aDotB)], node);
    }

    function replacePreIncDec (node, aDotB, options) {
        return createCallRuntimeMethod("op", [aDotB.expression, getPropertyName(aDotB), new UglifyJS.AST_String({
                    value : preIncDec[node.operator]
                }), new UglifyJS.AST_Number({
                    value : 1
                })], node, aDotB);
    }

    function replaceDelete (node, aDotB, options) {
        return createCallRuntimeMethod("del", [aDotB.expression, getPropertyName(aDotB)], node);
    }

    var changed = false;
    var transformer = new UglifyJS.TreeTransformer(function (node, descend) {
        descend(node, this);
        var replacer = null;
        var aDotB = null;
        if (node instanceof UglifyJS.AST_Assign) {
            aDotB = node.left;
            replacer = replaceAssignment;
        } else if (node instanceof UglifyJS.AST_Unary) {
            aDotB = node.expression;
            if (node.operator == "delete") {
                replacer = replaceDelete;
            } else if (preIncDec.hasOwnProperty(node.operator)) {
                replacer = node instanceof UglifyJS.AST_UnaryPostfix ? replacePostIncDec : replacePreIncDec;
            }
        }
        if (replacer && aDotB instanceof UglifyJS.AST_PropAccess) {
            changed = true;
            node = replacer(node, aDotB);
        }
        if (changed && node instanceof UglifyJS.AST_Toplevel) {
            node.body.unshift(createRequire());
        }
        return node;
    });
    ast.transform(transformer);
    return changed;
};
