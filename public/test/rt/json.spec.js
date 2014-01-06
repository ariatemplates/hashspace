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

var json = require("hsp/json");

describe("Json Observer", function () {

    var obj, obj2, chg1 = {}, chg2, chg3, chgsz1 = 0, chgcount=0, arr2 = [];

    function reset () {
        obj = {
            propA : "a",
            propB : "b",
            propC : {
                propcC1 : "c1"
            }
        };

        obj2 = {
            propA : "a",
            propB : "b",
            propC : ["v0", "v1", "v2", "v3"]
        };

        chg1 = {};
        chgsz1 = 0;
        chgcount = 0;
        arr2 = ["v0", "v1", "v2", "v3"];
    }

    var fn1 = function (changes) {
        chg1 = changes[0];
        chg2 = changes[1];
        chg3 = changes[2];
        chgsz1 = changes.length;
        chgcount++;
    };

    it("tests one observer on a map object", function () {
        reset();
        json.set(obj, "propB", "b2");
        expect(obj.propB).toEqual("b2");

        json.observe(obj, fn1);
        expect(obj["+json:observers"].length).toEqual(1);

        json.set(obj, "propB", "b3");
        expect(chg1.type).toEqual("updated");
        expect(chgsz1).toEqual(1);
        expect(chg1.object).toEqual(obj);
        expect(chg1.name).toEqual("propB");
        expect(chg1.oldValue).toEqual("b2");

        json.set(obj, "propD", "d");
        expect(chg1.type).toEqual("new");
        expect(chgsz1).toEqual(1);
        expect(obj.propD).toEqual("d");
        expect(chg1.name).toEqual("propD");
        expect(chg1.oldValue).toEqual(undefined);

        json.unobserve(obj, fn1);
        expect(obj["json:observers"]).toEqual(undefined);
    });

    it("tests two observers on a map object", function () {
        reset();

        json.observe(obj, fn1);
        expect(obj["+json:observers"].length).toEqual(1);

        var chg2 = {};
        var chgsz2 = 0;
        var fn2 = function (changes) {
            chg2 = changes[0];
            chgsz2 = changes.length;
        };
        json.observe(obj, fn2);
        expect(obj["+json:observers"].length).toEqual(2);

        json.set(obj, "propB", "b3");
        expect(chg1.type).toEqual("updated");
        expect(chgsz1).toEqual(1);
        expect(chg1.object).toEqual(obj);
        expect(chg1.name).toEqual("propB");
        expect(chg1.oldValue).toEqual("b");
        expect(chg1).toEqual(chg2);

        json.unobserve(obj, fn1);
        expect(obj["+json:observers"].length).toEqual(1);
        json.unobserve(obj, fn2);
        expect(obj["+json:observers"]).toEqual(undefined);
    });

    it("tests one observer on an array object", function () {
        reset(0);
        json.observe(obj2.propC, fn1);

        json.set(obj2.propC, 1, "v1-2");
        expect(obj2.propC[1]).toEqual("v1-2");
        expect(chg1.oldValue).toEqual("v1");
        expect(chg1.name).toEqual(1);
        expect(chg1.type).toEqual("updated");

        json.unobserve(obj, fn1);
    });

    it("tests array push", function () {
        reset(0);
        json.observe(obj2.propC, fn1);

        obj2.propC.push("v4");
        expect(obj2.propC[4]).toEqual("v4");
        expect(obj2.propC.length).toEqual(5);
        // chg2 corresponds to the length change
        expect(chg2.oldValue).toEqual(4);
        expect(chg2.name).toEqual("length");
        expect(chg2.type).toEqual("updated");
        expect(chgcount).toEqual(1);

        chgsz1=0;
        var r = obj2.propC.push("v5", "v6");
        expect(r).toEqual(7);
        // chg2 also corresponds to length update
        expect(chgsz1).toEqual(3); // 2 changes with the push + 1 change for length
        expect(chg3.name).toEqual("length"); // last change first
        expect(chg3.type).toEqual("updated");
        expect(obj2.propC[6]).toEqual("v6");
        expect(chgcount).toEqual(2);

        json.unobserve(obj2.propC, fn1);
    });

    it("tests array shift and unshift", function () {
        reset(0);
        json.observe(obj2.propC, fn1);
        expect(obj2.propC.join("/")).toEqual("v0/v1/v2/v3");

        var x=obj2.propC.shift();
        expect(x).toEqual("v0");
        expect(obj2.propC.length).toEqual(3);
        expect(obj2.propC.join("/")).toEqual("v1/v2/v3");
        expect(chgcount).toEqual(1); // a change has been raised

        var y=obj2.propC.unshift("V0.1","V0.2");
        expect(y).toEqual(5); // new length
        expect(obj2.propC.join("/")).toEqual("V0.1/V0.2/v1/v2/v3");
        expect(chgcount).toEqual(2); // another change has been raised

        json.unobserve(obj2.propC, fn1);
    });

    it("tests array pop", function () {
        reset(0);
        json.observe(obj2.propC, fn1);
        expect(obj2.propC.join("/")).toEqual("v0/v1/v2/v3");

        var x=obj2.propC.pop();
        expect(x).toEqual("v3");
        expect(obj2.propC.length).toEqual(3);
        expect(obj2.propC.join("/")).toEqual("v0/v1/v2");
        expect(chgcount).toEqual(1); // a change has been raised

        json.unobserve(obj2.propC, fn1);
    });

    it("tests array reverse", function () {
        reset(0);
        json.observe(obj2.propC, fn1);
        expect(chgsz1).toEqual(0);

        obj2.propC.reverse();
        expect(obj2.propC.join("/")).toEqual("v3/v2/v1/v0");
        expect(chgsz1).not.toEqual(0); // a change has been raised
        expect(chgcount).toEqual(1);

        json.unobserve(obj2.propC, fn1);
    });

    it("tests array sort", function () {
        reset(0);
        var arr=["D","C","A","E","B"];

        json.observe(arr, fn1);
        expect(chgsz1).toEqual(0);

        arr.sort(); // default order = lexicographical
        expect(arr.join("/")).toEqual("A/B/C/D/E");
        expect(chgsz1).not.toEqual(0); // a change has been raised
        expect(chgcount).toEqual(1);
        json.unobserve(arr, fn1);

        reset(0);
        arr=["D3","C1","A4","E2","B5"];

        json.observe(arr, fn1);
        expect(chgsz1).toEqual(0);

        arr.sort(function (a,b) {
            var x=parseInt(a.slice(1));
            var y=parseInt(b.slice(1));
            return x-y;
        });
        expect(arr.join("/")).toEqual("C1/E2/D3/A4/B5");
        expect(chgsz1).not.toEqual(0); // a change has been raised
        expect(chgcount).toEqual(1);
        json.unobserve(arr, fn1);
    });

    it("tests array splice", function () {
        reset(0);
        json.observe(obj2.propC, fn1);
        expect(chgsz1).toEqual(0);

        obj2.propC.splice(1, 2, "a");
        expect(chgcount).toEqual(1);
        expect(chgsz1).toEqual(2);
        expect(obj2.propC.length).toEqual(3);
        expect(obj2.propC.join("/")).toEqual("v0/a/v3");

        json.unobserve(obj2.propC, fn1);
    });

    it("tests array splice2", function () {
        reset(0);
        json.observe(obj2.propC, fn1);
        expect(chgsz1).toEqual(0);

        obj2.propC.splice2(1, 2, ["a", "b", "c"]);
        expect(chgcount).toEqual(1);
        expect(chgsz1).toEqual(2);
        expect(obj2.propC.length).toEqual(5);
        expect(obj2.propC.join("/")).toEqual("v0/a/b/c/v3");

        json.unobserve(obj2.propC, fn1);
    });

});