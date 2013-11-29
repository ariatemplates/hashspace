
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
# template inputSample(data)
    <div class="info section">All the following inputs are synchronized:</div>
    <div class="section">
        Comment #1: <input type="text" value="{data.comment}"/><br/>
        Comment #2: <input type="text" #model="{data.comment}"/><br/>
        Comment #3: <span class="inputText">{data.comment}</span><br/>
    </div>
    <div class="section">
        <input id="cb1" type="checkbox" value="{data.isChecked}"/>
        <label for="cb1">Check me!</label> -
        <input id="cb2" type="checkbox" #model="{data.isChecked}"/>
        <label for="cb2">Check me (2)!</label> -
        Checked: <span class="textValue">{data.isChecked}</span>
    </div>
    <div class="section">
        <input id="rb1" type="radio" #model="{data.selection}" value="A"/>
        <label for="rb1">Select A</label> -
        <input id="rb2" type="radio" #model="{data.selection}" value="B"/>
        <label for="rb2">Select B</label> -
        <input id="rb3" type="radio" #model="{data.selection}" value="C"/>
        <label for="rb3">Select C</label> -
        Selection in model: <span class="textValue">{data.selection}</span>
    </div>
# /template
***/
var inputSample = require("hsp/rt").template(["data"], function (n) {
    return [n.elt("div", 0, {
                "class" : "info section"
            }, 0, [n.$text(0, ["All the following inputs are synchronized:"])]), n.elt("div", 0, {
                "class" : "section"
            }, 0, [n.$text(0, ["Comment #1: "]), n.elt("input", {
                        e1 : [1, 2, "data", "comment"]
                    }, {
                        "type" : "text",
                        "value" : ["", 1]
                    }, 0), n.elt("br", 0, 0, 0), n.$text(0, ["Comment #2: "]), n.elt("input", {
                        e1 : [1, 2, "data", "comment"]
                    }, {
                        "type" : "text",
                        "#model" : ["", 1]
                    }, 0), n.elt("br", 0, 0, 0), n.$text(0, ["Comment #3: "]), n.elt("span", 0, {
                        "class" : "inputText"
                    }, 0, [n.$text({
                        e1 : [1, 2, "data", "comment"]
                    }, ["", 1])]), n.elt("br", 0, 0, 0)]), n.elt("div", 0, {
                "class" : "section"
            }, 0, [ n.elt("input", {
                        e1 : [1, 2, "data", "isChecked"]
                    }, {
                        "id" : "cb1",
                        "type" : "checkbox",
                        "value" : ["", 1]
                    }, 0), n.elt("label", 0, {
                        "for" : "cb1"
                    }, 0, [n.$text(0, ["Check me!"])]), n.$text(0, [" - "]), n.elt("input", {
                        e1 : [1, 2, "data", "isChecked"]
                    }, {
                        "id" : "cb2",
                        "type" : "checkbox",
                        "#model" : ["", 1]
                    }, 0), n.elt("label", 0, {
                        "for" : "cb2"
                    }, 0, [n.$text(0, ["Check me (2)!"])]), n.$text(0, [" - Checked: "]), n.elt("span", 0, {
                        "class" : "textValue"
                    }, 0, [n.$text({
                        e1 : [1, 2, "data", "isChecked"]
                    }, ["", 1])])]), n.elt("div", 0, {
                "class" : "section"
            }, 0, [ n.elt("input", {
                        e1 : [1, 2, "data", "selection"]
                    }, {
                        "id" : "rb1",
                        "type" : "radio",
                        "#model" : ["", 1],
                        "value" : "A"
                    }, 0), n.elt("label", 0, {
                        "for" : "rb1"
                    }, 0, [n.$text(0, ["Select A"])]), n.$text(0, [" - "]), n.elt("input", {
                        e1 : [1, 2, "data", "selection"]
                    }, {
                        "id" : "rb2",
                        "type" : "radio",
                        "#model" : ["", 1],
                        "value" : "B"
                    }, 0), n.elt("label", 0, {
                        "for" : "rb2"
                    }, 0, [n.$text(0, ["Select B"])]), n.$text(0, [" - "]), n.elt("input", {
                        e1 : [1, 2, "data", "selection"]
                    }, {
                        "id" : "rb3",
                        "type" : "radio",
                        "#model" : ["", 1],
                        "value" : "C"
                    }, 0), n.elt("label", 0, {
                        "for" : "rb3"
                    }, 0, [n.$text(0, ["Select C"])]), n.$text(0, [" - Selection in model: "]), n.elt("span", 0, {
                        "class" : "textValue"
                    }, 0, [n.$text({
                        e1 : [1, 2, "data", "selection"]
                    }, ["", 1])])])];
});


