var klass = require("../../klass");

var TreeWalker = klass({
    /**
     * Start traversing a parse tree. This method takes the intermediate representation created by the parser and
     * executes, for each of the nodes, a function defined on the processor object.
     * @param {SyntaxTree} tree the syntax tree.
     * @param {Object} processor a set of function to process the tree elements.
     * @return {[type]} [description]
     */
    walk : function (tree, processor) {
        var out = [];
        if (tree) {
            for (var i = 0; i < tree.length; i += 1) {
                var type = tree[i].type;
                if (processor[type]) {
                    out.push(processor[type](tree[i], this));
                }
            }
        }
        return out;
    },

    /**
     * Execute a callback on each element of an array. The callback receives the value of the array. This method returns
     * an array with the return value of the callbacks if not null.
     * @param {Array} array the input array.
     * @param {Function} callback the callback.
     * @return {Array} an array made with the result of each callback.
     */
    each : function (array, callback) {
        var result = [];
        for (var i = 0; i < array.length; i += 1) {
            var value = callback(array[i]);
            if (value !== null) {
                result.push(value);
            }
        }
        return result;
    }

});
exports.TreeWalker = TreeWalker;
