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

var json=require("hsp/json"),
    klass=require("hsp/klass");

var ATTRIBUTE_TYPES={
  "int":{
    defaultValue:0,
    convert:function(v,attcfg) {var r=parseInt(v,10);return isNaN(r)? getDefaultAttValue(attcfg) : r;}
  },
  "float":{
    defaultValue:0,
    convert:function(v,attcfg) {var r=parseFloat(v);return isNaN(r)? getDefaultAttValue(attcfg) : r;}
  },
  "bool": {
    defaultValue:true,
    convert:function(v,attcfg) {return v===true || v===1 || v==='1' || v==='true';}
  },
  "string":{
    defaultValue:'',
    convert:function(v,attcfg) {return v+'';}
  },
  "object":{
    defaultValue:null,
    convert:function(v,attcfg) {return v;}
  }
}

var BINDING_VALUES={
  "none":0,
  "1-way":1,
  "2-way":2
}

function getDefaultAttValue(attcfg) {
  // attcfg.type is always set when called from ATTRIBUTE_TYPES.x.convert()
  var d=attcfg.defaultValue;
  if (d===undefined) {
    return ATTRIBUTE_TYPES[attcfg.type].defaultValue;
  } else {
    // ensure default has the right type
    return ATTRIBUTE_TYPES[attcfg.type].convert(d,{type:'string'});
  }
}

/**
 * CptWrapper class
 * CptWrapper objects create, initializae and observe components to detect changes on their properties (or attributes)
 * and call their onAttributeChange() or onPropertyChange() methods
 * Such observers are necessary to avoid having component observing themselves. This way, component
 * can change their own properties through json.set() without recursively being called because of their own changes
 * This is performed by detecting if changes occur in the onXXChange() call stack - if this is the case,
 * CptWrapper will not call the onXXChange() callback again.
 */
var CptWrapper = exports.CptWrapper = klass({
  /**
   *  Observer constructor. 
   * @param Cptfn {Function} the component constructor
   */
  $constructor:function(Cptfn) {
    if (!Cptfn || Cptfn.constructor!==Function) {
      console.error("[CptWrapper] Invalid Component constructor!")
    } else {
      this.cpt=new Cptfn();
      this.nodeInstance=null; // reference to set the node instance adirty when an attribute changes
      this.initialized=false;

      // update attribute values for simpler processing
      var atts=this.cpt.attributes, att, bnd;
      if (atts) {
        for (var k in atts) {
          att=atts[k];
          bnd=att.binding;
          // set the internal _binding value 0=none 1=1-way 2=2-way
          if (bnd) {
            bnd=BINDING_VALUES[bnd];
            if (bnd!==undefined) {
              att._binding=bnd;
            } else {
              console.error("Invalid attribute binding value: "+att.binding);
              att._binding=0;
            }
          } else {
            att._binding=0;
          }

          // check type
          if (att.type) {
            if (ATTRIBUTE_TYPES[att.type]===undefined) {
              console.error("Invalid attribute type: "+att.type);
              att.type='string';
            }
          } else {
            att.type='string';
          }
        }
      }
    }
  },

  $dispose:function() {
    // unobserve properties and events
    if (this._cptChgeCb) {
      json.unobserve(this.cpt,this._cptChgeCb);
      this._cptChgeCb=null;
    }
    if (this._evtCb) {
      json.unobserveEvents(this.cpt,this._evtCb);
      this._evtCb=null;
    }
    this.cpt=null;
    this.nodeInstance=null;
  },

  /**
   * Initialize the compoent by creating the attribute properties on the component instance
   * and initializing the attribute values to their initial value
   * If the component instance has an init() method it will be called as well
   * @param {Map} initAttributes map of initial value set by the component host
   */
  init:function(initAttributes) {
    if (!this.initialized) {
      this.initialized=true;
      var cpt=this.cpt, atts=cpt.attributes;
      if (!cpt) {
        return; // just in case 
      }

      if (atts) {
        if (!initAttributes) {
          initAttributes={};
        }

        // initialize attributes
        var iAtt, att, isAttdefObject, hasType, v, attType;
        for (var k in atts) {
          att=atts[k];
          iAtt=initAttributes[k];
          isAttdefObject=(typeof(atts[k])==='object');
          hasType=(isAttdefObject && atts[k].type);
          if (hasType) {
            attType=ATTRIBUTE_TYPES[att.type];
            if (!attType) {
              console.error("Invalid component attribute type: "+att.type);
              attType=ATTRIBUTE_TYPES['string'];
            }
          }

          // determine value
          v='';
          if (iAtt!==undefined) {
            v=iAtt;
          } else {
            if (isAttdefObject) {
              v=att.defaultValue;
              if (v===undefined) {
                if (hasType) {
                  v=attType.defaultValue;
                }
              }
            } else {
              // attribute directly references the default value
              v=att; // todo clone objects
            }
          }

          // convert value type if applicable
          if (hasType) {
            v=attType.convert(v,att);
          }

          // init the component attribute with the right value
          cpt[k]=v;
        }
      }

      if (cpt.init) {
        // call init if defined on the component
        cpt.init();
      }

      this._cptChgeCb=this.onCptChange.bind(this);
      json.observe(cpt,this._cptChgeCb);

      this._evtCb=this.onEvent.bind(this);
      json.observeEvents(cpt,this._evtCb);
    }
  },
  
  onEvent:function(evt) {
    if (this.nodeInstance && this.nodeInstance.onEvent) {
      this.nodeInstance.onEvent(evt);
    }
  },
  /***
   * Check if not already in event handler stack and call the change event handler
   */
  onCptChange:function(change) {
    var chg=change, cpt=this.cpt;
    if (change.constructor===Array) {
      if (change.length>0) {
        chg=change[0];
      } else {
        console.error('[CptNode] Invalid change');
        return;
      }
    }
    var nm=chg.name; // property name
    if (nm==="") {
      return; // doesn't make sens (!)
    }

    var callControllerCb=true; // true if the onXXXChange() callback must be called on the controller

    if (cpt.attributes) {
      var att=cpt.attributes[nm];
      var isAttributeChange=(att!==undefined);
      if (isAttributeChange) {
        // adapt type if applicable
        var t=att.type;
        if (t) {
          var v=ATTRIBUTE_TYPES[t].convert(chg.newValue,att);
          chg.newValue=v;
          cpt[nm]=v; // change is already raised, no need to trigger another one through json.set()
        }
      }

      if (isAttributeChange && this.nodeInstance) {
          // notify attribute changes to the node instance (and the host) if attribute has a 2-way binding
          if (att._binding===2) {
            chg.newValue=this.cpt[nm]; // attribute value may have been changed by the controller
            this.nodeInstance.onAttributeChange(chg);
          }
      }

      if (isAttributeChange) {
        // check if cb must be called depending on binding mode
        if (att._binding===0) {
          callControllerCb=false;
        }
      }
    }

    if (callControllerCb) {
      if (this.processingChange===true) {
        // don't re-enter the change loop if we are already processing changes
        return;
      }
      this.processingChange=true;
      try {
        // calculate the callback name (e.g. onValueChange for the 'value' property)
        var cbnm= ["on", nm.charAt(0).toUpperCase(), nm.slice(1), "Change"].join('');

        if (cpt[cbnm]) {
          cpt[cbnm].call(cpt,chg.newValue,chg.oldValue);
        }

      } finally {
        this.processingChange=false;
      }
    }
  }
});
