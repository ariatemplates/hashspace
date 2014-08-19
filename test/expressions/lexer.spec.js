var lexer = require('./../../hsp/expressions/lexer');

describe('lexer', function () {

    describe('empty input', function () {
        it('should return an empty array of tokens for empty input', function () {
            expect(lexer()).to.eql([]);
            expect(lexer('')).to.eql([]);
            expect(lexer(null)).to.eql([]);
        });
    });

    describe('whitespaces', function () {
        it('should ignore whitespaces in input', function () {
            expect(lexer('  ')).to.eql([]);
            expect(lexer('\t\t')).to.eql([]);
            expect(lexer('\n')).to.eql([]);
            expect(lexer('\r\n')).to.eql([]);
            expect(lexer('   \t \r\n \t   \n  ')).to.eql([]);
        });
    });

    describe('numbers', function () {

        it('should recognise integers', function () {
            expect(lexer('0')).to.eql([{t: 'num', v: 0, f: 0}]);
            expect(lexer('10')).to.eql([{t: 'num', v: 10, f: 0}]);
            expect(lexer('100')).to.eql([{t: 'num', v: 100, f: 0}]);
            expect(lexer('1000')).to.eql([{t: 'num', v: 1000, f: 0}]);
            expect(lexer('12345')).to.eql([{t: 'num', v: 12345, f: 0}]);
        });

        it('should recognise floats', function () {
            expect(lexer('0.0')).to.eql([{t: 'num', v: 0.0, f: 0}]);
            expect(lexer('12.345')).to.eql([{t: 'num', v: 12.345, f: 0}]);
        });
    });

    describe('identifiers (names)', function () {

        it('should properly recognise names', function () {
            expect(lexer('f')).to.eql([{t: 'idn', v: 'f', f: 0}]);
            expect(lexer('foo')).to.eql([{t: 'idn', v: 'foo', f: 0}]);
            expect(lexer('$foo')).to.eql([{t: 'idn', v: '$foo', f: 0}]);
            expect(lexer('$$foo')).to.eql([{t: 'idn', v: '$$foo', f: 0}]);
            expect(lexer('_foo')).to.eql([{t: 'idn', v: '_foo', f: 0}]);
            expect(lexer('foo10')).to.eql([{t: 'idn', v: 'foo10', f: 0}]);
        });
    });

    describe('strings', function () {

        it('should recognise single quoted strings', function () {
            expect(lexer("''")).to.eql([{t: 'str', v: '', f: 0}]);
            expect(lexer("'foo'")).to.eql([{t: 'str', v: 'foo', f: 0}]);
            expect(lexer(" 'foo bar' ")).to.eql([{t: 'str', v: 'foo bar', f: 1}]);
        });

        it('should allow escape sequence for single-quoted strings', function () {
            expect(lexer("'\\''")).to.eql([{t: 'str', v: "'", f: 0}]);
        });

        it('should throw on unterminated string', function () {
            expect(function(){
                lexer('"');
            }).to.throwException('Error parsing """: unfinished string at 0');
        });

        it('should throw on unterminated string', function () {
            expect(function(){
                lexer('"fooo" " ooo');
            }).to.throwException('Error parsing ""fooo" " ooo": unfinished string at 7');
        });

        it('should recognise double quoted strings', function () {
            expect(lexer('""')).to.eql([{t: 'str', v: '', f: 0}]);
            expect(lexer('"foo"')).to.eql([{t: 'str', v: 'foo', f: 0}]);
            expect(lexer(' "foo bar" ')).to.eql([{t: 'str', v: 'foo bar', f: 1}]);
        });

        it('should allow escape sequence for double-quoted strings', function () {
            expect(lexer('"\\""')).to.eql([{t: 'str', v: '"', f: 0}]);
        });
    });

    describe('operators', function () {

        describe('single-char operators', function () {

            it('it should return operator token for single-char operatorss', function () {
                expect(lexer('+')).to.eql([{t: 'opr', v: '+', f: 0}]);
                expect(lexer('-')).to.eql([{t: 'opr', v: '-', f: 0}]);
                expect(lexer('*')).to.eql([{t: 'opr', v: '*', f: 0}]);
                expect(lexer('/')).to.eql([{t: 'opr', v: '/', f: 0}]);
                expect(lexer('%')).to.eql([{t: 'opr', v: '%', f: 0}]);
                expect(lexer('!')).to.eql([{t: 'opr', v: '!', f: 0}]);
                expect(lexer('|')).to.eql([{t: 'opr', v: '|', f: 0}]);
                expect(lexer('&')).to.eql([{t: 'opr', v: '&', f: 0}]);
                expect(lexer('=')).to.eql([{t: 'opr', v: '=', f: 0}]);
                expect(lexer('<')).to.eql([{t: 'opr', v: '<', f: 0}]);
                expect(lexer('>')).to.eql([{t: 'opr', v: '>', f: 0}]);
                expect(lexer('.')).to.eql([{t: 'opr', v: '.', f: 0}]);
                expect(lexer(',')).to.eql([{t: 'opr', v: ',', f: 0}]);
                expect(lexer('(')).to.eql([{t: 'opr', v: '(', f: 0}]);
                expect(lexer(')')).to.eql([{t: 'opr', v: ')', f: 0}]);
                expect(lexer('[')).to.eql([{t: 'opr', v: '[', f: 0}]);
                expect(lexer(']')).to.eql([{t: 'opr', v: ']', f: 0}]);
                expect(lexer('{')).to.eql([{t: 'opr', v: '{', f: 0}]);
                expect(lexer('}')).to.eql([{t: 'opr', v: '}', f: 0}]);
                expect(lexer('?')).to.eql([{t: 'opr', v: '?', f: 0}]);
                expect(lexer('|')).to.eql([{t: 'opr', v: '|', f: 0}]);
            });

            it('should not glue together single char operators', function () {
                expect(lexer('!!')).to.eql([
                    {t: 'opr', v: '!', f: 0},
                    {t: 'opr', v: '!', f: 1}
                ]);

                expect(lexer('{}')).to.eql([
                    {t: 'opr', v: '{', f: 0},
                    {t: 'opr', v: '}', f: 1}
                ]);
            });

            describe('multi-char operators', function () {

                it('should properly recognise multi-char operators', function () {
                    expect(lexer('||')).to.eql([{t: 'opr', v: '||', f: 0}]);
                    expect(lexer('&&')).to.eql([{t: 'opr', v: '&&', f: 0}]);
                    expect(lexer('==')).to.eql([{t: 'opr', v: '==', f: 0}]);
                    expect(lexer('!=')).to.eql([{t: 'opr', v: '!=', f: 0}]);
                    expect(lexer('===')).to.eql([{t: 'opr', v: '===', f: 0}]);
                    expect(lexer('!==')).to.eql([{t: 'opr', v: '!==', f: 0}]);
                    expect(lexer('<=')).to.eql([{t: 'opr', v: '<=', f: 0}]);
                    expect(lexer('>=')).to.eql([{t: 'opr', v: '>=', f: 0}]);
                });

            });
        });
    });

    describe('expressions', function () {

        it('should tokenize integers separates by whitespaces', function () {
            expect(lexer(' 12 34 5')).to.eql([
                {t: 'num', v: 12, f: 1},
                {t: 'num', v: 34, f: 4},
                {t: 'num', v: 5, f: 7}
            ]);
        });

        it('should tokenize integers in [] brackets', function () {
            expect(lexer(' [1]')).to.eql([
                {t: 'opr', v: '[', f: 1},
                {t: 'num', v: 1, f: 2},
                {t: 'opr', v: ']', f: 3}
            ]);
        });

        it('should tokenize integers and floats', function () {
            expect(lexer(' 10 12.4\n')).to.eql([
                {t: 'num', v: 10, f: 1},
                {t: 'num', v: 12.4, f: 4}
            ]);
        });

        it('should tokenize', function() {
            expect(lexer('"foo".toUpperCase()')).to.eql([
                {t: 'str', v: 'foo', f: 0},
                {t: 'opr', v: '.', f: 5},
                {t: 'idn', v: 'toUpperCase', f: 6},
                {t: 'opr', v: '(', f: 17},
                {t: 'opr', v: ')', f: 18}
            ]);
        });
    });

    describe('error conditions', function () {
        it('should throw on unrecognised token', function () {
            expect(function () {
                lexer('a^b');
            }).to.throwError(/Error parsing "a\^b": unknown token \^ at 1/);
        });
    });
});