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

var json = require("../json"),
    log = require("./log"),
    klass = require("../klass");

function identity(v) {
    return v;
}

var ATTRIBUTE_TYPES = {
    "int" : {
        defaultValue : 0,
        convert : function (v, attcfg) {
            var r = parseInt(v, 10);
            return isNaN(r) ? getDefaultAttValue(attcfg) : r;
        }
    },
    "float" : {
        defaultValue : 0,
        convert : function (v, attcfg) {
            var r = parseFloat(v);
            return isNaN(r) ? getDefaultAttValue(attcfg) : r;
        }
    },
    "boolean" : {
        defaultValue : false,
        convert : function (v, attcfg) {
            return v === true || v === 1 || v === '1' || v === 'true';
        }
    },
    "string" : {
        defaultValue : '',
        convert : function (v, attcfg) {
            return v + '';
        }
    },
    "object" : {
        defaultValue : null,
        convert : identity
    },
    "callback" : {
        defaultValue : null,
        convert : identity
    },
    "template" : {
        defaultValue : null,
        convert : identity
    }
};

var BINDING_VALUES = {
    "none" : 0,
    "1-way" : 1,
    "2-way" : 2
};

function getDefaultAttValue (attcfg) {
    // attcfg.type is always set when called from ATTRIBUTE_TYPES.x.convert()
    var d = attcfg.defaultValue, tp=attcfg.type;
    if (d === undefined || tp==="template") {
        return ATTRIBUTE_TYPES[tp].defaultValue;
    } else {
        // ensure default has the right type
        return ATTRIBUTE_TYPES[tp].convert(d, {
            type : 'string'
        });
    }
}

/**
 * CptWrapper class CptWrapper objects create, initialize and observe components to detect changes on their properties
 * (or attributes) and call their onAttributeChange() or onPropertyChange() methods Such observers are necessary to
 * avoid having component observing themselves. This way, component can change their own properties through json.set()
 * without recursively being called because of their own changes This is performed by detecting if changes occur in the
 * onXXChange() call stack - if this is the case, CptWrapper will not call the onXXChange() callback again.
 */
