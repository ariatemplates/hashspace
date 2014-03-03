var blockParser = require("./hspblocks.peg.js");

/**
 * Return the list of instruction blocks that compose a template file at this stage the template AST is not complete -
 * cf. parse() function to get the complete syntax tree Note: this function is exposed for unit test purposes and should
 * not be used directly
 * @param {String} template the template to parse
 */
exports.parse = function (template) {
    // add a last line feed a the end of the template as the parser parses the plaintext
    // sequences only when ending with a new line sequence (workaround to solve pegjs issue)
    return blockParser.parse(template + "\r\n");
};