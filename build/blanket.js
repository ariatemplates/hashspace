function normalizeBackslashes (str) {
    return str.replace(/\\/g, '/');
}

require('blanket')({
    // Only files that match the pattern will be instrumented
    pattern: function(fileName) {
        fileName = normalizeBackslashes(fileName);
        return fileName.indexOf('/hsp/compiler') >= 0 && fileName.indexOf('.peg.js') === -1;
    }
});