var CptWrapper = klass({
    /**
     * Observer constructor.
     * @param Cptfn {Function} the component constructor
     */
    $constructor : function (Cptfn) {
        if (!Cptfn || Cptfn.constructor !== Function) {
            log.error("[CptWrapper] Invalid Component constructor!");
        } else {
            this.cpt = new Cptfn();
            this.nodeInstance = null; // reference to set the node instance adirty when an attribute changes
            this.root=null; // reference to the root template node
            this.initialized = false;
            this.needsRefresh = true;

            // update attribute values for simpler processing
            var atts = this.cpt.$attributes, att, bnd;
            if (atts) {
                for (var k in atts) {
                    att = atts[k];
                    if (k.match(/^on/)) {
                        // this is a callback
                        if (!att.type) {
                            log.error("Attribute type 'callback' should be set to '" + k + "'");
                        } else if (att.type !== "callback") {
                            log.error("Attribute type 'callback' should be set to '" + k + "' instead of: "
                                    + att.type);
                            att.type = "callback";
                        }
                        continue;
                    }

                    bnd = att.binding;
                    // set the internal _binding value 0=none 1=1-way 2=2-way
                    if (bnd) {
                        bnd = BINDING_VALUES[bnd];
                        if (bnd !== undefined) {
                            att._binding = bnd;
                        } else {
                            log.error("Invalid attribute binding value: " + att.binding);
                            att._binding = 0;
                        }
                    } else {
                        att._binding = 0;
                    }

                    // check type
                    if (att.type) {
                        if (att.type === "callback") {
                            log.error("Attribute of type 'callback' must start with 'on' - please rename: " + k);
                        } else if (ATTRIBUTE_TYPES[att.type] === undefined) {
                            log.error("Invalid attribute type: " + att.type);
                            att.type = 'string';
                        }
                    } else {
                        att.type = 'string';
                    }
                }
            }
        }
    },

    $dispose : function () {
        // unobserve properties and events
        if (this._cptChgeCb) {
            json.unobserve(this.cpt, this._cptChgeCb);
            this._cptChgeCb = null;
        }
        var c=this.cpt;
        if (c) {
            if (c.$dispose) {
                c.$dispose();
            }
            c.nodeInstance = null;
            this.cpt = null;
        }
        this.nodeInstance = null;
        this.root = null;
    },

    /**
     * Initialize the component by creating the attribute properties on the component instance and initializing the
     * attribute values to their initial value If the component instance has an $init() method it will be called as well
     * @param {Map} initAttributes map of initial value set by the component host
     */
    init : function (initAttributes,parentCtrl) {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        var cpt = this.cpt, atts = cpt.$attributes;
        if (!cpt) {
            return; // just in case
        }

        // add $getElement methods
        cpt.$getElement=this.$getElement.bind(this);

        if (atts) {
            if (!initAttributes) {
                initAttributes = {};
            }

            // initialize attributes
            var iAtt, att, isAttdefObject, hasType, v, attType;
            for (var k in atts) {
                if (cpt[k]) {
                    continue;
                }
                att = atts[k];
                iAtt = initAttributes[k];
                // determine if attribute definition is an object or a plain value
                isAttdefObject = (typeof(atts[k]) === 'object');
                hasType = (isAttdefObject && atts[k].type);
                if (hasType) {
                    attType = ATTRIBUTE_TYPES[att.type];
                    if (!attType) {
                        log.error("Invalid component attribute type: " + att.type);
                        attType = ATTRIBUTE_TYPES['string'];
                    }
                }
                if (att.type === "callback") {
                    // create an even callback function
                    this.createEventFunction(k.slice(2));
                    cpt[k].isEmpty=(iAtt===undefined);
                    continue;
                } else if (att.type === "template") {
                    v=null;
                } else {
                    // determine value
                    v = '';
                    if (iAtt !== undefined) {
                        v = iAtt;
                    } else {
                        if (isAttdefObject) {
                            v = att.defaultValue;
                            if (v === undefined && hasType) {
                                v = attType.defaultValue;
                            }
                        } else {
                            // attribute directly references the default value
                            v = att; // todo clone objects
                        }
                    }
                    // convert value type if applicable
                    if (hasType) {
                        v = attType.convert(v, att);
                    }
                }
                // in the component attribute
                cpt[k] = v;
            }
        }

        if (cpt.$init) {
            // call init if defined on the component
            cpt.$init(parentCtrl);
        }

        this._cptChgeCb = this.onCptChange.bind(this);
        json.observe(cpt, this._cptChgeCb);
    },

    /**
     * Create an event function on the component controller in order to ease event notification e.g. to raise the
     * 'select' event, developers should simply write in the controller: this.onselect({foo:"bar"});
     */
    createEventFunction : function (evtType) {
        var self = this;
        this.cpt["on" + evtType] = function (evtData) {
            if (!evtData) {
                evtData = {};
            }
            if (!evtData.type) {
                evtData.type = evtType;
            }
            if (self.nodeInstance && self.nodeInstance.onEvent) {
                self.nodeInstance.onEvent(evtData);
            }
        };
    },

    /**
     * Check if not already in event handler stack and call the change event handler
     */
    onCptChange : function (change) {
        var chg = change, cpt = this.cpt;
        if (change.constructor === Array) {
            if (change.length > 0) {
                chg = change[0];
            } else {
                log.error('[CptNode] Invalid change - nbr of changes: '+change.length);
                return;
            }
        }
        this.needsRefresh=true;
        var nm = chg.name; // property name
        if (nm === "") {
            return; // doesn't make sens (!)
        }

        var callControllerCb = true; // true if the onXXXChange() callback must be called on the controller

        var att, isAttributeChange = false;
        if (cpt.$attributes) {
            att = cpt.$attributes[nm];
            isAttributeChange = (att !== undefined);
            if (isAttributeChange) {
                // adapt type if applicable
                var t = att.type;
                if (t) {
                    var v = ATTRIBUTE_TYPES[t].convert(chg.newValue, att);
                    chg.newValue = v;
                    cpt[nm] = v; // change is already raised, no need to trigger another one through json.set()
                }
            }

            if (isAttributeChange && this.nodeInstance) {
                // notify attribute changes to the node instance (and the host) if attribute has a 2-way binding
                if (att._binding === 2) {
                    chg.newValue = this.cpt[nm]; // attribute value may have been changed by the controller
                    this.nodeInstance.onAttributeChange(chg);
                }
            }

            if (isAttributeChange) {
                // check if cb must be called depending on binding mode
                if (att._binding === 0) {
                    callControllerCb = false;
                }
            }
        }

        if (callControllerCb) {
            if (this.processingChange === true) {
                // don't re-enter the change loop if we are already processing changes
                return;
            }
            this.processingChange = true;
            try {
                // calculate the callback name (e.g. onValueChange for the 'value' property)
                var cbnm='';
                if (isAttributeChange) {
                    cbnm=att.onchange;
                }
                if (!cbnm) {
                    cbnm = ["$on", nm.charAt(0).toUpperCase(), nm.slice(1), "Change"].join('');
                }

                if (cpt[cbnm]) {
                    cpt[cbnm].call(cpt, chg.newValue, chg.oldValue);
                }

            } finally {
                this.processingChange = false;
            }
        }
    },

    /**
     * Method that will be associated to the component controller to allow for finding an element
     * in the DOM generated by its template
     * Note: this method only returns element nodes - i.e. node of type 1 (ELEMENT_NODE)
     * As a consequence $getElement(0) will return the first element, even if a text node is inserted before
     * @param {Integer} index the position of the element (e.g. 0 for the first element)
     * @retrun {DOMElementNode}
     */
    $getElement:function(index) {
        var nd=this.nodeInstance;
        if (!nd) {
            nd=this.root;
        }
        if (nd) {
            return nd.getElementNode(index);
        }
        return null;
    },

    /**
     * Call the $refresh() function on the component
     */
    refresh:function() {
        var cpt=this.cpt;
        if (this.needsRefresh) {
            if (cpt && cpt.$refresh) {
                cpt.$refresh();
                this.needsRefresh=false;
            }
        }
    }
});

