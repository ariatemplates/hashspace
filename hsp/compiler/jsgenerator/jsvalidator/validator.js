var acorn = require("acorn/acorn");

/**
 * Validates a JavaScript string
 * @param {String} input the Javascript string
 * @return {Object} JSON structure with 'valid' and 'errors' properties e.g. {valid:false, errors:[{msg:'...',lineInfoTxt:'...',lineInfoHTML:'...',loc:{line:2,column:30}'}]}
 */
module.exports.validate = function (input) {
    var result = {
        isValid : true
    };

    try {
        acorn.parse(input, {
            ecmaVersion : 3,
            strictSemicolons : false,
            allowTrailingCommas : false,
            forbidReserved : true
        });
    } catch (ex) {
        result.isValid = false;
        result.errors = [formatError(ex, input)];
    }

    return result;
};

/**
 * Formats the error as an error structure with line extract information.
 * @param {Object} error the exception.
 * @param {String} input the Javascript string.
 * @return {Object} the structured error.
 */
function formatError (error, input) {
    var message = error.toString().replace(/\s*\(\d*\:\d*\)\s*$/i, ''); // remove line number / col number

    var beforeMatch = ('' + input.slice(0, error.pos)).match(/.*$/i);
    var afterMatch = ('' + input.slice(error.pos)).match(/.*/i);
    var before = beforeMatch ? beforeMatch[0] : '';
    var after = afterMatch ? afterMatch[0] : '';

    // Prepare line info for txt display
    var cursorPos = before.length;
    var errChar = (after.length) ? after.slice(0, 1) : 'X';
    var lineStr = before + after;
    var lncursor = [];
    for (var i = 0; i < lineStr.length; i++) {
        lncursor[i] = (i === cursorPos) ? '^' : '-';
    }
    var lineInfoTxt = lineStr + '\r\n' + lncursor.join('');

    // Prepare line info for HTML display
    var lineInfoHTML = ['<span class="code">', before, '<span class="error" title="', message, '">', errChar, '</span>',
            after.slice(1), '</span>'].join('');

    return {
        description : message,
        lineInfoTxt : lineInfoTxt,
        lineInfoHTML : lineInfoHTML,
        code : lineStr,
        line : error.loc ? error.loc.line : -1,
        column : error.loc ? error.loc.column : -1
    };

}
