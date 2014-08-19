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

module.exports = function getIdentifiers(tree) {

    var partialResult;

    if (tree instanceof Array) {
        partialResult = [];
        if (tree.length > 0) {
            for (var i = 0; i < tree.length; i++) {
                partialResult = partialResult.concat(getIdentifiers(tree[i]));
            }
        }
        return partialResult;
    }

    if (tree.a === 'literal') {
        return [];
    } else if (tree.a === 'idn') {
        return [tree.v];
    } else if (tree.a === 'unr') {
        return getIdentifiers(tree.l);
    } else if (tree.a === 'bnr') {
        return getIdentifiers(tree.l).concat(getIdentifiers(tree.r));
    } else if (tree.a === 'tnr') {
        return getIdentifiers(tree.l).concat(getIdentifiers(tree.r))
            .concat(getIdentifiers(tree.othr));
    } else {
        throw new Error('unknown entry' + JSON.stringify(tree));
    }
};