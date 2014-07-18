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

var vm = require("vm");
var assert = require("assert");
var processString = require("../../hsp/transpiler/processString");
var $set = require("../../hsp/$set");
var json = require("../../hsp/json");

describe("Transpiler", function () {

    var testFunction = function (a) {
        a.a = 1;
        a.a += 1;
        a.b = ++a.a;
        a.c = a.a++;
        a.d = 10;
        a.e = --a.d;
        a.f = a.d--;
        a.d -= 10;
        a.g = "ok";
        a.h = a.g == "ok" ? "ok" : "ko";
        delete a.g;
        a.i = 2;
        a.i *= 4;
        a.i /= 2;
        a.i %= 3;
        a.i <<= 4;
        a.i &= 16;
        a.i >>= 2;
        a.i >>>= 2;
        a.i = -1;
        a.i ^= 1;
        a.i |= 1;
        a.j = a.k = 7;
        (a.l = {}).m = 12;
    };

    var checkTranspiledTestFunction = function (transpiledTestFunction) {
        var a1 = {};
        var a2 = {};
        var expectedChgList = [{
                    type : "new",
                    name : "a",
                    newValue : 1,
                    oldValue : undefined
                }, {
                    type : "updated",
                    name : "a",
                    newValue : 2,
                    oldValue : 1
                }, {
                    type : "updated",
                    name : "a",
                    newValue : 3,
                    oldValue : 2
                }, {
                    type : "new",
                    name : "b",
                    newValue : 3,
                    oldValue : undefined
                }, {
                    type : "updated",
                    name : "a",
                    newValue : 4,
                    oldValue : 3
                }, {
                    type : "new",
                    name : "c",
                    newValue : 3,
                    oldValue : undefined
                }, {
                    type : "new",
                    name : "d",
                    newValue : 10,
                    oldValue : undefined
                }, {
                    type : "updated",
                    name : "d",
                    newValue : 9,
                    oldValue : 10
                }, {
                    type : "new",
                    name : "e",
                    newValue : 9,
                    oldValue : undefined
                }, {
                    type : "updated",
                    name : "d",
                    newValue : 8,
                    oldValue : 9
                }, {
                    type : "new",
                    name : "f",
                    newValue : 9,
                    oldValue : undefined
                }, {
                    type : "updated",
                    name : "d",
                    newValue : -2,
                    oldValue : 8
                }, {
                    type : "new",
                    name : "g",
                    newValue : "ok",
                    oldValue : undefined
                }, {
                    type : "new",
                    name : "h",
                    newValue : "ok",
                    oldValue : undefined
                }, {
                    type : "deleted",
                    name : "g",
                    newValue : undefined,
                    oldValue : "ok"
                }, {
                    type : "new",
                    name : "i",
                    newValue : 2,
                    oldValue : undefined
                }, {
                    type : "updated",
                    name : "i",
                    newValue : 8,
                    oldValue : 2
                }, {
                    type : "updated",
                    name : "i",
                    newValue : 4,
                    oldValue : 8
                }, {
                    type : "updated",
                    name : "i",
                    newValue : 1,
                    oldValue : 4
                }, {
                    type : "updated",
                    name : "i",
                    newValue : 16,
                    oldValue : 1
                }, {
                    type : "updated",
                    name : "i",
                    newValue : 4,
                    oldValue : 16
                }, {
                    type : "updated",
                    name : "i",
                    newValue : 1,
                    oldValue : 4
                }, {
                    type : "updated",
                    name : "i",
                    newValue : -1,
                    oldValue : 1
                }, {
                    type : "updated",
                    name : "i",
                    newValue : -2,
                    oldValue : -1
                }, {
                    type : "updated",
                    name : "i",
                    newValue : -1,
                    oldValue : -2
                }, {
                    type : "new",
                    name : "k",
                    newValue : 7,
                    oldValue : undefined
                }, {
                    type : "new",
                    name : "j",
                    newValue : 7,
                    oldValue : undefined
                }, {
                    type : "new",
                    name : "l",
                    newValue : {},
                    oldValue : undefined
                }];
        var observer = function (chgList) {
            assert.equal(chgList.length, 1);
            var chg = chgList[0];
            assert.strictEqual(chg.object, a1);
            delete chg.object;
            var item = expectedChgList.shift();
            assert.deepEqual(chg, item);
        };
        json.observe(a1, observer);
        transpiledTestFunction(a1);
        testFunction(a2);
        json.unobserve(a1, observer);
        assert.deepEqual(a1, a2);
        assert.equal(expectedChgList.length, 0);
    };

    function runJSCodeCommonJS (code) {
        return vm.runInNewContext(code, {
            require : function (requiredFile) {
                assert.equal(requiredFile, "hsp/$set");
                return $set;
            }
        });
    }

    it("tests default mode", function () {
        var result = processString("(" + testFunction.toString() + ")");
        assert.equal(result.changed, true);
        var transpiledTestFunction = runJSCodeCommonJS(result.code);
        checkTranspiledTestFunction(transpiledTestFunction);
    });

    it("tests commonJS mode with setVarName", function () {
        var result = processString("var myFunction = " + testFunction.toString()
                + "; ([myFunction, mySetLocalVariable])", null, {
            mode : "commonJS",
            setVarName : "mySetLocalVariable"
        });
        assert.equal(result.changed, true);
        var array = runJSCodeCommonJS(result.code);
        var transpiledTestFunction = array[0];
        checkTranspiledTestFunction(transpiledTestFunction);
        assert.equal(array[1], $set);
    });

    it("tests global mode with setVarName", function () {
        var result = processString("(" + testFunction.toString() + ")", null, {
            mode : "global",
            setVarName : "mySetGlobalVariable"
        });
        assert.equal(result.changed, true);
        var transpiledTestFunction = vm.runInNewContext(result.code, {
            mySetGlobalVariable : $set
        });
        checkTranspiledTestFunction(transpiledTestFunction);
    });

});
