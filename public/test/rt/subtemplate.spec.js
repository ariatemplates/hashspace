
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

var hsp=require("hsp/rt");
var json=require("hsp/json");

/***
# template content(label, value)
    {:label}: {value}
# /template
***/
var content = require("hsp/rt").template(["label", "value"], function(n) {
    return [n.$text({e1:[0,1,"label"],e2:[1,1,"value"]},["",1,": ",2])];
});


/***
# template test1(person)
    Before
    <#content label="First Name" value="{person.firstName}"/>
    After
# /template
***/
var test1 = require("hsp/rt").template(["person"], function(n) {
    return [
        n.$text(0,["Before "]),
        n.cpt([content,"content"],{e1:[1,2,"person","firstName"]},{"label":"First Name","value":["",1]},
0),
        n.$text(0,["After"])
    ];
});

/***
# template nameDetails(person)
    <#content value="{person.lastName}" label="Last Name"/>
    {if (person.firstName)}
        , 
        <#content label="First Name" value="{person.firstName}"/>
    {/if}
# /template
***/
var nameDetails = require("hsp/rt").template(["person"], function(n) {
    return [
        n.cpt([content,"content"],{e1:[1,2,"person","lastName"]},{"value":["",1],"label":"Last Name"},0),
        n.$if({e1:[1,2,"person","firstName"]},1,[
            n.$text(0,[",  "]),
            n.cpt([content,"content"],{e1:[1,2,"person","firstName"]},{"label":"First Name","value":["",1]},0)
        ])
    ];
});

/***
# template test2(p)
    <#nameDetails person="{p}"/>
# /template
***/
var test2 = require("hsp/rt").template(["p"], function(n) {
    return [
        n.cpt([nameDetails,"nameDetails"],{e1:[1,1,"p"]},{"person":["",1]},0)
    ];
});

/***
# template test3(person, label)
    // inserted template also has a label argument
    {label}
    <#content label="{person.firstName}" value="{:person.lastName}"/>
# /template
***/
var test3 = require("hsp/rt").template(["person","label"], function(n) {
    return [
        n.$text({e1:[1,1,"label"]},[" ",1," "]),
        n.cpt([content,"content"],{e1:[1,2,"person","firstName"],e2:[0,2,"person","lastName"]},
            {"label":["",1],"value":["",2]},0)
    ];
});

/***
# template test4(person)
    // insert with a JS function
    {concat(person.firstName, person.lastName)}
# /template
***/
var test4 = require("hsp/rt").template(["person"], function(n) {
    return [
        n.$insert({e1:[4,1,concat,1,2,1,3], e2:[1,2,"person","firstName"],e3:[1,2,"person","lastName"]},1)
    ];
});

function concat(a,b) {
    return a+": "+b;
}

/***
# template field(label,value)
    {label}
    <input type="text" value="{value}"/>
# /template
***/
var field = require("hsp/rt").template(["label", "value"], function(n) {
    return [
        n.$text({e1:[1,1,"label"]},["",1," "]),
        n.elt("input",{e1:[1,1,"value"]},{"type":"text","value":["",1]},0)
    ];
});

/***
# template test5(d)
    <#field label="Enter some text" value="{d.text}"/>
# /template
***/
var test5 = require("hsp/rt").template(["d"], function(n) {
    return [
        n.cpt([field,"field"],{e1:[1,2,"d","text"]},{"label":"Enter some text","value":["",1]},0)
    ];
});

/***
# template field2(attributes)
    Enter some text: 
    <input type="text" value="{attributes.value}"/>
# /template
***/
var field2 = require("hsp/rt").template(["attributes"], function(n) {
    return [
        n.$text(0,["Enter some text: "]),
        n.elt("input",{e1:[1,2,"attributes","value"]},{"type":"text","value":["",1]},0)
    ];
});

/***
# template test6(d)
    <#field2 attributes="{d.attributes}"/>
# /template
***/
var test6 = require("hsp/rt").template(["d"], function(n) {
    return [
        n.cpt([field2,"field2"],{e1:[1,2,"d","attributes"]},{"attributes":["",1]},0)
    ];
});

