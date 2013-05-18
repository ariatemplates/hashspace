/*
 * Partial grammar for hashspace that separates all statement or html element blocks
 * and return it as an Array
 * 
 * The last part of this file corresponds to fragments of the JavaScript grammar 
 * written by David Majda (minor modifications have been added to cope 
 * with hashspace constraints)
 * @see https://github.com/dmajda/pegjs
 */

TemplateFile
  = blocks:(TemplateBlock / TextBlock)*  /*(RequireBlock / TemplateBlock / TextBlock)* */
  {return blocks;}

TextBlock
  = lines:(!("#" _ "template") !("#" _ [a-zA-Z0-9]+ _ "template") !("#" _ "require") chars:[^\n\r]* eol:EOL {return chars.join("")+eol})+ 
  {return {type:"plaintext", value:lines.join('')}}

RequireBlock "require block" // TODO: finalize!
  = _ "# " _ "require" _ (EOL / EOF) 
  {return {type:"require"}}

TemplateBlock "template block"
  = start:TemplateStart content:TemplateContent? end:TemplateEnd? 
  {start.content=content;start.closed=(end!=="");return start}

TemplateStart "template statement"
  = _ "# " _ m:(("template") / (c:[a-zA-Z0-9]+ _ "template") {return c.join('')})
    _ name:Identifier _ args:(ArgumentsDefinition / invarg:InvalidTplArgs)? _  EOL 
  {
    var mod="";
    if (m!=="template") {
      mod=m;
    }
    if (args && args.invalidTplArg) {
      if (mod) {
        mod+=" ";
      }
      return {type:"invalidtemplate", line:line, column:column, code: "# "+mod+"template "+name+" "+args.invalidTplArg}
    } else {
      return {type:"template", name:name, mod:mod, args:(args==='')? []:args, line:line, column:column}
    }
  }

ArgumentsDefinition "arguments"
  = "(" _ first:Identifier? others:((_ "," _ arg:Identifier) {return arg})* _ ")" 
  {var args = first ? [first] : []; if (others && others.length) args=args.concat(others);return args;}

InvalidTplArgs
  = chars:[^\n\r]+ &EOL
  {return {invalidTplArg:chars.join('')}}

TemplateEnd "template end statement"
  = _ "# " _ "/template" _ (EOL / EOF) 
  {return {type:"/template"}} 

TemplateContent "template content" // TODO: CSSClassExpression
  = _ blocks:(  TplTextBlock 
                / CommentBlock / HTMLCommentBlock
                / IfBlock / ElseIfBlock / ElseBlock / EndIfBlock 
                / ForeachBlock / EndForeachBlock
                / HTMLElement / EndHTMLElement
                / ExpressionBlock
                / InvalidHTMLElement
                / InvalidBlock)* 
  {return blocks}

TplTextBlock "text"
  = chars:(TplTextChar)+ 
  {return {type:"text", value:chars.join(''), line:line, column:column}}

