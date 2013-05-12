
var acorn=require("acorn/acorn");

/**
 * Validate a JavaScript string
 * Return a JSON structure with 'valid' and 'errors' properties
 * e.g. {valid:false, errors:[{msg:'...',lineInfoTxt:'...',lineInfoHTML:'...',loc:{line:2,column:30}'}]}
 */
module.exports.validate = function(input) {
    var res={isValid:true}

    try {
        var r=acorn.parse(input, {
            ecmaVersion:3,
            strictSemicolons: false,
            allowTrailingCommas: false,
            forbidReserved: true
        })
    } catch(ex) {
        res.isValid=false;
        res.errors=[formatError(ex,input)];
    }

    return res;
}

/**
 * Format the error as an error structure with line extract information
 */
function formatError(err,input) {
    var lineInfo={};
    var msg=err.toString().replace(/\s*\(\d*\:\d*\)\s*$/i,''); // remove line number / col number

    var bm=(''+input.slice(0,err.pos)).match(/.*$/i);
    var am=(''+input.slice(err.pos)).match(/.*/i);
    var before=bm? bm[0] : '';
    var after=am? am[0] : ''; 

    // Prepare line info for txt display
    var cursorPos=before.length;
    var errChar=(after.length)? after.slice(0,1) : 'X';
    var lineStr=before+after;
    var lncursor=[];
    for (var i=0, sz=lineStr.length; sz>i;i++) {
        lncursor[i]= (i===cursorPos)? '^' : '-';
    }
    var lineInfoTxt=lineStr+'\r\n'+lncursor.join('');

    // Prepare line info for HTML display
    var lineInfoHTML=[
        '<span class="code">',
        before,
        '<span class="error" title="',msg,'">',
        errChar,
        '</span>',
        after.slice(1),
        '</span>'
    ].join('');

    return {
        description:msg,
        lineInfoTxt:lineInfoTxt,
        lineInfoHTML:lineInfoHTML,
        code:lineStr,
        line:err.loc? err.loc.line : -1,
        column:err.loc? err.loc.column: -1
    }
    
}
