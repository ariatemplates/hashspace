
/**
 * $CptAttInsert contains methods that will be added to the prototype of all
 * $CptNode node instance that correspond to an insertion of a component attribute
 *  e.g. <#c.body/> used in the template of mycpt that is instanciated as follows:
 *  <#mycpt><#body>foobar</#body></#mycpt>
 * so these cpt nodes are simply insert nodes for an attribute of its parent component
 */
module.exports.$CptAttInsert = {
  initCpt:function(rootRef,name) {
    // TODO
    console.log("$CptAttInsert: "+name)
    var ctl=this.vscope[rootRef];

    // get the node instance corresponding to the component that this attribute refers to
    var cptNodeInstance=ctl.nodeInstance;

    // component attribute associated to this insert
    var cptAttribute=cptNodeInstance.tplAttributes[name];

    // TODO 
    	// register somwhere to be notified if cpt attribute changes (e.g. created / deleted throgh an {if})
    	// and update childNode list if need be

    if (cptAttribute) {
    	// cpt attribute has been defined for the parent component
    	// add cpt attribute nodes to the current node
	    this.node.appendChild(cptAttribute.node);
	    cptAttribute.node=this.node;
	    cptAttribute.parent=this; // to bubble dirty state
	    this.childNodes=[];
	    this.childNodes[0]=cptAttribute; // to propagate refresh
    }
  },

  /**
   * Safely cut all dependencies before object is deleted
   */
  $dispose:function() {
    this.cleanObjectProperties();
  }
}
