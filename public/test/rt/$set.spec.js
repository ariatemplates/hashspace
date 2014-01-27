
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

var $set = require("hsp/$set");

describe("$set", function () {

    it("test accepted operators", function () {
        var operators = ["+=", "-=", "*=", "/=", "%=", "<<=", ">>=", ">>>=", "&=", "^=", "|="];
        var objTest = {
            a : 1
        };
        var objRef = {
            a : 1
        };
        for (var i = 0, l = operators.length; i < l; i++) {
            var resTest = $set.op(objTest, "a", operators[i], 1);
            var resRef = eval("objRef.a" + operators[i] + "1");
            expect(resTest).to.equal(resRef);
            expect(objTest.a).to.equal(objRef.a);
        }
    });

    it("test wrong operators", function () {
        // this test checks that it is not possible to do code injection through $set.op
        var operators = ["==", ";", "//", ";window.wrongOperator = true;"];
        var wrongOperatorInitialValue = window.wrongOperator;
        var a = {
            b : 1
        };
        for (var i = 0, l = operators.length; i < l; i++) {
            try {
                $set.op(a, "b", operators[i], 30);
                expect().fail("No exception with wrong operator: " + operators[i]);
            } catch (e) {
                expect(e + "").to.contain("Invalid operator");
            }
            expect(a.b).to.equal(1);
        }
        expect(window.wrongOperator).to.equal(wrongOperatorInitialValue);
    });
});
