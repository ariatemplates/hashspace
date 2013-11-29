var klass = require("../klass");

var TreeWalker = klass({
    /**
     * Start traversing a parse tree. This method takes the intermediate representation created by the parser and
     * executes, for each of the nodes, a function defined on the processor object
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
