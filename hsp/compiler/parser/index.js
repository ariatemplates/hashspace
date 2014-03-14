var blockParser = require("./hspblocks.peg.js");

/**
 * Return the list of instruction blocks that compose a template file.
 * At this stage the template AST is not complete, it is built in the next step of the compilation process, i.e. the treebuilder.
 * Note: this function is exposed for unit test purposes and should not be used directly
 * @param {String} template the template to parse
 * @return {Object} the parse result
 */
exports.parse = function (template) {
    // add a last line feed a the end of the template as the parser parses the plaintext
    // sequences only when ending with a new line sequence (workaround to solve pegjs issue)
    return blockParser.parse(template + "\r\n");
};