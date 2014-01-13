
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

var hsp=require("hsp/rt"),
    json=require("hsp/json"),
    doc=require("hsp/document"),
    ht=require("hsp/utils/hashtester");

/***
# template test1(label,names)
    {foreach (name in names)}
        <span class="name">
            {label} {name_key}: {name} ({:name.length} chars)
        </span>
        {if (name_islast)}
            Number of items: {:names.length}
        {/if}
    {/foreach}
# /template
***/
var test1 = require("hsp/rt").template(["label","names"], function(n) {
    return [
        n.$foreach(
            {e1:[1,1,"names"]},
            "name_key",
            "name", // name of the loop variable that should be created
            0,      // for type: 0=in / 1=of / 2=on
            1,        // index of the collection expression
            [
                n.elt(
                    "span",
                    0,
                    {"class":"name"},
                    0,
                    [n.$text({e1:[0,1,"label"],e2:[1,1,"name_key"],e3:[0,1,"name"],e4:[0,2,"name","length"]},["",1," ",2,": ",3," (",4," chars)"])]
                ),
                n.$if(
                    {e1:[1,1,"name_islast"]},
                    1,
                    [n.$text({e1:[0,2,"names","length"]},["Number of items: ",1])]
                )
            ]
        )
    ];
});

/***
# template test2(ds)
    {foreach idx,person in ds.persons}
        Person #{idx}: {person.firstName} {person.lastName}
        {if (person_isfirst)}
            (first)
        {/if}
        {if (person_islast)}
            (last)
        {/if}
    {/foreach}
# /template
***/
var test2 = require("hsp/rt").template(["ds"], function(n) {
    return [
        n.$foreach(
            {e1:[1,2,"ds","persons"]},
            "idx",
            "person", // name of the loop variable that should be created
            0,      // for type: 0=in / 1=of / 2=on
            1,        // index of the collection expression
            [
                n.$text({e1:[1,1,"idx"],e2:[1,2,"person","firstName"],e3:[1,2,"person","lastName"],e4:[0,2,"name","length"]},["Person #",1,": ",2," ",3]),
                n.$if(
                    {e1:[1,1,"person_isfirst"]},
                    1,
                    [n.$text(0,["(first)"])]
                ),
                n.$if(
                    {e1:[1,1,"person_islast"]},
                    1,
                    [n.$text(0,["(last)"])]
                )
            ]
        )
    ];
});

/***
# template test3(things) 
    {foreach (oneThing in things)}
        {oneThing}
    {/foreach}
# /template
***/
var test3 = require("hsp/rt").template(["things"], function(n) {
    return [
        n.$foreach(
            {e1: [1,1,"things"]},
            "oneThing_key",
            "oneThing",
            0,
            1,
            [
                n.$text(0, ["      "]),
                n.$text({e1: [1,1,"oneThing"]}, ["", 1]),
                n.$text(0, ["\n    "])
            ]
        )
    ];
});

/***
# template test4(things)
    {foreach oneThing in things}
        {if oneThing_isfirst}
            First
        {else}
            {if oneThing_islast}
                and last
            {else}
                then
            {/if}
        {/if}
        {oneThing}
        <br/>
    {/foreach}
# /template
***/
var test4 = require("hsp/rt").template(["things"], function(n) {
    return [
        n.$foreach(
            {e1: [1,1,"things"]},
            "oneThing_key",
            "oneThing",
            0,
            1,
            [
                n.$if(
                    {e1: [1,1,"oneThing_isfirst"]},
                    1,
                    [n.$text(0,["First "])],
                    [
                        n.$if(
                            {e1: [1,1,"oneThing_islast"]},
                            1,
                            [n.$text(0, [" and last "])],
                            [n.$text(0, [" then "])]
                        )
                    ]
                ),
                n.$text({e1: [1,1,"oneThing"]}, ["", 1])
            ]
        )
    ];
});

