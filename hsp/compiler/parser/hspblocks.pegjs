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
  = blocks:(TemplateBlock / ScriptBlock / TopLevelCommentBlock / TopLevelWhitespace)*
  {
   return blocks;
  }

TopLevelWhitespace "whitespace"
  = lines:(chars:WhiteSpace* eol:EOL {return chars.join("") + eol})+
    {return {type:"plaintext", value:lines.join('')}}

TopLevelCommentBlock "HTML comment"
 = block:HTMLCommentBlock _ eol:(EOL / EOF)
  {
    block.type = "toplevelcomment"; // to differentiate it from a comment inside a template
    block.value = block.value + (eol || "");
    return block;
  }

ScriptBlock "script block"
  = (_ "<script>" eol1:EOL? content:ScriptContentBlock "</script>" _ eol2:(EOL / EOF))
  {
    content.value = (eol1 || "") + content.value + (eol2 || "");
    return content;
  }

ScriptContentBlock
  = lines:(!(_ "</script") chars:[^\n\r]* eol:EOL {return chars.join("")+eol})+
  {return {type:"plaintext", value:lines.join('')}}

TemplateBlock "template block"
  = start:TemplateStart content:TemplateContent? end:TemplateEnd?
  {
    start.content=content;
    if (end) {start.closed=true;start.endLine=end.line};
    return start;
  }

