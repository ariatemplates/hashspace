var identifiers = require('./../../hsp/expressions/identifiers');
var parser = require('./../../hsp/expressions/parser');

describe('detect identifiers', function () {

    it('should not detect any identifiers for literals', function () {
        expect(identifiers(parser('"foo" + 1'))).to.eql([]);
    });

    it('should detect identifiers in expressions without operators', function () {
        expect(identifiers(parser('foo'))).to.eql(['foo']);
    });

    it('should detect identifiers in expressions with binary operators', function () {
        expect(identifiers(parser('foo + 1'))).to.eql(['foo']);
        expect(identifiers(parser('foo + bar'))).to.eql(['foo', 'bar']);
        expect(identifiers(parser('foo(bar)'))).to.eql(['foo', 'bar']);
    });

    it('should detect identifiers in expressions with ternary operators', function () {
        expect(identifiers(parser('foo ? bar : baz'))).to.eql(['foo', 'bar', 'baz']);
        expect(identifiers(parser('foo.bar(baz)'))).to.eql(['foo', 'baz']);
    });

    it('should detect identifiers in array literals', function () {
        expect(identifiers(parser('[foo, bar]'))).to.eql(['foo', 'bar']);
    });
});