describe("Sub-template insertion", function () {
    it("tests a simple insertion", function () {
        var dm = {
            firstName : "Omer",
            lastName : "Simpson"
        };
        var n = test1(dm);
        var tn = n.childNodes[1].childNodes[0];

        expect(n.childNodes.length).toEqual(3);
        expect(n.node.childNodes.length).toEqual(3);
        expect(n.node.childNodes[1].nodeValue).toEqual("First Name: Omer");
        expect(tn.node.nodeValue).toEqual("First Name: Omer");

        n.$dispose();
        expect(tn.node).toEqual(null);
    });

    it("tests nested insertion with multiple template instances and data-model updates", function () {
        var dm = {
            firstName : "Omer",
            lastName : "Simpson"
        };
        var n = test2(dm);

        expect(n.childNodes.length).toEqual(1);
        expect(n.node.childNodes.length).toEqual(5);
        expect(n.node.childNodes[0].nodeValue).toEqual("Last Name: Simpson");
        expect(n.node.childNodes[3].nodeValue).toEqual("First Name: Omer");

        // update the data model
        json.set(dm, "firstName", "Marge");
        hsp.refresh();
        expect(n.node.childNodes[3].nodeValue).toEqual("First Name: Marge");

        json.set(dm, "firstName", null);
        hsp.refresh();
        expect(n.node.childNodes.length).toEqual(3);

        json.set(dm, "firstName", "Mickey");
        json.set(dm, "lastName", "Mouse");
        hsp.refresh();
        expect(n.node.childNodes.length).toEqual(5);
        expect(n.node.childNodes[0].nodeValue).toEqual("Last Name: Mouse");
        expect(n.node.childNodes[3].nodeValue).toEqual("First Name: Mickey");

        var n2 = n.childNodes[0].childNodes[1].childNodes[1].childNodes[0];
        expect(n2.node.nodeValue).toEqual("First Name: Mickey");

        n.$dispose();
        expect(n2.node).toEqual(null);
    });

    it("tests that nested template scope is isolated from the parent's template scope", function () {
        var dm = {
            firstName : "Omer",
            lastName : "Simpson"
        };
        var n = test3(dm, "Always look on the bright side of life");

        expect(n.node.childNodes.length).toEqual(2);
        expect(n.node.childNodes[0].nodeValue).toEqual(" Always look on the bright side of life ");
        expect(n.node.childNodes[1].nodeValue).toEqual("Omer: Simpson");

        n.$dispose();
    });

    it("tests insert with a JS function", function () {
        var dm = {
            firstName : "Omer",
            lastName : "Simpson"
        };
        var n = test4(dm);

        expect(n.node.childNodes.length).toEqual(1);
        expect(n.node.childNodes[0].nodeValue).toEqual("Omer: Simpson");
        n.$dispose();
    });

    it("tests insert no code injection with a JS function", function () {
        var dm = {
            firstName : "<b>Omer</b>",
            lastName : "Simpson"
        };
        var n = test4(dm);

        // <b> is not interpreted as a tag, but as &lt;b&gt;
        expect(n.node.childNodes.length).toEqual(1);
        expect(n.node.childNodes[0].nodeValue).toEqual("<b>Omer</b>: Simpson");
        n.$dispose();
    });

    it("tests template argument update", function () {
        var dm = {
            firstName : "Omer",
            lastName : "Simpson"
        };
        var n = test3(dm, "answer is?");

        expect(n.node.childNodes[0].nodeValue).toEqual(" answer is? ");

        n.updateArgument(1, "answer is 42");
        hsp.refresh();

        expect(n.node.childNodes[0].nodeValue).toEqual(" answer is 42 ");

        n.$dispose();
    });

    it("tests input data change from sub- to parent- template", function () {
        var dm = {
            text : "some text"
        };
        var n = test5(dm);

        var input = n.node.childNodes[1];
        expect(input.value).toEqual("some text");

        input.value = "foo";
        input.click(); // triggers change propagation

        // change must have been propagated to parent scope
        expect(dm.text).toEqual("foo");

        // check that the scope observer is properly disposed
        expect(n.childNodes[0]._scopeChgeCb).toNotEqual(null);
        n.$dispose();
        expect(n.childNodes).toEqual(null);
    });

    it("tests input data change from sub- to parent- template with object argument", function () {
        var dm = {
            attributes : {
                value : "some text"
            }
        };
        var n = test6(dm);

        var input = n.node.childNodes[1];
        expect(input.value).toEqual("some text");

        input.value = "bar";
        input.click(); // triggers change propagation

        // change must have been propagated to parent scope
        expect(dm.attributes.value).toEqual("bar");

        n.$dispose();
    });
    
    it("tests scope root data change", function () {
        var dm = {
            attributes : {
                value : "some text"
            }
        };
        var n = test6(dm);

        var input = n.node.childNodes[1];
        expect(input.value).toEqual("some text");

        // change the whole attributes object, which is a root
        // element in the scope of the field2 template
        json.set(dm, "attributes", {
            value : "new text"
        });
        hsp.refresh();

        expect(input.value).toEqual("new text");
        n.$dispose();
    });
});
