
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

var klass = require("hsp/klass");

describe("JS Klass", function () {

    it("test a simple class with a constructors", function () {
        var ClassA = klass({
            $constructor : function (idx) {
                this.idx = idx;
            },
            foo : function (incr) {
                this.idx += incr;
            }
        });
        expect(typeof(ClassA)).to.equal("function");
        var a = new ClassA(2);
        a.foo(7);
        expect(a.idx).to.equal(9);
        expect(a.constructor === ClassA);
        expect(a.$constructor === ClassA);
    });

    it("test a simple class with a constructor", function () {
        var ClassA = klass({
            foo : function (incr) {
                if (!this.idx)
                    this.idx = 0;
                this.idx += incr;
            }
        });
        expect(typeof(ClassA)).to.equal("function");
        var a = new ClassA(2);
        expect(a.idx).to.equal(undefined);
        a.foo(7);
        expect(a.idx).to.equal(7);
    });

    it("test one level inheritance", function () {
        var ClassA = klass({
            $constructor : function (idx, extra) {
                this.idx = idx ? idx : 0;
                if (extra)
                    this.extra = extra;
            },
            foo : function (incr) {
                this.idx += incr;
            }
        });
        var ClassB = klass({
            $extends : ClassA,
            $constructor : function (value) {
                // call super constructor
                ClassA.$constructor.call(this, 10);
                this.value = value;
            },
            bar : function (arg) {
                this.foo(5);
                this.value += "-" + this.idx + "-" + arg;
            }
        });

        var b = new ClassB("test");
        expect(b.idx).to.equal(10);
        b.bar(9);
        expect(b.idx).to.equal(15);
        expect(b.value).to.equal("test-15-9");

        // no constructor test
        var ClassB2 = klass({
            $extends : ClassA,
            bar : function (arg) {
                this.foo(5);
                this.value = this.idx + "-" + arg;
            }
        });
        var b21 = new ClassB2();
        expect(b21.idx).to.equal(0);
        var b22 = new ClassB2(22);
        expect(b22.idx).to.equal(22);
        var b23 = new ClassB2(23, "hi!");
        expect(b23.extra).to.equal("hi!");
    });

    it("test two levels inheritance", function () {
        var ClassA = klass({
            $constructor : function (idx, extra) {
                this.idx = idx ? idx : 0;
                if (extra)
                    this.extra = extra;
            },
            foo : function (incr) {
                this.idx += incr;
            }
        });
        var ClassB = klass({
            $extends : ClassA,
            $constructor : function () {
                ClassA.$constructor.call(this, 10, 20);
            },
            bar : function (value) {
                return value + "-" + this.idx;
            }
        });
        var ClassC = klass({
            $extends : ClassB,
            $constructor : function (incr) {
                ClassB.$constructor.call(this);
                this.idx += incr;
            },
            bar : function (value) {
                // override parent method
                return "[" + ClassB.bar.call(this, value) + "]";
            },
            bar2 : function () {
                return "hello";
            }
        });
        var c = new ClassC(10);
        expect(c.idx).to.equal(20);
        expect(c.extra).to.equal(20);
        expect(c.bar("hello")).to.equal("[hello-20]");
        expect(c.bar2()).to.equal("hello");
    });

    // TODO ensure $dispose is always defined
});
