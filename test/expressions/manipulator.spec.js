var expression = require('./../../hsp/expressions/manipulator');

describe('getValue', function () {

    it('should return undefined for empty expressions', function() {
        expect(expression('').getValue({})).to.be(undefined);
    });

    it('should get value of literal string expressions', function() {
        expect(expression('"foo"').getValue({})).to.equal('foo');
        expect(expression('"\\""').getValue({})).to.equal('"');
        expect(expression('"foo" + "bar"').getValue({})).to.equal('foobar');
        expect(expression('"foo" + 1').getValue({})).to.equal('foo1');
        expect(expression('"foo".toUpperCase()').getValue({})).to.equal('FOO');
    });

    it('should evaluate boolean literals', function() {
        expect(expression('false').getValue({})).to.equal(false);
        expect(expression('true').getValue({})).to.equal(true);
        expect(expression('o.false').getValue({o :{'false': true}})).to.equal(true);
    });

    it('should not allow overriding built in JS constants', function() {
        expect(expression('false').getValue({'false': true})).to.equal(false);
        expect(expression('null').getValue({'null': 'not null'})).to.equal(null);
    });

    it('should get value of literal numeric expressions', function() {
        expect(expression('1').getValue({})).to.equal(1);
        expect(expression('1 + 1').getValue({})).to.equal(2);
        expect(expression('1 + 1  +2').getValue({})).to.equal(4);
        expect(expression('1 - 1').getValue({})).to.equal(0);
        expect(expression('1 * 1').getValue({})).to.equal(1);
        expect(expression('2*5 +1').getValue({})).to.equal(11);
    });

    it('should get value of expressions that use scope identifiers', function() {
        expect(expression('foo').getValue({foo: 'bar'})).to.equal('bar');
        expect(expression('foo + bar').getValue({foo: 'foo', bar: 'bar'})).to.equal('foobar');
        expect(expression('one + two').getValue({one: 1, two: 2})).to.equal(3);
        expect(expression('two - one').getValue({one: 1, two: 2})).to.equal(1);
    });

    it('should evaluate expressions with dots', function() {
        expect(expression('foo.bar').getValue({foo: {bar: 'baz'}})).to.equal('baz');
        expect(expression('foo.bar.baz').getValue({foo: {bar: {baz: 'baz'}}})).to.equal('baz');
    });

    it('should evaluate expressions with dots and no dots', function() {
        expect(expression('foo.bar + baz').getValue({foo: {bar: 'bar'}, baz: 'baz'})).to.equal('barbaz');
        expect(expression('foo.bar + " " +  baz').getValue({foo: {bar: 'bar'}, baz: 'baz'})).to.equal('bar baz');
    });

    it('should evaluate expressions with []', function() {
        expect(expression('foo["bar"]').getValue({foo: {bar: 'baz'}})).to.equal('baz');
        expect(expression('foo["ba" + "r"]').getValue({foo: {bar: 'baz'}})).to.equal('baz');
        expect(expression('foo[idx]').getValue({foo: {bar: 'baz'}, idx: 'bar'})).to.equal('baz');
        expect(expression('foo[idx].baz').getValue({foo: {bar: {baz: 'Im baz'}}, idx: 'bar'})).to.equal('Im baz');
        expect(expression('foo[idx]["baz"]').getValue({foo: {bar: {baz: 'Im baz'}}, idx: 'bar'})).to.equal('Im baz');
        expect(expression('foo[idx]["baz"][0]').getValue({foo: {bar: {baz: 'Im baz'}}, idx: 'bar'})).to.equal('I');
    });

    it('should evaluate function calls in expressions', function() {
        var scope = {
            r: "r",
            foo: {
                bar: function () {
                    return 'baz';
                }
            },
            fooo: {
                barr: function () {
                    return {bazz: 'baz'};
                }
            },
            obj: {
                baz: "I'm baz"
            }
        };
        expect(expression('foo()').getValue({foo: function() {return 'bar';}})).to.equal('bar');
        expect(expression('foo()').getValue({foo: function() {}})).to.be.undefined;
        expect(expression('foo("oof")').getValue({foo: function(prefix) {return prefix + 'bar';}})).to.equal('oofbar');
        expect(expression('foo.bar()').getValue({foo: {bar: function() {return 'baz';}}})).to.equal('baz');
        expect(expression('foo.bar()[2]').getValue({foo: {bar: function() {return 'baz';}}})).to.equal('z');
        expect(expression('fooo.barr().bazz').getValue(scope)).to.equal("baz");
        expect(expression('obj[foo["ba" + r]()]').getValue(scope)).to.equal("I'm baz");
        expect(expression('obj[foo["ba"[0] + "ba"[1] + r]()]').getValue(scope)).to.equal("I'm baz");
    });

    it('should evaluate functions with args', function() {
        expect(expression('foo.bar("sth")').getValue({foo: {bar: function(sth) {return sth.toUpperCase(); }}})).to.equal('STH');
        expect(expression('add(1, 1)').getValue({add: function(a, b) { return a + b; }})).to.equal(2);
        expect(expression('foo.bar("s" + "th")').getValue({foo: {bar: function(sth) {return sth.toUpperCase(); }}})).to.equal('STH');
        expect(expression('obj[foo.bar("s" + "th")]').getValue({obj: {STH: 'else'}, foo: {bar: function(sth) {return sth.toUpperCase(); }}})).to.equal('else');
    });

    it('should evaluate expressions with the pipe (|) operator without args', function() {
        expect(expression('collection | first').getValue({
            collection: ['foo', 'bar'],
            first: function(input) {
                return input[0];
            }
        })).to.equal('foo');
    });

    it('should evaluate expressions with the pipe (|) operator with args', function() {
        var scope = {
            collection: ['foo', 'bar'],
            zeroone: [0, 1],
            item: function(input, idx) {
                return input[idx];
            },
            all: function(input) {
                return input;
            },
            zero: function() {
                return 0;
            }
        };

        expect(expression('collection | all').getValue(scope)).to.eql(scope.collection);
        expect(expression('collection | all | item:1').getValue(scope)).to.equal('bar');
        expect(expression('collection | item:0 | item:1').getValue(scope)).to.equal('o');
        expect(expression('collection | item:1').getValue(scope)).to.equal('bar');
        expect(expression('collection | item:1:false').getValue(scope)).to.equal('bar');
        expect(expression('collection | item:(zeroone | item:1)').getValue(scope)).to.equal('bar');
        expect(expression('collection | item:zero()').getValue(scope)).to.equal('foo');
        expect(expression('collection | item:zero() | item:0').getValue(scope)).to.equal('f');
        expect(expression('collection | item:0+1').getValue(scope)).to.equal('bar');
        expect(expression('collection | item:0*1').getValue(scope)).to.equal('foo');
        expect(expression('all(collection) | item:0*1').getValue(scope)).to.equal('foo');
        expect(expression('all(collection) | item:zero() | item:0').getValue(scope)).to.equal('f');
    });

    it('should evaluate expression where pipe function is an expression', function() {
        expect(expression('d[ppName]|fnSorter.sort')
            .getValue({
               d: {all: ['foo', 'bar']},
               ppName: 'all',
               fnSorter: {sort: function(input) {return input.sort();}}
            }))
            .to.eql(['bar', 'foo']);
    });

    it('should bind this to a proper object when using pipe functions on object', function() {
        var scope = {
            input: ['foo', 'bar'],
            obj: {
                idx: 1,
                selector: function(input) {
                    return input[this.idx];
                }
            }
        };
        expect(expression('input|obj.selector').getValue(scope)).to.eql('bar');
        expect(expression('input|obj["selector"]').getValue(scope)).to.eql('bar');
    });

    it('should bind this to an empty scope when using pipe functions on scope', function() {
        var scope = {
            input: ['foo', 'bar'],
            idx: 1,
            selector: function(input) {
                return input[this.idx || 0];
            }
        };
        expect(expression('input|selector').getValue(scope)).to.eql('foo');
    });

    it('should evaluate expressions containing simple comparison (<, >)', function() {
        expect(expression('1 < 2').getValue({})).to.equal(true);
        expect(expression('1 > 2').getValue({})).to.equal(false);
        expect(expression('1 > foo').getValue({foo: 2})).to.equal(false);
    });

    it('should evaluate expressions containing 2-char comparisons (<=, >=, ==)', function() {
        expect(expression('1 <= 2').getValue({})).to.equal(true);
        expect(expression('2 <= 2').getValue({})).to.equal(true);
        expect(expression('1 >= 2').getValue({})).to.equal(false);
        expect(expression('1 >= foo').getValue({foo: 2})).to.equal(false);
        expect(expression('2 == foo').getValue({foo: 2})).to.equal(true);
        expect(expression('2 != 3').getValue({foo: 2})).to.equal(true);
        expect(expression('"2" == 2').getValue({foo: 2})).to.equal(true);
    });

    it('should evaluate expressions containing 2-char comparisons (!==, ===)', function() {
        expect(expression('2 === foo').getValue({foo: 2})).to.equal(true);
        expect(expression('"2" === 2').getValue({foo: 2})).to.equal(false);
        expect(expression('"2" !== 2').getValue({foo: 2})).to.equal(true);
    });

    it('should evaluate expressions containing boolean AND / OR (&& / ||)', function() {
        expect(expression('true && true').getValue({})).to.equal(true);
        expect(expression('true && false').getValue({})).to.equal(false);
        expect(expression('true || false').getValue({})).to.equal(true);
        expect(expression('true || true').getValue({})).to.equal(true);
        expect(expression('false || false').getValue({})).to.equal(false);
    });

    it('should support the ternary operator', function() {
        expect(expression('true ? 1 : 0').getValue({})).to.equal(1);
        expect(expression('false ? 1 : 0').getValue({})).to.equal(0);
        expect(expression('false ? 1 : 2+4*foo').getValue({foo: 3})).to.equal(14);
    });

    it('should evaluate expressions with modulo (%) operator', function() {
        expect(expression('5 %2').getValue({})).to.equal(1);
        expect(expression('5 % foo').getValue({foo: 2})).to.equal(1);
    });

    it('should evaluate expressions with boolean negation (!) operator', function() {
        expect(expression('!false').getValue({})).to.equal(true);
        expect(expression('!true').getValue({})).to.equal(false);
        expect(expression('!foo').getValue({foo: false})).to.equal(true);
        expect(expression('!!foo').getValue({foo: 1})).to.equal(true);
        expect(expression('!!foo').getValue({foo: 0})).to.equal(false);
    });

    it('should evaluate expressions with arithmetic minus (-) operator', function() {
        expect(expression('-1').getValue({})).to.equal(-1);
        expect(expression('-foo').getValue({foo: 1})).to.equal(-1);
        expect(expression('-foo').getValue({foo: -1})).to.equal(1);
        expect(expression('1 - foo').getValue({foo: -1})).to.equal(2);
        expect(expression('1 - -foo').getValue({foo: -1})).to.equal(0);
        expect(expression('1 + -foo').getValue({foo: -1})).to.equal(2);
    });

    it('should evaluate expressions with grouping brackets', function() {
        expect(expression('(1)').getValue({})).to.equal(1);
        expect(expression('(-11)').getValue({})).to.equal(-11);
        expect(expression('(1 + 1) * 2').getValue({})).to.equal(4);
        expect(expression('(foo())').getValue({foo: function() {return 5;}})).to.equal(5);
        expect(expression('(foo() +1)').getValue({foo: function() {return 5;}})).to.equal(6);
        expect(expression('(foo() +1)/3').getValue({foo: function() {return 5;}})).to.equal(2);
    });

    it('should allow array literals in expressions', function() {
        expect(expression('[1]').getValue({})).to.eql([1]);
        expect(expression('[1, 2]').getValue({})).to.eql([1, 2]);
        expect(expression('[1, [1 , 2]]').getValue({})).to.eql([1, [1, 2]]);
        expect(expression('[1, 2][1]').getValue({})).to.equal(2);
        expect(expression('[1, 2] | first').getValue({first: function(input){ return input[0];}})).to.equal(1);
    });

    it('should allow object lirerals in expressions', function() {
        expect(expression("{foo: 'bar'}").getValue({})).to.eql({foo: 'bar'});
        expect(expression("{foo: 'bar', foo2: 'baz'}").getValue({})).to.eql({foo: 'bar', foo2: 'baz'});
        expect(expression("{foo: {foo2: 'baz'}}").getValue({})).to.eql({foo: {foo2: 'baz'}});
    });
});

