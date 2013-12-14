var doc = require("hsp/document");

/**
 * $CptAttribute contains methods that will be added to the prototype of all
 * $CptNode node instance that correspond to a component used as template attribute - e.g. body in:
 *   <#mycpt><#body>foobar</#body></#mycpt>
 * so these cpt nodes are simply attributes of another component
 */
module.exports.$CptAttribute = {
  initCpt:function(name) {
    //nothing to do
    this.tplAttribute={name:name};
    this.node=doc.createDocumentFragment();

    // create sub-nodes
    if (this.children) {
      this.childNodes=[];
      for (var i = 0, sz = this.children.length; sz > i; i++) {
        this.childNodes[i] = this.children[i].createNodeInstance(this);
      }
    }
  },

  /**
   * Safely cut all dependencies before object is deleted
   */
  $dispose:function() {
    this.cleanObjectProperties();
  }
};
