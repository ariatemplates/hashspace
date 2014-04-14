var doc = require("../document");

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
    this.createPathObservers();
    this.createCommentBoundaries("cptattinsert");
    this.createChildNodeInstances(cptAttElement);
  },

  createChildNodeInstances:function(cptAttElement) {
    if (!this.isDOMempty) {
        this.removeChildNodeInstances(this.node1,this.node2);
        this.isDOMempty = true;
    }

    this.cptAttElement=cptAttElement;
    this.childNodes=[];
    var root=this.cptAttElement.getTemplateNode();
    if (root) {
        // append root as childNode
        this.childNodes[0]=root;

        // render in a doc fragment
        var df = doc.createDocumentFragment();
        root.render(df,false);

        this.node.insertBefore(df, this.node2);
        root.replaceNodeBy(df, this.node); // recursively remove doc fragment reference
        this.isDOMempty = false;
      }
  },

  /**
   * Safely cut all dependencies before object is deleted
   */
  $dispose:function() {
    this.cptAllElt=null;
    this.cleanObjectProperties();
  }
};
