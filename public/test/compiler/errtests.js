// Mocha tests
var assert = require("assert");
var compiler = require("../../../hsp/compiler/compiler");
var ut = require("./utils/testutils");

describe('Template compilation errors: ', function () {

    var testFn = function () {
        var sample = ut.getErrorSampleContent(this.name);
        var r = compiler.compile(sample.template, this.name, true, true);

        // console.log(JSON.stringify(r.syntaxTree ,null," "));

        if (sample.errors) {
            assert.equal(ut.jsonContains(r.errors, sample.errors, "errorList"), "", "parsed tree comparison");
        } else {
            console.log("");
            console.log("Error list for " + this.name + ": ");
            console.log(JSON.stringify(r.errors, null, "  "));
        }
    };

    var samples = ["text1", "text2", "text3", "if1", "if2", "if3", "if4", "if5", "if6", "if7", "foreach1", "foreach2",
            "foreach3", "element1", "element2", "element3", "element4", "element5", "element6", "element7", "element8",
            "insert", "template1", "template2", "template3", "template4", "jsexpression1", "jsexpression2", "component"];
    //samples=["component"];
    for (var i = 0, sz = samples.length; sz > i; i++) {
        // create one test for each sample
        it('tests error sample ('+samples[i]+')', testFn.bind({
            name : samples[i]
        }));
    }

    it('tests mixed errors in template and JS script', function () {
        var sample = ut.getErrorSampleContent("mixed1");
        var r = compiler.compile(sample.template, "mixed1");

        var s = [
                compiler.HEADER,
                '\r\n',
                'require("hsp/rt").logErrors(__filename,[{',
                '"description":"SyntaxError: Unexpected token",',
                '"lineInfoTxt":"    foo({blah:\\\"hello\\\",});\\r\\n----------------------^--",',
                '"lineInfoHTML":"<span class=\\\"code\\\">    foo({blah:\\\"hello\\\",<span class=\\\"error\\\" title=\\\"SyntaxError: Unexpected token\\\">}</span>);</span>",',
                '"code":"    foo({blah:\\\"hello\\\",});",', '"line":13,', '"column":22', '}]);\r\n'].join('');

        assert.equal(r.code, s, "generated code");

    });

    it('tests mixed errors in template and JS script 2', function () {
        var sample = ut.getErrorSampleContent("mixed2");
        var r = compiler.compile(sample.template, "mixed2");

        assert.equal(r.errors[0].line, 1, "error line 1");
    });

    it('tests mixed errors in template and JS script 3', function () {
        var sample = ut.getErrorSampleContent("mixed3");
        var r = compiler.compile(sample.template, "mixed3");

        assert.equal(r.errors[0].line, 8, "error line 8");
    });

    it('tests mixed errors in template and JS script 4', function () {
        var sample = ut.getErrorSampleContent("mixed4");
        var r = compiler.compile(sample.template, "mixed4");

        assert.equal(r.errors[0].line, 13, "error line 13");
    });

});