TemplateStart "template statement"
  = _ "<template" parsedAtts:TemplateElementAttributes? _ closing:(">")? _ EOL
  {
    var errors = [];
    var attNamesCount = {};  // count attributes to avoid duplicates
    var attMap = {};        // { attrib1 : ..., attrib2: ...}
    var acceptedAttribs = ['id', 'args', 'ctrl', 'export', 'export-module'];

    // To be used in error messages.
    // Note that we're rebuilding code from partials, so it may differ when compared with real code
    // when it comes to spacing etc.
    var code = "<template";

    var templateId = null;
    var modifier = null;
    var controller = null;
    var controllerRef = null;
    var args = [];

    for (var i = 0; i < parsedAtts.length; i++) {
        var att = parsedAtts[i];

        if (att.type == "invalidtplarg") {
            errors.push("unexpected character: '" + att.invalidTplArg + "'");
            code += att.invalidTplArg;
        } else if (att.type == "invalidattribute") {
            for (var k = 0; k < att.errors.length; k++) {
                // att.errors foreach, line, column
                var err = att.errors[k];
                if (err.errorType == "name") {
                    errors.push("invalid attribute name: unexpected character(s) found in '" + err.value + "'");
                } else if (err.errorType = "tail") {
                    errors.push("unexpected character '" + err.tail + "' found at the end of attribute value");
                } else {
                    errors.push("invalid attribute: " + err.type + ":" + err.value);
                }
            }
            code += " " + att.code;
        } else {
            var attName = att.name;
            attNamesCount[attName] = (attNamesCount[attName] || 0) + 1 ;
            attMap[attName] = att ;

            var codeChunk = " " + att.name;
            if (att.type == "attribute") {
                // foo     => ""
                // foo=""  => []
                // foo="x" => [{"value":"x"}]
                if (att.value) {
                    var valueOfAtt = att.value[0] ? att.value[0].value : "";
                    codeChunk += ('="' + valueOfAtt + '"');
                }
                code += codeChunk;
            } else if (att.type == "tpl-arguments") {
                code += " " + att.name + '="' + att.args.join(",") + '"';
            } else if (att.type == "tpl-controller") {
                code += " " + att.name + '="' + att.controller.code + " as " + att.controllerRef + '"';
            }
        }
    }

    if (!closing) {
        errors.push("missing closing brace for <template");
    } else {
        code += ">";
    }

    for (var attName in attNamesCount) {
        // prevent <template unknown-attribute="value">
        if (acceptedAttribs.indexOf(attName) == -1) {
            errors.push("invalid template attribute: " + attName);
        }

        // prevent <template id="foo" id="bar">
        if (attNamesCount[attName] > 1) {
            errors.push("duplicated template attribute: " + attName);
        }
    }

    // each template needs a unique id; uniqueness is checked at later stage
    if (!attMap ["id"] ) {
        errors.push("missing mandatory template id");
    } else {
        templateId = attMap["id"].value[0].value;
    }

    // 'ctrl' and 'args' do not make sense together
    if (attMap["ctrl"] && attMap["args"]) {
        errors.push("a template can not have both 'args' and 'ctrl' attributes");
    }

    // if 'args' or 'ctrl' have type === 'attribute', they were matched using standard HTML attrib matching rule
    // instead of the specialized rules for maching 'args' / 'ctrl' (TemplateCtrlAttribute / TemplateArgsAttribute)
    // => that means the value provided was invalid
    if (attMap["args"]) {
        var att = attMap["args"];
        if (att.type === "tpl-arguments" && Array.isArray(att.args) && att.args.length === 0) {
            // let's forbid empty args for consistency with ctrl;
            // set appropriate type and value to have error handling consistent with that of ctrl
            attMap["args"] = {
               type : "attribute",
               value : []
            }
        }

        if (attMap["args"].type !== "tpl-arguments") {
            var value = attMap["args"].value;
            if (value === "") {
                value = "[empty value]";
            } else if (Array.isArray(value) && value.length === 0) {
                value = "[empty string]";
            } else {
                value = value[0].value;
            }
            errors.push("invalid value of 'args' attribute: " + value);
        } else {
            args = attMap["args"].args;
        }
    }

    // ctrl     => ""
    // ctrl=""  => []
    // ctrl="x" => [{"value":"x"}]
    if (attMap["ctrl"]) {
        if (attMap["ctrl"].type !== "tpl-controller") {
            var value = attMap["ctrl"].value;
            if (value === "") {
                value = "[empty value]";
            } else if (Array.isArray(value) && value.length === 0) {
                value = "[empty string]";
            } else {
                value = value[0].value;
            }
            errors.push("invalid value of 'ctrl' attribute: " + value);
        } else {
            controller = attMap["ctrl"].controller;
            controllerRef = attMap["ctrl"].controllerRef;
        }
    }

    // export also has to be either empty, or contain a valid identifier, which can not clash with
    // an id of another template (checked at later stage)
    if (attMap["export"] && attMap["export-module"]) {
        errors.push("a template can not have both 'export' and 'export-module' attributes");
    }

    // prevent 'export-module="foo"' which doesn't make sense and may confuse users
    if (attMap["export-module"] && attMap["export-module"].value) {
        errors.push("the 'export-module' attribute must not have a value");
    }

    if (attMap["export"]) {
        var exportedValue = attMap["export"].value;
        if (Array.isArray(exportedValue) && exportedValue.length > 0) {
            exportedValue = exportedValue[0].value;
        } else {
            exportedValue = null;
        }
        modifier = {
            type : "export",
            exportName : exportedValue
        };
    } else if (attMap["export-module"]) {
        modifier = {
            type: "export-module"
        }
    }

    if (errors && errors.length > 0) {
        return {type:"invalidtemplate", suberrors:errors, code:code, line:line(), column:column()/*, parsedAtts:parsedAtts*/}
    }

    return {type:"template", name:templateId, controller:controller, controllerRef:controllerRef, args:args,
      modifier:modifier, /*attributes:parsedAtts,*/ line:line(), column:column()}
  }

TemplateElementAttributes // modeled after HTMLElementAttributes
  = atts:( (S att:(TemplateAttribute)){return att} / att:InvalidTplArgs {return att})*

TemplateAttribute // equivalent to HTMLAttribute
  = TemplateCtrlAttribute / TemplateArgsAttribute / HTMLAttribute

// TemplateCtrlAttribute and TemplateArgsAttribute are modeled after HTMLAttribute
TemplateCtrlAttribute "template controller definition"
  = "ctrl" _ "=" _ "\"" _ ctrl:JSObjectRef _ "as" _ ref:Identifier _ "\""
  {
    return {type:"tpl-controller", name:"ctrl", controller:ctrl, controllerRef:ref, line:line(), column:column()}
  }

