var json = require("hsp/json"),
    $TextNode = require("hsp/rt/$text");

var $CptNode,$CptAttElement, TNode; // injected through setDependency to avoid circular dependencies

exports.setDependency=function(name,value) {
  if (name==="$CptAttElement") {
    $CptAttElement=value;
  } else if (name==="$CptNode") {
    $CptNode=value;
  } else if (name==="TNode") {
    TNode = value;
  }
};

/**
 * $CptComponent contains methods that will be added to the prototype of all
 * $CptNode node instance that correspond to a component insertion:
 *   <#mywidget foo="bar"/>
 * (i.e. a component using a template with any controller)
 */
exports.$CptComponent = {
  initCpt:function(tpl) {
    this.isCptComponent = true;

    // prepare init arguments
    var initArgs = {};
    if (this.atts) {
        var att, pvs = this.parent.vscope;
        for (var i = 0, sz = this.atts.length; sz > i; i++) {
            att = this.atts[i];
            initArgs[att.name] = att.getValue(this.eh, pvs, null);
        }
    }

    // determine if cpt supports template arguments
    var ctlProto=tpl.controllerConstructor.prototype;
    this.ctlAttributes=ctlProto.attributes;
    this.ctlElements=ctlProto.elements;

    // load template arguments
    this.loadCptAttElements();

    // load child elements before processing the template
    // TODO
    var cptArgs={
      nodeInstance:this,
      attributes:null,
      content:null
    };
    if (this.tplAttributes) {
      var tpa=this.tplAttributes, attributes={};
      cptArgs.attributes={};
      for (var k in tpa) {
        // set the template attribute value on the controller
        if (tpa.hasOwnProperty(k)) {
          attributes[k]=tpa[k];
        }
      }
      cptArgs.attributes=attributes;
    }
    if (this.tplElements) {
      var tpe=this.tplElements, content=[];
      
      for (var i=0,sz=tpe.length; sz>i; i++) {
        // set the template attribute value on the controller
        content.push(tpe[i]);
      }
      cptArgs.content=content;
    }

    tpl.call(this, initArgs, cptArgs);
  },

  /**
   * Safely cut all dependencies before object is deleted
   */
  $dispose:function() {
    this.ctlAttributes=null;
    this.cleanObjectProperties();
    var tpa=this.tplAttributes;
    if (tpa) {
      for (var k in tpa) {
        if (tpa.hasOwnProperty(k)) {
          tpa[k].$dispose();
        }
      }
    }
    var ag=this._attGenerators;
    if (ag) {
      for (var k in ag) {
        if (ag.hasOwnProperty(k)) {
          ag[k].$dispose();
        }
      }
    }
    var en=this.attEltNodes;
    if (en) {
      for (var i=0,sz=en.length; sz>i; i++) {
        en[i].$dispose();
      }
      this.attEltNodes=null;
    }
  },

  /**
   * Load the component sub-nodes that correspond to template attributes
   */
  loadCptAttElements : function () {
    // determine the possible template attribute names
    var tpAttNames={}, ca=this.ctlAttributes, defaultTplAtt=null, lastTplAtt=null, count=0;
    for (var k in ca) {
      if (ca.hasOwnProperty(k) && ca[k].type==="template") {
        // k is defined in the controller attributes collection
        // so k is a valid template attribute name
        tpAttNames[k]=true;
        count++;
        if (ca[k].defaultContent) {
          defaultTplAtt=k;
        }
        lastTplAtt=k;
      }
    }

    // if there is only one template attribute it will be automatically considered as default
    if (!defaultTplAtt) {
      if (count===1) {
        defaultTplAtt=lastTplAtt;
      } else if (count>1) {
        // error: a default must be defined
        console.error(this+" A default content element must be defined when multiple content elements are supported");
        // use last as default
        defaultTplAtt=lastTplAtt;
      }
    }

    // check if a default attribute element has to be created and create it if necessary
    this.manageDefaultAttElt(defaultTplAtt);

    // Analyze node attributes to see if a template attribute is passed as text attribute
    var atts=this.atts, att, nm;
    if (atts) {
      for (var k in atts) {
        if (!atts.hasOwnProperty(k)) continue;
        att=atts[k];
        nm=att.name;
        if (tpAttNames[nm]) {
          // nm is a template attribute passed as text attribute
          if (this.tplAttributes && this.tplAttributes[nm]) {
            // already defined: raise an error
            
            console.error(this+" Component attribute '" + nm + "' is defined multiple times - please check");
          } else {
            // create new tpl Attribute Text Node and add it to the tplAttributes collection
            if (!att.generator) {
              var txtNode;
              if (att.value) {
                // static value
                txtNode = new $TextNode(0,[""+att.value]);
              } else {
                // dynamic value using expressions
                txtNode = new $TextNode(this.exps,atts[k].textcfg);
              }
              if (!this._attGenerators) {
                this._attGenerators = [];
              }
              att.generator = new $CptAttElement(nm,0,0,0,[txtNode]); // name, exps, attcfg, ehcfg, children
              this._attGenerators.push(att.generator);
            }
            // generate a real $CptAttElement using the TextNode as child element
            var ni=att.generator.createNodeInstance(this);
            ni.isCptContent=true;
            if (!this.attEltNodes) {
              this.attEltNodes=[];
            }
            this.attEltNodes.push(ni);
            // attribute elements will automatically register through registerAttElement()
          }
        }
      }
    }

    this.retrieveAttElements();
  },

  /**
   * Check if a default attribute element has to be created and create one if necessary
   */
  manageDefaultAttElt:function (defaultTplAtt) {
    if (!this.children) {
      return;
    }

    // TODO memoize result at prototype level to avoid processing this multiple times

    //isValidCptAttElement
    var cn=this.children, sz=cn.length;

    // check in which case we fall:
    // 1. valid and invalid cpt att element are found -> error
    // 2. only valid cpt att element are found
    // 3. only invalid cpt att element are found -> default cpt att element must be created
    var validFound=false, invalidFound=false;
    for (var i=0;sz>i;i++) {
      if (cn[i].isValidCptAttElement()) {
        validFound=true;
      } else {
        invalidFound=true;
      }
    }

    if (validFound && invalidFound) {
      // case #1: error
      console.error(this+"Component content cannot mix attribute elements with content elements");
    } else {
      var loadCpts=false;
      if (validFound && !invalidFound) {
        // case #2: only valid cpt have been found - so we have to load them
        loadCpts=true;
      } else if (!validFound && invalidFound && defaultTplAtt) {
        // case #3: only invalid cpt have been found - so we have to create a default attribute element
        // to fall back in case #2
        var catt=new $CptAttElement(defaultTplAtt,0,0,0,this.children); // name, exps, attcfg, ehcfg, children

        // add this default cpt att element as unique child
        this.children=[catt];
        cn=this.children;
        sz=cn.length;
        loadCpts=true;
      }
      if (loadCpts) {
        var ni;
        if (!this.attEltNodes) {
          this.attEltNodes=[];
        }
        for (var i=0;sz>i;i++) {
          if (!cn[i].isEmptyTextNode) {
            ni=cn[i].createNodeInstance(this);
            ni.isCptContent=true;
            this.attEltNodes.push(ni);
            // attribute elements will automatically register through registerAttElement()
          }
        }
      }
    }
  },

  /**
   * Retrieve all child attribute elements
   * and update the tplAttributes and tplElements collections
   */
  retrieveAttElements:function() {
    var aen=this.attEltNodes;
    if (!aen) {
      return null;
    }
    var attElts=[], cta=this.ctlAttributes;
    for (var i=0,sz=aen.length; sz>i;i++) {
      aen[i].registerAttElements(attElts);
    }
    // check that all elements are valid (i.e. have valid names)
    var nm, elt, ok, elts=[], cte=this.ctlElements? this.ctlElements : [];
    for (var i=0,sz=attElts.length; sz>i; i++) {
      elt=attElts[i];
      nm=elt.name;
      ok=true;
      if (cta && cta[nm]) {
        // valid tpl attribute
        if (!this.tplAttributes) {
          this.tplAttributes={};
        }
        this.tplAttributes[nm]=elt;
      } else {
        if (!nm) {
          console.error(this+" Invalid attribute element (unnamed)");
          ok=false;
        } else if (!cte[nm]) {
          console.error(this+" Invalid attribute element: @"+nm);
          ok=false;
        }
      }
      if (ok) {
        elts.push(elt);
      }
    }
    if (elts.length===0) {
      elts=null;
    }
    this.tplElements=elts;
    return elts;
  },

  /**
   * If the template instance support some template attributes this method return the
   * template attribute object that corresponds to the name passed as argument
   * This method is called by the CptNode createNodeInstance to determine if a component
   * is of type $CptAttElement
   * Null is returned if there is no attribute corresponding to this name
   */
  getTplAttribute : function (name) {
    var ctlAtts=this.ctlAttributes;
    if (ctlAtts) {
      return ctlAtts[name];
    }
    return null;
  },

  /**
   * Callback called by the controller observer when the controller raises an event
   */
  onEvent : function (evt) {
      var evh = this.evtHandlers, et = evt.type;
      if (evh) {
          for (var i = 0, sz = evh.length; sz > i; i++) {
              if (evh[i].evtType === et) {
                  evh[i].executeCb(evt, this.eh, this.parent.vscope);
                  break;
              }
          }
      }
  },

  /**
   * Recursively replace the DOM node by another node if it matches the preNode passed as argument
   */
  replaceNodeBy : function (prevNode, newNode) {
      if (prevNode === newNode) {
          return;
      }
      TNode.replaceNodeBy.call(this,prevNode, newNode);
      var aen=this.attEltNodes;
      if (aen) {
          for (var i=0,sz=aen.length; sz>i;i++) {
              aen[i].replaceNodeBy(prevNode, newNode);
          }
      }
  },

  /**
   * Refresh the sub-template arguments and the child nodes, if needed
   */
  refresh : function () {
      if (this.edirty) {
          var en=this.attEltNodes;
          if (en) {
              for (var i=0,sz=en.length; sz>i; i++) {
                  en[i].refresh();
              }
              // if content changed we have to rebuild tplElements
              this.retrieveAttElements();
          }
          // Change content of the controller
          json.set(this.controller,"content",this.tplElements);

          this.edirty=false;
      }
      $CptNode.refresh.call(this);
  },

  /**
   * Refresh the node attributes (even if adirty is false)
   */
  refreshAttributes : function () {
    var atts = this.atts, att, eh = this.eh, pvs = this.parent.vscope, ctl = this.controller, v;
    this.adirty = false;
    if (atts && ctl && ctl.attributes) {
      // this template has a controller
      // let's propagate the new attribute values to the controller attributes
      for (var i = 0, sz = this.atts.length; sz > i; i++) {
        att = atts[i];
        // propagate changes for 1- and 2-way bound attributes
        if (ctl.attributes[att.name]._binding !== 0) {
          v = att.getValue(eh, pvs, null);
          if ('' + v != '' + ctl[att.name]) {
            // values may have different types - this is why we have to check that values are different to
            // avoid creating loops
            json.set(ctl, att.name, v);
          }
        }
      }
    }
  },

  /**
   * Helper function used to give contextual error information
   * @return {String} - e.g. "[Component lib.mycomponent]"
   */
  toString:function() {
    return "[Component: #"+this.tplPath.slice(1).join(".")+"]";
  }
};
