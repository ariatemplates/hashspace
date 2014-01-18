
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

var json = require("hsp/json"),
    PropObserver = require("hsp/propobserver");

describe("Property Observer", function () {
    var obj;

    function reset () {
        obj = {
            propA : "a",
            propB : "b",
            propC : {
                propcC1 : "c1"
            }
        };
    }

    function BasicListener () {
        this.chge = null;
        this.count = 0;
        this.onPropChange = function (chge) {
            this.chge = chge;
            this.count++;
        };
    }

    it("test one prop observer per property", function () {
        reset();

        var o = new PropObserver(obj);
        var p1 = new BasicListener();

        expect(o.props.propA).to.equal(undefined);
        json.set(obj, "propA", "a1");
        o.addObserver(p1, "propA");

        json.set(obj, "propA", "a2");
        expect(p1.chge.name).to.equal("propA");
        expect(p1.chge.oldValue).to.equal("a1");
        expect(p1.chge.object[p1.chge.name]).to.equal("a2");
        expect(p1.count).to.equal(1);

        // test a 2nd change
        p1.chge = null;
        json.set(obj, "propA", "a3");
        json.set(obj, "propB", "b3");
        expect(p1.chge.oldValue).to.equal("a2");
        expect(p1.count).to.equal(2);

        // observe another property
        p1.chge = null;
        o.addObserver(p1, "propB");
        json.set(obj, "propA", "a4");
        json.set(obj, "propB", "b4");
        expect(p1.chge.oldValue).to.equal("b3");
        expect(p1.count).to.equal(4);

        o.rmObserver(p1, "propA");
        expect(o.props.propA).to.equal(undefined);
        json.set(obj, "propA", "a5");
        json.set(obj, "propB", "b5");
        expect(p1.chge.oldValue).to.equal("b4");
        expect(p1.count).to.equal(5);

        o.rmObserver(p1, "propB");
        expect(o.props.propB).to.equal(undefined);
        json.set(obj, "propA", "a6");
        json.set(obj, "propB", "b6");
        expect(p1.chge.oldValue).to.equal("b4");
        expect(p1.count).to.equal(5);
    });

    it("test one prop observer for all properties", function () {
        reset();

        var o = new PropObserver(obj);
        var p1 = new BasicListener();

        expect(o.props.propA).to.equal(undefined);
        json.set(obj, "propA", "a1");
        o.addObserver(p1);

        json.set(obj, "propA", "a2");
        expect(p1.chge.name).to.equal("propA");
    });

    it("test two prop observers per property", function () {
        reset();

        var o = new PropObserver(obj);
        var p1 = new BasicListener();
        var p2 = new BasicListener();

        json.set(obj, "propA", "a1");
        o.addObserver(p1, "propA");
        o.addObserver(p2, "propA");
        json.set(obj, "propA", "a2");

        expect(p1.chge.oldValue).to.equal("a1");
        expect(p1.chge.object[p1.chge.name]).to.equal("a2");
        expect(p2.chge.oldValue).to.equal("a1");
        expect(p2.chge.object[p2.chge.name]).to.equal("a2");

        // delete test
        o.rmObserver(p1, "propA");
        expect(o.props.propA.length).to.equal(1);
        json.set(obj, "propA", "a3");
        expect(p2.chge.oldValue).to.equal("a2");
        o.rmObserver(p2, "propA");
        expect(o.props.propA).to.equal(undefined);
    });

    it("test prop observer disposal", function () {
        reset();

        var o = new PropObserver(obj);
        var p1 = new BasicListener();

        json.set(obj, "propA", "a1");
        o.addObserver(p1, "propA");
        json.set(obj, "propA", "a2");

        expect(obj["+json:observers"].length).to.equal(1);
        o.$dispose();
        expect(o.props).to.equal(undefined);
        expect(obj["+json:observers"]).to.equal(undefined);
    });

    it("test prop observer on array length", function () {
        var arr = ["Omer"];

        var o = new PropObserver(arr);
        var p = new BasicListener();

        o.addObserver(p, "length");
        expect(arr.length).to.equal(1);
        expect(p.count).to.equal(0);

        json.set(arr, 1, "Marge");
        expect(arr.length).to.equal(2);
        expect(arr[1]).to.equal("Marge");
        expect(p.count).to.equal(1);

        // splice with length change
        arr.splice(1, 0, "Bart");
        expect(arr.length).to.equal(3);
        expect(p.count).to.equal(2);

        // splice with no length change
        arr.splice(1, 1, "Bart2");
        expect(arr.length).to.equal(3);
        expect(p.count).to.equal(2);

        // splice2 with length change
        arr.splice2(1, 1);
        expect(arr.length).to.equal(2);
        expect(p.count).to.equal(3);

        // shift test
        var x = arr.shift();
        expect(x).to.equal("Omer");
        expect(arr.length).to.equal(1);
        expect(p.count).to.equal(4);

        // pop test
        arr.splice(0, 0, "Omer");
        x = arr.pop();
        expect(x).to.equal("Marge");
        expect(arr.length).to.equal(1);
        expect(p.count).to.equal(6);

        o.$dispose();
    });

});
