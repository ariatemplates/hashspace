var p = require('./../../hsp/expressions/parser');
var observable = require('./../../hsp/expressions/observable');

describe('determining observable pairs', function () {

    describe('nothing to observe', function () {
        it('should not return any pairs if there is nothing to observe', function () {
            expect(observable(p('1'), {})).to.be.empty();
            expect(observable(p('"foo" + "bar"'), {})).to.be.empty();
            expect(observable(p('"foo.toString()"'), {})).to.be.empty();
        });
    });

    describe('identifiers only', function () {
        it('should observe scope for simple identifiers', function () {
            var scope = {foo: 'foo'};
            expect(observable(p('foo'), scope))
                .to.eql([[scope, 'foo']]);
        });

        it('should observe scope for all identifiers', function () {
            var scope = {foo: 'foo', bar: 'bar'};
            expect(observable(p('foo + bar'), scope))
                .to.eql([[scope, 'foo'], [scope, 'bar']]);
        });
    });

    describe('"static" property access with .', function () {
        it('should properly observe expressions with dots', function () {
            var scope = {foo: {bar: 'bar'}};
            expect(observable(p('foo.bar'), scope))
                .to.eql([[scope, 'foo'], [scope.foo, 'bar']]);
        });

        it('should not observe null values', function() {
            var scope = {foo: null};
            expect(observable(p('foo.bar'), scope))
                .to.eql([[scope, 'foo']]);
        });
    });

    describe('"dynamic" property access with []', function () {
        it('should properly observe expressions with dynamic path access', function () {
            var scope = {foo: {bar: 'bar'}, idx: 'bar'};
            expect(observable(p('foo[idx]'), scope))
                .to.eql([[scope, 'foo'], [scope, 'idx']]);
        });
    });

    describe('function calls', function () {
        it('should properly observe expressions with function calls', function () {
            var scope = {bar: function(){}};
            expect(observable(p('bar()'), scope))
                .to.eql([[scope, null]]);
        });

        it('should properly observe expressions with function with args', function () {
            var scope = {bar: function(){}, foo: 'foo'};
            expect(observable(p('bar(foo)'), scope))
                .to.eql([[scope, null], [scope, 'foo']]);
        });

        it('should properly observe expressions with function on objects', function () {
            var scope = {foo: {bar: function(){}}};
            expect(observable(p('foo.bar("baz")'), scope))
                .to.eql([[scope, 'foo'], [scope.foo, null]]);

            expect(observable(p('foo.bar(baz)'), scope))
                .to.eql([[scope, 'foo'], [scope.foo, null], [scope, 'baz']]);
        });
    });

    describe('ternary operator', function () {
        it('should observe each sub-expression of ternary ?', function () {
            var scope = {foo: true, bar: 'bar', baz: 'baz'};
            expect(observable(p('foo ? bar : baz'), scope))
                .to.eql([[scope, 'foo'], [scope, 'bar'], [scope, 'baz']]);
        });
    });

    describe('pipe operator', function () {
        it('should observe all sub-expressions of the pipe operator', function () {
            var scope = {foo: [], bar: function(input, args){}, baz: 'baz'};
            expect(observable(p('foo | bar:baz'), scope))
                .to.eql([[scope, 'foo'], [scope, 'bar'], [scope, 'baz']]);
        });

        it('should observe all sub-expressions of the pipe operator - other case', function () {
            var scope = {ctrl: {foo: []}, bar: function(input, args){}, baz: 'baz'};
            expect(observable(p('ctrl.foo | bar:baz'), scope))
                .to.eql([[scope, 'ctrl'], [scope.ctrl, 'foo'], [scope, 'bar'], [scope, 'baz']]);
        });
    });

    describe('array literals', function () {
        it('should observe each element of array literal', function () {
            var scope = {foo: true, bar: 'bar'};
            expect(observable(p('[foo, 5, bar, "baz"]'), scope))
                .to.eql([[scope, 'foo'], [scope, 'bar']]);
        });
    });

    describe('object literals', function () {
        it('should observe all values of object literals', function () {
            var scope = {foo: true, bar: 'bar'};
            expect(observable(p('{foo: foo, bar: bar}'), scope))
                .to.eql([[scope, 'foo'], [scope, 'bar']]);
        });
    });
});

//TODO:
// - there is something not quite right with function calls, I should add observing for null
// - expression evaluation vs. observable pair detecting? => compile functions, yay!
// - dealing undefined values?
// - code duplication in tree traversal (at the same time this is probably the fastest method)