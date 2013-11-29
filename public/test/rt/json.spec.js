
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

    var obj, obj2, chg1 = {}, chgsz1 = 0, arr2 = [];

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
        arr2 = ["v0", "v1", "v2", "v3"];
    }

    var fn1 = function (changes) {
        chg1 = changes[0];
        chgsz1 = changes.length;
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

        json.push(obj2.propC, "v4");
        expect(obj2.propC[4]).toEqual("v4");
        expect(obj2.propC.length).toEqual(5);
        // chg1 corresponds to the length change
        expect(chg1.oldValue).toEqual(4);
        expect(chg1.name).toEqual("length");
        expect(chg1.type).toEqual("updated");

        var r = json.push(obj2.propC, "v5", "v6");
        expect(r).toEqual(7);
        // chg1 also corresponds to length update
        expect(chgsz1).toEqual(1);
        expect(chg1.name).toEqual("length"); // last change first
        expect(chg1.type).toEqual("updated");
        expect(obj2.propC[6]).toEqual("v6");

        json.unobserve(obj, fn1);
    });

    it("tests array splice", function () {
        reset(0);
        json.observe(obj2.propC, fn1);
        expect(chgsz1).toEqual(0);

        // array.splice(-2,1,"a")
        json.splice(obj2.propC, -2, 1, "a");
        arr2.splice(-2, 1, "a");
        expect(obj2.propC.join("/")).toEqual(arr2.join("/"));
        expect(chgsz1).not.toEqual(0); // a change has been raised

        // TODO implement change report according to Object.observe
    });

    // TODO
    // json.observeItems(this.dm.todos, syncData)
    // this.dm.todos.filter( function(val) {return !val.completed;} )

});