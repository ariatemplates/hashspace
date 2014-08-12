var klass = require("../../klass");

var ClassHandler = klass({
    $constructor : function (nodeInstance) {
        this.nodeInstance = nodeInstance;
        this.previousClasses = null;
    },

    setValue: function (name, newClasses) {
        var currentClasses = this.nodeInstance.node.className;
        var results = currentClasses? currentClasses.split(' '): [];
        if (this.previousClasses) {
            var previousClassesArray = this.previousClasses.split(' ');
            for (var i = 0; i < previousClassesArray.length; i++) {
                var index = results.indexOf(previousClassesArray[i]);
                if (index > -1) {
                    results.splice(index, 1);
                }
            }
        }
        if (newClasses != null && newClasses.length > 0) {
            results.splice(0, 0, newClasses.replace(/^\s+|\s+$/g, '').replace(/\s+/g,' '));
        }
        this.previousClasses = newClasses;
        
        //Add generated className to the element (issue on IE8 with the class attribute?)
        if (this.nodeNS) {
            this.nodeInstance.node.setAttribute("class", results.join(' '));
        } else {
            this.nodeInstance.node.className = results.join(' ');
        }
    },

    $dispose: function() {
        this.previousClasses = null;
    }
});

module.exports = ClassHandler;