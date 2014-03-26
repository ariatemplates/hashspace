var path = require("path");
var parser = require("./parser/index");
var treebuilder = require("./treebuilder/index");
var jsgenerator = require("./jsgenerator/index");

/**
 * Compiles a template and return a JS compiled string and a list of errors.
 * @param {String} template the template file content as a string.
 * @param {String} dirPath the directory path.
 * @param {String} fileName the name of the file being compiled (optional - used for error messages).
 * @param {Boolean} includeSyntaxTree  if true, the result object will contain the syntax tree generated by the compiler.
 * @param {Boolean} bypassJSvalidation  if true, the validation of the generated JS file (including non-template code) is bypassed - default:false.
 * @return {JSON} a JSON structure with the following properties:
 *      errors: {Array} the error list - each error having the following structure:
 *          description: {String} - a message describing the error 
 *          line: {Number} - the error line number
 *          column: {Number} - the error column number 
 *          code: {String} - a code extract showing where the error occurs (optional)
 *      code: {String} the generated JavaScript code
 *      syntaxTree: {JSON} the syntax tree generated by the parser (optional - cf. parameters)
 *      lineMap: {Array} array of the new line indexes: lineMap[3] returns the new line index for line 4 in
 *          the orginal file (lineMap[0] is always 0 as all line count starts at 1 for both input and output values)
 */
exports.compile = function (template, fullPath, includeSyntaxTree, bypassJSvalidation) {
    // Parsing might throw an exception
    var res = {};
    var fileName = path.basename(fullPath),
        dirPath = path.dirname(fullPath);

    if (!template) {
        res.errors = [{
            description : "[Hashspace compiler] template argument is undefined"
        }];
    } else {
        //Step 1: parser
        var blockList = parser.parse(template);
        //Step2 : treebuilder
        res = treebuilder.build(blockList);
    }

    //Step3 : jsgenerator
    res = jsgenerator.generate(res, template, fileName, dirPath, includeSyntaxTree, bypassJSvalidation);

    return res;
};
