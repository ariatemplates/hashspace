
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

function test1(person,ctl) {
	if (!test1.ng) {
		var Ng=require("hsp/rt").NodeGenerator, n=Ng.nodes;
		test1.ng=new Ng(
			n.elt(
				"div",
				{e1:[3,"ctl","handleClick"]},
				{"title":"test1"},
				{"click":1},
				[n.$text({e1:[1,"person","name"]},["Hello ",1,"!"])]
			)
		);
	}
	return test1.ng.process(this,["person",person,"ctl",ctl]);
}
/***
// basic test with a single div container
# template test1(person,ctl)
	<div title="test1" onclick="{ctl.handleClick()}">
		Hello {person.name}!
	</div>
# /template
***/

function test2(label,names,ctl) {
	if (!test2.ng) {
		var Ng=require("hsp/rt").NodeGenerator, n=Ng.nodes;
		test2.ng=new Ng(
			n.$foreach(
				{e1:[1,0,"names"]},
				"name", // name of the loop variable that should be created
				0,  	// for type: 0=in / 1=of / 2=on
				1,		// index of the collection expression
				[
					n.elt(
						"span",
						{e1:[3,"ctl","handleClick",1,2,1,3,0,"literal arg",1,4],e2:[0,0,"name"],e3:[0,0,"name_key"],e4:[0,0,"event"]},
						0,
						{"click":1},
						[n.$text({e1:[0,0,"label"],e2:[1,0,"name_key"],e3:[0,0,"name"]},["",1," ",2,": ",3])]
					)
				]
			)
		);
	}
	return test2.ng.process(this,["label",label,"names",names,"ctl",ctl]);
}
/***
# template test2(label,names,ctl)
	# foreach (name in names)
		<span onclick="{handleClick(name,name_key,"literal arg",event)}">
			{:label} {name_key}: {:name}
		</span>
	# /foreach
# /template
***/

var doClickCount=0, doClickEvtType="", doClickStrArg="";

function doClick(str,evt) {
	doClickCount++;
	doClickEvtType=evt.type;
	doClickStrArg=str;
}

function test3(person,ctl) {
	if (!test3.ng) {
		var Ng=require("hsp/rt").NodeGenerator, n=Ng.nodes;
		test3.ng=new Ng(
			n.elt(
				"div",
				{e1:[4,doClick,0,'blah',1,2],e2:[0,0,"event"]},
				{"title":"test3"},
				{"click":1},
				[n.$text({e1:[1,"person","name"]},["Hello ",1,"!"])]
			)
		);
	}
	return test3.ng.process(this,["person",person,"ctl",ctl]);
}
/***
// test callback on the global scope
# template test3(person)
	<div title="test3" onclick="{doClick('blah',event)}">
		Hello {person.name}!
	</div>
# /template
***/

describe("Element Nodes", function () {
	var ELEMENT_NODE=1;
	var TEXT_NODE=3;

	function test2SpanNode(n,idx) {
		return n.node.childNodes[1+idx*3+1];
	}

	function test2SpanValue(n,idx) {
		// return the value of the text node in the span
		return test2SpanNode(n,idx).childNodes[0].nodeValue
	}

	it("tests a simple event handler", function() {
		var dm={name:"Omer"};
		var count=0;
		var lastArg;
		var ctl={
			handleClick:function(arg) {
				count++;
				lastArg=arg
			}
		}
		var n=test1(dm,ctl);
		expect(n.node.firstChild.firstChild.nodeValue).toEqual("Hello Omer!");
		expect(count).toEqual(0);

		n.node.firstChild.click();
		expect(count).toEqual(1);
		expect(lastArg).toEqual(undefined);

		n.$dispose();
	});

	it("tests handlers on loop elements with contectual args", function() {
		var count=0;
		var lastName="";
		var lastIdx=-1;
		var lastStrArg="";
		var lastEvtType=null;

		var ctl={
			handleClick:function(name,idx,strArg,evt) {
				count++;
				lastName=name;
				lastIdx=idx;
				lastStrArg=strArg;
				lastEvtType=evt.type;
			}
		}
		var ds=["Omer","Marge","Bart","Lisa","Maggie"]
		var n=test2("index",ds,ctl);

		expect(test2SpanValue(n,1)).toEqual("index 1: Marge");
		expect(test2SpanValue(n,3)).toEqual("index 3: Lisa");
		expect(count).toEqual(0);

		test2SpanNode(n,1).click();

		expect(count).toEqual(1);
		expect(lastName).toEqual("Marge");
		expect(lastIdx).toEqual(1);
		expect(lastStrArg).toEqual("literal arg");
		expect(lastEvtType).toEqual("click");
		
		test2SpanNode(n,3).click();

		expect(count).toEqual(2);
		expect(lastName).toEqual("Lisa");
		expect(lastIdx).toEqual(3);
		expect(lastStrArg).toEqual("literal arg");
		expect(lastEvtType).toEqual("click");

		n.$dispose();
	});

	it("tests global scope handler function", function() {
		var dm={name:"Omer"};
		var n=test3(dm);

		expect(n.node.firstChild.firstChild.nodeValue).toEqual("Hello Omer!");
		expect(doClickCount).toEqual(0);

		n.node.firstChild.click();
		expect(doClickCount).toEqual(1);
		expect(doClickStrArg).toEqual("blah");
		
		n.$dispose();
	});
	
});
