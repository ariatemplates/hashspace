
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

var json=require("hsp/json");
var PropObserver=require("hsp/propobserver");

describe("Property Observer", function () {
	var obj;

	function reset() {
		obj={
			propA:"a",
			propB:"b",
			propC: {
				propcC1:"c1"
			}
		}
	}

	function BasicListener() {
		this.chge=null;
		this.count=0;
		this.onPropChange=function(chge) {
			this.chge=chge;
			this.count++;
		}
	}

	it("test one prop observer per property", function() {
		reset();

		var o=new PropObserver(obj);
		var p1=new BasicListener();

		expect(o.props.propA).toEqual(undefined);
		json.set(obj,"propA","a1");
		o.addObserver(p1,"propA");

		json.set(obj,"propA","a2");
		expect(p1.chge.name).toEqual("propA");
		expect(p1.chge.oldValue).toEqual("a1");
		expect(p1.chge.object[p1.chge.name]).toEqual("a2");
		expect(p1.count).toEqual(1);

		// test a 2nd change
		p1.chge=null;
		json.set(obj,"propA","a3");
		json.set(obj,"propB","b3");
		expect(p1.chge.oldValue).toEqual("a2");
		expect(p1.count).toEqual(2);

		// observe another property
		p1.chge=null;
		o.addObserver(p1,"propB");
		json.set(obj,"propA","a4");
		json.set(obj,"propB","b4");
		expect(p1.chge.oldValue).toEqual("b3");
		expect(p1.count).toEqual(4);

		o.rmObserver(p1,"propA");
		expect(o.props.propA).toEqual(undefined);
		json.set(obj,"propA","a5");
		json.set(obj,"propB","b5");
		expect(p1.chge.oldValue).toEqual("b4");
		expect(p1.count).toEqual(5);

		o.rmObserver(p1,"propB");
		expect(o.props.propB).toEqual(undefined);
		json.set(obj,"propA","a6");
		json.set(obj,"propB","b6");
		expect(p1.chge.oldValue).toEqual("b4");
		expect(p1.count).toEqual(5);
	});

	it("test one prop observer for all properties", function() {
		reset();

		var o=new PropObserver(obj);
		var p1=new BasicListener();

		expect(o.props.propA).toEqual(undefined);
		json.set(obj,"propA","a1");
		o.addObserver(p1);

		json.set(obj,"propA","a2");
		expect(p1.chge.name).toEqual("propA");
	});

	it("test two prop observers per property", function() {
		reset();

		var o=new PropObserver(obj);
		var p1=new BasicListener();
		var p2=new BasicListener();
		
		json.set(obj,"propA","a1");
		o.addObserver(p1,"propA");
		o.addObserver(p2,"propA");
		json.set(obj,"propA","a2");

		expect(p1.chge.oldValue).toEqual("a1");
		expect(p1.chge.object[p1.chge.name]).toEqual("a2");
		expect(p2.chge.oldValue).toEqual("a1");
		expect(p2.chge.object[p2.chge.name]).toEqual("a2");

		// delete test
		o.rmObserver(p1,"propA");
		expect(o.props.propA.length).toEqual(1);
		json.set(obj,"propA","a3");
		expect(p2.chge.oldValue).toEqual("a2");
		o.rmObserver(p2,"propA");
		expect(o.props.propA).toEqual(undefined);
	});

	it("test prop observer disposal", function() {
		reset();

		var o=new PropObserver(obj);
		var p1=new BasicListener();
		
		json.set(obj,"propA","a1");
		o.addObserver(p1,"propA");
		json.set(obj,"propA","a2");

		expect(obj["+json:observers"].length).toEqual(1);
		o.$dispose();
		expect(o.props).toEqual(undefined);
		expect(obj["+json:observers"]).toEqual(undefined);
	});

});
