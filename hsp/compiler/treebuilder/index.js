var SyntaxTree = require("./syntaxTree").SyntaxTree;

/**
 * TODO
 */
exports.build = function (blockList) {
    var res = {};
    try {
        var st = new SyntaxTree();
        st.generateTree(blockList);
        // st.displayErrors();
        res = {
            syntaxTree : st.tree.content,
            errors : st.errors
        };
    } catch (ex) {
        res = {
            syntaxTree : null,
            errors : [{
                        description : ex.toString(),
                        line : ex.line,
                        column : ex.column
                    }]
        };
    }
    return res;
};
