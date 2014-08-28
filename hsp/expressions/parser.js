/**
 * Code in this file is based on the work from https://github.com/douglascrockford/TDOP
 * by Douglas Crockford douglas@crockford.com
 */
var lexer = require('./lexer');

var SYMBOLS = {};
var tokens, token, tokenIdx = 0;

var BaseSymbol = {
    nud: function () {
        throw new Error("Undefined nud function for: " + this.v);
    },
    led: function () {
        throw new Error("Missing operator: " + this.v);
    }
};

function itself() {
    return this;
}

function symbol(id, bp) {
    var s = SYMBOLS[id];
    bp = bp || 0;

    if (s) {
        if (bp >= s.lbp) {
            s.lbp = bp;
        }
    } else {
        s = Object.create(BaseSymbol);
        s.id = s.v = id;
        s.lbp = bp;
        SYMBOLS[id] = s;
    }

    return s;
}

function prefix(id, nud) {
    var s = symbol(id);
    s.nud = nud || function () {
        this.l = expression(70);
        this.a = 'unr';
        return this;
    };
    return s;
}

function infix(id, bindingPower, led) {
    var s = symbol(id, bindingPower);
    s.led = led || function (left) {
        this.l = left;
        this.r = expression(bindingPower);
        this.a = 'bnr';
        return this;
    };
    return s;
}

function infixr(id, bp, led) {
    var s = symbol(id, bp);
    s.led = led || function (left) {
        this.l = left;
        this.r = expression(bp - 1);
        this.a = 'bnr';
        return this;
    };
    return s;
}

var constant = function (s, v) {
    var x = symbol(s);
    x.nud = function () {
        this.v = SYMBOLS[this.id].v;
        this.a = "literal";
        return this;
    };
    x.v = v;
    return x;
};


//define "parser rules"
symbol('(end)');
symbol('(identifier)').nud = itself;
symbol('(literal)').nud = itself;
symbol("]");
symbol(")");
symbol("}");
symbol(",");
symbol(":");
constant("true", true);
constant("false", false);
constant("null", null);
prefix("new", function(){
    var args = [];
    this.a = 'bnr';
    this.l = expression(70);
    advance("(");
    if (token.v !== ')') {
        while (true) {
            args.push(expression(0));
            if (token.id !== ",") {
                break;
            }
            advance(",");
        }
    }
    advance(")");
    this.r = args;
    return this;
});
prefix("-");
prefix("!");
prefix("(", function () {
    var e = expression(0);
    advance(")");
    return e;
});
prefix("[", function () {
    var a = [];
    if (token.id !== "]") {
        while (true) {
            a.push(expression(0));
            if (token.id !== ",") {
                break;
            }
            advance(",");
        }
    }
    advance("]");
    this.l = a;
    this.a = 'unr';
    return this;
});
prefix("{", function () {
    var a = [];
    if (token.id !== "}") {
        while (true) {
            var n = token;
            if (n.a !== "idn" && n.a !== "literal") {
                throw new Error("Bad key.");
            }
            advance();
            advance(":");
            var v = expression(0);
            v.key = n.v;
            a.push(v);
            if (token.id !== ",") {
                break;
            }
            advance(",");
        }
    }
    advance("}");
    this.l = a;
    this.a = 'unr';
    return this;
});
infix("?", 20, function (left) {
    this.l = left;
    this.r = expression(0);
    advance(":");
    this.othr = expression(0);
    this.a = 'tnr';
    return this;
});
infixr("&&", 30);
infixr("||", 30);
infixr("<", 40);
infixr(">", 40);
infixr("<=", 40);
infixr(">=", 40);
infixr("==", 40);
infixr("!=", 40);
infixr("===", 40);
infixr("!==", 40);
infix("+", 50);
infix("-", 50);
infix("*", 60);
infix("/", 60);
infix("%", 60);
infix(".", 80, function (left) {
    this.l = left;
    if (token.a !== "idn") {
        throw new Error("Expected a property name, got:" + token.a + " at " + token.f);
    }
    token.a = "literal";
    this.r = token;
    this.a = 'bnr';
    advance();
    return this;
});
infix("[", 80, function (left) {
    this.l = left;
    this.r = expression(0);
    this.a = 'bnr';
    advance("]");
    return this;
});
infix("(", 70, function (left) {
    var a = [];
    if (left.id === "." || left.id === "[") {
        this.a = 'tnr';
        this.l = left.l;
        this.r = left.r;
        this.othr = a;
    } else {
        this.a = 'bnr';
        this.l = left;
        this.r = a;
        if (left.a !== 'unr' &&
            left.a !== "idn" && left.id !== "(" &&
            left.id !== "&&" && left.id !== "||" && left.id !== "?") {

            throw new Error("Expected a variable name: " + JSON.stringify(left));
        }
    }
    if (token.id !== ")") {
        while (true) {
            a.push(expression(0));
            if (token.id !== ",") {
                break;
            }
            advance(",");
        }
    }
    advance(")");
    return this;
});
infixr("|", 20, function (left) {
    //token points to a pipe function here - check if the next item is equal to :
    this.l = left;
    this.r = expression(20);
    this.a = 'tnr';
    this.othr = [];
    while (token.a === 'opr' && token.v === ':') {
        advance();
        this.othr.push(expression(20));
    }
    return this;
});

function advance(id) {
    var tokenType, o, inputToken, v;
    if (id && token.id !== id) {
        throw new Error("Expected '" + id + "' but '" + token.id + "' found.");
    }
    if (tokenIdx >= tokens.length) {
        token = SYMBOLS["(end)"];
        return;
    }
    inputToken = tokens[tokenIdx];
    tokenIdx += 1;
    v = inputToken.v;
    tokenType = inputToken.t;
    if (tokenType === "idn") {
        o = SYMBOLS[v] || SYMBOLS['(identifier)'];
    } else if (tokenType === "opr") {
        o = SYMBOLS[v];
        if (!o) {
            throw new Error("Unknown operator: " + v);
        }
    } else if (tokenType === "str" || tokenType ===  "num") {
        o = SYMBOLS["(literal)"];
        tokenType = "literal";
    } else {
        throw new Error("Unexpected token:" + v);
    }
    token = Object.create(o);
    //token.f  = inputToken.f;
    token.v = v;
    token.a = tokenType;

    return token;
}

function expression(rbp) {
    var left;
    var t = token;
    advance();
    left = t.nud();
    while (rbp < token.lbp) {
        t = token;
        advance();
        left = t.led(left);
    }
    return left;
}

/**
 * Expression parsing algorithm based on http://javascript.crockford.com/tdop/tdop.html
 * Other useful resources (reading material):
 * http://eli.thegreenplace.net/2010/01/02/top-down-operator-precedence-parsing/
 * http://l-lang.org/blog/TDOP---Pratt-parser-in-pictures/
 * http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
 *
 * @param input {String} - expression to parse
 * @return {Object} - parsed AST
 */
module.exports = function (input) {
    var expr, exprs = [];

    tokens = lexer(input);
    token = undefined;
    tokenIdx = 0;

    if (tokens.length) {
        advance(); //get the first token
        while(token.id !== '(end)') {
            expr = expression(0);
            exprs.push(expr);
            if (token.v === ',') {
                advance(',');
            }
        }
        return exprs.length === 1 ? exprs[0] : exprs;
    } else {
        return {f: 0, a: 'literal', v: undefined};
    }
};