TemplateArgsAttribute "template arguments"
  = "args" _ "=" _ "\"" _ first:VarIdentifier? others:((_ "," _ arg:VarIdentifier) {return arg})* _ "\""
  {
    var args = first ? [first] : [];
    if (others && others.length > 0) {
      args = args.concat(others);
    }
    return {type:"tpl-arguments", name:"args", args:args, line:line(), column:column()}
  }

InvalidTplArgs
  = _ !">" chars:[^\n\r]+ &EOL
  {return {type:"invalidtplarg", invalidTplArg:chars.join('')}}

TemplateEnd "template end statement"
  = _ "</template" _ ">" _ (EOL / EOF)
  {return {type:"/template",line:line(),column:column()}}

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
  {return {type:"text", value:chars.join(''), line:line(), column:column()}}

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
  {return {type:"invalidblock", code:chars.join(''), line:line(), column:column()}}

IfBlock "if statement"
  = "{" _ "if " _ expr:(IfCondWithBrackets / CoreExpText) _ "}" EOS?
  {return {type:"if", condition:expr, line:line(), column:column()}}

IfCondWithBrackets
  = "(" expr:CoreExpText ")" {return expr}

ElseIfBlock "elseif statement"
  = "{" _ "else " _ "if" _ expr:(IfCondWithBrackets / CoreExpText) _ "}" EOS?
  {return {type:"elseif", condition:expr, line:line(), column:column()}}

ElseBlock
  = "{" _ "else" _ "}" EOS?
  {return {type:"else", line:line(), column:column()}}

EndIfBlock
  = "{" _ "/if" _ "}" EOS?
  {return {type:"endif", line:line(), column:column()}}

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
  {return {type:"foreach", item:args.item, key:args.key, colref:args.colref, line:line(), column:column()}}

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
  {return {type:"endforeach", line:line(), column:column()}}

HTMLElement
  = "<" !(_ "template") name:HTMLName  atts:HTMLElementAttributes? S? end:"/"? ">" EOS?
  {return {type:"element", name:name, closed:(end!=null), attributes:atts, line:line(), column:column()}}

HTMLElementAttributes
  = atts:((S att:(HTMLAttribute)) {return att})*

EndHTMLElement // TODO support comments inside Element
  = "</" !(_ "template") name:HTMLName S? ">" EOS?
  {return {type:"endelement", name:name, line:line(), column:column()}}

HspComponent
  = "<#" ref:JSObjectRef  atts:HTMLElementAttributes? S? end:"/"? ">" EOS?
  {return {type:"component", ref:ref, closed:(end!=null), attributes:atts, line:line(), column:column()}}

EndHspComponent
  = "</#" ref:JSObjectRef S? ">" EOS?
  {return {type:"endcomponent", ref:ref, line:line(), column:column()}}

HspCptAttribute
  = "<@" ref:VarIdentifier  atts:HTMLElementAttributes? S? end:"/"? ">" EOS?
  {return {type:"cptattribute", name:ref, closed:(end!=null), attributes:atts, line:line(), column:column()}}

EndHspCptAttribute
  = "</@" ref:VarIdentifier S? ">" EOS?
  {return {type:"endcptattribute", name:ref, line:line(), column:column()}}

InvalidHTMLElement
  = "<" !(_ "/template" _ ">") code:[^\r\n]* EOL
  {return {type:"invalidelement", code:'<'+code.join(''), line:line(), column:column()}}

HTMLName
  = first:[a-z] next:([a-z] / [0-9] / "-")*
  {return first + next.join("");}

HTMLAttName
  = first:[a-zA-Z#] next:([a-zA-Z] / [0-9] / "-" / "_")* endString:(":" end:([a-zA-Z] / [0-9] / "-" / "_")+ {return ":" + end.join("")})?
  // uppercase chars are considered as error in the parse post-processor
  {return first + next.join("") + (endString?endString:"");}

HTMLAttribute
  = !"<" attName:(
      (n:HTMLAttName tail:HTMLAttributeStringChars* {return {name:n, tail:tail};})
      /(n2:HTMLAttributeStringChars+ {return {name:n2.join('')};})
    )
    v:(_ "=" _ value:HTMLAttributeQuoted tail:HTMLAttributeStringChars* {return {value:value, tail:tail};})?
    v2:(_ "=" _ value:InvalidHTMLAttributeValueWithoutQuotes {return value;})?
    &(S / EOL / ">" / "/")
  {
    var isValueValid = true;
    for (var i = 0; v && v.value && i < v.value.length; i++) {
      var item = v.value[i];
      if (item.type === "error") {
        isValueValid = false;
      }
    }
    if (attName.tail && attName.tail.length === 0 && isValueValid && v2 == null && (v == null || v.tail && v.tail.length === 0)) {
      return {type: "attribute", name:attName.name, value:v==null?"":v.value, line:line(), column:column()}
    }
    else {
      var errors = [];
      var code;
      if (typeof attName.tail === "undefined" || attName.tail && attName.tail.length) {
        var tailStr = (attName.tail && attName.tail.length > 0 ? attName.tail.join('') : "");
        var nameStr = attName.name + tailStr;
        errors.push({errorType: "name", value: nameStr, line: line(), column: column()});
        code = nameStr;
      } else {
        code = attName.name;
      }

      if (!isValueValid) {
        errors.push({errorType: "value", value: v.value});
      }
      if (v != null && v.tail && v.tail.length > 0) {
        errors.push({errorType: "tail", value: v.value, tail: v.tail.join('')});
      }
      if (v2 != null && v2.value && v2.value.length > 0) {
        errors.push({errorType: "invalidquotes", value: v2.value, line: v2.line, column: v2.column});
      }
      if (v && v.value && v.value[0]) {
        code += '="' + v.value[0].value + '"';
        if (v.tail) {
            code += v.tail.join('');
        }
      } else if (v2) {
        code += v2.value;
      }
      return {type: "invalidattribute", code:code, errors : errors};
    }
  }

HTMLAttributeQuoted
  = '"' value:(HTMLAttributeTextDoubleQuoted / ExpressionTextBlock / InvalidHTMLAttributeValueWithinDoubleQuotes)* '"'
    {return value;}
  / "'" value:(HTMLAttributeTextSingleQuoted / ExpressionTextBlock / InvalidHTMLAttributeValueWithinSingleQuotes)* "'"
    {return value;}

HTMLAttributeTextDoubleQuoted
  = chars:(
      "\\{" {return "\u007B"}  // { = \u007B
      / "\\\"" {return "\""}
      / EOL {return "\\n"}
      / [^{\"]
    )+
  {return {type:"text", value:chars.join(''), line:line(), column:column()}}

HTMLAttributeTextSingleQuoted
  = chars:(
      "\\{" {return "\u007B"}  // { = \u007B
      / "\\\'" {return "\'"}
      / EOL {return "\\n"}
      / [^{\']
    )+
  {return {type:"text", value:chars.join(""), line:line(), column:column()}}

InvalidHTMLAttributeValueWithinDoubleQuotes
  = chars:[^\"\n\r]+
  {return {type:"error", value:chars.join(''), line:line(), column:column()}}

InvalidHTMLAttributeValueWithinSingleQuotes
  = chars:[^'\n\r]+
  {return {type:"error", value:chars.join(''), line:line(), column:column()}}

InvalidHTMLAttributeValueWithoutQuotes
  = chars:HTMLAttributeStringChars+
  {return {value:chars.join(''), line:line(), column:column()}}

HTMLAttributeStringChars
 = [^=\t\v\f \u00A0\uFEFF\n\r/>]

LogBlock
  = "{" _ "log " _ first:CoreExpText _ next:("," _ CoreExpText)* _"}" EOS?
  {
    var exprs=[first];
    if (next) {
      for (var i=0, sz=next.length;sz>i;i++) {
        exprs.push(next[i][2]);
      }
    }
    return {type:"log", exprs:exprs, line:line(), column:column()};
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
    return {type:"let",assignments:asn, line:line(), column:column()}
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
            "line": line(),
            "column": column()
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
    r.bound=(ubflag == null);
    r.line=line();
    r.column=column();
    r.type="expression";
    r.category="jsexptext";
    r.value = e.value;
    return r;
  }

InvalidExpressionValue
  = !("/template" _) chars:[^}]+
  {return {type:"invalidexpression", code:chars.join(''), line:line(), column:column()}}

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
