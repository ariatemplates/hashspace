// Mocha test suite
var assert = require("assert");
var jsv = require("../../hsp/jsvalidator/validator");

describe('JS Validator: ', function(){

    it ('tests a valid script', function(){
        var s=[ 'var x="text1";',
                'function func() {var x="text2";};',
                'var z;'
                ].join("\r\n");

        var r=jsv.validate(s);
        
        assert.equal(r.isValid,true,"valid result");
        assert.equal(r.errors,null,"no errors");
    });


    it ('tests a simple error', function(){
        var s=[ 'var x="text1";',
                'function func() {var x="text2",};',
                'var z;'
                ].join("\r\n");

        var r=jsv.validate(s);
        
        assert.equal(r.isValid,false,"invalid result");
        assert.equal(r.errors.length,1,"one error");
        assert.equal(r.errors[0].description,'SyntaxError: Unexpected token',"error msg");
        assert.equal(r.errors[0].line,2,"error line number");
        assert.equal(r.errors[0].column,31,"error column number");

        s='function func() {var x="text2",};\r\n-------------------------------ˆ-';
        assert.equal(r.errors[0].lineInfoTxt,s,"error line info as text");
        s='<span class="code">function func() {var x="text2",<span class="error" title="SyntaxError: Unexpected token">}</span>;</span>';
        assert.equal(r.errors[0].lineInfoHTML,s,"error line info as HTML");
    });

    it ('tests an error at line start', function(){
        var s=[ 'var x="text1";',
                'function func() {var x="text2"};',
                '?;var z;'
                ].join("\r\n");

        var r=jsv.validate(s);
        
        assert.equal(r.isValid,false,"invalid result");
        assert.equal(r.errors.length,1,"one error");
        assert.equal(r.errors[0].description,'SyntaxError: Unexpected token',"error msg");
        assert.equal(r.errors[0].line,3,"error line number");
        assert.equal(r.errors[0].column,0,"error column number");

        s='?;var z;\r\nˆ-------';
        assert.equal(r.errors[0].lineInfoTxt,s,"error line info as text");
        s='<span class="code"><span class="error" title="SyntaxError: Unexpected token">?</span>;var z;</span>';
        assert.equal(r.errors[0].lineInfoHTML,s,"error line info as HTML");
    });

    it ('tests an error at line start+1', function(){
        var s=[ 'var x="text1";',
                'function func() {var x="text2"};',
                ' ?;var z;'
                ].join("\r\n");

        var r=jsv.validate(s);
        
        assert.equal(r.isValid,false,"invalid result");
        assert.equal(r.errors.length,1,"one error");
        assert.equal(r.errors[0].description,'SyntaxError: Unexpected token',"error msg");
        assert.equal(r.errors[0].line,3,"error line number");
        assert.equal(r.errors[0].column,1,"error column number");

        s=' ?;var z;\r\n-ˆ-------';
        assert.equal(r.errors[0].lineInfoTxt,s,"error line info as text");
        s='<span class="code"> <span class="error" title="SyntaxError: Unexpected token">?</span>;var z;</span>';
        assert.equal(r.errors[0].lineInfoHTML,s,"error line info as HTML");
    });



});