/***
# template test5(persons) 
    {foreach person in persons)}
        {person.name}
    {/foreach}
# /template
***/
var test5 = require("hsp/rt").template(["persons"], function(n) {
    return [
        n.$foreach(
            {e1: [1,1,"persons"]},
            "person_key",
            "person",
            0,
            1,
            [n.$text({e1: [1,2,"person","name"]}, ["", 1])]
        )
    ];
});

/***
# template test6(itemsList)
    {foreach item in itemsList}
        {if item.edit}
            <input type="text" value="{item.value}"></input>
        {else}
            <span>{item.value}</span>
        {/if}
    {/foreach}
# /template
***/
var test6 = require("hsp/rt").template(["itemsList"], function(n){
    return [n.$foreach({e1:[1,1,"itemsList"]},"item_key","item",0,1,[n.$if({e1:[1,2,"item","edit"]},1,[n.elt("input",{e1:[1,2,"item","value"]},{"type":"text","value":["",1]},0)],[n.elt("span",0,0,0,[n.$text({e1:[1,2,"item","value"]},["",1])])])])];
});

describe("ForEach Node", function () {
    function test1Count (arrayLength) {
        // return number of items produced by test 1
        return 1 + arrayLength * 5 + 1 + 1;
    }

    function test1SpanValue (n, idx) {
        // return the value of the text node in the span
        return test1SpanNodeValue(n.node, idx);
    }

    function test1SpanNodeValue (node, idx) {
        // return the value of the text node in the span
        return node.childNodes[1 + idx * 5 + 1].childNodes[0].nodeValue;
    }

    function test2Count (arrayLength) {
        // return number of items produced by test 2
        return 1 + arrayLength * 7 + 2 + 1;
    }

    function test2NodeValue (n, forIdx, nodeIdx) {
        // return the text value in the node associated to the parameters
        var firstIf = (forIdx === 0) ? 0 : 1;
        return n.node.childNodes[1 + forIdx * 7 + firstIf + nodeIdx].nodeValue;
    }

    function domToString (node) {
        var arr = [], cn = node.childNodes;
        for (var i = 0, sz = cn.length; sz > i; i++) {
            arr.push(cn[i].nodeValue);
        }
        return arr.join("+");
    }

    it("tests a simple loop on a literal array", function () {
        var ds = ["Omer", "Marge", "Bart", "Lisa", "Maggie"];
        var n = test1("index", ds);

        var elt = doc.createElement("div");
        n.render(elt);

        expect(test1SpanNodeValue(elt, 1)).toEqual("index 1: Marge (5 chars)");
        expect(test1SpanNodeValue(elt, 3)).toEqual("index 3: Lisa (4 chars)");
        expect(elt.childNodes[1 + 4 * 5 + 3].nodeValue).toEqual("Number of items: 5"); // last if content

        var nd = n.childNodes[0].childNodes[2].childNodes[0].childNodes[0]; // text node for Bart
        expect(nd.node.nodeValue).toEqual("index 2: Bart (4 chars)");

        n.$dispose();
        expect(nd.node).toEqual(null);
    });

    it("tests deleteItem", function () {
        var ds = ["Omer", "Marge", "Bart", "Lisa", "Maggie"];
        var n = test1("index", ds);

        expect(n.node.childNodes.length).toEqual(1 + 5 * 5 + 1 + 1);
        expect(test1SpanValue(n, 1)).toEqual("index 1: Marge (5 chars)");

        var idx = n.childNodes[0].deleteItem(1);
        hsp.refresh();
        expect(n.node.childNodes.length).toEqual(1 + 4 * 5 + 1 + 1);
        expect(idx).toEqual(1 + 5 - 1);
        expect(test1SpanValue(n, 1)).toEqual("index 1: Bart (4 chars)");

        n.$dispose();
    });

    it("tests moveItem", function () {
        var ds = ["Omer", "Marge", "Bart", "Lisa", "Maggie"];
        var n = test1("index", ds);

        var elt = doc.createElement("div");
        n.render(elt);

        n.childNodes[0].moveItem(3, 1); // Lisa should replace Marge
        hsp.refresh();
        // new displayed array: ["Omer","Lisa","Marge","Bart","Maggie"]
        expect(n.node.childNodes.length).toEqual(test1Count(5));
        expect(test1SpanNodeValue(elt, 1)).toEqual("index 1: Lisa (4 chars)");
        expect(test1SpanNodeValue(elt, 2)).toEqual("index 2: Marge (5 chars)");
        expect(test1SpanNodeValue(elt, 3)).toEqual("index 3: Bart (4 chars)");

        n.childNodes[0].moveItem(0, 4); // Omer should replace Maggie
        hsp.refresh();
        // new displayed array: ["Lisa","Marge","Bart","Maggie","Omer"]
        expect(n.childNodes[0].childNodes.length).toEqual(5);
        expect(n.node.childNodes.length).toEqual(test1Count(5));
        expect(test1SpanNodeValue(elt, 0)).toEqual("index 0: Lisa (4 chars)");
        expect(test1SpanNodeValue(elt, 1)).toEqual("index 1: Marge (5 chars)");
        expect(test1SpanNodeValue(elt, 3)).toEqual("index 3: Maggie (6 chars)");
        expect(test1SpanNodeValue(elt, 4)).toEqual("index 4: Omer (4 chars)");

        n.$dispose();
    });

    it("tests item change on a literal array", function () {
        var ds = ["Omer", "Marge", "Bart", "Lisa", "Maggie"];
        var n = test1("index", ds);

        expect(test1SpanValue(n, 3)).toEqual("index 3: Lisa (4 chars)");

        // item change: ["Omer","Marge","Bart","LISA","Maggie"]
        json.set(ds, 3, "LISA");
        hsp.refresh();
        expect(n.childNodes[0].childNodes.length).toEqual(5);
        expect(n.node.childNodes.length).toEqual(test1Count(5));
        expect(test1SpanValue(n, 3)).toEqual("index 3: LISA (4 chars)");

        n.$dispose();
    });

    it("tests item move on a literal array", function () {
        var ds = ["Omer", "Marge", "Bart", "LISA", "Maggie"];
        var n = test1("index", ds);

        // item move: ["Omer","Maggie","Marge","LISA","BART"]
        ds.splice(1, 0, "Maggie");
        ds.splice(3, 1);
        ds.splice(4, 1, "BART");
        hsp.refresh();

        expect(n.childNodes[0].childNodes.length).toEqual(5);
        expect(n.node.childNodes.length).toEqual(test1Count(5));
        expect(test1SpanValue(n, 0)).toEqual("index 0: Omer (4 chars)");
        expect(test1SpanValue(n, 1)).toEqual("index 1: Maggie (6 chars)");
        expect(test1SpanValue(n, 2)).toEqual("index 2: Marge (5 chars)");
        expect(test1SpanValue(n, 3)).toEqual("index 3: LISA (4 chars)");
        expect(test1SpanValue(n, 4)).toEqual("index 4: BART (4 chars)");

        n.$dispose();
    });

    it("tests item delete on a literal array", function () {
        var ds = ["Omer", "Maggie", "Marge", "LISA", "BART"];
        var n = test1("index", ds);

        // delete item: ["Omer","Marge"]
        ds.splice(3, 2);
        ds.splice(1, 1);
        hsp.refresh();
        expect(n.childNodes[0].childNodes.length).toEqual(2);
        expect(n.node.childNodes.length).toEqual(test1Count(2));
        expect(test1SpanValue(n, 0)).toEqual("index 0: Omer (4 chars)");
        expect(test1SpanValue(n, 1)).toEqual("index 1: Marge (5 chars)");

        n.$dispose();
    });

    it("tests item insert on a literal array", function () {
        var ds = ["Omer", "Marge"];
        var n = test1("index", ds);

        var elt = doc.createElement("div");
        n.render(elt);

        // new array: ["Omer", "Bart", "Lisa", "Marge"]
        ds.splice(1, 0, "Bart", "Lisa");
        hsp.refresh();
        expect(n.childNodes[0].childNodes.length).toEqual(4);
        expect(n.node.childNodes.length).toEqual(test1Count(4));
        expect(test1SpanNodeValue(elt, 0)).toEqual("index 0: Omer (4 chars)");
        expect(test1SpanNodeValue(elt, 1)).toEqual("index 1: Bart (4 chars)");
        expect(test1SpanNodeValue(elt, 2)).toEqual("index 2: Lisa (4 chars)");
        expect(test1SpanNodeValue(elt, 3)).toEqual("index 3: Marge (5 chars)");

        n.$dispose();
    });

    it("tests append on a literal array", function () {
        var ds = ["Omer", "Marge"];
        var n = test1("index", ds);

        // insert item: ["Omer", "Marge", "Bart"]
        ds.push("Bart");
        hsp.refresh();
        expect(n.childNodes[0].childNodes.length).toEqual(3);
        expect(n.node.childNodes.length).toEqual(test1Count(3));
        expect(test1SpanValue(n, 0)).toEqual("index 0: Omer (4 chars)");
        expect(test1SpanValue(n, 1)).toEqual("index 1: Marge (5 chars)");
        expect(test1SpanValue(n, 2)).toEqual("index 2: Bart (4 chars)");

        n.$dispose();
    });

    it("tests shift on a literal array", function () {
        var ds = ["Omer", "Bart", "Lisa", "Marge", "Maggie"];
        var n = test1("index", ds);

        var elt = doc.createElement("div");
        n.render(elt);

        // new item: ["Bart", "Lisa", "Marge", "Maggie"]
        ds.shift();
        hsp.refresh();
        expect(n.childNodes[0].childNodes.length).toEqual(4);
        expect(n.node.childNodes.length).toEqual(test1Count(4));
        expect(test1SpanNodeValue(elt, 0)).toEqual("index 0: Bart (4 chars)");
        expect(test1SpanNodeValue(elt, 1)).toEqual("index 1: Lisa (4 chars)");
        expect(test1SpanNodeValue(elt, 2)).toEqual("index 2: Marge (5 chars)");
        expect(test1SpanNodeValue(elt, 3)).toEqual("index 3: Maggie (6 chars)");

        ds.shift();
        hsp.refresh();
        expect(n.childNodes[0].childNodes.length).toEqual(3);
        expect(n.node.childNodes.length).toEqual(test1Count(3));
        expect(test1SpanNodeValue(elt, 0)).toEqual("index 0: Lisa (4 chars)");

        n.$dispose();
    });

    it("tests literal array with null items", function () {
        var ds = ["Omer", null, "Marge", null];
        var n = test1("index", ds);

        expect(n.childNodes[0].childNodes.length).toEqual(2);
        expect(n.node.childNodes.length).toEqual(test1Count(2) - 1);
        expect(test1SpanValue(n, 0)).toEqual("index 0: Omer (4 chars)");
        expect(test1SpanValue(n, 1)).toEqual("index 1: Marge (5 chars)");
        n.$dispose();
    });

    it("tests literal array update with null items", function () {
        var ds = ["Omer", "Marge", "Bart", "Lisa"];
        var n = test1("index", ds);

        json.set(ds, 2, null); // ["Omer", "Marge", null, "Lisa"]
        hsp.refresh();

        expect(n.childNodes[0].childNodes.length).toEqual(3);
        expect(n.node.childNodes.length).toEqual(test1Count(3));
        expect(test1SpanValue(n, 0)).toEqual("index 0: Omer (4 chars)");
        expect(test1SpanValue(n, 1)).toEqual("index 1: Marge (5 chars)");
        expect(test1SpanValue(n, 2)).toEqual("index 2: Lisa (4 chars)");
        n.$dispose();
    });

    it("tests a simple loop on an object array", function () {
        var ds = {
            persons : [{
                        firstName : "Omer",
                        lastName : "Simpson"
                    }, {
                        firstName : "Marge",
                        lastName : "Simpson"
                    }, {
                        firstName : "Bart",
                        lastName : "Simpson"
                    }]
        };
        var n = test2(ds);

        expect(n.childNodes[0].childNodes.length).toEqual(3);
        expect(n.node.childNodes.length).toEqual(test2Count(3));
        expect(test2NodeValue(n, 0, 1)).toEqual("Person #0: Omer Simpson");
        expect(test2NodeValue(n, 0, 3)).toEqual("(first)");
        expect(test2NodeValue(n, 1, 1)).toEqual("Person #1: Marge Simpson");
        expect(test2NodeValue(n, 2, 1)).toEqual("Person #2: Bart Simpson");

        // test dynamic update
        json.set(ds.persons[1], "lastName", "SIMPSON");
        hsp.refresh();

        expect(n.node.childNodes.length).toEqual(test2Count(3));
        expect(test2NodeValue(n, 0, 1)).toEqual("Person #0: Omer Simpson");
        expect(test2NodeValue(n, 1, 1)).toEqual("Person #1: Marge SIMPSON");
        expect(test2NodeValue(n, 2, 1)).toEqual("Person #2: Bart Simpson");

        n.$dispose();
    });

    it("tests modifications on an object array", function () {
        var ds = {
            persons : [{
                        firstName : "Omer",
                        lastName : "Simpson"
                    }, {
                        firstName : "Marge",
                        lastName : "Simpson"
                    }, {
                        firstName : "Bart",
                        lastName : "Simpson"
                    }]
        };
        var n = test2(ds);

        // test dynamic update
        ds.persons.splice( 1, 1); // remove Marge
        ds.persons.push({
            firstName : "Lisa",
            lastName : "SIMPSON"
        }, {
            firstName : "Maggie",
            lastName : "S"
        });
        hsp.refresh();

        expect(n.node.childNodes.length).toEqual(test2Count(4));
        expect(test2NodeValue(n, 0, 1)).toEqual("Person #0: Omer Simpson");
        expect(test2NodeValue(n, 0, 3)).toEqual("(first)");
        expect(test2NodeValue(n, 1, 1)).toEqual("Person #1: Bart Simpson");
        expect(test2NodeValue(n, 2, 1)).toEqual("Person #2: Lisa SIMPSON");
        expect(test2NodeValue(n, 3, 1)).toEqual("Person #3: Maggie S");
        expect(test2NodeValue(n, 3, 5)).toEqual("(last)");

        n.$dispose();
    });

    it("tests collection change on an object array", function () {
        var ds = {
            persons : [{
                        firstName : "Omer",
                        lastName : "Simpson"
                    }, {
                        firstName : "Marge",
                        lastName : "Simpson"
                    }, {
                        firstName : "Bart",
                        lastName : "Simpson"
                    }]
        };
        var n = test2(ds);

        var ds2 = [{
                    firstName : "Fred",
                    lastName : "Astaire"
                }, {
                    firstName : "Ginger",
                    lastName : "Rogers"
                }];

        json.set(ds, "persons", ds2);
        hsp.refresh();
        expect(n.node.childNodes.length).toEqual(test2Count(2));
        expect(test2NodeValue(n, 0, 1)).toEqual("Person #0: Fred Astaire");
        expect(test2NodeValue(n, 0, 3)).toEqual("(first)");
        expect(test2NodeValue(n, 1, 1)).toEqual("Person #1: Ginger Rogers");
        expect(test2NodeValue(n, 1, 5)).toEqual("(last)");

        n.$dispose();
    });

    it("tests node render", function () {
        var ds = ["oranges"];
        var n = test3(ds);

        // simulate render with another doc fragment
        var elt = doc.createElement("div");
        n.render(elt);

        expect(elt.childNodes.length).toEqual(2 + 5);

        ds.push("mangos");
        hsp.refresh();

        expect(elt.childNodes.length).toEqual(2 + 5 * 2);
        expect(elt.childNodes[2 + 5 + 1].nodeValue).toEqual("mangos");
    });

    it("tests splice with nested ifs in a foreach loop", function () {
        var ds = ["AA", "BB"];
        var n = test4(ds);

        // simulate render with another doc fragment
        var elt = doc.createElement("div");
        n.render(elt);

        var str1 = "# foreach+# item+# if+First +# /if+AA+# /item+# item+# if+# if+ and last +# /if+# /if+BB+# /item+# /foreach";
        var str2 = "# foreach+# item+# if+First +# /if+AA+# /item+# item+# if+# if+ then +# /if+# /if+CC+# /item+# item+# if+# if+ and last +# /if+# /if+BB+# /item+# /foreach";

        var r = domToString(elt);
        expect(r).toEqual(str1);

        ds.splice(1, 0, "CC");
        hsp.refresh();
        r = domToString(elt);
        expect(r).toEqual(str2);

        n.$dispose();
    });

    it("tests nested ifs in a foreach loop", function () {
        var ds = ["AA", "BB"];
        var n = test4(ds);

        // simulate render with another doc fragment
        var elt = doc.createElement("div");
        n.render(elt);

        var str1 = "# foreach+# item+# if+First +# /if+AA+# /item+# item+# if+# if+ and last +# /if+# /if+BB+# /item+# /foreach";
        var str2 = "# foreach+# item+# if+First +# /if+AA+# /item+# item+# if+# if+ then +# /if+# /if+BB+# /item+# item+# if+# if+ and last +# /if+# /if+CC+# /item+# /foreach";
        var str3 = "# foreach+# item+# if+First +# /if+AA+# /item+# item+# if+# if+ then +# /if+# /if+BB+# /item+# item+# if+# if+ then +# /if+# /if+CC+# /item+# item+# if+# if+ and last +# /if+# /if+DD+# /item+# /foreach";
        var str4 = "# foreach+# item+# if+First +# /if+AA+# /item+# item+# if+# if+ then +# /if+# /if+A2+# /item+# item+# if+# if+ then +# /if+# /if+BB+# /item+# item+# if+# if+ then +# /if+# /if+CC+# /item+# item+# if+# if+ and last +# /if+# /if+DD+# /item+# /foreach";

        var r = domToString(elt);
        expect(r).toEqual(str1);

        ds.push("CC");
        hsp.refresh();
        r = domToString(elt);

        expect(r).toEqual(str2);

        ds.push("DD");
        hsp.refresh();
        r = domToString(elt);

        expect(r).toEqual(str3);

        ds.splice(1, 0, "A2");
        hsp.refresh();
        r = domToString(elt);

        expect(r).toEqual(str4);

        n.$dispose();
    });

    it("tests array delete / refill", function () {
        var ds = [{
            name : "Omer"
        }];
        var n = test5(ds);

        expect(n.node.childNodes.length).toEqual(5);
        expect(n.node.childNodes[2].nodeValue).toEqual("Omer");

        ds.splice(0, 1);
        hsp.refresh();
        expect(n.node.childNodes.length).toEqual(2);

        ds.splice2(0, ds.length, [{
            name : "Marge"
        }]);
        hsp.refresh();
        expect(n.node.childNodes.length).toEqual(5);
        expect(n.node.childNodes[2].nodeValue).toEqual("Marge");

        ds.splice(0, 1);
        hsp.refresh();
        expect(n.node.childNodes.length).toEqual(2);
    });

    it("tests with independent if child statement", function() {
        var h=ht.newTestContext();
        var ds = [];
        test6(ds).render(h.container);

        var inputNodes = h("input");
        var spanNodes = h("span");
        expect(inputNodes.length).toEqual(0);
        expect(spanNodes.length).toEqual(0);
        
        ds.push({value:"AA", edit: true});
        hsp.refresh();
        
        inputNodes = h("input");
        spanNodes = h("span");
        expect(inputNodes.length).toEqual(1);
        expect(inputNodes.item(0).value()).toEqual("AA");
        expect(spanNodes.length).toEqual(0);
        
        json.set(ds[0], "edit", false);
        hsp.refresh();
        
        inputNodes = h("input");
        spanNodes = h("span");
        expect(inputNodes.length).toEqual(0);
        expect(spanNodes.length).toEqual(1);
        expect(spanNodes.item(0).text()).toEqual("AA");

        h.$dispose();
    });
    
});
