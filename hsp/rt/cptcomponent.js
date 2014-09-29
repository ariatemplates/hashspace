var json = require("../json"),
    log = require("./log"),
    doc = require("./document"),
    $TextNode = require("./$text"),
    cptwrapper = require("./cptwrapper");

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
  /**
   * Initialize the component
   * @param {Object} arg
   *     e.g. {template:obj,ctlConstuctor:obj.controllerConstructor}
   *     e.g. {cptattelement:obj,ctlConstuctor:obj.controllerConstructor}
   */
  initCpt:function(arg) {
    this.isCptComponent = true;
    this.ctlConstuctor=arg.ctlConstuctor;

    if (this.template) {
      // this component is associated to a template
      this.createPathObservers();
      this.createCommentBoundaries("cpt");
      this.createChildNodeInstances();

      // $init child components
      this.initChildComponents();
      this.ctlWrapper.refresh(); // first refresh
    } else if (arg.cptattelement) {
      // this component is an attribute of another component
      var cw=cptwrapper.createCptWrapper(this.ctlConstuctor, this.getCptArguments());
      this.ctlWrapper=cw;
      this.controller=cw.cpt;
      if (cw.cpt.tagName) {
          log.error(this+" 'tagName' is a reserved keyword and cannot be used in component controllers");
      }
      cw.cpt.tagName=this.tagName;
      // NB the controller $init has not been called yet - this will be done once the parent component has initialized
    }
  },

  /**
   * Process and retrieve the component arguments that are needed to init the component template
   */
  getCptArguments:function() {
    // determine if cpt supports template arguments
    if (this.template) {
      // as template can be changed dynamically we have to sync the constructor
      this.ctlConstuctor=this.template.controllerConstructor;
    }
    var ctlProto=this.ctlConstuctor.prototype;
    this.ctlAttributes=ctlProto.$attributes;
    this.ctlElements=ctlProto.$elements;

    // load template arguments
    this.loadCptAttElements();

    // load child elements before processing the template
    var cptArgs={
      nodeInstance:this,
      $attributes:{},
      $content:null
    };
    var attributes=cptArgs.$attributes, att;

    if (this.atts) {
      // some attributes have been passed to this instance - so we push them to cptArgs
      // so that they are set on the controller when the template are rendered
      var atts = this.atts, eh = this.eh, pvs = this.vscope, nm;
      if (atts) {
        for (var i = 0, sz = this.atts.length; sz > i; i++) {
          att = atts[i];
          nm = att.name;
          if (this.ctlAttributes[nm].type!=="template") {
            attributes[nm]=att.getValue(eh, pvs, null);
          }
        }
      }
    }

    if (this.tplAttributes) {
      var tpa=this.tplAttributes;
      for (var k in tpa) {
        // set the template attribute value on the controller
        if (tpa.hasOwnProperty(k)) {
          attributes[k]=tpa[k];
        }
      }
    }
    if (this.childElements) {
      cptArgs.$content=this.getControllerContent();
    }
    return cptArgs;
  },

  /**
   * Create the child nodes for a dynamic template - this method assumes
   * that node1 and node2 exist
   */
  createChildNodeInstances : function () {
      this.removeChildInstances();

      if (this.template) {
        // temporarily assign a new node to get the content in a doc fragment
        this.vscope=this.parent.vscope; // to come back to original state, when the scope has not been changed by the template
        var targs=this.getTemplateArguments(), cargs=this.getCptArguments();
        var realNode = this.node;
        var df = doc.createDocumentFragment();
        this.node = df;
        this.template.call(this, targs, cargs); // WARNING: this changes vscope to the template vscope

        realNode.insertBefore(df, this.node2);
        this.replaceNodeBy(df , realNode); // recursively remove doc fragment reference
        // now this.node=realNode
        this.isDOMempty = false;
      }
  },

  /**
   * Safely cut all dependencies before object is deleted
   * @param {Boolean} localPropOnly if true only local properties will be deleted (optional)
   *        must be used when a new instance is created to adapt to a path change
   */
  $dispose:function(localPropOnly) {
    if (this.ctlWrapper) {
      this.ctlWrapper.$dispose();
      this.ctlWrapper=null;
      this.controller=null;
    }
    this.ctlAttributes=null;
    this.cleanObjectProperties(localPropOnly);
    this.ctlConstuctor=null;
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
    this.attEltNodes=null;
    this._attGenerators=null;

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
        log.error(this+" A default content element must be defined when multiple content elements are supported");
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

            log.error(this+" Component attribute '" + nm + "' is defined multiple times - please check");
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
    var ct=this.getCptContentType(), loadCpts=true;

    if (ct==="ERROR") {
      loadCpts=false;
      log.error(this.info+" Component content cannot mix attribute elements with content elements");
    } else if (ct!=="ATTELT") {
      if (defaultTplAtt) {
        // ct is CONTENT or INDEFINITE - so we create a default attribute element
        var catt=new $CptAttElement(defaultTplAtt,0,0,0,this.children); // name, exps, attcfg, ehcfg, children

        // add this default cpt att element as unique child
        this.children=[catt];
      } else {
        // there is no defaultTplAtt
        loadCpts=false;
      }
    }

    if (loadCpts) {
      var ni, cn=this.children, sz=cn.length;
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
  },

  /**
   * Retrieve all child attribute elements
   * and update the tplAttributes and childElements collections
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
        ok = false;
      } else {
        if (!nm) {
          log.error(this+" Invalid attribute element (unnamed)");
          ok=false;
        } else if (!cte[nm]) {
          log.error(this+" Invalid attribute element: @"+nm);
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
    this.childElements=elts;
    return elts;
  },

  /**
   * Initializes the attribute elements of type component that have not been
   * already initialized
   */
  initChildComponents:function() {
    var ce=this.childElements;
    if (!ce || !ce.length) {
      return;
    }
    var cw;
    for (var i=0,sz=ce.length;sz>i;i++) {
      cw=ce[i].ctlWrapper;
      if (cw && !cw.initialized) {
        cw.init(null,this.controller);
      }
    }
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
   * Calculate the content array that will be set on component's controller
   */
  getControllerContent:function() {
    var c=[], ce=this.childElements, celts=this.ctlElements, eltType;
    if (ce && ce.length) {
      for (var i=0, sz=ce.length;sz>i;i++) {
        eltType=celts[ce[i].name].type;
        if (eltType==="component") {
          c.push(ce[i].controller);
        } else if (eltType==="template") {
          c.push(ce[i]);
        } else {
          log.error(this+" Invalid element type: "+eltType);
        }
      }
    }
    return c.length>0? c : null;
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
              // if content changed we have to rebuild childElements
              this.retrieveAttElements();
              this.initChildComponents();
          }
          // Change content of the controller
          json.set(this.controller,"$content",this.getControllerContent());

          this.edirty=false;
      }
      // warning: the following refresh may change the component type and
      // as such ctlWrapper could become null if new component is a template
      $CptNode.refresh.call(this);
      if (this.ctlWrapper) {
        // refresh cpt through $refresh if need be
        this.ctlWrapper.refresh();
      }
  },

  /**
   * Refresh the node attributes (even if adirty is false)
   */
  refreshAttributes : function () {
    var atts = this.atts, att, ctlAtt, eh = this.eh, ctl = this.controller, v;
    var vs = this.isCptAttElement? this.vscope : this.parent.vscope;
    if (atts && ctl && ctl.$attributes) {
      // this template has a controller
      // let's propagate the new attribute values to the controller attributes
      for (var i = 0, sz = this.atts.length; sz > i; i++) {
        att = atts[i];
        ctlAtt = ctl.$attributes[att.name];
        // propagate changes for 1- and 2-way bound attributes
        if (ctlAtt.type!=="template" && ctlAtt._binding !== 0) {
          v = att.getValue(eh, vs, null);
          if (ctlAtt.type==="object" || ctlAtt.type==="array") {
            json.set(ctl, att.name, v);
          } else if ('' + v != '' + ctl[att.name]) {
            // values may have different types - this is why we have to check that values are different to
            // avoid creating loops
            json.set(ctl, att.name, v);
          }
        }
      }
    }
  }
};
