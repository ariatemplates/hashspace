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

var processAST = require("./processAST");
var formatAST = require("./formatAST");

module.exports = function (fileContent, fileName, options) {
    options = options || {};
    var UglifyJS = options["uglify-js"] || require("uglify-js");
    var ast = UglifyJS.parse(fileContent, {
        filename : fileName
    });
    var changed = processAST(ast, options);
    return {
        changed : changed,
        code : changed ? formatAST(ast, fileContent, options) : fileContent,
        ast : ast
    };
};