/**
 * Create a Component wrapper and initialize it correctly according to the attributes passed as arguments
 * @param {Object} cptArgs the component arguments
 *      e.g. { nodeInstance:x, $attributes:{att1:{}, att2:{}}, $content:[] }
 */
function createCptWrapper(Ctl, cptArgs) {
    var cw = new CptWrapper(Ctl), att, t, v; // will also create a new controller instance
    if (cptArgs) {
        var cpt=cw.cpt, ni=cptArgs.nodeInstance;
        if (ni.isCptComponent || ni.isCptAttElement) {
            // set the nodeInstance reference on the component
            var $attributes=cptArgs.$attributes, $content=cptArgs.$content;
            cw.nodeInstance = ni;
            cw.cpt.nodeInstance = ni;

            if ($attributes) {
                for (var k in $attributes) {

                    // set the template attribute value on the component instance
                    if ($attributes.hasOwnProperty(k)) {
                        att=cw.cpt.$attributes[k];
                        t=att.type;
                        v=$attributes[k];

                        if (t && ATTRIBUTE_TYPES[t]) {
                            // in case of invalid type an error should already have been logged
                            // a type is defined - so let's convert the value
                            v=ATTRIBUTE_TYPES[t].convert(v, att);
                        }
                        json.set(cpt,k,v);
                    }
                }
            }

            if ($content) {
                if (cpt.$content) {
                  log.error(ni+" Component controller cannot use '$content' for another property than child attribute elements");
                } else {
                  // create the content property on the component instance
                  json.set(cpt,"$content",$content);
                }
            }
        }
    }
    return cw;
}

exports.CptWrapper = CptWrapper;
exports.createCptWrapper=createCptWrapper;
