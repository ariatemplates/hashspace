
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
# template test1(person)
	<div title="test1">
		Hello {person.name}!
	</div>
# /template
***/
var test1 = require("hsp/rt").template(["person"], function(n) {
	return [
		n.elt(
			"div",
			0,
			{"title":"test1"},
			0,
			[n.$text({e1:[1,2,"person","name"]},["Hello ",1,"!"])]
		)
	]
});

/***
# template test2(person)
	<div title="test2" class="t2 {person.gender}" tabIndex="{person.idx}">
		{person.firstName} / {person.lastName} 
		<span class="{person.ffLevel}">
			Frequent flyer #: {person.ffNbr}
		</span>
	</div>
# /template
***/
var test2 = require("hsp/rt").template(["person"], function(n) {
	return [
		n.elt(
			"div",
			{e1:[1,2,"person","gender"],e2:[1,2,"person","idx"]},
			{"title":"test2","class":["t2 ",1],"tabIndex":["",2]},
			0,
			[	
				n.$text({e1:[1,2,"person","firstName"],e2:[1,2,"person","lastName"]},["",1," / ",2," ["]),
				n.elt(
					"span",
					{e1:[1,2,"person","ffLevel"]},
					{"class":["",1]},
					0,
					[n.$text({e1:[1,2,"person","ffNbr"]},["Frequent flyer #: ",1])]
				),
				n.$text(0,[" ]"])
			]
		)
	]
});


describe("Element Nodes", function () {
	var ELEMENT_NODE=1;
	var TEXT_NODE=3;

	it("tests a simple div with text and bound data on text content", function() {
		var dm={name:"Omer"}
		var n=test1(dm);
		expect(n.node.firstChild.nodeType).toEqual(ELEMENT_NODE);
		expect(n.node.firstChild.attributes.title.value).toEqual("test1");
		expect(n.node.firstChild.firstChild.nodeType).toEqual(TEXT_NODE);
		expect(n.node.firstChild.firstChild.nodeValue).toEqual("Hello Omer!");

		// test property change
		json.set(dm,"name","Marge");
		hsp.refresh();

		expect(n.node.firstChild.firstChild.nodeValue).toEqual("Hello Marge!");		

		n.$dispose();
	});

	it("tests a nested containers with bound data on attributes", function() {
		var dm={idx:1, firstName:"Omer", lastName:"Simpson", gender:"male", ffNbr:1234567890, ffLevel:"platinum"};
		var n=test2(dm);

		expect(n.node.firstChild.nodeName).toEqual("DIV");
		expect(n.node.firstChild.attributes["class"].value).toEqual("t2 male");
		expect(n.node.firstChild.attributes["tabIndex"].value).toEqual("1");
		expect(n.node.firstChild.childNodes[0].nodeName).toEqual("#text");
		expect(n.node.firstChild.childNodes[0].nodeValue).toEqual("Omer / Simpson [");
		expect(n.node.firstChild.childNodes[1].nodeName).toEqual("SPAN");
		expect(n.node.firstChild.childNodes[1].attributes["class"].value).toEqual("platinum");
		expect(n.node.firstChild.childNodes[1].firstChild.nodeValue).toEqual("Frequent flyer #: 1234567890");
		expect(n.node.firstChild.childNodes[2].nodeValue).toEqual(" ]");

		json.set(dm,"firstName","Marge");
		json.set(dm,"gender","female");
		json.set(dm,"ffLevel","gold");
		json.set(dm,"ffNbr",1112223330);
		hsp.refresh();

		expect(n.node.firstChild.attributes["class"].value).toEqual("t2 female");
		expect(n.node.firstChild.attributes["tabIndex"].value).toEqual("1");
		expect(n.node.firstChild.childNodes[0].nodeValue).toEqual("Marge / Simpson [");
		expect(n.node.firstChild.childNodes[1].attributes["class"].value).toEqual("gold");
		expect(n.node.firstChild.childNodes[1].firstChild.nodeValue).toEqual("Frequent flyer #: 1112223330");
		expect(n.node.firstChild.childNodes[2].nodeValue).toEqual(" ]");

		n.$dispose();
	});

	it("tests the EltNode $dispose", function() {
		var dm={idx:1, firstName:"Omer", lastName:"Simpson", gender:"male", ffNbr:1234567890, ffLevel:"platinum"};
		var n=test2(dm); 

		var n0=n.childNodes[0];
		var n00=n.childNodes[0].childNodes[0];
		var n01=n.childNodes[0].childNodes[1];
		var n010=n.childNodes[0].childNodes[1].childNodes[0];

		// TODO
		n.$dispose();
		expect(n.node).toEqual(undefined);
		expect(n0.node).toEqual(undefined);
		expect(n00.node).toEqual(undefined);
		expect(n01.node).toEqual(undefined);
		expect(n010.node).toEqual(undefined);

		// check that generator tree still works and is not impacted by the instance disposal
		n=test2(dm); 
		expect(n.node.firstChild.attributes["class"].value).toEqual("t2 male");
		expect(n.node.firstChild.attributes["tabIndex"].value).toEqual("1");
		expect(n.node.firstChild.childNodes[0].nodeValue).toEqual("Omer / Simpson [");
		expect(n.node.firstChild.childNodes[1].attributes["class"].value).toEqual("platinum");
		expect(n.node.firstChild.childNodes[1].firstChild.nodeValue).toEqual("Frequent flyer #: 1234567890");
		expect(n.node.firstChild.childNodes[2].nodeValue).toEqual(" ]");

		n.$dispose();
	});

	it("tests the EltNode with an empty data model", function() {
		var n=test2(); 
		expect(n.node.firstChild.attributes["class"].value).toEqual("t2 ");
		expect(n.node.firstChild.childNodes[0].nodeValue).toEqual(" /  [");
		expect(n.node.firstChild.childNodes[1].attributes["class"].value).toEqual("");
		expect(n.node.firstChild.childNodes[1].firstChild.nodeValue).toEqual("Frequent flyer #: ");
		expect(n.node.firstChild.childNodes[2].nodeValue).toEqual(" ]");
		n.$dispose();
	});

});
