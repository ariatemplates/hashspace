
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
	{if (person.firstName)}
		Hello {person.firstName}
	{/if}
# /template
***/
var test1 = require("hsp/rt").template(["person"], function(n) {
	return [
		n.$if(
			{e1:[1,2,"person","firstName"]},
			1,
			[	
				n.$text({e1:[1,2,"person","firstName"]},["Hello ",1])
			]
		)
	]
});

/***
# template test2(person)
	{if person.firstName}
		<h2>Hello {person.firstName}</h2>
		{if (person.favouriteDish)}
			<span class="dish">Your preferred dish: {person.favouriteDish}</span>
		{/if}
	{else}
		<div class="noname">
			Hello {person.lastName}
		</div>
	{/if}
# /template
***/
var test2 = require("hsp/rt").template(["person"], function(n) {
	return [
		n.$if(
			{e1:[1,2,"person","firstName"]},
			1,
			[	
				n.elt(
					"h2",
					0,
					0,
					0,
					[n.$text({e1:[1,2,"person","firstName"]},["Hello ",1])]
				),
				n.$if(
					{e1:[1,2,"person","favouriteDish"]},
					1,
					[
						n.elt(
							"span",
							0,
							{"class":"dish"},
							0,
							[n.$text({e1:[0,2,"person","favouriteDish"]},["Your preferred dish: ",1])]
						)
					]
				)
			],
			[
				n.elt(
					"div",
					0,
					{"class":"noname"},
					0,
					[n.$text({e1:[0,2,"person","lastName"]},["Hello ",1])]
				)
			]
		)
	]
});

/***
# template test3(person)
	Hello 
	{if person.firstName}
		{person.firstName}!
	{/if}
# /template
***/
var test3 = require("hsp/rt").template(["person"], function(n) {
	return [
		n.$text(0,["Hello "]),
		n.$if(
			{e1:[1,2,"person","firstName"]},
			1,
			[	
				n.$text({e1:[1,2,"person","firstName"]},["",1,"!"])
			]
		)
	]
});

/***
# template test4(person)
	Hello 
	// test literal as if parameter - even if it doesn't really make sense, should still be supported - e.g. for debugging purposes
	{if (true)}
		{person.firstName}!
	{/if}
# /template
***/
var test4 = require("hsp/rt").template(["person"], function(n) {
	return [
		n.$text(0,["Hello "]),
		n.$if(
			{e1:[5,true]},
			1,
			[	
				n.$text({e1:[1,2,"person","firstName"]},["",1,"!"])
			]
		)
	]
});


describe("If Node", function () {
	var ELEMENT_NODE=1;
	var TEXT_NODE=3;
	var COMMENT_NODE=8;

	it("tests a simple if condition without any else statement", function() {
		var dm={firstName:"Omer",lastName:"Simpson"};
		var n=test1(dm);
		expect(n.node.firstChild.nodeType).toEqual(COMMENT_NODE);
		expect(n.node.firstChild.nodeValue).toEqual("# if");
		expect(n.node.childNodes.length).toEqual(3);
		expect(n.node.childNodes[1].nodeValue).toEqual("Hello Omer");

		// change first name and check update
		json.set(dm,"firstName","Marge");
		hsp.refresh();
		expect(n.node.childNodes[1].nodeValue).toEqual("Hello Marge");

		json.set(dm,"firstName",null);
		hsp.refresh();
		expect(n.node.childNodes.length).toEqual(2);

		n.$dispose();
	});

	it("tests nested if and else statements", function() {
		var dm={firstName:"Omer",lastName:"Simpson"};
		var n=test2(dm);

		expect(n.node.childNodes[1].nodeName).toEqual("H2");
		expect(n.node.childNodes[1].firstChild.nodeValue).toEqual("Hello Omer");
		expect(n.node.childNodes.length).toEqual(5);
		expect(n.node.childNodes[3].nodeName).toEqual("#comment");

		json.set(dm,"favouriteDish","Donuts");
		hsp.refresh();
		expect(n.node.childNodes.length).toEqual(6);
		expect(n.node.childNodes[3].nodeName).toEqual("SPAN");
		expect(n.node.childNodes[3].firstChild.nodeValue).toEqual("Your preferred dish: Donuts");

		json.set(dm,"firstName",null);
		hsp.refresh();
		expect(n.node.childNodes.length).toEqual(3);
		expect(n.node.childNodes[1].nodeName).toEqual("DIV");
		expect(n.node.childNodes[1].firstChild.nodeValue).toEqual("Hello Simpson");

		n.$dispose();
	});

	it("tests the $dispose behaviour", function()  {
		var dm={firstName:"Omer",lastName:"Simpson",favouriteDish:"Donuts"};
		var n=test2(dm);

		var n1=n.childNodes[0].childNodes[0];
		var n2=n.childNodes[0].childNodes[1].childNodes[0];
		expect(n1.tag).toEqual("h2");
		expect(n1.node).not.toEqual(null);
		expect(n2.tag).toEqual("span");
		expect(n2.node).not.toEqual(null);

		// moving to the else statement will automatically dispose the elements of the main block
		json.set(dm,"firstName",null);
		hsp.refresh();
		expect(n1.node).toEqual(null);
		expect(n.childNodes[0].childNodes[0].tag).toEqual("div");
		expect(n2.node).toEqual(null);

		json.set(dm,"firstName","Marge");
		hsp.refresh();
		expect(n.childNodes[0].childNodes[0].tag).toEqual("h2");
		n2=n.childNodes[0].childNodes[1].childNodes[0];
		expect(n2.node).not.toEqual(null);

		n.$dispose();
		expect(n2.node).toEqual(null);
	});

	it("tests multiple nodes at root level", function() {
		var dm={firstName:"Omer",lastName:"Simpson",favouriteDish:"Donuts"};
		var n=test3(dm);

		expect(n.childNodes.length).toEqual(2);
		var ch1=n.childNodes[1];
		var ch2=n.childNodes[1].childNodes[0];
		expect(ch1.node).not.toEqual(null);
		expect(ch2.node.nodeValue).toEqual("Omer!");
		n.$dispose();
		expect(n.childNodes).toEqual(undefined);
		expect(ch1.node).toEqual(null);
		expect(ch2.node).toEqual(null);
	});

	it("tests literal value as if condition", function() {
		var dm={firstName:"Omer",lastName:"Simpson",favouriteDish:"Donuts"};
		var n=test4(dm);
		expect(n.childNodes.length).toEqual(2);
		var ch1=n.childNodes[1];
		var ch2=n.childNodes[1].childNodes[0];
		expect(ch1.node).not.toEqual(null);
		expect(ch2.node.nodeValue).toEqual("Omer!");
		n.$dispose();
	});

});
