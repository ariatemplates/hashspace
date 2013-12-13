var json = require("hsp/json");

/**
 * $CptTemplate contains methods that will be added to the prototype of all
 * $CptNode node instance that correspond to a template insertion:
 *   <#mytemplate foo="bar"/> 
 * (i.e. a component using a template without any controller)
 */
module.exports.$CptTemplate = {
  initCpt:function(tpl) {
    // prepare init arguments
    var initArgs = {};
    if (this.atts) {
        var att, pvs = this.parent.vscope;
        for (var i = 0, sz = this.atts.length; sz > i; i++) {
            att = this.atts[i];
            initArgs[att.name] = att.getValue(this.eh, pvs, null);
        }
    }

    tpl.call(this, initArgs);

    // the component is a template without any controller
    // so we have to observe the template scope to be able to propagate changes to the parent scope
    this._scopeChgeCb = this.onScopeChange.bind(this);
    json.observe(this.vscope, this._scopeChgeCb);
  },

  /**
   * Safely cut all dependencies before object is deleted
   */
  $dispose:function() {
    this.cleanObjectProperties();
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
      var atts = this.atts, att, eh = this.eh, pvs = this.parent.vscope, ctl = this.controller, v;
      this.adirty = false;
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
}
