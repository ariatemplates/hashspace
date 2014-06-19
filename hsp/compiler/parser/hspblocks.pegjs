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
  = blocks:(TemplateBlock / TextBlock)* 
  {return blocks;}

TextBlock
  = lines:(!(_ ("#" / "{") _ "template") !(_ ("#" / "{") _ [a-zA-Z0-9]+ _ "template") !("#" _ "require") chars:[^\n\r]* eol:EOL {return chars.join("")+eol})+
  {return {type:"plaintext", value:lines.join('')}}

TemplateBlock "template block"
  = start:TemplateStart content:TemplateContent? end:TemplateEnd? 
  {
    start.content=content;
    if (end) {start.closed=true;start.endLine=end.line;};
    return start;
  }

TemplateStart "template statement"
  = _ d1:("#" / "{") p:_ m:(("template") / (c:[a-zA-Z0-9]+ _ "template") {return c.join('')})
    S+ name:Identifier args:(TemplateController / ArgumentsDefinition / invarg:InvalidTplArgs)? _ d2:("}")? EOL 
  {
    var mod=""; // modifier (e.g. "export")
    if (m!=="template") {
      mod=m;
    }
    if (args && args.invalidTplArg) {
      if (mod) {
        mod+=" ";
      }
      return {type:"invalidtemplate", line:line, column:column, code: d1+p+mod+"template "+name+" "+args.invalidTplArg+d2}
    } else {
      if ((d1 === "{" && d2 !=="}") || (d1 === "#" && d2!=="")) {
        // inconsistant delimiters
        return {type:"invalidtemplate", line:line, column:column, code: d1+p+mod+"template "+name+" "+args.invalidTplArg+d2}
      }

      if (args && args.ctl && args.constructor!==Array) {
        // this template uses a controller
        return {type:"template", name:name, mod:mod, controller:args.ctl, controllerRef: args.ctlref, line:line, column:column}
      }
      return {type:"template", name:name, mod:mod, args:(args==='')? []:args, line:line, column:column}
    }
  }

TemplateController "controller"
  = S+ "using" S+ ref:Identifier _ ":" _ ctl:JSObjectRef
  {return {ctl:ctl, ctlref:ref}}

ArgumentsDefinition "arguments"
  = _ "(" _ first:VarIdentifier? others:((_ "," _ arg:VarIdentifier) {return arg})* _ ")" 
  {var args = first ? [first] : []; if (others && others.length) args=args.concat(others);return args;}

InvalidTplArgs
  = _ !"}" chars:[^\n\r]+ &EOL
  {return {invalidTplArg:chars.join('')}}

TemplateEnd "template end statement"
  = TemplateEnd1 / TemplateEnd2

TemplateEnd1
  = _"{/template" _ "}" _ (EOL / EOF)
  {return {type:"/template",line:line,column:column}}  

TemplateEnd2
  = _"#" _ "/template" _ (EOL / EOF)
  {return {type:"/template",line:line,column:column}} 

