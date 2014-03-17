var path = require('path');
var fs = require('fs');

module.exports = function(grunt) {
    grunt.registerTask('inittests', 'Inits the test result folder', function () {
        var root = path.normalize(__dirname + "./../../test-results");
        grunt.file.mkdir(root);
    });

    grunt.registerTask('finalizetests', 'Finalizes Mocha tests', function () {
        var fileName = path.normalize(__dirname + "./../../test-results/") + 'lcov_mocha.info';
        var data = fs.readFileSync(fileName,'utf8');
        var index = data.indexOf('/hsp/');
        var token = data.substring(3, index);
        var re = new RegExp(token,"g");
        var result = data.replace(re, '.');
        fs.writeFileSync(fileName, result, 'utf8');
    });
};