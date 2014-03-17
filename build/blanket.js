var path = require('path');
var srcDir = path.join(__dirname, '..', 'hsp');

require('blanket')({
    // Only files that match the pattern will be instrumented
    pattern: '//' + normalizeBackslashes(srcDir) + '(?!\/compiler\/parser\/hspblocks)/'
});

function normalizeBackslashes (str) {
    return str.replace(/\\/g, '/');
}