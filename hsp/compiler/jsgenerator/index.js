var TemplateWalker = require("./templateWalker").TemplateWalker;
var processors = require("./processors");
var jsv = require("./jsvalidator/validator");

/**
 * Header added to all generated JS file
 */
var HEADER_ARR = [
        '// ################################################################ ',
        '//  This file has been generated by the hashspace compiler          ',
        '//  Direct MODIFICATIONS WILL BE LOST when the file is recompiled!  ',
        '// ################################################################ ',
        '', 'var hsp=require("hsp/rt");', ''];

var HEADER = module.exports.HEADER = HEADER_ARR.join('\r\n');
var HEADER_SZ = HEADER_ARR.length;

/**
 * TODO
 */
exports.generate = function(res, template, fileName, dirPath, includeSyntaxTree, bypassJSvalidation) {
    res.code = '';
    if (!res.errors || !res.errors.length) {
        // It is sure that res is an array otherwise the parser would have thrown an exception
        var templateWalker = new TemplateWalker(fileName, dirPath);
        var out = templateWalker.walk(res.syntaxTree, processors);

        if (includeSyntaxTree === true) {
            res.codeFragments = templateWalker.templates;
        }

        res.code = HEADER + out.join('\r\n');
        res.errors = templateWalker.errors;
    } else {
        // Generate a JS script to show the errors when the generated file is loaded
        res.code = HEADER;
    }

    if (!res.errors) {
        res.errors = [];
    } else if (res.errors.length > 0) {
        // remove all code so that script can still be loaded
        res.code = HEADER;
    }

    if (res.errors.length === 0 && bypassJSvalidation !== true) {
        var lineMap = _generateLineMap(res, template);
        res.lineMap = lineMap;
        var validationResult = _validate(res.code, lineMap);
        // call the JS validator
        // we don't checke for JS errors when there are template errors as the code generated by the template may be
        // wrong
        if (!validationResult.isValid) {
            // remove all code so that script can still be loaded
            res.code = HEADER;

            Array.prototype.push.apply(res.errors, validationResult.errors);
        }
    }

    res.code += _getErrorScript(res.errors, fileName);

    if (includeSyntaxTree !== true) {
        res.syntaxTree = null;
    }

    return res;
};

/**
 * TODO
 */
function _validate (code, lineMap) {
    var r = jsv.validate(code);
    var result = {isValid: r.isValid};
    if (!r.isValid) {
        // translate error line numbers
        var err, ln, lm = lineMap;
        for (var i = 0, sz = r.errors.length; sz > i; i++) {
            err = r.errors[i];
            ln = err.line;

            err.line = -1; // to avoid sending a wrong line in case of pb
            for (var j = 0, sz2 = lm.length; sz2 > j; j++) {
                if (lm[j] === ln) {
                    err.line = j; // original line nbr
                    break;
                }
            }
        }
        result.errors = r.errors;
    }
    return result;
}

/**
 * Generate an error script to include in the template compiled script in order to show errors in the browser when the
 * script is loaded
 */
function _getErrorScript (errors, fileName) {
    var r = '';
    if (errors && errors.length) {
        r = ['\r\nrequire("hsp/rt").logErrors("', fileName, '",', JSON.stringify(errors, null), ');\r\n'].join("");
    }
    return r;
}

/**
 * Generate the line map of a compilatin result
 * @param {JSON} res the result object of a compilation - cf. compile function
 * @param {String} file the template file (before compilation)
 */
function _generateLineMap (res, file) {
    if (res.errors && res.errors.length) {
        return;
    }
    var st = res.syntaxTree, templates = [];
    // identify the templates in the syntax tree
    for (var i = 0; st.length > i; i++) {
        if (st[i].type === 'template') {
            templates.push(st[i]);
        }
    }

    var nbrOfLinesInCompiledTemplate = 5;
    var lm = [], sz = file.split(/\n/g).length + 1, pos = HEADER_SZ, tpl;
    var pos1 = -1; // position of the next template start
    var pos2 = -1; // position of the next template end
    var tplIdx = -1; // position of the current template

    for (var i = 0; sz > i; i++) {
        if (i === 0 || i === pos2) {
            // end of current template: let's determine next pos1 and pos2
            tplIdx = (i === 0) ? 0 : tplIdx + 1;
            if (tplIdx < templates.length) {
                // there is another template
                tpl = templates[tplIdx];
                pos1 = tpl.startLine;
                pos2 = tpl.endLine;
                if (pos2 < pos1) {
                    // this case should never arrive..
                    pos2 = pos1;
                }
            } else {
                // last template has been found
                tplIdx = pos1 = pos2 = -1;
            }
            if (i === 0) {
                lm[0] = 0;
            }
            i++;
        }
        if (i === pos1) {
            for (var j = pos1, max = pos2 + 1; max > j; j++) {
                // all lines are set to the template start
                lm[i] = pos;
                i++;
            }
            pos += nbrOfLinesInCompiledTemplate;
            i -= 2; // to enter the i===pos2 clause at next step
        } else {
            lm[i] = pos;
            pos++;
        }
    }

    return lm;
}