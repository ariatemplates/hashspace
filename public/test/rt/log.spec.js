
/*
 * Copyright 2012 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var log = require("hsp/rt/log");

var msgs=[];
var testLogger=function(msg) {
    msgs.push(msg);
    return false; // to prevent other loggers to run
};

describe("Hashspace log", function () {
    beforeEach(function() {
        msgs=[];
        log.removeAllLoggers();
        log.addLogger(testLogger);
    });

    afterEach(function() {
        log.removeAllLoggers();
    });

    it("tests logger creation / removal", function () {
        log.removeAllLoggers();
        var order=[];

        var logger1=function() {
            order.push(1);
            return true;
        };

        var logger2=function() {
            order.push(2);
            return true;
        };

        var logger3=function() {
            order.push(3);
            return false;
        };
        
        expect(log.getNbrOfLoggers()).to.equal(0);

        log.addLogger(logger2);
        expect(log.getNbrOfLoggers()).to.equal(1);

        log.addLogger(logger1);
        expect(log.getNbrOfLoggers()).to.equal(2);

        log("Hello World 1");
        expect(order.join(",")).to.equal("1,2");

        log.removeLogger(logger1);
        expect(log.getNbrOfLoggers()).to.equal(1);

        log("Hello World 2");
        expect(order.join(",")).to.equal("1,2,2");

        log.addLogger(logger3);
        expect(log.getNbrOfLoggers()).to.equal(2);

        log("Hello World 3");
        expect(order.join(",")).to.equal("1,2,2,3"); // new logger prevents the 2nd logger to be called

        log.removeAllLoggers();
        expect(log.getNbrOfLoggers()).to.equal(0);
    });

    it("tests log with multiple arguments", function () {
        log({foo:"foo"},"bar",123);
        expect(msgs[0].type).to.equal("debug");
        expect(msgs[0].message).to.equal('{foo:"foo"} bar 123');
        expect(msgs[0].message.line).to.equal(undefined);

        log({foo:"foo"},"bar",123,{type:"error",line:91107});
        expect(msgs[1].type).to.equal("error");
        expect(msgs[1].message).to.equal('{foo:"foo"} bar 123');
        expect(msgs[1].line).to.equal(91107);
    });

    it("tests error log", function () {
        log.error("First error");
        expect(msgs[0].type).to.equal("error");
        expect(msgs[0].message).to.equal("First error");

        log.error("Second error",{type:"debug",id:100,file:"foo.hsp",line:123,column:234});
        expect(msgs[1].type).to.equal("error");
        expect(msgs[1].message).to.equal("Second error");
        expect(msgs[1].id).to.equal(100);
        expect(msgs[1].file).to.equal("foo.hsp");
        expect(msgs[1].line).to.equal(123);
        expect(msgs[1].column).to.equal(234);
    });

    it("tests error log with multiple arguments", function () {
        log.error("test",123);
        expect(msgs[0].type).to.equal("error");
        expect(msgs[0].message).to.equal('test 123');
        expect(msgs[0].message.line).to.equal(undefined);

        log.error("hello",123,{type:"debug",line:91107});
        expect(msgs[1].type).to.equal("error");
        expect(msgs[1].message).to.equal('hello 123');
        expect(msgs[1].line).to.equal(91107);
    });

    it("tests warning log", function () {
        log.warning("Some warning");
        expect(msgs[0].type).to.equal("warning");
        expect(msgs[0].message).to.equal("Some warning");

        log.warning('foo','bar',911);
        expect(msgs[1].type).to.equal("warning");
        expect(msgs[1].message).to.equal("foo bar 911");
    });

    it("tests info log", function () {
        log.info("Some info");
        expect(msgs[0].type).to.equal("info");
        expect(msgs[0].message).to.equal("Some info");

        log.info('foo','bar',911);
        expect(msgs[1].type).to.equal("info");
        expect(msgs[1].message).to.equal("foo bar 911");
    });

    it("tests default formatting", function () {
        var txt=log.format({type:"error",message:"Blah blah",code:"for (x in foo) {"});
        expect(txt).to.equal("[error] Blah blah\r\n>> for (x in foo) {");

        txt=log.format({type:"info",message:"Blah blah",file:"foo.hsp",line:12});
        expect(txt).to.equal("[info: foo.hsp] Blah blah (line:12)");

        txt=log.format({type:"debug",message:"Blah blah",file:"foo.hsp",column:12});
        expect(txt).to.equal("[debug: foo.hsp] Blah blah (column:12)");

        txt=log.format({type:"warning",message:"Blah blah",file:"foo.hsp",line:12,column:34});
        expect(txt).to.equal("[warning: foo.hsp] Blah blah (line:12, column:34)");
    });

});
