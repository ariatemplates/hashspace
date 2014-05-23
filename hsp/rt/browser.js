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

/**
 * Checks if a given browser supports svg
 * Based on //http://stackoverflow.com/questions/9689310/which-svg-support-detection-method-is-best
 * @returns {boolean}
 */
function supportsSvg() {
    return !!window.document.createElementNS &&
        !!window.document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect;
}

/**
 * A utility with various browser-related routines.
 * Most importantly it contains feature-detection logic.
 */
module.exports.supportsSvg = supportsSvg;