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
  = lines:(!(_ ("<") _ "template") !(_ ("<") _ [a-zA-Z0-9]+ _ "template") !("#" _ "require") chars:[^\n\r]* eol:EOL {return chars.join("")+eol})+
  {return {type:"plaintext", value:lines.join('')}}

TemplateBlock "template block"
  = start:TemplateStart content:TemplateContent? end:TemplateEnd?
  {
    start.content=content;
    if (end) {start.closed=true;start.endLine=end.line;};
    return start;
  }

TemplateStart "template statement"
  = _ d1:("<") p:_ m:(("template") / (c:[a-zA-Z0-9]+ _ "template") {return c.join('')})
    S+ name:Identifier args:(TemplateController / ArgumentsDefinition / invarg:InvalidTplArgs)? _ d2:(">")? EOL
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
      if ((d1 === "<" && d2 !==">")) {
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
  = _ !">" chars:[^\n\r]+ &EOL
  {return {invalidTplArg:chars.join('')}}

TemplateEnd "template end statement"
  = _ "</template" _ ">" _ (EOL / EOF)
  {return {type:"/template",line:line,column:column}}

TemplateContent "template content"
  = _ blocks:(  TplTextBlock
                / CommentBlock / HTMLCommentBlock
                / IfBlock / ElseIfBlock / ElseBlock / EndIfBlock
                / ForeachBlock / EndForeachBlock
                / HTMLElement / EndHTMLElement
                / HspComponent / EndHspComponent
                / HspCptAttribute / EndHspCptAttribute
                / LetBlock
                / LogBlock
                / ExpressionTextBlock
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
  = "{" _ "if " _ expr:(IfCondWithBrackets / CoreExpText) _ "}" EOS?
  {return {type:"if", condition:expr, line:line, column:column}}

IfCondWithBrackets
  = "(" expr:CoreExpText ")" {return expr}

ElseIfBlock "elseif statement"
  = "{" _ "else " _ "if" _ expr:(IfCondWithBrackets / CoreExpText) _ "}" EOS?
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
  = item:VarIdentifier " " _ "in " _ col:CoreExpText
  {return {item:item, key:item+"_key", colref:col}}

ForeachArgs2
  = key:VarIdentifier _ "," _ item:VarIdentifier " " _ "in " _ col:CoreExpText
  {return {item:item, key:key, colref:col}}

EndForeachBlock
  = "{" _ "/foreach" _ "}"
  {return {type:"endforeach", line:line, column:column}}

HTMLElement
  = "<" !(_ "template") name:HTMLName  atts:HTMLElementAttributes? S? end:"/"? ">" EOS?
  {return {type:"element", name:name, closed:(end!==""), attributes:atts, line:line, column:column}}

HTMLElementAttributes
  = atts:((S att:(HTMLAttribute)) {return att})*

EndHTMLElement // TODO support comments inside Element
  = "</" !(_ "template") name:HTMLName S? ">" EOS?
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
  = "<" !(_ "/template" _ ">") code:[^\r\n]* EOL
  {return {type:"invalidelement", code:'<'+code.join(''), line:line, column:column}}

HTMLName
  = first:[a-z] next:([a-z] / [0-9] / "-")*
  {return first + next.join("");}

HTMLAttName
  = first:[a-zA-Z#] next:([a-zA-Z] / [0-9] / "-")* endString:(":" end:([a-zA-Z] / [0-9] / "-")+ {return ":" + end.join("")})?
  // uppercase chars are considered as error in the parse post-processor
  {return first + next.join("") + endString;}

HTMLAttribute
  = name:HTMLAttName v:(_ "=" _ "\"" value:HTMLAttributeValue "\"" {return value;})?
  {
    return {type:"attribute", name:name, value:v, line:line, column:column}
  }

HTMLAttributeValue
  = (HTMLAttributeText / ExpressionTextBlock)*

HTMLAttributeText
  = chars:HTMLAttributeChar+
  {return {type:"text", value:chars.join('')}}

HTMLAttributeChar // TODO look at W3C specs
  =   "\\{" {return "\u007B"}  // { = \u007B
    / "\\\"" {return "\""}
    / EOL {return "\\n"}
    / [^{\"]

LogBlock
  = "{" _ "log " _ first:CoreExpText _ next:("," _ CoreExpText)* _"}" EOS?
  {
    var exprs=[first];
    if (next) {
      for (var i=0, sz=next.length;sz>i;i++) {
        exprs.push(next[i][2]);
      }
    }
    return {type:"log", exprs:exprs, line:line, column:column};
  }

LetBlock
  = "{" _ "let " _ first:CoreExpText __ next:("," __ CoreExpText)* "}" EOS?
  {
    var asn=[first];
    if (next) {
      for (var i=0, sz=next.length;sz>i;i++) {
        asn.push(next[i][2]);
      }
    }
    return {type:"let",assignments:asn, line:line, column:column}
  }

CoreExpText
  =  c: (CoreExpTextNoBrackets
       / CoreExpTextInCurly
       / CoreExpTextInBrackets
       / InvalidCoreExpText
     )+
     {
        return {
            "category": "jsexptext",
            "value": c.join(''),
            "line": line,
            "column": column
        };
     }

CoreExpTextNoBrackets
 = !"/template" c:[^{}()]+ {return c.join('')}

CoreExpTextInCurly
 = c:("{" (exp:CoreExpText? {return exp !==null ? exp.value : ''}) "}") {return c.join('')}

CoreExpTextInBrackets
 = c:("(" (exp:CoreExpText? {return exp !==null ? exp.value : ''}) ")") {return c.join('')}

InvalidCoreExpText
 = c:([{(] (exp:CoreExpText? {return exp !==null ? exp.value : ''})) {return c.join('')}

ExpressionTextBlock
  = "{" ubflag:":"? __ e:CoreExpText "}"
  {
    var r={};
    r.bound=(ubflag.length==0);
    r.line=line;
    r.column=column;
    r.type="expression";
    r.category="jsexptext";
    r.value = e.value;
    return r;
  }

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