describe('forgiving evaluation of expressions', function () {
    it('should forgive . on undefined', function () {
        expect(expression("foo.bar").getValue({})).to.equal(undefined);
        expect(expression("foo.bar").getValue({foo : null})).to.equal(undefined);
        expect(expression("foo.bar.baz").getValue({})).to.equal(undefined);
    });

    it('should forgive [ on undefined', function () {
        expect(expression("foo['bar']").getValue({})).to.equal(undefined);
        expect(expression("foo['bar']['baz']").getValue({})).to.equal(undefined);
    });

    it('should forgive function calls on undefined', function () {
        expect(expression("foo.bar()").getValue({})).to.equal(undefined);
        expect(expression("foo.bar()").getValue({foo: null})).to.equal(undefined);
    });
});

describe('getValue with defaults', function () {

    describe('simple expressions', function () {
        it('should handle default values for undefined', function () {
            expect(expression("foo").getValue({}, 'bar')).to.equal('bar');
            expect(expression("foo").getValue({foo: undefined}, 'bar')).to.equal('bar');
        });

        it('should handle default values for null', function () {
            expect(expression("foo").getValue({foo: null}, 'bar')).to.equal('bar');
        });

        it('should handle default values for NaN', function () {
            expect(expression("foo").getValue({foo: NaN}, 5)).to.equal(5);
        });

        it('detecting NaN values should not be too eager', function () {
            expect(expression("{}").getValue({}, 5)).to.eql({});
        });
    });
});

