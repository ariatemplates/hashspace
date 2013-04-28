// Mocha tests
var assert = require("assert");
var compiler = require("../../hsp/compiler/compiler");
var ut = require("./utils/testutils");

describe('Template compilation errors: ', function(){

    var testFn= function(){
        var sample=ut.getErrorSampleContent(this.name);
        var r=compiler.compile(sample.template,this.name,true);

        if (sample.errors) {
            assert.equal(ut.jsonContains(r.errors, sample.errors, "errorList"), "", "parsed tree comparison");
        } else {
            console.log("");
            console.log("Error list for "+this.name+": ");
            console.log(JSON.stringify(r.errors ,null,"  "));
        }
    }

    var samples=[   "text1", "text2", "text3", "if1", "if2", "if3", "if4", "if5", "if6", "if7", "foreach1", "foreach2", "foreach3", 
                    "element1", "element2", "element3", "element4", "element5", "element6", "element7", "element8", "insert",
                    "template1", "template2", "template3"];
    for (var i=0, sz=samples.length;sz>i;i++) {
        // create one test for each sample
        it ('tests error sample '+samples[i], testFn.bind({name:samples[i]}));
    }

    it ('tests mixed errors in template and JS script', function() {
        var sample=ut.getErrorSampleContent("mixed");
        var r=compiler.compile(sample.template,"mixed");

        var s=[
            compiler.HEADER,
            '\r\n',
            'require("hsp/rt").logErrors([{',
            '"description":"SyntaxError: Unexpected token",',
            '"lineInfoTxt":"    foo({blah:\\\"hello\\\",});\\r\\n----------------------ˆ--",',
            '"lineInfoHTML":"<span class=\\\"code\\\">    foo({blah:\\\"hello\\\",<span class=\\\"error\\\" title=\\\"SyntaxError: Unexpected token\\\">}</span>);</span>",',
            '"code":"    foo({blah:\\\"hello\\\",});",',
            '"line":18,',
            '"column":22',
            '}]);\r\n'
        ].join('');

        assert.equal(r.code,s,"generated code");

    })

});
