/**
 * $CptAttInsert contains methods that will be added to the prototype of all
 * $CptNode node instance that correspond to an insertion of a component attribute
 *  e.g. <#c.body/> used in the template of mycpt that is instanciated as follows:
 *  <#mycpt><#body>foobar</#body></#mycpt>
 * so these cpt nodes are simply insert nodes for an attribute of its parent component
 */
module.exports.$CptAttInsert = {
  initCpt:function(rootRef,name) {
    // get controller
    var ctl=this.vscope[rootRef];

    // get the node instance corresponding to the component that this attribute refers to
    var cptNodeInstance=ctl.nodeInstance;

    // component attribute associated to this insert
    if (cptNodeInstance.tplAttributes) {
      var cptAttribute=cptNodeInstance.tplAttributes[name];

      // TODO 
      // register somewhere to be notified if cpt attribute changes (e.g. created / deleted throgh an {if})
      // and update childNode list if need be

      if (cptAttribute) {
        var root=cptAttribute.getTemplateNode(this.vscope);

        // append root
        this.childNodes=[];
        this.childNodes[0]=root;
        root.render(this.node);
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
