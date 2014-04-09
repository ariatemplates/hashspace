/**
 * $CptAttInsert contains methods that will be added to the prototype of all
 * $CptNode node instance that correspond to an insertion of a component attribute
 *  e.g. <#c.body/> used in the template of mycpt that is instanciated as follows:
 *  <#mycpt><#body>foobar</#body></#mycpt>
 * so these cpt nodes are simply insert nodes for an attribute of its parent component
 */
module.exports.$CptAttInsert = {
  initCpt:function(cptAttElement) {
    // get the $RootNode corresponding to the templat to insert
    var root=cptAttElement.getTemplateNode();

    if (root) {
      // append root as childNode
      this.childNodes=[];
      this.childNodes[0]=root;
      // instantiate sub-childNodes
      root.render(this.node,false);
    }
  },

  /**
   * Safely cut all dependencies before object is deleted
   */
  $dispose:function() {
    this.cleanObjectProperties();
  }
};