describe("Input Elements", function () {
    it("validates text elements", function () {
        var v1 = "edit me!";
        var d = {
            comment : v1,
            isChecked : false,
            selection : "B"
        };
        var n = inputSample(d);

        var input1 = n.childNodes[1].childNodes[1];
        var input2 = n.childNodes[1].childNodes[4];

        expect(input1.node.value).toEqual(v1);
        expect(input2.node.value).toEqual(v1);

        // change value from the model
        var v2 = "foo";
        json.set(d, "comment", v2);
        hsp.refresh();
        expect(input1.node.value).toEqual(v2);
        expect(input2.node.value).toEqual(v2);

        // change the value from input1 (value attribute)
        var v3 = "bar";
        input1.node.value = v3;
        input1.node.click(); // to simulate change
        expect(input1.node.value).toEqual(v3);
        expect(input2.node.value).toEqual(v3);
        expect(d.comment).toEqual(v3);

        // change the value from input2 (#model attribute)
        var v4 = "blah";
        input2.node.value = v4;
        input2.node.click(); // to simulate change
        expect(input1.node.value).toEqual(v4);
        expect(input2.node.value).toEqual(v4);
        expect(d.comment).toEqual(v4);

        n.$dispose();
    });

    it("validates checkbox elements", function () {
        var d = {
            comment : "foo",
            isChecked : true,
            selection : "B"
        };
        var n = inputSample(d);

        var cb1 = n.childNodes[2].childNodes[0];
        var cb2 = n.childNodes[2].childNodes[3];

        expect(cb1.node.checked).toEqual(true);
        expect(cb2.node.checked).toEqual(true);

        // change from data model

        json.set(d, "isChecked", false);
        hsp.refresh();
        expect(cb1.node.checked).toEqual(false);
        expect(cb2.node.checked).toEqual(false);
        expect(d.isChecked).toEqual(false);

        // change from cb1 (value reference)
        cb1.node.click();
        if (cb1.node.checked) {
            // on firefox calling click doesn't trigger the onclick event!?
            expect(cb1.node.checked).toEqual(true);
            expect(cb2.node.checked).toEqual(true);
            expect(d.isChecked).toEqual(true);
        }

        // change from cb2 (#model reference)
        cb2.node.click();
        expect(cb1.node.checked).toEqual(false);
        expect(cb2.node.checked).toEqual(false);
        expect(d.isChecked).toEqual(false);

        n.$dispose();
    });

    it("validates radio elements", function () {
        var d = {
            comment : "foo",
            isChecked : true,
            selection : "B"
        };
        var n = inputSample(d);

        var rb1 = n.childNodes[3].childNodes[0];
        var rb2 = n.childNodes[3].childNodes[3];

        expect(rb1.node.checked).toEqual(false);
        expect(rb2.node.checked).toEqual(true);

        // change from data model
        json.set(d, "selection", "C");
        hsp.refresh();
        expect(rb1.node.checked).toEqual(false);
        expect(rb2.node.checked).toEqual(false);

        // change from rb1
        rb1.node.click();
        expect(rb1.node.checked).toEqual(true);
        expect(rb2.node.checked).toEqual(false);
        expect(d.selection).toEqual("A");

        n.$dispose();
    });

});
