/*
 * Partial grammar for hashspace that separates all statement or html element blocks
 * and return it as an Array
 */

TemplateFile
  = blocks:(RequireBlock / TemplateBlock / TextBlock)* 
  {return blocks;}

TextBlock
  = lines:(!("#" _ "template") !("#" _ "require") chars:[^\n\r]* eol:EOL {return chars.join("")+eol})+ 
  {return {type:"plaintext", value:lines.join('')}}

RequireBlock "require" // TODO: finalize!
  = _ "# " _ "require" _ (EOL / EOF) 
  {return {type:"require"}}

TemplateBlock "template"
  = start:TemplateStart content:TemplateContent? end:TemplateEnd 
  {start.content=content;return start}

TemplateStart "template statement"
  = _ "# " _ "template" _ name:Identifier _ args:ArgumentsDefinition? _  EOL 
  {return {type:"template", name:name, args:(args==='')? []:args}}

ArgumentsDefinition "arguments"
  = "(" _ first:Identifier? others:((_ "," _ arg:Identifier) {return arg})* _ ")" 
  {var args = first ? [first] : []; if (others && others.length) args=args.concat(others);return args;}

TemplateEnd "template end statement"
  = _ "# " _ "/template" _ (EOL / EOF) 
  {return {type:"/template"}} 

TemplateContent "template content" // TODO: InvalidHTMLElt / CSSClassExpression
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
  {return {type:"text", value:chars.join('')}}

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
  {return {type:"invalidexpression", value:chars.join('')}}

IfBlock "if statement"
  = "{" _ "if " _ expr:Expression _ "}" EOS?
  {return {type:"if", condition:expr}}

ElseIfBlock "elseif statement" 
  = "{" _ "else " _ "if" _ expr:( Expression / ( "(" _ expr2:Expression _ ")" ) {return expr2}) _ "}" EOS?
  {return {type:"elseif", value:expr}}

ElseBlock
  = "{" _ "else" _ "}" EOS?
  {return {type:"else"}}

EndIfBlock
  = "{" _ "/if" _ "}" EOS?
  {return {type:"endif"}}

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
  {return {type:"foreach", item:args.item, key:args.key, colref:args.colref}}

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
  {return {type:"endforeach"}}

HTMLElement
  = "<" name:HTMLName atts:((S att:HTMLAttribute) {return att})* S? end:"/"? ">" EOS?
  {return {type:"element", name:name, closed:(end!==""), attributes:atts }}

EndHTMLElement // TODO support comments inside Element
  = "</" name:HTMLName S? ">" EOS?
  {return {type:"endelement", name:name}}

InvalidHTMLElement
  = "<" [^\r\n]* EOL
  {return {type:"invalidelement"}}

HTMLName
  = first:[a-z] next:([a-z] / [0-9] / "-")* 
  {return first + next.join("");}

HTMLAttribute
  = name:HTMLName _ "=" _ "\"" value:HTMLAttributeValue "\""
  {return {type:"attribute", name:name, value:value}}

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
  = "{" ubflag:":"? e:Expression* "}" // we need to keep a list of expression to match expressions starting with a valid part
  {
    var r={};
    if (e.length==1) {
      r=e[0];r.type="expression"; r.bound=(ubflag.length==0);
    } else {
      r.type="expression"; r.category="error"; r.content=e;
    }
    return r;
  }

Expression
  = Expression1 
    / "(" _ exp:Expression1 _ ")" {return exp}
    / InvalidExpressionValue

Expression1
  = JSLiteral / JSFunctionCall / JSObjectRef

InvalidExpressionValue
  = chars:[^}]+
  {return {type:"invalidexpression", value:chars.join('')}}

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

// ################################################################################

JSObjectRef "JS object reference"
  = start:Identifier tail:(( "." pp:Identifier) {return pp}/ ( "[" idx:[0-9]+ "]") {return parseInt(idx.join(''),10)})*
  {var r=[start]; if (tail && tail.length) r=r.concat(tail);return {category:"objectref", path:r}}

ArgExpression
  = JSLiteral 
  / "event" {return {category:"event"}}
  / JSObjectRef

JSFunctionCall "JS function reference"
  = fnpath:JSObjectRef S? "(" S? 
   args:(arg1:ArgExpression args2:( (S? "," S? arg:ArgExpression S?) {return arg} )* 
      {var r=[]; if(arg1) {r.push(arg1);if(args2 && args2.length) r=r.concat(args2)};return r;} )? 
   S? ")" S?
  {if (args==='') args=[];return {category:"functionref", path:fnpath.path, args:args}} 

JSLiteral
  = NullLiteral       { return {category: "null"};}
  / v:BooleanLiteral  { return {category: "boolean", value:v.value };}
  / v:NumericLiteral  { return {category: "number", value: v };}
  / v:StringLiteral   { return {category: "string",  value: v };}

// ################################################################################
/*!
 * This part is taken from the JavaScript PEGjs grammar by David Majda
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