TplTextChar "text character"
  = "\\{" {return "\u007B"}       // { = \u007B
  / "\\}" {return "\u007D"}       // } = \u007D
  / "\\n" {return "\n"}
  / EOL &TemplateEnd {return ""}  // ignore last EOL
  / EOL _ {return " "}
  / "#" !(_ "\/template") {return "#"}
  / "\/" !"/" {return "/"}
  / "\\/" {return "/"}
  / "\\//" {return "//"}
  / "\\<" {return "<"}
  / [^{#/<]

InvalidBlock
  = "{" chars:[^{}#]* "}"
  {return {type:"invalidblock", code:chars.join(''), line:line, column:column}}

IfBlock "if statement"
  = "{" _ "if " _ expr:HExpression _ "}" EOS?
  {return {type:"if", condition:expr, line:line, column:column}}

ElseIfBlock "elseif statement" 
  = "{" _ "else " _ "if" _ expr:( HExpression / ( "(" _ expr2:HExpression _ ")" ) {return expr2}) _ "}" EOS?
  {return {type:"elseif", value:expr, line:line, column:column}}

ElseBlock
  = "{" _ "else" _ "}" EOS?
  {return {type:"else", line:line, column:column}}

EndIfBlock
  = "{" _ "/if" _ "}" EOS?
  {return {type:"endif", line:line, column:column}}

CommentBlock
  = _ "\/\/" chars:[^\r\n]* &EOL
  {return {type:"comment", value:chars.join('')}}

HTMLCommentBlock
  = "<!--" chars:HTMLCommentChar* "-->"
  {return {type:"comment", value:chars.join('')}}

HTMLCommentChar
  = !"-" "-" !">" {return "-"}
    / "-" !"->" {return "-"}
    / !"--" ">" {return ">"}
    / [^>\-]

ForeachBlock
  = "{" _ "foreach " _ args:( ForeachArgs / ("(" _ a:ForeachArgs _ ")") {return a}) _ "}" EOS?
  {return {type:"foreach", item:args.item, key:args.key, colref:args.colref, line:line, column:column}}

ForeachArgs
  = ForeachArgs1 / ForeachArgs2

ForeachArgs1
  = item:Identifier " " _ "in " _ col:JSObjectRef 
  {return {item:item, key:item+"_key", colref:col}}

ForeachArgs2
  = key:Identifier _ "," _ item:Identifier " " _ "in " _ col:JSObjectRef 
  {return {item:item, key:key, colref:col}}

EndForeachBlock
  = "{" _ "/foreach" _ "}"
  {return {type:"endforeach", line:line, column:column}}

HTMLElement
  = "<" name:HTMLName  atts:HTMLElementAttributes? S? end:"/"? ">" EOS?
  {return {type:"element", name:name, closed:(end!==""), attributes:atts, line:line, column:column}}

HTMLElementAttributes
  = atts:((S att:(HTMLAttribute)) {return att})*

EndHTMLElement // TODO support comments inside Element
  = "</" name:HTMLName S? ">" EOS?
  {return {type:"endelement", name:name, line:line, column:column}}

InvalidHTMLElement
  = "<" code:[^\r\n]* EOL
  {return {type:"invalidelement", code:'<'+code.join(''), line:line, column:column}}

HTMLName
  = first:[a-z] next:([a-z] / [0-9] / "-")* 
  {return first + next.join("");}

HTMLAttribute
  = name:HTMLName _ "=" _ "\"" value:HTMLAttributeValue "\""
  {return {type:"attribute", name:name, value:value, line:line, column:column}}

HTMLAttributeValue
  = (HTMLAttributeText / ExpressionBlock)*

HTMLAttributeText
  = chars:HTMLAttributeChar+
  {return {type:"text", value:chars.join('')}}

HTMLAttributeChar // TODO look at W3C specs
  =   "\\{" {return "\u007B"}  // { = \u007B
    / "\\\"" {return "\""}
    / [^{\"\n\r]

ExpressionBlock
  = "{" ubflag:":"? e:HExpression* "}" // we need to keep a list of expression to match expressions starting with a valid part
  {
    var r={};
    if (e.length==1) {
      r=e[0];if (!r.type) r.type="expression"; r.bound=(ubflag.length==0); r.line=line; r.column=column;
    } else {
      var code=[], itm;
      for (var i=0, sz=e.length;sz>i;i++) {
        itm=e[i];
        if (itm.value) {
          code.push(itm.value);
        } else if (itm.code) {
          code.push(itm.code);
        } else {
          code.push("TODO");
        }
      }
      r.type="expression"; r.category="invalidexpression"; r.code=code.join(''); r.line=line; r.column=column;
    }
    return r;
  }

HExpression
  = HExpression1 
    / "(" _ exp:HExpression1 _ ")" {return exp}
    / InvalidExpressionValue

HExpression1
  =   JSLiteral 
    / JSFunctionCall 
    / JSObjectRef 
    / ce:ConditionalExpressionNoIn {if (!ce.category) ce.category="jsexpression";return ce;}

InvalidExpressionValue
  = chars:[^}]+
  {return {type:"invalidexpression", code:chars.join(''), line:line, column:column}}

// White spaces
    // mandatory padding including line breaks
S "white space" 
  = empty:(WhiteSpace / "\u000D" / "\u000A")+

_   // optional padding excluding line breaks
  = WhiteSpace*

WhiteSpace "white space"
  = [\t\v\f \u00A0\uFEFF]

EOL "end of line"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028" // line separator
  / "\u2029" // paragraph separator

EOS "end of statement" //
  = empty:(_ EOL _)

EOF "end of file"
  = !.

__ // changed
  = (WhiteSpace / EOL / Comment)*

Comment "comment"
  = MultiLineComment
  / SingleLineComment

MultiLineComment
  = "/*" (!"*/" .)* "*/"

SingleLineComment
  = "//" (!EOL .)*

// ################################################################################

JSObjectRef "JS object reference"
  = start:Identifier tail:(( "." pp:Identifier) {return pp}/ ( "[" idx:[0-9]+ "]") {return parseInt(idx.join(''),10)})*
  {var r=[start]; if (tail && tail.length) r=r.concat(tail);return {category:"objectref", path:r, code:r.join('.')}}

ArgExpression
  = JSLiteral 
  / "event" {return {category:"event", code:"event"}}
  / JSObjectRef

JSFunctionCall "JS function reference"
  = fnpath:JSObjectRef S? "(" S? 
   args:(arg1:ArgExpression args2:( (S? "," S? arg:ArgExpression S?) {return arg} )* 
      {var r=[]; if(arg1) {r.push(arg1);if(args2 && args2.length) r=r.concat(args2)};return r;} )? 
   S? ")" S?
  {if (args==='') args=[];return {category:"functionref", path:fnpath.path, args:args, code:fnpath.code+"("+args.join(",")+")"}} 

JSLiteral
  = NullLiteral       { return {type:"expression", category: "null", code:"null"};}
  / v:BooleanLiteral  { return {type:"expression", category: "boolean", value:v.value, code:""+v.value};}
  / v:NumericLiteral  { return {type:"expression", category: "number", value: v, code:""+v};}
  / v:StringLiteral   { return {type:"expression", category: "string",  value: v, code:""+v};}

// ################################################################################
/*!
 * The last part of this file is taken & modified from the JavaScript PEGjs grammar 
 * by David Majda
 * https://github.com/dmajda/pegjs
 *
 * JavaScript parser based on the grammar described in ECMA-262, 5th ed.
 * (http://www.ecma-international.org/publications/standards/Ecma-262.htm)
 */
SourceCharacter
  = .

Identifier "identifier"
  = !ReservedWord name:IdentifierName { return name; }

IdentifierName "identifier"
  = start:IdentifierStart parts:IdentifierPart* 
  {return start + parts.join("");}

IdentifierStart
  = Letter // should be UnicodeLetter to be fully ECMAScript compliant - cf. PEGS JS Grammar
  / "$"
  / "_"

IdentifierPart
  = IdentifierStart / Digit

Letter
  = [a-zA-Z]

Digit
  = [0-9]

ReservedWord
  = Keyword / FutureReservedWord / NullLiteral / BooleanLiteral

Keyword
  = (
        "break"
      / "case"
      / "catch"
      / "continue"
      / "debugger"
      / "default"
      / "delete"
      / "do"
      / "else"
      / "finally"
      / "for"
      / "function"
      / "if"
      / "instanceof"
      / "in"
      / "new"
      / "return"
      / "switch"
      / "this"
      / "throw"
      / "try"
      / "typeof"
      / "var"
      / "void"
      / "while"
      / "with"
    )
    !IdentifierPart

FutureReservedWord
  = (
        "class"
      / "const"
      / "enum"
      / "export"
      / "extends"
      / "import"
      / "super"
    )
    !IdentifierPart

NullLiteral
  = "null" 
  {return { type: "nullliteral", value: null }; }

BooleanLiteral
  = "true"  { return { type: "booleanliteral", value: true  }; }
  / "false" { return { type: "booleanliteral", value: false }; }

NumericLiteral "number"
  = literal:(HexIntegerLiteral / DecimalLiteral) !IdentifierStart 
  {return literal;}

HexIntegerLiteral
  = "0" [xX] digits:HexDigit+ 
  {return parseInt("0x" + digits.join(""));}

HexDigit
  = [0-9a-fA-F]

DecimalLiteral
  = before:DecimalIntegerLiteral "." after:DecimalDigits? exponent:ExponentPart? 
    {return parseFloat(before + "." + after + exponent);}
  / "." after:DecimalDigits exponent:ExponentPart? 
    {return parseFloat("." + after + exponent);}
  / before:DecimalIntegerLiteral exponent:ExponentPart? 
    {return parseFloat(before + exponent);}

DecimalIntegerLiteral
  = "0" / digit:NonZeroDigit digits:DecimalDigits? 
  {return digit + digits;}

DecimalDigits
  = digits:DecimalDigit+ 
  {return digits.join("");}

DecimalDigit
  = [0-9]

NonZeroDigit
  = [1-9]

ExponentPart
  = indicator:ExponentIndicator integer:SignedInteger 
  {return indicator + integer;}

ExponentIndicator
  = [eE]

SignedInteger
  = sign:[-+]? digits:DecimalDigits 
  {return sign + digits;}

StringLiteral "string"
  = parts:('"' DoubleStringCharacters? '"' / "'" SingleStringCharacters? "'") 
  {return parts[1];}

DoubleStringCharacters
  = chars:DoubleStringCharacter+ { return chars.join(""); }

SingleStringCharacters
  = chars:SingleStringCharacter+ { return chars.join(""); }

DoubleStringCharacter
  = !('"' / "\\" / EOL) char_:SourceCharacter { return char_;     }
  / "\\" sequence:EscapeSequence              { return sequence;  }

SingleStringCharacter
  = !("'" / "\\" / EOL) char_:SourceCharacter { return char_;     }
  / "\\" sequence:EscapeSequence              { return sequence;  }

EscapeSequence
  = CharacterEscapeSequence
  / "0" !DecimalDigit { return "\0"; }
  / HexEscapeSequence
  / UnicodeEscapeSequence

CharacterEscapeSequence
  = SingleEscapeCharacter
  / NonEscapeCharacter

SingleEscapeCharacter
  = char_:['"\\bfnrtv] {
      return char_
        .replace("b", "\b")
        .replace("f", "\f")
        .replace("n", "\n")
        .replace("r", "\r")
        .replace("t", "\t")
        .replace("v", "\x0B") // IE does not recognize "\v".
    }

NonEscapeCharacter
  = (!EscapeCharacter / EOL) char_:SourceCharacter { return char_; }

EscapeCharacter
  = SingleEscapeCharacter
  / DecimalDigit
  / "x"
  / "u"

HexEscapeSequence
  = "x" h1:HexDigit h2:HexDigit 
  {return String.fromCharCode(parseInt("0x" + h1 + h2));}

UnicodeEscapeSequence
  = "u" h1:HexDigit h2:HexDigit h3:HexDigit h4:HexDigit 
  {return String.fromCharCode(parseInt("0x" + h1 + h2 + h3 + h4));}


/* ===== A.3 Expressions ===== */

PrimaryExpression // changed
  = name:Identifier { return { type: "expression", "category": "objectref", "path": [name]}; }
  / JSLiteral
  / ArrayLiteral
  / ObjectLiteral
  / "(" __ expression:Expression __ ")" { return expression; }

ArrayLiteral
  = "[" __ elements:ElementList? __ (Elision __)? "]" {
      return {
        type:     "ArrayLiteral",
        elements: elements !== "" ? elements : []
      };
    }

ElementList
  = (Elision __)?
    head:AssignmentExpression
    tail:(__ "," __ Elision? __ AssignmentExpression)* {
      var result = [head];
      for (var i = 0; i < tail.length; i++) {
        result.push(tail[i][5]);
      }
      return result;
    }

Elision
  = "," (__ ",")*

ObjectLiteral
  = "{" __ properties:(PropertyNameAndValueList __ ("," __)?)? "}" {
      return {
        type:       "ObjectLiteral",
        properties: properties !== "" ? properties[0] : []
      };
    }

PropertyNameAndValueList
  = head:PropertyAssignment tail:(__ "," __ PropertyAssignment)* {
      var result = [head];
      for (var i = 0; i < tail.length; i++) {
        result.push(tail[i][3]);
      }
      return result;
    }

PropertyAssignment // changed
  = name:PropertyName __ ":" __ value:AssignmentExpression {
      return {
        type:  "PropertyAssignment",
        name:  name,
        value: value
      };
    }

PropertyName
  = IdentifierName
  / StringLiteral
  / NumericLiteral

PropertySetParameterList
  = Identifier

MemberExpression // changed
  = base:(
        PrimaryExpression
    )
    accessors:(
        __ "[" __ name:Expression __ "]" { return name; }
      / __ "." __ name:IdentifierName    { return name; }
    )* {
      var result = base;
      for (var i = 0; i < accessors.length; i++) {
        result = {
          type: "PropertyAccess",
          base: result,
          name: accessors[i]
        };
      }
      return result;
    }

NewExpression // changed
  = MemberExpression

CallExpression
  = base:(
      name:MemberExpression __ arguments:Arguments {
        return {
          type:      "FunctionCall",
          name:      name,
          arguments: arguments
        };
      }
    )
    argumentsOrAccessors:(
        __ arguments:Arguments {
          return {
            type:      "FunctionCallArguments",
            arguments: arguments
          };
        }
      / __ "[" __ name:Expression __ "]" {
          return {
            type: "PropertyAccessProperty",
            name: name
          };
        }
      / __ "." __ name:IdentifierName {
          return {
            type: "PropertyAccessProperty",
            name: name
          };
        }
    )* {
      var result = base;
      for (var i = 0; i < argumentsOrAccessors.length; i++) {
        switch (argumentsOrAccessors[i].type) {
          case "FunctionCallArguments":
            result = {
              type:      "FunctionCall",
              name:      result,
              arguments: argumentsOrAccessors[i].arguments
            };
            break;
          case "PropertyAccessProperty":
            result = {
              type: "PropertyAccess",
              base: result,
              name: argumentsOrAccessors[i].name
            };
            break;
          default:
            throw new Error(
              "Invalid expression type: " + argumentsOrAccessors[i].type
            );
        }
      }
      return result;
    }

Arguments
  = "(" __ arguments:ArgumentList? __ ")" {
    return arguments !== "" ? arguments : [];
  }

ArgumentList
  = head:AssignmentExpression tail:(__ "," __ AssignmentExpression)* {
    var result = [head];
    for (var i = 0; i < tail.length; i++) {
      result.push(tail[i][3]);
    }
    return result;
  }

LeftHandSideExpression
  = CallExpression
  / NewExpression

PostfixExpression
  = expression:LeftHandSideExpression _ operator:PostfixOperator {
      return {
        type:       "PostfixExpression",
        operator:   operator,
        expression: expression
      };
    }
  / LeftHandSideExpression

PostfixOperator
  = "++"
  / "--"

UnaryExpression
  = PostfixExpression
  / operator:UnaryOperator __ expression:UnaryExpression {
      return {
        type:       "UnaryExpression",
        operator:   operator,
        expression: expression
      };
    }

UnaryOperator // changed
  = "void"
  / "typeof"
  / "++"
  / "--"
  / "+"
  / "-"
  / "~"
  /  "!"

MultiplicativeExpression
  = head:UnaryExpression
    tail:(__ MultiplicativeOperator __ UnaryExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

MultiplicativeOperator
  = operator:("*" / "/" / "%") !"=" { return operator; }

AdditiveExpression
  = head:MultiplicativeExpression
    tail:(__ AdditiveOperator __ MultiplicativeExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

AdditiveOperator
  = "+" !("+" / "=") { return "+"; }
  / "-" !("-" / "=") { return "-"; }

ShiftExpression
  = head:AdditiveExpression
    tail:(__ ShiftOperator __ AdditiveExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

ShiftOperator
  = "<<"
  / ">>>"
  / ">>"

RelationalExpression
  = head:ShiftExpression
    tail:(__ RelationalOperator __ ShiftExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

RelationalOperator
  = "<="
  / ">="
  / "<"
  / ">"
  / "instanceof"
  / "in"

RelationalExpressionNoIn
  = head:ShiftExpression
    tail:(__ RelationalOperatorNoIn __ ShiftExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

RelationalOperatorNoIn
  = "<="
  / ">="
  / "<"
  / ">"
  / "instanceof"

EqualityExpression
  = head:RelationalExpression
    tail:(__ EqualityOperator __ RelationalExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

EqualityExpressionNoIn
  = head:RelationalExpressionNoIn
    tail:(__ EqualityOperator __ RelationalExpressionNoIn)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

EqualityOperator
  = "==="
  / "!=="
  / "=="
  / "!="

BitwiseANDExpression
  = head:EqualityExpression
    tail:(__ BitwiseANDOperator __ EqualityExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

BitwiseANDExpressionNoIn
  = head:EqualityExpressionNoIn
    tail:(__ BitwiseANDOperator __ EqualityExpressionNoIn)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

BitwiseANDOperator
  = "&" !("&" / "=") { return "&"; }

BitwiseXORExpression
  = head:BitwiseANDExpression
    tail:(__ BitwiseXOROperator __ BitwiseANDExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

BitwiseXORExpressionNoIn
  = head:BitwiseANDExpressionNoIn
    tail:(__ BitwiseXOROperator __ BitwiseANDExpressionNoIn)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

BitwiseXOROperator
  = "^" !("^" / "=") { return "^"; }

BitwiseORExpression
  = head:BitwiseXORExpression
    tail:(__ BitwiseOROperator __ BitwiseXORExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

BitwiseORExpressionNoIn
  = head:BitwiseXORExpressionNoIn
    tail:(__ BitwiseOROperator __ BitwiseXORExpressionNoIn)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

BitwiseOROperator
  = "|" !("|" / "=") { return "|"; }

LogicalANDExpression
  = head:BitwiseORExpression
    tail:(__ LogicalANDOperator __ BitwiseORExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

LogicalANDExpressionNoIn
  = head:BitwiseORExpressionNoIn
    tail:(__ LogicalANDOperator __ BitwiseORExpressionNoIn)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

LogicalANDOperator
  = "&&" !"=" { return "&&"; }

LogicalORExpression
  = head:LogicalANDExpression
    tail:(__ LogicalOROperator __ LogicalANDExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

LogicalORExpressionNoIn
  = head:LogicalANDExpressionNoIn
    tail:(__ LogicalOROperator __ LogicalANDExpressionNoIn)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

LogicalOROperator
  = "||" !"=" { return "||"; }

ConditionalExpression
  = condition:LogicalORExpression __
    "?" __ trueExpression:AssignmentExpression __
    ":" __ falseExpression:AssignmentExpression {
      return {
        type:            "ConditionalExpression",
        condition:       condition,
        trueExpression:  trueExpression,
        falseExpression: falseExpression
      };
    }
  / LogicalORExpression

// This is the one we use in hashspace
ConditionalExpressionNoIn
  = condition:LogicalORExpressionNoIn __
    "?" __ trueExpression:AssignmentExpressionNoIn __
    ":" __ falseExpression:AssignmentExpressionNoIn {
      return {
        type:            "ConditionalExpression",
        condition:       condition,
        trueExpression:  trueExpression,
        falseExpression: falseExpression
      };
    }
  / LogicalORExpressionNoIn

// Not used in hashspace
AssignmentExpression
  = left:LeftHandSideExpression __
    operator:AssignmentOperator __
    right:AssignmentExpression {
      return {
        type:     "AssignmentExpression",
        operator: operator,
        left:     left,
        right:    right
      };
    }
  / ConditionalExpression

AssignmentExpressionNoIn
  = left:LeftHandSideExpression __
    operator:AssignmentOperator __
    right:AssignmentExpressionNoIn {
      return {
        type:     "AssignmentExpression",
        operator: operator,
        left:     left,
        right:    right
      };
    }
  / ConditionalExpressionNoIn

AssignmentOperator
  = "=" (!"=") { return "="; }
  / "*="
  / "/="
  / "%="
  / "+="
  / "-="
  / "<<="
  / ">>="
  / ">>>="
  / "&="
  / "^="
  / "|="

Expression
  = head:AssignmentExpression
    tail:(__ "," __ AssignmentExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

ExpressionNoIn
  = head:AssignmentExpressionNoIn
    tail:(__ "," __ AssignmentExpressionNoIn)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }
