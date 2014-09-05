var parser = require('./../../hsp/expressions/parser');

describe('error cases', function () {

    it('should throw for binary operators without left-hand side operand', function () {
        expect(function () {
            parser('/foo');
        }).to.throwError(new RegExp("Invalid expression - missing operand for the / operator"));
    });

    it('should throw for expressions that look as a function call', function () {
        expect(function () {
            parser('foreach (thing in things)');
        }).to.throwError();
    });

    it('should not allow expressions with a trailing comma', function () {
        expect(function () {
            parser('person.name,');
        }).to.throwError(new RegExp("Statement separator , can't be placed at the end of an expression"));
    });
});