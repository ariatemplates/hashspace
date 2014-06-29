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

var hsp = require("hsp/rt"),
    ht=require("hsp/utils/hashtester");

var orderBy = hsp.global.orderBy,
    Sorter = hsp.global.Sorter;

describe("Collection utils", function () {

    var h, people = [
        {name:"Homer", age:38},
        {name:"Marge", age:38},
        {name:"Bart", age:10},
        {name:"Lisa", age:8},
        {name:"Maggie", age:1}
    ];

    var ageSort=function(a,b) {
        var v1=a.age, v2=b.age;
        if (v1>v2) {
            return 1;
        } else {
            return v1==v2? 0 : -1;
        }
    };

    beforeEach(function () {
         h=ht.newTestContext();
     });

    afterEach(function () {
        h.$dispose();
    });

    it("should log an error when wrong array type is passed to orderBy()", function () {
        var r=orderBy({"0":"A","1":"B"},"name");

        expect(r.length).to.equal(0);
        expect(r).not.to.equal(people);
        expect(h.logs().length).to.equal(1);
        expect(h.logs(0).message).to.equal("[orderBy()] array argument must be of type Array");
        h.logs.clear();
    });

    it("should log an error when wrong expression is passed to orderBy()", function () {
        var r=orderBy(people,123);

        expect(r.length).to.equal(5);
        expect(r).not.to.equal(people);
        expect(h.logs().length).to.equal(1);
        expect(h.logs(0).message).to.equal("[orderBy()] Invalid expression argument: 123");
        h.logs.clear();
    });

    it("validates orderBy() with property expression", function () {
        var r=orderBy(people,"name");

        expect(r.length).to.equal(5);
        expect(r).not.to.equal(people);
        expect(r[0].name).to.equal("Bart");
        expect(r[1].name).to.equal("Homer");
        expect(r[2].name).to.equal("Lisa");
        expect(r[3].name).to.equal("Maggie");
        expect(r[4].name).to.equal("Marge");
    });

    it("validates orderBy() with property expression + reverse order", function () {
        var r=orderBy(people,"name",true);

        expect(r.length).to.equal(5);
        expect(r).not.to.equal(people);
        expect(r[4].name).to.equal("Bart");
        expect(r[3].name).to.equal("Homer");
        expect(r[2].name).to.equal("Lisa");
        expect(r[1].name).to.equal("Maggie");
        expect(r[0].name).to.equal("Marge");
    });

    it("validates orderBy() with property expression and missing properties", function () {
        var p=people.slice(0); // clone
        p[1]={firsName:"Marge"}; // no name
        var r=orderBy(p,"name");

        expect(r.length).to.equal(5);
        expect(r).not.to.equal(people);
        expect(r[0].firsName).to.equal("Marge");
        expect(r[1].name).to.equal("Bart");
        expect(r[2].name).to.equal("Homer");
        expect(r[3].name).to.equal("Lisa");
        expect(r[4].name).to.equal("Maggie");
    });

    it("validates orderBy() with function expression", function () {
        var r=orderBy(people,ageSort);

        expect(r.length).to.equal(5);
        expect(r).not.to.equal(people);
        expect(r[0].name).to.equal("Maggie");
        expect(r[1].name).to.equal("Lisa");
        expect(r[2].name).to.equal("Bart");
        expect(r[3].name).to.equal("Homer");
        expect(r[4].name).to.equal("Marge");
    });

    it("validates orderBy() with function expression + reverse order", function () {
        var r=orderBy(people,ageSort,true);

        expect(r.length).to.equal(5);
        expect(r).not.to.equal(people);
        expect(r[4].name).to.equal("Maggie");
        expect(r[3].name).to.equal("Lisa");
        expect(r[2].name).to.equal("Bart");
        expect(r[0].name).to.equal("Homer"); // first in original array and similar age to Marge
        expect(r[1].name).to.equal("Marge");
    });

    it("should log an error when Sorter constructor is called with an invalid sort function option", function () {
        var sorter=new Sorter({sortFunction:"foo",states:"AD"});

        expect(sorter.state).to.equal("N");
        expect(sorter.states.join('')).to.equal("N");
        
        expect(h.logs().length).to.equal(1);
        expect(h.logs(0).message).to.equal("[Sorter] Sort function must be a function: foo");
        h.logs.clear();
    });

    it("should log an error when Sorter constructor is called with an invalid sort property option", function () {
        var sorter=new Sorter({property:123,states:"AD"});

        expect(sorter.state).to.equal("N");
        expect(sorter.states.join('')).to.equal("N");
        
        expect(h.logs().length).to.equal(1);
        expect(h.logs(0).message).to.equal("[Sorter] Sort property must be a string: 123");
        h.logs.clear();
    });

    it("should log an error when Sorter constructor is called with an invalid states option type", function () {
        var sorter=new Sorter({property:"name",states:123});

        expect(sorter.state).to.equal("N");
        expect(sorter.states.join('')).to.equal("NAD");
        
        expect(h.logs().length).to.equal(1);
        expect(h.logs(0).message).to.equal("[Sorter] states option must be a string: 123");
        h.logs.clear();
    });

    it("should log an error when Sorter constructor is called with an invalid states option value", function () {
        var sorter=new Sorter({property:"name",states:"AXN"});

        expect(sorter.state).to.equal("A");
        expect(sorter.states.join('')).to.equal("AN");
        
        expect(h.logs().length).to.equal(1);
        expect(h.logs(0).message).to.equal("[Sorter] Invalid state code: X");
        h.logs.clear();
    });

    it("validates Sorter with sort property and default states", function () {
        var sorter=new Sorter({property:"name"});

        expect(sorter.state).to.equal("N");

        var r=sorter.apply(people);
        expect(r.length).to.equal(5);
        expect(r).not.to.equal(people);
        expect(r[0].name).to.equal("Homer");
        expect(r[1].name).to.equal("Marge");
        expect(r[2].name).to.equal("Bart");
        expect(r[3].name).to.equal("Lisa");
        expect(r[4].name).to.equal("Maggie");

        // change state
        sorter.nextState();
        expect(sorter.state).to.equal("A");
        r=sorter.apply(people);
        expect(r.length).to.equal(5);
        expect(r).not.to.equal(people);
        expect(r[0].name).to.equal("Bart");
        expect(r[1].name).to.equal("Homer");
        expect(r[2].name).to.equal("Lisa");
        expect(r[3].name).to.equal("Maggie");
        expect(r[4].name).to.equal("Marge");

        // change state
        sorter.nextState();
        expect(sorter.state).to.equal("D");
        r=sorter.apply(people);
        expect(r.length).to.equal(5);
        expect(r).not.to.equal(people);
        expect(r[4].name).to.equal("Bart");
        expect(r[3].name).to.equal("Homer");
        expect(r[2].name).to.equal("Lisa");
        expect(r[1].name).to.equal("Maggie");
        expect(r[0].name).to.equal("Marge");

        // change state
        sorter.nextState();
        expect(sorter.state).to.equal("N");
    });

    it("validates Sorter with sort function and AD states", function () {
        var sorter=new Sorter({property:"name",sortFunction:ageSort,states:"AD"}); // property will be ignored

        expect(sorter.state).to.equal("A");

        var r=sorter.apply(people);
        expect(r.length).to.equal(5);
        expect(r).not.to.equal(people);
        expect(r[0].name).to.equal("Maggie");
        expect(r[1].name).to.equal("Lisa");
        expect(r[2].name).to.equal("Bart");
        expect(r[3].name).to.equal("Homer");
        expect(r[4].name).to.equal("Marge");

        // change state
        sorter.nextState();
        expect(sorter.state).to.equal("D");
        r=sorter.apply(people);
        expect(r[4].name).to.equal("Maggie");
        expect(r[3].name).to.equal("Lisa");
        expect(r[2].name).to.equal("Bart");
        expect(r[0].name).to.equal("Homer"); // first in original array and similar age to Marge
        expect(r[1].name).to.equal("Marge");

        // change state
        sorter.nextState();
        expect(sorter.state).to.equal("A");
    });

    it("validates Sorter.setState()", function () {
        var sorter=new Sorter({property:"name"});

        sorter.setState("A");
        expect(sorter.state).to.equal("A");
        var r=sorter.apply(people);
        expect(r.length).to.equal(5);
        expect(r).not.to.equal(people);
        expect(r[0].name).to.equal("Bart");
        expect(r[1].name).to.equal("Homer");
        expect(r[2].name).to.equal("Lisa");
        expect(r[3].name).to.equal("Maggie");
        expect(r[4].name).to.equal("Marge");
    });

    it("should log an error when Sorter.setState() is called with an invalid argument", function () {
        var sorter=new Sorter({property:"name",states:"AD"});

        sorter.setState("N");
        expect(sorter.state).to.equal("A");
        expect(h.logs().length).to.equal(1);
        expect(h.logs(0).message).to.equal("[Sorter.setState] state argument 'N' is not part of the possible states 'AD'");
        h.logs.clear();
    });

    it("should log an error when Sorter.apply() is called with an invalid argument", function () {
        var sorter=new Sorter({property:"name",states:"AD"});

        var r=sorter.apply(123);
        expect(r.length).to.equal(0);
        expect(h.logs().length).to.equal(1);
        expect(h.logs(0).message).to.equal("[Sorter.apply()] array argument must be of type Array");
        h.logs.clear();
    });

});