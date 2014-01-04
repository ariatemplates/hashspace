var json = require("hsp/json");
var $TextNode = require("hsp/rt/$text");
var TNode = require("hsp/rt/tnode").TNode;
var doc = require("hsp/document");

/**
 * $CptComponent contains methods that will be added to the prototype of all
 * $CptNode node instance that correspond to a component insertion:
 *   <#mywidget foo="bar"/>
 * (i.e. a component using a template with any controller)
 */
module.exports.$CptComponent = {
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
    var Ctl=tpl.controllerConstructor;
    this.ctlAttributes=Ctl.prototype.attributes;

    // load template arguments
    this.loadCptAttributes();

    tpl.call(this, initArgs);

    if (this.ctlWrapper) {
        this.ctlWrapper.nodeInstance = this;
    }
    if (this.controller) {
      if (this.tplAttributes) {
        var ctl=this.controller, tpa=this.tplAttributes;
        for (var k in tpa) {
          // set the template attribute value on the controller
          if (tpa.hasOwnProperty(k)) {
            json.set(ctl,k,{node:tpa[k]});
          }
        }
      }
    }
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
  },

  /**
   * Load the component sub-nodes that correspond to template attributes
   */
  loadCptAttributes : function () {
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
    if (!defaultTplAtt && count===1) {
      defaultTplAtt=lastTplAtt;
    }

    if (this.children) {
      // create childNodes first as they contain component template attributes
      
      // Analyze the child nodes
      var n, tplAttFound=false, cn=[];
      var cnode=this.node;
      this.node=null;
      for (var i = 0, sz = this.children.length; sz > i; i++) {
          n = this.children[i].createNodeInstance(this);

          if (n.tplAttribute) {
            tplAttFound=true;
            var nm=n.tplAttribute.name;
            // register it in the tplAttributes collection
            if (!this.tplAttributes) {
              this.tplAttributes={};
            }
            this.tplAttributes[nm]=n;
          } else {
            // ignore this node (could be a $if or $foreach)
          }
          cn.push(n);
      }
      this.node=cnode;

      // if there is a default template and no explicit tpl attributes found let's consider
      // the content as associated to the default template
      if (!tplAttFound) {
        if (!defaultTplAtt) {
          console.error("Component content cannot be associated to any component attribute");
        } else {
          // create a TNode to gather all chil nodes and register it in the tplAttributes collection
          var t=new TNode(0);
          t.isDOMless=true; // to minimize initialization (cf. TNode)

          var ni=t.createNodeInstance(this);

          // use a doc fragment to gather all node instance nodes
          ni.node=doc.createDocumentFragment();
          ni.isDOMless=false;
          t.childNodes=cn;

          // register all child nodes as child of the new TNode
          for (var k in cn) {
            if (!cn.hasOwnProperty(k)) continue;
            cn[k].parent=ni;
            ni.node.appendChild(cn[k].node);
          }

          // register the node in the tplAttributes collection
          this.tplAttributes={};
          this.tplAttributes[defaultTplAtt]=ni;
        }
      }
      
    }

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
            console.error("Component attribute '" + nm + "' is defined multiple times - please check");
          } else {
            // add it to the tplAttributes collection
            
            // create new tpl Attribute Text Node
            if (!att.generator) {
              var gen;
              if (att.value) {
                // static value
                gen = new $TextNode(0,[""+att.value]);
              } else {
                // dynamic value using expressions
                gen = new $TextNode(this.exps,atts[k].textcfg);
              }
              if (!this._attGenerators) {
                this._attGenerators = [];
              }
              this._attGenerators.push(gen);
              att.generator = gen;
            }
            var n=att.generator.createNodeInstance(this);

            // add it to the collection
            if (!this.tplAttributes) {
              this.tplAttributes={};
            }
            this.tplAttributes[nm]=n;
          }
        }
      }
    }
  },

  /**
   * If the template instance support some template attributes this method return the
   * template attribute object that corresponds to the name passed as argument
   * This method is called by the CptNode createNodeInstance to determine if a component
   * is of type $CptAttribute
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
  }
};
