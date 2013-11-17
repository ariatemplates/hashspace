 
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

var lastNewMinValue=null;

var lib={};
// sample controller
lib.NbrField = klass({ 
  attributes: {
    defaultvalue:0, 
    value:{type:"float",defaultValue:0,binding:"2-way"},
    min:{type:"float",defaultValue:-Number.MAX_VALUE,binding:"1-way"},
    max:Number.MAX_VALUE 
  },

  init:function() { 
    this.internalValue=this.value;  // bound to value
    this.isValid=true;              // bound to internalValue, min and max
    this.checkValidity();
  },

  /** 
   * attribute change handlers
   * notify the controller that an external object (template or host) updated the value attribute
   */
  onValueChange:function(newValue,oldValue) {
    var n=getNumber(newValue);
    json.set(this,"internalValue",n!==null? n : 0); 
    this.checkValidity(); 
  },

  onMinChange:function(newValue,oldValue) {
    lastNewMinValue=newValue;
    this.checkValidity(); 
  },

  onMaxChange:function(newValue,oldValue) {
    var n=getNumber(newValue);
    json.set(this,"max",n!==null? n : Number.MAX_VALUE); 
    this.checkValidity(); 
  },

  /** 
   * property change handler
   * notify the controller that the template changed an internal property 
   */ 
  onInternalValueChange:function(newValue,oldValue) { 
    // validate and expose as attribute if ok
    json.set(this,"value",this.checkValidity()? this.internalValue : this.defaultvalue); 
  }, 

  /** 
   * Check if the internal value is valid and update the isValid property accordingly 
   */ 
  checkValidity:function() { 
    var n=getNumber(this.internalValue); 
    var v=(n===null)? false : (n>=this.min) && (n<=this.max); 
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
    var v1=this.value, v2=this.defaultvalue;
    json.set(this,"internalValue",v2);
    json.set(this,"value",v2);
    this.checkValidity();
    json.raiseEvent(this,"reset",{oldValue:v1,newValue:v2});
  }
})

/***
// this template can be generated through the component3.txt test
# template nbrfield using c:lib.NbrField
  <input type="text" #model="{c.internalValue}" class="{'nbrfield','error': c.invalidValue, 'mandatory': c.mandatory}"/>
  <input type="button" value="..." onclick="{c.resetField()}"/>
# /template
***/
var nbrfield = require("hsp/rt").template({ctl:[lib,"lib","NbrField"],ref:"c"}, function(n){
  return [
    n.elt("input",
      {e1:[1,2,"c","internalValue"],e2:[6,function(a0,a1) {
          return ["nbrfield",((a0)? ''+"error":''),((a1)? ''+"mandatory":'')].join(' ');
      },3,4],e3:[1,2,"c","invalidValue"],e4:[1,2,"c","mandatory"]},
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

var TypedCtl=klass({
  attributes:{
    attint:{type:"int",defaultValue:42},
    attfloat:{type:"float",defaultValue:'12.3'},
    attstring:{type:"string",defaultValue:123},
    attbool:{type:"bool",defaultValue:false}
  }
})

describe("Component Nodes", function () {
  var ELEMENT_NODE=1;
  var TEXT_NODE=3;

  it("tests component wrapper", function() {
    var cw=new cpt.CptWrapper(lib.NbrField);
    cw.init();

    var c=cw.cpt;
    expect(c.value).toEqual(0);
    expect(c["+json:observers"].length).toEqual(1);

    json.set(c,"value",42);
    expect(c.internalValue).toEqual(42);

    // test internal binding conversion
    expect(c.attributes.value._binding).toEqual(2);
    
    json.set(c,"internalValue",12);
    expect(c.value).toEqual(12);
    expect(c.isValid).toEqual(true);

    json.set(c,"internalValue","foo");
    expect(c.value).toEqual(0);
    expect(c.isValid).toEqual(false);

    cw.$dispose();
    expect(cw.cpt).toEqual(null);
    expect(c["+json:observers"]).toEqual(undefined);
    expect(c["+json:observers"]).toEqual(undefined);
  });

  it("tests component wrapper typed attributes + default value", function() {
    var cw=new cpt.CptWrapper(TypedCtl);
    cw.init();
    var c=cw.cpt;

    expect(c.attint).toEqual(42);
    expect(c.attfloat).toEqual(12.3);
    expect(c.attstring).toEqual('123');
    expect(c.attbool).toEqual(false);

    cw.$dispose();
  });

  it("tests component wrapper typed attributes + init value", function() {
    var cw=new cpt.CptWrapper(TypedCtl);
    cw.init({attint:"12",attfloat:"190.2",attbool:'true'});
    var c=cw.cpt;

    expect(c.attint).toEqual(12);
    expect(c.attfloat).toEqual(190.2);
    expect(c.attbool).toEqual(true);

    cw.$dispose();
  });

  it("tests attribute type conversion before change callback is called", function() {
    var cw=new cpt.CptWrapper(lib.NbrField);
    cw.init({min:-123});
    var c=cw.cpt;

    expect(c.min).toEqual(-123);

    // simulate external change
    json.set(c,"min","-10");
    expect(lastNewMinValue).toEqual(-10);
    expect(c.min).toEqual(-10);

    cw.$dispose();
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

    expect(n.controller.value).toEqual(42);
    expect(n.controller.isValid).toEqual(true);

    textInput.value="foo";
    textInput.click();

    expect(n.controller.value).toEqual(0);
    expect(n.controller.isValid).toEqual(false);

    textInput.value="123.4";
    textInput.click();

    expect(n.controller.value).toEqual(123.4);
    expect(n.controller.isValid).toEqual(true);

    button.click(); // reset
    hsp.refresh();  // controller to DOM is only propagated after refresh

    expect(n.controller.value).toEqual(0);
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
