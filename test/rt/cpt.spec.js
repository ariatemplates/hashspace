
/*
 * Copyright 2013 Amadeus s.a.s.
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
    klass=require("hsp/klass"),
    cpt=require("hsp/rt/cpt");

// transform a string to a number 
var NBR_DIGITS=/^(\-|\.|\+)?\d+(\.)?(\d+)?$/; 
function getNumber(s) { 
    s=""+s; 
    if (!NBR_DIGITS.test(s)) return null; 
    return Number(s); 
}

var lib={};
// sample controller
lib.NbrField = klass({ 
  $constructor:function() { 
    this.attributes={ 
      defaultvalue:0, 
      value:0, 
      min:-Number.MAX_VALUE, 
      max:Number.MAX_VALUE 
    } 
    this.internalValue=0; // bound to value
    this.isValid=true;    // bound to internalValue, min and max
  },
  /** 
   * notify the controller that an external object (template or host) updated an attribute
   */
  onAttributeChange:function(change) { 
    var name=change.name, value=change.newValue, n=getNumber(value); 
    if (n!==null) { 
      if (name==="value") { 
        json.set(this,"internalValue",n); 
        this.checkValidity(); 
      } else if (name==="min" || name==="max") { 
        this.checkValidity(); 
      } 
    } else { 
      // invalid value: set property to its default value 
      var defaults={defaultvalue:0,value:0,min:Number.MIN_VALUE,max:Number.MAX_VALUE}; 
      json.set(this.attributes,name,defaults[name]); 
    } 
  }, 
  /** 
   * Notify the controller that the template changed an internal property 
   */ 
  onPropertyChange:function(change) { 
    if (change.name==="internalValue") { 
      // validate and expose as attribute if ok
      json.set(this.attributes,"value",this.checkValidity()? this.internalValue : this.attributes.defaultvalue); 
    } 
  }, 
  /** 
   * Check if the internal value is valid and update the isValid property accordingly 
   */ 
  checkValidity:function() { 
    var n=getNumber(this.internalValue); 
    var v=(n===null)? false : (n>=this.attributes.min) && (n<=this.attributes.max); 
    if (n!==null) {
      this.internalValue=n; // to have a number type
    }
    json.set(this,"isValid",v); 
    return v; 
  },
  /**
   * Reset the field value
   */
  resetField:function() {
    var v1=this.attributes.value, v2=this.attributes.defaultvalue;
    json.set(this,"internalValue",v2);
    json.set(this.attributes,"value",v2);
    this.checkValidity();
    json.raiseEvent(this,"reset",{oldValue:v1,newValue:v2});
  }
})

/***
// this template can be generated through the component3.txt test
# template nbrfield using c:lib.NbrField
  <input type="text" #model="{c.internalValue}" class="{'nbrfield','error': c.invalidValue, 'mandatory': c.attributes.mandatory}"/>
  <input type="button" value="..." onclick="{c.resetField()}"/>
# /template
***/
var nbrfield = require("hsp/rt").template({ctl:[lib,"lib","NbrField"],ref:"c"}, function(n){
  return [
    n.elt("input",
      {e1:[1,2,"c","internalValue"],e2:[6,function(a0,a1) {
          return ["nbrfield",((a0)? ''+"error":''),((a1)? ''+"mandatory":'')].join(' ');
      },3,4],e3:[1,2,"c","invalidValue"],e4:[1,3,"c","attributes","mandatory"]},
      {"type":"text","#model":["",1],"class":["",2]},
      0
    ),
    n.elt("input",
      {e1:[3,2,"c","resetField"]},
      {"type":"button","value":"..."},
      {"click":1}
    )
  ];
});

