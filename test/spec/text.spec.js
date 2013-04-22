
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
# template hello1()
	Hello World!
# /template
***/
var hello1 = require("hsp/rt").template([], function(n) {
	return [
		n.$text(0,["Hello World!"])
	]
});

/***
# template hello2(person)
	Hello {person.name}!
# /template
***/
var hello2 = require("hsp/rt").template(["person"], function(n) {
	return [
		n.$text({e1:[1,"person","name"]},["Hello ",1,"!"])
	]
});

/***
# template hello3(person)
	Hello {person.firstName} {person.lastName}!
# /template
***/
var hello3 = require("hsp/rt").template(["person"], function(n) {
	return [
		n.$text({e1:[1,"person","firstName"],e2:[1,"person","lastName"]},["Hello ",1," ",2,"!"])
	]
});

/***
// same as hello3 but with unbound variable on the lastName
# template hello4(person)
	Hello {person.firstName} {:person.lastName}!
# /template
***/
var hello4 = require("hsp/rt").template(["person"], function(n) {
	return [
		n.$text({e1:[1,"person","firstName"],e2:[0,"person","lastName"]},["Hello ",1," ",2,"!"])
	]
});

/***
// same as hello3 but with a string parameter
# template hello5(name)
	Hello {name}!
# /template
***/
var hello5 = require("hsp/rt").template(["name"], function(n) {
	return [
		n.$text({e1:[1,0,"name"]},["Hello ",1,"!"])
	]
});


describe("Text Nodes", function () {
	var TEXT_NODE=3;

	it("checks hello world text node - without any parameter", function() {
		var n=hello1();
		expect(n.node.firstChild.nodeType).toEqual(TEXT_NODE);
		expect(n.node.firstChild.nodeValue).toEqual("Hello World!");
		n.$dispose();
	});

	it("checks hello world text node - with parameter", function() {
		var n=hello2({name:"Alexandre"});
		expect(n.node.firstChild.nodeValue).toEqual("Hello Alexandre!");
		n.$dispose();
	});

	it("checks hello world text node - with parameter and 2 variables", function() {
		var n=hello3({firstName:"Miles",lastName:"Davis"});
		expect(n.node.firstChild.nodeValue).toEqual("Hello Miles Davis!");
		n.$dispose();
	});	

	it("checks hello world with 2 bound variables", function() {
		var dm={firstName:"Daniel",lastName:"Kahneman"};
		var n=hello3(dm);
		expect(n.node.firstChild.nodeValue).toEqual("Hello Daniel Kahneman!");
		json.set(dm,"lastName","Craig");
		expect(n.node.firstChild.nodeValue).toEqual("Hello Daniel Kahneman!");
		n.refresh();
		expect(n.node.firstChild.nodeValue).toEqual("Hello Daniel Craig!");
		json.set(dm,"firstName","Mickey");
		json.set(dm,"lastName","Mouse");
		n.refresh();
		expect(n.node.firstChild.nodeValue).toEqual("Hello Mickey Mouse!");
		n.$dispose();
	});

	it("checks hello world with 2 different instances & bound properties", function() {
		var dm1={firstName:"Daniel",lastName:"Kahneman"};
		var n1=hello3(dm1);
		var dm2={firstName:"Charles",lastName:"Darwin"};
		var n2=hello3(dm2);

		expect(n1.node.firstChild.nodeValue).toEqual("Hello Daniel Kahneman!");
		expect(n2.node.firstChild.nodeValue).toEqual("Hello Charles Darwin!");

		json.set(dm2,"lastName","Brown");
		hsp.refresh();
		
		expect(n1.node.firstChild.nodeValue).toEqual("Hello Daniel Kahneman!");
		expect(n2.node.firstChild.nodeValue).toEqual("Hello Charles Brown!");
		n1.$dispose();
		n2.$dispose();
	});

	it("checks hello world with multiple templates on the same DM, with bound and unbound options", function() {
		var dm={firstName:"Charles",lastName:"Darwin"};
		var n1=hello3(dm);
		var n2=hello3(dm);
		var n3=hello4(dm);

		expect(n1.node.firstChild.nodeValue).toEqual("Hello Charles Darwin!");
		expect(n2.node.firstChild.nodeValue).toEqual("Hello Charles Darwin!");
		expect(n3.node.firstChild.nodeValue).toEqual("Hello Charles Darwin!");
		
		json.set(dm,"lastName","Brown");
		hsp.refresh();
		expect(n1.node.firstChild.nodeValue).toEqual("Hello Charles Brown!");
		expect(n2.node.firstChild.nodeValue).toEqual("Hello Charles Brown!");
		expect(n3.node.firstChild.nodeValue).toEqual("Hello Charles Darwin!"); // unbound case

		n1.$dispose();
		n2.$dispose();
		n3.$dispose();
	});

	it("tests the $dispose method",function() {
		var dm={firstName:"Charles",lastName:"Darwin"};
		var n=hello3(dm);
		var ch=n.childNodes[0];

		expect(dm[json.MD_OBSERVERS]).not.toEqual(undefined);
		expect(dm[n.MD_ID]).not.toEqual(undefined);
		expect(ch.node).not.toEqual(undefined);
		
		n.$dispose();
		expect(dm[json.MD_OBSERVERS]).toEqual(undefined);
		expect(n.node).toEqual(undefined);
		expect(ch.node).toEqual(undefined);
		expect(dm[n.MD_ID]).toEqual(undefined);
		expect(n.propObs).toEqual(undefined);

		// check that generator is not impacted by the $dispose call
		n=hello3(dm);
		expect(n.node.firstChild.nodeValue).toEqual("Hello Charles Darwin!");
		json.set(dm,"lastName","Brown");
		hsp.refresh();
		expect(n.node.firstChild.nodeValue).toEqual("Hello Charles Brown!");
		n.$dispose();
	});

	it("tests a template with a simple string parameter",function() {
		var n=hello5("Bart");

		expect(n.node.firstChild.nodeValue).toEqual("Hello Bart!");
		n.$dispose();
	});

});


// TODO test root node with multiple chile nodes