TemplateContent "template content" // TODO: CSSClassExpression
  = _ blocks:(  TplTextBlock 
                / CommentBlock / HTMLCommentBlock
                / IfBlock / ElseIfBlock / ElseBlock / EndIfBlock 
                / ForeachBlock / EndForeachBlock
                / HTMLElement / EndHTMLElement
                / HspComponent / EndHspComponent
                / HspCptAttribute / EndHspCptAttribute
                / LetBlock
                / LogBlock
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
  = "{" !(_ "/template" _ "}") chars:[^{}#]* "}"
  {return {type:"invalidblock", code:chars.join(''), line:line, column:column}}

IfBlock "if statement"
  = "{" _ "if " _ expr:HPipeExpression _ "}" EOS?
  {return {type:"if", condition:expr, line:line, column:column}}

ElseIfBlock "elseif statement" 
  = "{" _ "else " _ "if" _ expr:HPipeExpression _ "}" EOS?
  {return {type:"elseif", condition:expr, line:line, column:column}}

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
  = item:VarIdentifier " " _ "in " _ col:HPipeExpression 
  {return {item:item, key:item+"_key", colref:col}}

ForeachArgs2
  = key:VarIdentifier _ "," _ item:VarIdentifier " " _ "in " _ col:HPipeExpression 
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

HspComponent
  = "<#" ref:JSObjectRef  atts:HTMLElementAttributes? S? end:"/"? ">" EOS?
  {return {type:"component", ref:ref, closed:(end!==""), attributes:atts, line:line, column:column}}

EndHspComponent
  = "</#" ref:JSObjectRef S? ">" EOS?
  {return {type:"endcomponent", ref:ref, line:line, column:column}}

HspCptAttribute
  = "<@" ref:VarIdentifier  atts:HTMLElementAttributes? S? end:"/"? ">" EOS?
  {return {type:"cptattribute", name:ref, closed:(end!==""), attributes:atts, line:line, column:column}}

EndHspCptAttribute
  = "</@" ref:VarIdentifier S? ">" EOS?
  {return {type:"endcptattribute", name:ref, line:line, column:column}}

InvalidHTMLElement
  = "<" code:[^\r\n]* EOL
  {return {type:"invalidelement", code:'<'+code.join(''), line:line, column:column}}

HTMLName
  = first:[a-z] next:([a-z] / [0-9] / "-")* 
  {return first + next.join("");}

HTMLAttName
  = first:[a-zA-Z#] next:([a-zA-Z] / [0-9] / "-")* 
  // uppercase chars are considered as error in the parse post-processor
  {return first + next.join("");}

HTMLAttribute
  = name:HTMLAttName v:(_ "=" _ "\"" value:HTMLAttributeValue "\"" {return value;})?
  {
    return {type:"attribute", name:name, value:v, line:line, column:column}
  }

HTMLAttributeValue
  = (HTMLAttributeText / ExpressionBlock)*

HTMLAttributeText
  = chars:HTMLAttributeChar+
  {return {type:"text", value:chars.join('')}}

HTMLAttributeChar // TODO look at W3C specs
  =   "\\{" {return "\u007B"}  // { = \u007B
    / "\\\"" {return "\""}
    / [^{\"\n\r]

LogBlock
  = "{" _ "log " _ first:HPipeExpression _ next:("," _ HPipeExpression)* _"}" EOS?
  {
    var exprs=[first];
    if (next) {
      for (var i=0, sz=next.length;sz>i;i++) {
        exprs.push(next[i][2]);
      }
    }
    return {type:"log",exprs:exprs, line:line, column:column};
  }

LetBlock
  = "{" _ "let " _ first:LetAssignment __ next:("," __ LetAssignment)* "}" EOS?
  {
    var asn=[first];
    if (next) {
      for (var i=0, sz=next.length;sz>i;i++) {
        asn.push(next[i][2]);
      }
    }
    return {type:"let",assignments:asn, line:line, column:column}
  }

LetAssignment
  =  nm:Identifier _ "=" _ val:HPipeExpression
  {
    return {identifier:nm, value:val}
  }

ExpressionBlock
  = "{" ubflag:":"? __ e:HExpression* "}" // keep a list of expression to match expressions starting with a valid part
  {
    var r={};
    if (e.length==1) {
      r=e[0];
      if (r.type!=="invalidexpression") {
        r.expType=r.type; 
        r.type="expression";
      }
      r.bound=(ubflag.length==0);
      if (!r.category) {
        r.category="jsexpression";
      }
    } else {
      var code=[], itm, valid=true, t;
      for (var i=0, sz=e.length;sz>i;i++) {
        t=e[i].type;
        if (t==="invalidexpression") {
          valid=false;
          break;
        }
      }

      if (valid) {
        r.type="expression";
        r.category="jsexpression";
        r.expType="CssClassExpression"
        r.list=e;
      } else {
        // invalid expression
        for (var i=0, sz=e.length;sz>i;i++) {
          itm=e[i];
          if (itm.value) {
            code.push(itm.value);
          } else if (itm.code) {
            code.push(itm.code);
          } else {
            code.push("(...)"); // TODO
          }
        }
        r.type="expression"; r.category="invalidexpression"; r.code=code.join('');
      }
    }
    r.line=line; 
    r.column=column;
    return r;
  }

HExpression
  =   HExpressionCssClassElt 
    / HPipeExpression 
    / "," __ cce:HExpressionCssClassElt __ {return cce}
    / "," __ exp:HPipeExpression __ {return exp}
    / InvalidExpressionValue

HPipeExpression
  =  ce:ConditionalExpressionNoIn pipes:(__ "|" __ HPipeFunction)*
  {
    if (!ce.category) ce.category="jsexpression"; 
    ce.expType=ce.type;
    ce.line=line;
    ce.column=column;
    if (pipes && pipes.length>0) {
      ce.pipes=[];
      for (var i=0;pipes.length>i;i++) {
        ce.pipes.push(pipes[i][3]);
      }
    }
    return ce;
  }

HPipeFunction
 = fn:ConditionalExpressionNoIn args:(__ ":" __ ConditionalExpressionNoIn)*
 {
   var expr={fnexpr:fn};
   if (args) {
     expr.args=[];
     for (var i=0;args.length>i;i++) {
       expr.args.push(args[i][3]);
     }
   }
   return expr;
 }

HExpressionCssClassElt
  = head:LogicalORExpression __ ":" __ tail:LogicalORExpression 
  {return {type:"CssClassElement", left:head, right:tail};}

InvalidExpressionValue
  = !("/template" _) chars:[^}]+
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
  = start:VarIdentifier tail:(( "." pp:Identifier) {return pp}/ ( "[" idx:[0-9]+ "]") {return parseInt(idx.join(''),10)})*
  {var r=[start]; if (tail && tail.length) r=r.concat(tail);return {category:"objectref", path:r, code:r.join('.')}}

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

VarIdentifier "variable identifier" // same as Identifer but without underscore as first letter
  = !ReservedWord name:VarIdentifierName { return name; }

VarIdentifierName "identifier"
  = start:VarIdentifierStart parts:IdentifierPart* 
  {return start + parts.join("");}

VarIdentifierStart
  = Letter // should be UnicodeLetter to be fully ECMAScript compliant - cf. PEGS JS Grammar
  / "$"    // underscore is not supported as first letter

IdentifierPart
  = IdentifierStart / Digit

Letter
  = [a-zA-Z]

Digit
  = [0-9]

/* Tokens */

BreakToken      = "break"      !IdentifierPart
CaseToken       = "case"       !IdentifierPart
CatchToken      = "catch"      !IdentifierPart
ClassToken      = "class"      !IdentifierPart
ConstToken      = "const"      !IdentifierPart
ContinueToken   = "continue"   !IdentifierPart
DebuggerToken   = "debugger"   !IdentifierPart
DefaultToken    = "default"    !IdentifierPart
DeleteToken     = "delete"     !IdentifierPart
DoToken         = "do"         !IdentifierPart
ElseToken       = "else"       !IdentifierPart
EnumToken       = "enum"       !IdentifierPart
ExportToken     = "export"     !IdentifierPart
ExtendsToken    = "extends"    !IdentifierPart
FalseToken      = "false"      !IdentifierPart
FinallyToken    = "finally"    !IdentifierPart
ForToken        = "for"        !IdentifierPart
FunctionToken   = "function"   !IdentifierPart
GetToken        = "get"        !IdentifierPart
IfToken         = "if"         !IdentifierPart
ImportToken     = "import"     !IdentifierPart
InstanceofToken = "instanceof" !IdentifierPart
InToken         = "in"         !IdentifierPart
NewToken        = "new"        !IdentifierPart
NullToken       = "null"       !IdentifierPart
ReturnToken     = "return"     !IdentifierPart
SetToken        = "set"        !IdentifierPart
SuperToken      = "super"      !IdentifierPart
SwitchToken     = "switch"     !IdentifierPart
ThisToken       = "this"       !IdentifierPart
ThrowToken      = "throw"      !IdentifierPart
TrueToken       = "true"       !IdentifierPart
TryToken        = "try"        !IdentifierPart
TypeofToken     = "typeof"     !IdentifierPart
VarToken        = "var"        !IdentifierPart
VoidToken       = "void"       !IdentifierPart
WhileToken      = "while"      !IdentifierPart
WithToken       = "with"       !IdentifierPart

ReservedWord
  = Keyword / FutureReservedWord / NullLiteral / BooleanLiteral

Keyword
  = BreakToken
  / CaseToken
  / CatchToken
  / ContinueToken
  / DebuggerToken
  / DefaultToken
  / DeleteToken
  / DoToken
  / ElseToken
  / FinallyToken
  / ForToken
  / FunctionToken
  / IfToken
  / InstanceofToken
  / InToken
  / NewToken
  / ReturnToken
  / SwitchToken
  / ThisToken
  / ThrowToken
  / TryToken
  / TypeofToken
  / VarToken
  / VoidToken
  / WhileToken
  / WithToken

FutureReservedWord
  = ClassToken
  / ConstToken
  / EnumToken
  / ExportToken
  / ExtendsToken
  / ImportToken
  / SuperToken

NewToken = "new" !IdentifierPart

NullLiteral
  = NullToken
  {return { type: "nullliteral", value: null }; }

BooleanLiteral
  = TrueToken  { return { type: "booleanliteral", value: true  }; }
  / FalseToken { return { type: "booleanliteral", value: false }; }

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
  = name:Identifier { return { type: "Variable", name: name, code:name }; }
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

MemberExpression
  = base:(
          PrimaryExpression
        / NewToken __ callee:MemberExpression __ args:Arguments {
          return { type: "NewExpression", callee: callee, arguments: args };
        }
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
      result.code=base.code
      if (accessors.length) {
        var acc;
        for (var i=0, sz=accessors.length;sz>i;i++) {
          acc=accessors[i];
          if (acc.code) {
            accessors[i]=acc.code;
          }
        }
        result.code+="."+accessors.join(".");
      }
      return result;
    }

NewExpression
  = MemberExpression
  / NewToken " " __ callee:NewExpression {
    return { type: "NewExpression", callee: callee, arguments: [] };
  }

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
  = VoidToken
  / TypeofToken
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
  / InstanceofToken
  / InToken

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
  / InstanceofToken

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
  = head:BitwiseXORExpression
    tail:(__ LogicalANDOperator __ BitwiseXORExpression)* { // changes here: was BitwiseORExpression
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
  = head:BitwiseXORExpressionNoIn
    tail:(__ LogicalANDOperator __ BitwiseXORExpressionNoIn)* { // changes here: was BitwiseORExpressionNoIn
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
