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

/**
 * CptObserver class
 * CptObserver objects observe components to detect changes on their properties (or attributes)
 * and call their onAttributeChange() or onPropertyChange() methods
 * Such observers are necessary to avoid having component observing themselves. This way, component
 * can change their own properties through json.set() without recursively being called because of their own changes
 * This is performed by detecting if changes occur in the onXXChange() call stack - if this is the case,
 * CptObserver will not call the onXXChange() callback again.
 */
var CptObserver = exports.CptObserver = klass({
  /**
   *  Observer constructor. 
   * @param cpt {Object} the component to be observed. This object doesn't need to have special properties
   * - if cpt has an "attributes" properties and an onAttributeChange() method, attributes will be observed
   *   and onAttributeChange will be calle when an attribute is changed by an external object
   * - if cpt has an onPropertyChange() method, all properties - except "attributes" - will be observed and 
   *   on PropertyChange() will be called when a property is changed by an external object
   */
  $constructor:function(cpt) {
    this.cpt=cpt;
    this.nodeInstance=null; // reference to set the node instance adirty when an attribute changes
    if (cpt.onAttributeChange && cpt.attributes && typeof(cpt.attributes)==='object' && cpt.attributes.constructor!==Array) {
      this._attChgeCb=this.onAttributeChange.bind(this);
      json.observe(cpt.attributes,this._attChgeCb);
    }
    if (cpt.onPropertyChange) {
      this._ppChgeCb=this.onPropertyChange.bind(this);
      json.observe(cpt,this._ppChgeCb);
    }
    this._evtCb=this.onEvent.bind(this);
    json.observeEvents(cpt,this._evtCb);
  },
  $dispose:function() {
    // unobserve properties and events
    if (this._attChgeCb) {
      json.unobserve(this.cpt.attributes,this._attChgeCb);
      this._attChgeCb=null;
    }
    if (this._ppChgeCb) {
      json.unobserve(this.cpt,this._ppChgeCb);
      this._ppChgeCb=null;
    }
    json.unobserveEvents(this.cpt,this._evtCb);
    this._evtCb=null;
    this.cpt=null;
    this.nodeInstance=null;
  },
  onAttributeChange:function(change) {
    this.manageChange("AttributeChange",change);
  },
  onPropertyChange:function(change) {
    this.manageChange("PropertyChange",change);
  },
  onEvent:function(evt) {
    if (this.nodeInstance && this.nodeInstance.onEvent) {
      this.nodeInstance.onEvent(evt);
    }
  },
  /***
   * Check if not already in event handler stack and call the change event handler
   */
  manageChange:function(chgeType,change) {
    var chg=change;
    if (change.constructor===Array) {
      if (change.length>0) {
        chg=change[0];
      } else {
        console.error('[CptNode] Invalid change');
        return;
      }
    }
    // notify attribute changes to the node instance 
    if (chgeType==="AttributeChange" && this.nodeInstance) {
        chg.newValue=this.cpt.attributes[chg.name]; // attribute value may have been changed by the controller
        this.nodeInstance.onAttributeChange(chg);
    }

    if (this.processingChange===true) {
      // don't re-enter the change loop if we are already processing changes
      return;
    }
    this.processingChange=true;
    try {
      this.cpt["on"+chgeType].call(this.cpt,chg);
    } finally {
      this.processingChange=false;
    }
  }
});