lib.nbrfield=nbrfield;
/***
# template test(d)
  <input type="text" value="{d.value}"/>
  <#lib.nbrfield value="{d.value}" min="-10" max="10"/>
# /template
***/
var test = require("hsp/rt").template(["d"], function(n) {
  return [
    n.elt("input",{e1:[1,2,"d","value"]},{"type":"text","value":["",1]},0),
    n.cpt([lib,"lib","nbrfield"],
      {e1:[1,2,"d","value"],e2:[4,1,notifyReset,0,123]},
      {"value":["",1],"min":"-10","max":"10"},
      {"reset":2}
    )
  ];
});

var resetCount=0, lastResetArg=0;
function notifyReset(arg) {
  resetCount++;
  lastResetArg=arg;
}

describe("Component Nodes", function () {
  var ELEMENT_NODE=1;
  var TEXT_NODE=3;

  it("tests component observer", function() {
    var c=new lib.NbrField();
    var co=new cpt.CptObserver(c);

    expect(co.cpt).toEqual(c);
    expect(c.attributes.value).toEqual(0);
    expect(c["+json:observers"].length).toEqual(1);
    expect(c.attributes["+json:observers"].length).toEqual(1);

    json.set(c.attributes,"value",42);
    expect(c.internalValue).toEqual(42);
    
    json.set(c,"internalValue",12);
    expect(c.attributes.value).toEqual(12);
    expect(c.isValid).toEqual(true);

    json.set(c,"internalValue","foo");
    expect(c.attributes.value).toEqual(0);
    expect(c.isValid).toEqual(false);

    co.$dispose();
    expect(co.cpt).toEqual(null);
    expect(c["+json:observers"]).toEqual(undefined);
    expect(c.attributes["+json:observers"]).toEqual(undefined);
  });

  it("tests a component template load", function() {
    var n=nbrfield();
    var textInput=n.node.firstChild;
    var button=n.node.childNodes[1];
    expect(textInput.nodeType).toEqual(ELEMENT_NODE);
    expect(textInput.attributes.type.value).toEqual("text");
    expect(textInput.value).toEqual("0");

    textInput.value="42";
    textInput.click();

    expect(n.controller.attributes.value).toEqual(42);
    expect(n.controller.isValid).toEqual(true);

    textInput.value="foo";
    textInput.click();

    expect(n.controller.attributes.value).toEqual(0);
    expect(n.controller.isValid).toEqual(false);

    textInput.value="123.4";
    textInput.click();

    expect(n.controller.attributes.value).toEqual(123.4);
    expect(n.controller.isValid).toEqual(true);

    button.click(); // reset
    hsp.refresh();  // controller to DOM is only propagated after refresh

    expect(n.controller.attributes.value).toEqual(0);
    expect(n.controller.internalValue).toEqual(0);
    expect(textInput.value).toEqual('0');
    expect(n.controller.isValid).toEqual(true);

    n.$dispose();
    expect(n.controller).toEqual(null);
  });

it("tests a component inside another template", function() {
    resetCount=0;
    lastResetArg=0;
    var d={value:'42'};
    var n=test(d);

    var textInput=n.node.firstChild;
    var cptInput=n.node.childNodes[1];
    var cptButton=n.node.childNodes[2];
    expect(textInput.value).toEqual('42');
    expect(cptInput.value).toEqual('42');

    cptInput.value="3";
    cptInput.click();     // to trigger data binding
    hsp.refresh();        // to trigger update of the dom

    expect(textInput.value).toEqual('3');
    expect(cptInput.value).toEqual('3');

    cptInput.value="12";  // bigger than max value
    cptInput.click();     // to trigger data binding
    hsp.refresh();        // to trigger update of the dom

    expect(textInput.value).toEqual('0');
    expect(cptInput.value).toEqual('12');

    textInput.value="5";  // check binding in the other way
    textInput.click();
    hsp.refresh();

    expect(textInput.value).toEqual('5');
    expect(cptInput.value).toEqual('5');

    cptButton.click();
    hsp.refresh();

    expect(textInput.value).toEqual('0');
    expect(cptInput.value).toEqual('0');
    expect(resetCount).toEqual(1);
    expect(lastResetArg).toEqual(123);

    n.$dispose();
  });

});
