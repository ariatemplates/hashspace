
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


/***
# template test1(person,ctl)
    <div title="test1" onclick="{ctl.handleClick()}">
        Hello {person.name}!
    </div>
# /template
***/
var test1 = require("hsp/rt").template(["person","ctl"], function(n) {
    return [
        n.elt(
            "div",
            {e1:[3,2,"ctl","handleClick"]},
            {"title":"test1"},
            {"click":1},
            [n.$text({e1:[1,2,"person","name"]},["Hello ",1,"!"])]
        )
    ];
});

/***
# template test2(label,names,ctl)
    # foreach (name in names)
        <span onclick="{ctl.handleClick(name,name_key,"literal arg",event)}">
            {:label} {name_key}: {:name}
        </span>
    # /foreach
# /template
***/
var test2 = require("hsp/rt").template(["label","names","ctl"], function(n) {
    return [
        n.$foreach(
            {e1:[1,1,"names"]},
            "name_key",
            "name", // name of the loop variable that should be created
            0, // for type: 0=in / 1=of / 2=on
            1, // index of the collection expression
            [
                n.elt(
                    "span",
                    {e1:[3,2,"ctl","handleClick",1,2,1,3,0,"literal arg",1,4],e2:[0,1,"name"],e3:[0,1,"name_key"],e4:[0,1,"event"]},
                    0,
                    {"click":1},
                    [n.$text({e1:[0,1,"label"],e2:[1,1,"name_key"],e3:[0,1,"name"]},["",1," ",2,": ",3])]
                )
            ]
        )
    ];
});

/***
# template test3(person)
    <div title="test3" onclick="{doClick('blah',event)}">
        Hello {person.name}!
    </div>
# /template
***/

var test3 = require("hsp/rt").template(["person","ctl"], function(n) {
    return [
        n.elt(
            "div",
            {e1:[4,1,doClick,0,'blah',1,2],e2:[0,1,"event"]},
            {"title":"test3"},
            {"click":1},
            [n.$text({e1:[1,2,"person","name"]},["Hello ",1,"!"])]
        )
    ];
});


/***
# template test4()
    <img onclick="this.cbatt=123;return false;"/>
# /template
***/
var test4 = require("hsp/rt").template([], function(n) {
    return [
        n.elt("img",
            0,
            0,
            {"click":"this.cbatt=123;return false;"}
        )
    ];
});


var doClickCount = 0, doClickEvtType = "", doClickStrArg = "";
function doClick (str, evt) {
    doClickCount++;
    doClickEvtType = evt.type;
    doClickStrArg = str;
}


describe("Event Handlers", function () {
    function test2SpanNode (n, idx) {
        return n.node.childNodes[1 + idx * 3 + 1];
    }

    function test2SpanValue (n, idx) {
        // return the value of the text node in the span
        return test2SpanNode(n, idx).childNodes[0].nodeValue;
    }

    it("tests a simple event handler", function () {
        var dm = {
            name : "Omer"
        };
        var count = 0;
        var lastArg;
        var ctl = {
            handleClick : function (arg) {
                count++;
                lastArg = arg;
            }
        };
        var n = test1(dm, ctl);
        expect(n.node.firstChild.firstChild.nodeValue).toEqual("Hello Omer!");
        expect(count).toEqual(0);

        n.node.firstChild.click();
        expect(count).toEqual(1);
        expect(lastArg).toEqual(undefined);

        n.$dispose();
    });

    it("tests handlers on loop elements with contectual args", function () {
        var count = 0;
        var lastName = "";
        var lastIdx = -1;
        var lastStrArg = "";
        var lastEvtType = null;

        var ctl = {
            handleClick : function (name, idx, strArg, evt) {
                count++;
                lastName = name;
                lastIdx = idx;
                lastStrArg = strArg;
                lastEvtType = evt.type;
            }
        };
        var ds = ["Omer", "Marge", "Bart", "Lisa", "Maggie"];
        var n = test2("index", ds, ctl);

        expect(test2SpanValue(n, 1)).toEqual("index 1: Marge");
        expect(test2SpanValue(n, 3)).toEqual("index 3: Lisa");
        expect(count).toEqual(0);

        test2SpanNode(n, 1).click();

        expect(count).toEqual(1);
        expect(lastName).toEqual("Marge");
        expect(lastIdx).toEqual(1);
        expect(lastStrArg).toEqual("literal arg");
        expect(lastEvtType).toEqual("click");

        test2SpanNode(n, 3).click();

        expect(count).toEqual(2);
        expect(lastName).toEqual("Lisa");
        expect(lastIdx).toEqual(3);
        expect(lastStrArg).toEqual("literal arg");
        expect(lastEvtType).toEqual("click");

        n.$dispose();
    });

    it("tests global scope handler function", function () {
        var dm = {
            name : "Omer"
        };
        var n = test3(dm);

        expect(n.node.firstChild.firstChild.nodeValue).toEqual("Hello Omer!");
        expect(doClickCount).toEqual(0);

        n.node.firstChild.click();
        expect(doClickCount).toEqual(1);
        expect(doClickStrArg).toEqual("blah");

        n.$dispose();
    });

    it("tests standard html event handlers", function () {
        var n = test4();
        var img = n.node.firstChild;
        expect(img.cbatt).toEqual(undefined);
        img.click();
        expect(img.cbatt).toEqual(123);
        n.$dispose();
    });

});