describe('setValue', function () {

    it('should set values of simple assignable expressions', function() {
        var scope = {
            foo: 'bar'
        };
        expression("foo").setValue(scope, 'baz');
        expect(scope.foo).to.equal('baz');
    });

    it('should set values of nested assignable expressions', function() {
        var scope = {
            foo: {
                bar: 'baz'
            }
        };
        expression("foo.bar").setValue(scope, 'bazzzz');
        expect(scope.foo.bar).to.equal('bazzzz');
    });

    it('should set the isAssignable flag to true for assignable expressions', function () {
        expect(expression("foo").isAssignable).to.equal(true);
        expect(expression("foo.bar").isAssignable).to.equal(true);
        expect(expression("foo.bar.baz").isAssignable).to.equal(true);
        expect(expression("foo[bar]").isAssignable).to.equal(true);
        expect(expression("foo.bar[baz]").isAssignable).to.equal(true);
        expect(expression("foo[bar].baz").isAssignable).to.equal(true);
    });

    it('should set the isAssignable flag to false for non-assignable expressions', function () {
        expect(expression("'foo'").isAssignable).to.equal(false);
        expect(expression("foo === bar").isAssignable).to.equal(false);
        expect(expression("foo + bar").isAssignable).to.equal(false);
        expect(expression("foo.bar()").isAssignable).to.equal(false);
        expect(expression("foo ? bar : baz").isAssignable).to.equal(false);
        expect(expression("foo | bar").isAssignable).to.equal(false);
    });

    it('should throw when a non-assignable expression is set', function () {
        expect(function () {
            expression('1').setValue({}, 5);
        }).to.throwError(/Expression "1" is not assignable/);
    });
});

//TODO: "corner" cases:
//- assigning to something that evaluates to non-object (null, undefined, etc.)
//- null / undefined in property access

//TODO: error condition handling
//- non-closed brackets ( [ {
//- using function call on something that is not a function
//- using [] . on something that is not an object
