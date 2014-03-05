// Mocha tests
var assert = require("assert");
var parser = require("../../../hsp/compiler/parser");
var compiler = require("../../../hsp/compiler/compiler");
var jsgenerator = require("../../../hsp/compiler/jsgenerator");
var ut = require("./utils/testutils");

describe('Block Parser: ', function () {

    it('tests testutils.getContent', function () {
        var tpl = ut.getSampleContent("template1").template;
        var s = ['var x="text1";',
                'function func() {var x="text2"};',
                '',
                '# template hello1',
                '   Hello World!',
                '# /template',
                '',
                '// comment',
                'function func2(z) {return z;}',
                '',
                '# template hello1bis (arg1, arg2)',
                '\tHello',
                '\tAgain!',
                '# /template',
                'var z;'].join("\n");

        assert.equal(tpl.replace(/\r/g, ""), s, "sample content");
    });

    it('tests testutils.compareJSCode', function () {
        var s1 = "";
        var s2 = "";
        assert.equal(ut.compareJSCode(s1, s2), "", "compareJSCode 1");

        s1 = 'new Ng([n.$text(0,["Hello World!"])]);';
        s2 = 'new Ng  ( \n[ n.$text( 0,  \n["Hello World!"])]); ';
        assert.equal(ut.compareJSCode(s1, s2), "", "compareJSCode 2");

    });

    var testFn = function () {
        var sample = ut.getSampleContent(this.name);
        var bl = parser.parse(sample.template);
        var skip = (sample.parsedTree && sample.parsedTree === "skip");
        if (!skip) {
            if (sample.parsedTree) {
                assert.equal(ut.jsonContains(bl, sample.parsedTree, "parsedTree"), "", "parsed tree comparison");
            } else {
                console.log("--------------");
                console.log("Parsed tree for " + this.name + ": ");
                console.log(JSON.stringify(bl, null, "  "));
            }
        }

        var r = compiler.compile(sample.template, this.name, true, true);
        skip = (sample.syntaxTree && sample.syntaxTree === "skip");
        if (!skip) {
            if (sample.syntaxTree) {
                assert.equal(ut.jsonContains(r.syntaxTree, sample.syntaxTree, "syntaxTree"), "", "syntax tree comparison");
            } else {
                console.log("--------------");
                console.log("Syntax tree for " + this.name + ": ");
                console.log(JSON.stringify(r.syntaxTree, null, "  "));
            }
        }

        if (sample.codeFragments) {
            if (r.errors.length > 0) {
                console.log("--------------");
                for (var i = 0, sz = r.errors.length; sz > i; i++) {
                    console.log("Compilation error: " + r.errors[i].description);
                }
            }
            assert.equal(r.errors.length, 0, "No compilation errors");

            for (var k in sample.codeFragments) {
                //console.log("compilation result ["+k+"]\n\n"+r.codeFragments[k]+"\n\n");

                // validate generated code
                if (!r.codeFragments)
                    assert.fail("Missing Generated code");
                else {
                    assert.equal(ut.compareJSCode(r.codeFragments[k], sample.codeFragments[k]), "", k
                            + " code fragment comparison");
                }
            }
        }
    };

    var samples = ut.getSampleNames(__dirname + "/samples");
    //samples=["log2"];

    for (var i = 0, sz = samples.length; sz > i; i++) {
        // create one test for each sample
        it('validates sample (' + samples[i] + ')', testFn.bind({
            name : samples[i]
        }));
    }

    it('a space between # and template should be optional', function(){
      var r = compiler.compile([
        '#template nospaces()',
        '#/template'
      ].join('\n'), "without_spaces");
      assert.equal(r.errors.length, 0, "no compilation error");
    });

    it('should allow whitespaces before #template', function(){
      var r = compiler.compile(
        '\n   #template spacesBefore()\n' +
        ' #/template', "spacesBefore");
      assert.equal(r.errors.length, 0, "no compilation error");
    });

    it('should allow whitespaces before #template when a modifier is present', function(){
        var r = compiler.compile(
            '\n   # export  template spacesBefore()\n' +
                ' #/template', "spacesBefore");
        console.log(r.errors);
        assert.equal(r.errors.length, 0, "no compilation error");
    });

    it('validates full compiled template', function () {
        var sample = ut.getSampleContent("template1");
        var r = compiler.compile(sample.template, "template1");

        var s = [jsgenerator.HEADER,
            'var x="text1";',
            'function func() {var x="text2"};',
            '',
            'var hello1 = require("hsp/rt").template([], function(n){',
            '  return [n.$text(0,["Hello World!"])];',
            '});',
            '',
            '// comment', 'function func2(z) {return z;}',
            '',
            'var hello1bis = require("hsp/rt").template(["arg1","arg2"], function(n){',
            '  return [n.$text(0,["Hello Again!"])];',
            '});',
            'var z;'].join("\n");

        assert.equal(r.errors.length, 0, "no compilation error");
        // console.log(s.length) // 587
        // console.log(r.code.length) // 591
        // assert.equal(r.code,s,"template generated code"); // strange issue with non visible characters
        assert.equal(ut.compareJSCode(r.code.replace(/\r/g, ""), s), "", "template generated code");

        var lm = [0, 5, 6, 7, 8, 8, 8, 13, 14, 15, 16, 17, 17, 17, 17, 22];
        assert.equal(ut.jsonContains(r.lineMap, lm, "lineMap"), "", "line map comparison");
    });

    it('validates full compiled template with export', function () {
        var sample = ut.getSampleContent("template2");
        var r = compiler.compile(sample.template, "template2");

        var s = [jsgenerator.HEADER, '', 'var hello4 = exports.hello4 = require("hsp/rt").template([], function(n){',
                '  return [n.$text(0,["Hello World!"])];', '});'].join("\n");

        assert.equal(r.errors.length, 0, "no compilation error");
        // console.log(s.length) // 587
        // console.log(r.code.length) // 591
        // assert.equal(r.code,s,"template generated code"); // strange issue with non visible characters
        assert.equal(ut.compareJSCode(r.code.replace(/\r/g, ""), s), "", "template generated code");
    });

    it('validates full compiled template with component', function () {
        var sample = ut.getSampleContent("component2");
        var r = compiler.compile(sample.template, "component2");

        var s = [
                jsgenerator.HEADER,
                '',
                'var mycomponent = require("hsp/rt").template({ctl:[foo,"foo","ComponentController"],ref:"c"}, function(n){',
                '  return [n.$text(0,["some text..."])];', '});'].join("\n");

        assert.equal(r.errors.length, 0, "no compilation error");
        assert.equal(ut.compareJSCode(r.code.replace(/\r/g, ""), s), "", "template generated code for components");
    });

    it('validates full compiled template using components', function () {
        var sample = ut.getSampleContent("component5");
        var r = compiler.compile(sample.template, "component5");

        var s = [
                jsgenerator.HEADER,
                '',
                'var test = require("hsp/rt").template([], function(n){',
                '  var _body,_panel;try {_body=body} catch(e) {};try {_panel=panel} catch(e) {};',
                '  return [',
                '  n.cpt([_panel,"panel"],0,0,0,[n.cpt([_body,"body"],0,{"class":"foo"},0,[n.$text(0,["Hello World! "])])])];',
                '});'
        ].join("\n");

        assert.equal(r.errors.length, 0, "no compilation error");
        assert.equal(ut.compareJSCode(r.code.replace(/\r/g, ""), s), "", "template generated code for components");
    });
});
