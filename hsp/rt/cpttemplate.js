var json = require("../json"),
    doc = require("./document");

/**
 * $CptTemplate contains methods that will be added to the prototype of all
 * $CptNode node instance that correspond to a template insertion:
 *   <#mytemplate foo="bar"/> 
 * (i.e. a component using a template without any controller)
 */
module.exports.$CptTemplate = {
  /**
   * Initialize the component
   * @param {Object} arg
   *     e.g. {template:obj,ctlConstuctor:obj.controllerConstructor}
   */
  initCpt:function(arg) {
    // create path observers and comment boundaries
    this.createPathObservers();
    this.createCommentBoundaries("template");
    this.createChildNodeInstances();

    // the component is a template without any controller
    // so we have to observe the template root scope to be able to propagate changes to the parent scope
    this._scopeChgeCb = this.onScopeChange.bind(this);
    json.observe(this.vscope, this._scopeChgeCb);
  },

  /**
   * Create the child nodes for a dynamic template - this method assumes
   * that node1 and node2 exist
   */
  createChildNodeInstances : function () {
      this.removeChildInstances();

      if (this.template) {
        var args = this.getTemplateArguments();

        // temporarily assign a new node to get the content in a doc fragment
        var realNode = this.node;
        var df = doc.createDocumentFragment();
        this.node = df;
        this.template.call(this, args);

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
    this.cleanObjectProperties(localPropOnly);
  },

  /**
   * Callback called by the json observer when the scope changes This callback is only called when the component
   * template has no controller Otherwise the cpt node is automatically set dirty and controller attributes will be
   * refreshed through refresh() - then the controller will directly call onAttributeChange()
   */
  onScopeChange : function (changes) {
      if (changes.constructor === Array) {
          // cpt observer always return the first element of the array
          if (changes.length > 0) {
              this.onAttributeChange(changes[0]);
          }
      }
  },

  /**
   * Refresh the node attributes (even if adirty is false)
   */
  refreshAttributes : function () {
      var atts = this.atts, att, eh = this.eh, pvs = this.parent.vscope;
      if (atts) {
          // this template has no controller
          // let's propagate the new attribute values to the current scope
          var vscope = this.vscope;
          for (var i = 0, sz = this.atts.length; sz > i; i++) {
              att = atts[i];
              json.set(vscope, att.name, att.getValue(eh, pvs, null));
          }
      }
  }
};
