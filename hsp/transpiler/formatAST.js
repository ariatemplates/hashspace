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

module.exports = function (ast, fileContent, options) {
    options = options || {};
    var UglifyJS = options["uglify-js"] || require("uglify-js");

    fileContent = fileContent.replace(/\r\n?|[\n\u2028\u2029]/g, "\n").replace(/\uFEFF/g, "");

    var nextStart = null;
    var out = [];

    function continueUntil (newPosition) {
        if (nextStart !== null && newPosition > nextStart) {
            out.push(fileContent.substring(nextStart, newPosition));
        }
        nextStart = null;
    }

    function restartFrom (newPosition) {
        nextStart = newPosition;
    }

    function walkFunction (node, descend) {
        var newStart = (nextStart === null);
        var formatInfo = node.formatInfo;
        if (formatInfo) {
            if (!newStart) {
                continueUntil(formatInfo.originalStartPos);
            }
            out.push(formatInfo.before);
            var middle = formatInfo.middle;
            for (var i = 0, l = middle.length; i < l; i++) {
                if (i > 0) {
                    out.push(", ");
                }
                walkNode(middle[i]);
            }
            out.push(formatInfo.after);
            if (!newStart) {
                restartFrom(formatInfo.originalEndPos);
            }
        } else if (newStart && !(node.start && node.end)) {
            out.push(node.print_to_string());
        } else {
            if (newStart) {
                restartFrom(node.start.pos);
            }
            descend();
            if (newStart) {
                continueUntil(node.end.endpos);
            }
        }
        return true;
    }

    function walkNode (node) {
        var walker = new UglifyJS.TreeWalker(walkFunction);
        node.walk(walker);
    }

    walkNode(ast);
    return out.join("");
};
