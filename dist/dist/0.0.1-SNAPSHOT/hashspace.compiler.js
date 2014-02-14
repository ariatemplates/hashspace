require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"5lNCN0":[function(require,module,exports){
(function (global){
(function browserifyShim(module, define) {
exports.readFileSync=function(){return "/*\n * Partial grammar for hashspace that separates all statement or html element blocks\n * and return it as an Array\n * \n * The last part of this file corresponds to fragments of the JavaScript grammar \n * written by David Majda (minor modifications have been added to cope \n * with hashspace constraints)\n * @see https://github.com/dmajda/pegjs\n */\n\nTemplateFile\n  = blocks:(TemplateBlock / TextBlock)*  /*(RequireBlock / TemplateBlock / TextBlock)* */\n  {return blocks;}\n\nTextBlock\n  = lines:(!(\"#\" _ \"template\") !(\"#\" _ [a-zA-Z0-9]+ _ \"template\") !(\"#\" _ \"require\") chars:[^\\n\\r]* eol:EOL {return chars.join(\"\")+eol})+ \n  {return {type:\"plaintext\", value:lines.join('')}}\n\nRequireBlock \"require block\" // TODO: finalize!\n  = _ \"# \" _ \"require\" _ (EOL / EOF) \n  {return {type:\"require\"}}\n\nTemplateBlock \"template block\"\n  = start:TemplateStart content:TemplateContent? end:TemplateEnd? \n  {\n    start.content=content;\n    if (end) {start.closed=true;start.endLine=end.line;};\n    return start;\n  }\n\nTemplateStart \"template statement\"\n  = _ \"# \" _ m:((\"template\") / (c:[a-zA-Z0-9]+ _ \"template\") {return c.join('')})\n    S+ name:Identifier args:(TemplateController / ArgumentsDefinition / invarg:InvalidTplArgs)? _  EOL \n  {\n    var mod=\"\"; // modifier (e.g. \"export\")\n    if (m!==\"template\") {\n      mod=m;\n    }\n    if (args && args.invalidTplArg) {\n      if (mod) {\n        mod+=\" \";\n      }\n      return {type:\"invalidtemplate\", line:line, column:column, code: \"# \"+mod+\"template \"+name+\" \"+args.invalidTplArg}\n    } else {\n      if (args && args.ctl && args.constructor!==Array) {\n        // this template uses a controller\n        return {type:\"template\", name:name, mod:mod, controller:args.ctl, controllerRef: args.ctlref, line:line, column:column}\n      }\n      return {type:\"template\", name:name, mod:mod, args:(args==='')? []:args, line:line, column:column}\n    }\n  }\n\nTemplateController \"controller\"\n  = S+ \"using\" S+ ref:Identifier _ \":\" _ ctl:JSObjectRef\n  {return {ctl:ctl, ctlref:ref}}\n\nArgumentsDefinition \"arguments\"\n  = _ \"(\" _ first:VarIdentifier? others:((_ \",\" _ arg:VarIdentifier) {return arg})* _ \")\" \n  {var args = first ? [first] : []; if (others && others.length) args=args.concat(others);return args;}\n\nInvalidTplArgs\n  = _ chars:[^\\n\\r]+ &EOL\n  {return {invalidTplArg:chars.join('')}}\n\nTemplateEnd \"template end statement\"\n  = _ \"# \" _ \"/template\" _ (EOL / EOF) \n  {return {type:\"/template\",line:line,column:column}} \n\nTemplateContent \"template content\" // TODO: CSSClassExpression\n  = _ blocks:(  TplTextBlock \n                / CommentBlock / HTMLCommentBlock\n                / IfBlock / ElseIfBlock / ElseBlock / EndIfBlock \n                / ForeachBlock / EndForeachBlock\n                / HTMLElement / EndHTMLElement\n                / HspComponent / EndHspComponent\n                / HspCptAttribute / EndHspCptAttribute\n                / LogBlock\n                / ExpressionBlock\n                / InvalidHTMLElement\n                / InvalidBlock)* \n  {return blocks}\n\nTplTextBlock \"text\"\n  = chars:(TplTextChar)+ \n  {return {type:\"text\", value:chars.join(''), line:line, column:column}}\n\nTplTextChar \"text character\"\n  = \"\\\\{\" {return \"\\u007B\"}       // { = \\u007B\n  / \"\\\\}\" {return \"\\u007D\"}       // } = \\u007D\n  / \"\\\\n\" {return \"\\n\"}\n  / EOL &TemplateEnd {return \"\"}  // ignore last EOL\n  / EOL _ {return \" \"}\n  / \"#\" !(_ \"\\/template\") {return \"#\"}\n  / \"\\/\" !\"/\" {return \"/\"}\n  / \"\\\\/\" {return \"/\"}\n  / \"\\\\//\" {return \"//\"}\n  / \"\\\\<\" {return \"<\"}\n  / [^{#/<]\n\nInvalidBlock\n  = \"{\" chars:[^{}#]* \"}\"\n  {return {type:\"invalidblock\", code:chars.join(''), line:line, column:column}}\n\nIfBlock \"if statement\"\n  = \"{\" _ \"if \" _ expr:HExpression _ \"}\" EOS?\n  {return {type:\"if\", condition:expr, line:line, column:column}}\n\nElseIfBlock \"elseif statement\" \n  = \"{\" _ \"else \" _ \"if\" _ expr:HExpression _ \"}\" EOS?\n  {return {type:\"elseif\", condition:expr, line:line, column:column}}\n\nElseBlock\n  = \"{\" _ \"else\" _ \"}\" EOS?\n  {return {type:\"else\", line:line, column:column}}\n\nEndIfBlock\n  = \"{\" _ \"/if\" _ \"}\" EOS?\n  {return {type:\"endif\", line:line, column:column}}\n\nCommentBlock\n  = _ \"\\/\\/\" chars:[^\\r\\n]* &EOL\n  {return {type:\"comment\", value:chars.join('')}}\n\nHTMLCommentBlock\n  = \"<!--\" chars:HTMLCommentChar* \"-->\"\n  {return {type:\"comment\", value:chars.join('')}}\n\nHTMLCommentChar\n  = !\"-\" \"-\" !\">\" {return \"-\"}\n    / \"-\" !\"->\" {return \"-\"}\n    / !\"--\" \">\" {return \">\"}\n    / [^>\\-]\n\nForeachBlock\n  = \"{\" _ \"foreach \" _ args:( ForeachArgs / (\"(\" _ a:ForeachArgs _ \")\") {return a}) _ \"}\" EOS?\n  {return {type:\"foreach\", item:args.item, key:args.key, colref:args.colref, line:line, column:column}}\n\nForeachArgs\n  = ForeachArgs1 / ForeachArgs2\n\nForeachArgs1\n  = item:VarIdentifier \" \" _ \"in \" _ col:JSObjectRef \n  {return {item:item, key:item+\"_key\", colref:col}}\n\nForeachArgs2\n  = key:VarIdentifier _ \",\" _ item:VarIdentifier \" \" _ \"in \" _ col:JSObjectRef \n  {return {item:item, key:key, colref:col}}\n\nEndForeachBlock\n  = \"{\" _ \"/foreach\" _ \"}\"\n  {return {type:\"endforeach\", line:line, column:column}}\n\nHTMLElement\n  = \"<\" name:HTMLName  atts:HTMLElementAttributes? S? end:\"/\"? \">\" EOS?\n  {return {type:\"element\", name:name, closed:(end!==\"\"), attributes:atts, line:line, column:column}}\n\nHTMLElementAttributes\n  = atts:((S att:(HTMLAttribute)) {return att})*\n\nEndHTMLElement // TODO support comments inside Element\n  = \"</\" name:HTMLName S? \">\" EOS?\n  {return {type:\"endelement\", name:name, line:line, column:column}}\n\nHspComponent\n  = \"<#\" ref:JSObjectRef  atts:HTMLElementAttributes? S? end:\"/\"? \">\" EOS?\n  {return {type:\"component\", ref:ref, closed:(end!==\"\"), attributes:atts, line:line, column:column}}\n\nEndHspComponent\n  = \"</#\" ref:JSObjectRef S? \">\" EOS?\n  {return {type:\"endcomponent\", ref:ref, line:line, column:column}}\n\nHspCptAttribute\n  = \"<@\" ref:VarIdentifier  atts:HTMLElementAttributes? S? end:\"/\"? \">\" EOS?\n  {return {type:\"cptattribute\", name:ref, closed:(end!==\"\"), attributes:atts, line:line, column:column}}\n\nEndHspCptAttribute\n  = \"</@\" ref:VarIdentifier S? \">\" EOS?\n  {return {type:\"endcptattribute\", name:ref, line:line, column:column}}\n\nInvalidHTMLElement\n  = \"<\" code:[^\\r\\n]* EOL\n  {return {type:\"invalidelement\", code:'<'+code.join(''), line:line, column:column}}\n\nHTMLName\n  = first:[a-z] next:([a-z] / [0-9] / \"-\")* \n  {return first + next.join(\"\");}\n\nHTMLAttName\n  = first:[a-zA-Z#] next:([a-zA-Z] / [0-9] / \"-\")* \n  // uppercase chars are considered as error in the parse post-processor\n  {return first + next.join(\"\");}\n\nHTMLAttribute\n  = name:HTMLAttName v:(_ \"=\" _ \"\\\"\" value:HTMLAttributeValue \"\\\"\" {return value;})?\n  {\n    return {type:\"attribute\", name:name, value:v, line:line, column:column}\n  }\n\nHTMLAttributeValue\n  = (HTMLAttributeText / ExpressionBlock)*\n\nHTMLAttributeText\n  = chars:HTMLAttributeChar+\n  {return {type:\"text\", value:chars.join('')}}\n\nHTMLAttributeChar // TODO look at W3C specs\n  =   \"\\\\{\" {return \"\\u007B\"}  // { = \\u007B\n    / \"\\\\\\\"\" {return \"\\\"\"}\n    / [^{\\\"\\n\\r]\n\nLogBlock\n  = \"{\" _ \"log \" _ first:HExpressionContent _ next:(\",\" _ HExpressionContent)* _\"}\" EOS?\n  {\n    var exprs=[first];\n    if (next) {\n      for (var i=0, sz=next.length;sz>i;i++) {\n        exprs.push(next[i][2]);\n      }\n    }\n    return {type:\"log\",exprs:exprs, line:line, column:column};\n  }\n\nExpressionBlock\n  = \"{\" ubflag:\":\"? e:HExpression* \"}\" // keep a list of expression to match expressions starting with a valid part\n  {\n    var r={};\n    if (e.length==1) {\n      r=e[0];\n      if (r.type!==\"invalidexpression\") {\n        r.expType=r.type; \n        r.type=\"expression\";\n      }\n      r.bound=(ubflag.length==0);\n      if (!r.category) {\n        r.category=\"jsexpression\";\n      }\n    } else {\n      var code=[], itm, valid=true, t;\n      for (var i=0, sz=e.length;sz>i;i++) {\n        t=e[i].type;\n        if (t===\"invalidexpression\") {\n          valid=false;\n          break;\n        }\n      }\n\n      if (valid) {\n        r.type=\"expression\";\n        r.category=\"jsexpression\";\n        r.expType=\"CssClassExpression\"\n        r.list=e;\n      } else {\n        // invalid expression\n        for (var i=0, sz=e.length;sz>i;i++) {\n          itm=e[i];\n          if (itm.value) {\n            code.push(itm.value);\n          } else if (itm.code) {\n            code.push(itm.code);\n          } else {\n            code.push(\"(...)\"); // TODO\n          }\n        }\n        r.type=\"expression\"; r.category=\"invalidexpression\"; r.code=code.join('');\n      }\n    }\n    r.line=line; \n    r.column=column;\n    return r;\n  }\n\nHExpression\n  =   HExpressionCssClassElt \n    / HExpressionContent \n    / \",\" __ cce:HExpressionCssClassElt {return cce}\n    / \",\" __ exp:HExpressionContent {return exp}\n    / InvalidExpressionValue\n\nHExpressionContent\n  =  ce:ConditionalExpressionNoIn\n  {if (!ce.category) ce.category=\"jsexpression\"; ce.expType=ce.type;ce.line=line;ce.column=column;return ce;}\n\nHExpressionCssClassElt\n  = head:LogicalORExpression __ \":\" __ tail:LogicalORExpression \n  {return {type:\"CssClassElement\", left:head, right:tail};}\n\nInvalidExpressionValue\n  = chars:[^}]+\n  {return {type:\"invalidexpression\", code:chars.join(''), line:line, column:column}}\n\n// White spaces\n    // mandatory padding including line breaks\nS \"white space\" \n  = empty:(WhiteSpace / \"\\u000D\" / \"\\u000A\")+\n\n_   // optional padding excluding line breaks\n  = WhiteSpace*\n\nWhiteSpace \"white space\"\n  = [\\t\\v\\f \\u00A0\\uFEFF]\n\nEOL \"end of line\"\n  = \"\\n\"\n  / \"\\r\\n\"\n  / \"\\r\"\n  / \"\\u2028\" // line separator\n  / \"\\u2029\" // paragraph separator\n\nEOS \"end of statement\" //\n  = empty:(_ EOL _)\n\nEOF \"end of file\"\n  = !.\n\n__ // changed\n  = (WhiteSpace / EOL / Comment)*\n\nComment \"comment\"\n  = MultiLineComment\n  / SingleLineComment\n\nMultiLineComment\n  = \"/*\" (!\"*/\" .)* \"*/\"\n\nSingleLineComment\n  = \"//\" (!EOL .)*\n\n// ################################################################################\n\nJSObjectRef \"JS object reference\"\n  = start:VarIdentifier tail:(( \".\" pp:Identifier) {return pp}/ ( \"[\" idx:[0-9]+ \"]\") {return parseInt(idx.join(''),10)})*\n  {var r=[start]; if (tail && tail.length) r=r.concat(tail);return {category:\"objectref\", path:r, code:r.join('.')}}\n\nJSLiteral\n  = NullLiteral       { return {type:\"expression\", category: \"null\", code:\"null\"};}\n  / v:BooleanLiteral  { return {type:\"expression\", category: \"boolean\", value:v.value, code:\"\"+v.value};}\n  / v:NumericLiteral  { return {type:\"expression\", category: \"number\", value: v, code:\"\"+v};}\n  / v:StringLiteral   { return {type:\"expression\", category: \"string\",  value: v, code:\"\"+v};}\n\n// ################################################################################\n/*!\n * The last part of this file is taken & modified from the JavaScript PEGjs grammar \n * by David Majda\n * https://github.com/dmajda/pegjs\n *\n * JavaScript parser based on the grammar described in ECMA-262, 5th ed.\n * (http://www.ecma-international.org/publications/standards/Ecma-262.htm)\n */\nSourceCharacter\n  = .\n\nIdentifier \"identifier\"\n  = !ReservedWord name:IdentifierName { return name; }\n\nIdentifierName \"identifier\"\n  = start:IdentifierStart parts:IdentifierPart* \n  {return start + parts.join(\"\");}\n\nIdentifierStart\n  = Letter // should be UnicodeLetter to be fully ECMAScript compliant - cf. PEGS JS Grammar\n  / \"$\"\n  / \"_\"\n\nVarIdentifier \"variable identifier\" // same as Identifer but without underscore as first letter\n  = !ReservedWord name:VarIdentifierName { return name; }\n\nVarIdentifierName \"identifier\"\n  = start:VarIdentifierStart parts:IdentifierPart* \n  {return start + parts.join(\"\");}\n\nVarIdentifierStart\n  = Letter // should be UnicodeLetter to be fully ECMAScript compliant - cf. PEGS JS Grammar\n  / \"$\"    // underscore is not supported as first letter\n\nIdentifierPart\n  = IdentifierStart / Digit\n\nLetter\n  = [a-zA-Z]\n\nDigit\n  = [0-9]\n\nReservedWord\n  = Keyword / FutureReservedWord / NullLiteral / BooleanLiteral\n\nKeyword\n  = (\n        \"break\"\n      / \"case\"\n      / \"catch\"\n      / \"continue\"\n      / \"debugger\"\n      / \"default\"\n      / \"delete\"\n      / \"do\"\n      / \"else\"\n      / \"finally\"\n      / \"for\"\n      / \"function\"\n      / \"if\"\n      / \"instanceof\"\n      / \"in\"\n      / \"new\"\n      / \"return\"\n      / \"switch\"\n      / \"this\"\n      / \"throw\"\n      / \"try\"\n      / \"typeof\"\n      / \"var\"\n      / \"void\"\n      / \"while\"\n      / \"with\"\n    )\n    !IdentifierPart\n\nFutureReservedWord\n  = (\n        \"class\"\n      / \"const\"\n      / \"enum\"\n      / \"export\"\n      / \"extends\"\n      / \"import\"\n      / \"super\"\n    )\n    !IdentifierPart\n\nNullLiteral\n  = \"null\" \n  {return { type: \"nullliteral\", value: null }; }\n\nBooleanLiteral\n  = \"true\"  { return { type: \"booleanliteral\", value: true  }; }\n  / \"false\" { return { type: \"booleanliteral\", value: false }; }\n\nNumericLiteral \"number\"\n  = literal:(HexIntegerLiteral / DecimalLiteral) !IdentifierStart \n  {return literal;}\n\nHexIntegerLiteral\n  = \"0\" [xX] digits:HexDigit+ \n  {return parseInt(\"0x\" + digits.join(\"\"));}\n\nHexDigit\n  = [0-9a-fA-F]\n\nDecimalLiteral\n  = before:DecimalIntegerLiteral \".\" after:DecimalDigits? exponent:ExponentPart? \n    {return parseFloat(before + \".\" + after + exponent);}\n  / \".\" after:DecimalDigits exponent:ExponentPart? \n    {return parseFloat(\".\" + after + exponent);}\n  / before:DecimalIntegerLiteral exponent:ExponentPart? \n    {return parseFloat(before + exponent);}\n\nDecimalIntegerLiteral\n  = \"0\" / digit:NonZeroDigit digits:DecimalDigits? \n  {return digit + digits;}\n\nDecimalDigits\n  = digits:DecimalDigit+ \n  {return digits.join(\"\");}\n\nDecimalDigit\n  = [0-9]\n\nNonZeroDigit\n  = [1-9]\n\nExponentPart\n  = indicator:ExponentIndicator integer:SignedInteger \n  {return indicator + integer;}\n\nExponentIndicator\n  = [eE]\n\nSignedInteger\n  = sign:[-+]? digits:DecimalDigits \n  {return sign + digits;}\n\nStringLiteral \"string\"\n  = parts:('\"' DoubleStringCharacters? '\"' / \"'\" SingleStringCharacters? \"'\") \n  {return parts[1];}\n\nDoubleStringCharacters\n  = chars:DoubleStringCharacter+ { return chars.join(\"\"); }\n\nSingleStringCharacters\n  = chars:SingleStringCharacter+ { return chars.join(\"\"); }\n\nDoubleStringCharacter\n  = !('\"' / \"\\\\\" / EOL) char_:SourceCharacter { return char_;     }\n  / \"\\\\\" sequence:EscapeSequence              { return sequence;  }\n\nSingleStringCharacter\n  = !(\"'\" / \"\\\\\" / EOL) char_:SourceCharacter { return char_;     }\n  / \"\\\\\" sequence:EscapeSequence              { return sequence;  }\n\nEscapeSequence\n  = CharacterEscapeSequence\n  / \"0\" !DecimalDigit { return \"\\0\"; }\n  / HexEscapeSequence\n  / UnicodeEscapeSequence\n\nCharacterEscapeSequence\n  = SingleEscapeCharacter\n  / NonEscapeCharacter\n\nSingleEscapeCharacter\n  = char_:['\"\\\\bfnrtv] {\n      return char_\n        .replace(\"b\", \"\\b\")\n        .replace(\"f\", \"\\f\")\n        .replace(\"n\", \"\\n\")\n        .replace(\"r\", \"\\r\")\n        .replace(\"t\", \"\\t\")\n        .replace(\"v\", \"\\x0B\") // IE does not recognize \"\\v\".\n    }\n\nNonEscapeCharacter\n  = (!EscapeCharacter / EOL) char_:SourceCharacter { return char_; }\n\nEscapeCharacter\n  = SingleEscapeCharacter\n  / DecimalDigit\n  / \"x\"\n  / \"u\"\n\nHexEscapeSequence\n  = \"x\" h1:HexDigit h2:HexDigit \n  {return String.fromCharCode(parseInt(\"0x\" + h1 + h2));}\n\nUnicodeEscapeSequence\n  = \"u\" h1:HexDigit h2:HexDigit h3:HexDigit h4:HexDigit \n  {return String.fromCharCode(parseInt(\"0x\" + h1 + h2 + h3 + h4));}\n\n\n/* ===== A.3 Expressions ===== */\n\nPrimaryExpression // changed \n  = name:Identifier { return { type: \"Variable\", name: name, code:name }; }\n  / JSLiteral\n  / ArrayLiteral\n  / ObjectLiteral\n  / \"(\" __ expression:Expression __ \")\" { return expression; }\n\nArrayLiteral\n  = \"[\" __ elements:ElementList? __ (Elision __)? \"]\" {\n      return {\n        type:     \"ArrayLiteral\",\n        elements: elements !== \"\" ? elements : []\n      };\n    }\n\nElementList\n  = (Elision __)?\n    head:AssignmentExpression\n    tail:(__ \",\" __ Elision? __ AssignmentExpression)* {\n      var result = [head];\n      for (var i = 0; i < tail.length; i++) {\n        result.push(tail[i][5]);\n      }\n      return result;\n    }\n\nElision\n  = \",\" (__ \",\")*\n\nObjectLiteral\n  = \"{\" __ properties:(PropertyNameAndValueList __ (\",\" __)?)? \"}\" {\n      return {\n        type:       \"ObjectLiteral\",\n        properties: properties !== \"\" ? properties[0] : []\n      };\n    }\n\nPropertyNameAndValueList\n  = head:PropertyAssignment tail:(__ \",\" __ PropertyAssignment)* {\n      var result = [head];\n      for (var i = 0; i < tail.length; i++) {\n        result.push(tail[i][3]);\n      }\n      return result;\n    }\n\nPropertyAssignment // changed\n  = name:PropertyName __ \":\" __ value:AssignmentExpression {\n      return {\n        type:  \"PropertyAssignment\",\n        name:  name,\n        value: value\n      };\n    }\n\nPropertyName\n  = IdentifierName\n  / StringLiteral\n  / NumericLiteral\n\nPropertySetParameterList\n  = Identifier\n\nMemberExpression // changed\n  = base:(\n        PrimaryExpression\n    )\n    accessors:(\n        __ \"[\" __ name:Expression __ \"]\" { return name; }\n      / __ \".\" __ name:IdentifierName    { return name; }\n    )* {\n      var result = base;\n      for (var i = 0; i < accessors.length; i++) {\n        result = {\n          type: \"PropertyAccess\",\n          base: result,\n          name: accessors[i]\n        };\n      }\n      result.code=base.code\n      if (accessors.length) {\n        var acc;\n        for (var i=0, sz=accessors.length;sz>i;i++) {\n          acc=accessors[i];\n          if (acc.code) {\n            accessors[i]=acc.code;\n          }\n        }\n        result.code+=\".\"+accessors.join(\".\");\n      }\n      return result;\n    }\n\nNewExpression // changed\n  = MemberExpression\n\nCallExpression\n  = base:(\n      name:MemberExpression __ arguments:Arguments {\n        return {\n          type:      \"FunctionCall\",\n          name:      name,\n          arguments: arguments\n        };\n      }\n    )\n    argumentsOrAccessors:(\n        __ arguments:Arguments {\n          return {\n            type:      \"FunctionCallArguments\",\n            arguments: arguments\n          };\n        }\n      / __ \"[\" __ name:Expression __ \"]\" {\n          return {\n            type: \"PropertyAccessProperty\",\n            name: name\n          };\n        }\n      / __ \".\" __ name:IdentifierName {\n          return {\n            type: \"PropertyAccessProperty\",\n            name: name\n          };\n        }\n    )* {\n      var result = base;\n      for (var i = 0; i < argumentsOrAccessors.length; i++) {\n        switch (argumentsOrAccessors[i].type) {\n          case \"FunctionCallArguments\":\n            result = {\n              type:      \"FunctionCall\",\n              name:      result,\n              arguments: argumentsOrAccessors[i].arguments\n            };\n            break;\n          case \"PropertyAccessProperty\":\n            result = {\n              type: \"PropertyAccess\",\n              base: result,\n              name: argumentsOrAccessors[i].name\n            };\n            break;\n          default:\n            throw new Error(\n              \"Invalid expression type: \" + argumentsOrAccessors[i].type\n            );\n        }\n      }\n      return result;\n    }\n\nArguments\n  = \"(\" __ arguments:ArgumentList? __ \")\" {\n    return arguments !== \"\" ? arguments : [];\n  }\n\nArgumentList\n  = head:AssignmentExpression tail:(__ \",\" __ AssignmentExpression)* {\n    var result = [head];\n    for (var i = 0; i < tail.length; i++) {\n      result.push(tail[i][3]);\n    }\n    return result;\n  }\n\nLeftHandSideExpression\n  = CallExpression\n  / NewExpression\n\nPostfixExpression\n  = expression:LeftHandSideExpression _ operator:PostfixOperator {\n      return {\n        type:       \"PostfixExpression\",\n        operator:   operator,\n        expression: expression\n      };\n    }\n  / LeftHandSideExpression\n\nPostfixOperator\n  = \"++\"\n  / \"--\"\n\nUnaryExpression\n  = PostfixExpression\n  / operator:UnaryOperator __ expression:UnaryExpression {\n      return {\n        type:       \"UnaryExpression\",\n        operator:   operator,\n        expression: expression\n      };\n    }\n\nUnaryOperator // changed\n  = \"void\"\n  / \"typeof\"\n  / \"++\"\n  / \"--\"\n  / \"+\"\n  / \"-\"\n  / \"~\"\n  /  \"!\"\n\nMultiplicativeExpression\n  = head:UnaryExpression\n    tail:(__ MultiplicativeOperator __ UnaryExpression)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nMultiplicativeOperator\n  = operator:(\"*\" / \"/\" / \"%\") !\"=\" { return operator; }\n\nAdditiveExpression\n  = head:MultiplicativeExpression\n    tail:(__ AdditiveOperator __ MultiplicativeExpression)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nAdditiveOperator\n  = \"+\" !(\"+\" / \"=\") { return \"+\"; }\n  / \"-\" !(\"-\" / \"=\") { return \"-\"; }\n\nShiftExpression\n  = head:AdditiveExpression\n    tail:(__ ShiftOperator __ AdditiveExpression)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nShiftOperator\n  = \"<<\"\n  / \">>>\"\n  / \">>\"\n\nRelationalExpression\n  = head:ShiftExpression\n    tail:(__ RelationalOperator __ ShiftExpression)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nRelationalOperator\n  = \"<=\"\n  / \">=\"\n  / \"<\"\n  / \">\"\n  / \"instanceof\"\n  / \"in\"\n\nRelationalExpressionNoIn\n  = head:ShiftExpression\n    tail:(__ RelationalOperatorNoIn __ ShiftExpression)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nRelationalOperatorNoIn\n  = \"<=\"\n  / \">=\"\n  / \"<\"\n  / \">\"\n  / \"instanceof\"\n\nEqualityExpression\n  = head:RelationalExpression\n    tail:(__ EqualityOperator __ RelationalExpression)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nEqualityExpressionNoIn\n  = head:RelationalExpressionNoIn\n    tail:(__ EqualityOperator __ RelationalExpressionNoIn)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nEqualityOperator\n  = \"===\"\n  / \"!==\"\n  / \"==\"\n  / \"!=\"\n\nBitwiseANDExpression\n  = head:EqualityExpression\n    tail:(__ BitwiseANDOperator __ EqualityExpression)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nBitwiseANDExpressionNoIn\n  = head:EqualityExpressionNoIn\n    tail:(__ BitwiseANDOperator __ EqualityExpressionNoIn)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nBitwiseANDOperator\n  = \"&\" !(\"&\" / \"=\") { return \"&\"; }\n\nBitwiseXORExpression\n  = head:BitwiseANDExpression\n    tail:(__ BitwiseXOROperator __ BitwiseANDExpression)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nBitwiseXORExpressionNoIn\n  = head:BitwiseANDExpressionNoIn\n    tail:(__ BitwiseXOROperator __ BitwiseANDExpressionNoIn)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nBitwiseXOROperator\n  = \"^\" !(\"^\" / \"=\") { return \"^\"; }\n\nBitwiseORExpression\n  = head:BitwiseXORExpression\n    tail:(__ BitwiseOROperator __ BitwiseXORExpression)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nBitwiseORExpressionNoIn\n  = head:BitwiseXORExpressionNoIn\n    tail:(__ BitwiseOROperator __ BitwiseXORExpressionNoIn)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nBitwiseOROperator\n  = \"|\" !(\"|\" / \"=\") { return \"|\"; }\n\nLogicalANDExpression\n  = head:BitwiseORExpression\n    tail:(__ LogicalANDOperator __ BitwiseORExpression)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nLogicalANDExpressionNoIn\n  = head:BitwiseORExpressionNoIn\n    tail:(__ LogicalANDOperator __ BitwiseORExpressionNoIn)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nLogicalANDOperator\n  = \"&&\" !\"=\" { return \"&&\"; }\n\nLogicalORExpression\n  = head:LogicalANDExpression\n    tail:(__ LogicalOROperator __ LogicalANDExpression)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nLogicalORExpressionNoIn\n  = head:LogicalANDExpressionNoIn\n    tail:(__ LogicalOROperator __ LogicalANDExpressionNoIn)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nLogicalOROperator\n  = \"||\" !\"=\" { return \"||\"; }\n\nConditionalExpression\n  = condition:LogicalORExpression __\n    \"?\" __ trueExpression:AssignmentExpression __\n    \":\" __ falseExpression:AssignmentExpression {\n      return {\n        type:            \"ConditionalExpression\",\n        condition:       condition,\n        trueExpression:  trueExpression,\n        falseExpression: falseExpression\n      };\n    }\n  / LogicalORExpression\n\n// This is the one we use in hashspace\nConditionalExpressionNoIn\n  = condition:LogicalORExpressionNoIn __\n    \"?\" __ trueExpression:AssignmentExpressionNoIn __\n    \":\" __ falseExpression:AssignmentExpressionNoIn {\n      return {\n        type:            \"ConditionalExpression\",\n        condition:       condition,\n        trueExpression:  trueExpression,\n        falseExpression: falseExpression\n      };\n    }\n  / LogicalORExpressionNoIn\n\n// Not used in hashspace\nAssignmentExpression\n  = left:LeftHandSideExpression __\n    operator:AssignmentOperator __\n    right:AssignmentExpression {\n      return {\n        type:     \"AssignmentExpression\",\n        operator: operator,\n        left:     left,\n        right:    right\n      };\n    }\n  / ConditionalExpression\n\nAssignmentExpressionNoIn\n  = left:LeftHandSideExpression __\n    operator:AssignmentOperator __\n    right:AssignmentExpressionNoIn {\n      return {\n        type:     \"AssignmentExpression\",\n        operator: operator,\n        left:     left,\n        right:    right\n      };\n    }\n  / ConditionalExpressionNoIn\n\nAssignmentOperator\n  = \"=\" (!\"=\") { return \"=\"; }\n  / \"*=\"\n  / \"/=\"\n  / \"%=\"\n  / \"+=\"\n  / \"-=\"\n  / \"<<=\"\n  / \">>=\"\n  / \">>>=\"\n  / \"&=\"\n  / \"^=\"\n  / \"|=\"\n\nExpression\n  = head:AssignmentExpression\n    tail:(__ \",\" __ AssignmentExpression)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n\nExpressionNoIn\n  = head:AssignmentExpressionNoIn\n    tail:(__ \",\" __ AssignmentExpressionNoIn)* {\n      var result = head;\n      for (var i = 0; i < tail.length; i++) {\n        result = {\n          type:     \"BinaryExpression\",\n          operator: tail[i][1],\n          left:     result,\n          right:    tail[i][3]\n        };\n      }\n      return result;\n    }\n"}
}).call(global, module, undefined);

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"fs":[function(require,module,exports){
module.exports=require('5lNCN0');
},{}],"F4GJtq":[function(require,module,exports){
var parser = require("./parser");
var klass = require("../klass");
var TreeWalker = require("./treeWalker").TreeWalker;
var processors = require("./processors");
var jsv = require("./jsvalidator/validator");

/**
 * Header added to all generated JS file
 */

var HEADER_ARR = [
        '// ################################################################ ',
        '//  This file has been generated by the hashspace compiler          ',
        '//  Direct MODIFICATIONS WILL BE LOST when the file is recompiled!  ',
        '// ################################################################ ',
        '', 'var hsp=require("hsp/rt");', ''];

var HEADER = module.exports.HEADER = HEADER_ARR.join('\r\n');
var HEADER_SZ = HEADER_ARR.length;

/**
 * Compile a template and return a JS compiled string and a list of errors
 * @param template {String} the template file content as a string
 * @param fileName {String} the name of the file being compiled (optional - used for error messages)
 * @param includeSyntaxTree {Boolean} if true, the result object will contain the syntax tree generated by the compiler
 * @param bypassJSvalidation {Boolean} if true, the validation of the generated JS file (including non-template code) is
 * bypassed - default:false
 * @return {JSON} a JSON structure with the following properties:
 *      errors: {Array} the error list - each error having the following structure:
 *          description: {String} - a message describing the error 
 *          line: {Number} - the error line number
 *          column: {Number} - the error column number 
 *          code: {String} - a code extract showing where the error occurs (optional)
 *      code: {String} the generated JavaScript code
 *      syntaxTree: {JSON} the syntax tree generated by the parser (optional - cf. parameters)
 *      lineMap: {Array} array of the new line indexes: lineMap[3] returns the new line index for line 4 in
 *          the orginal file (lineMap[0] is always 0 as all line count starts at 1 for both input and output values)
 */
exports.compile = function (template, path, includeSyntaxTree, bypassJSvalidation) {
    // Parsing might throw an exception
    var res = {};
    var m=path.match(/[^\/]+$/), fileName=m? m[0] : 'unknown', dirPath='';
    if (fileName.length<path.length) {
        dirPath=path.slice(0,-fileName.length);
    }


    if (!template) {
        res.errors = [{
            description : "[Hashspace compiler] template argument is undefined"
        }];
    } else {
        res = parser.parse(template);
    }

    res.code = '';

    if (!res.errors || !res.errors.length) {
        // I'm sure res is an array otherwise the parser would have thrown an exception
        var w = new TemplateWalker(fileName,dirPath);
        var out = w.walk(res.syntaxTree, processors);

        if (includeSyntaxTree === true) {
            res.codeFragments = w.templates;
        }

        res.code = HEADER + out.join('\r\n');
        res.errors = w.errors;

        generateLineMap(res, template);
    } else {
        // Generate a JS script to show the errors when the generated file is loaded
        res.code = HEADER;
    }

    if (!res.errors) {
        res.errors = [];
    } else if (res.errors.length > 0) {
        // remove all code so that script can still be loaded
        res.code = HEADER;
    }

    if (res.errors.length === 0 && bypassJSvalidation !== true) {
        // call the JS validator
        // we don't checke for JS errors when there are template errors as the code generated by the template may be
        // wrong
        var r = jsv.validate(res.code);
        if (!r.isValid) {
            // remove all code so that script can still be loaded
            res.code = HEADER;

            // translate error line numbers
            var err, ln, lm = res.lineMap;
            for (var i = 0, sz = r.errors.length; sz > i; i++) {
                err = r.errors[i];
                ln = err.line;

                err.line = -1; // to avoid sending a wrong line in case of pb
                for (var j = 0, sz2 = lm.length; sz2 > j; j++) {
                    if (lm[j] === ln) {
                        err.line = j; // original line nbr
                        break;
                    }
                }
            }

            Array.prototype.push.apply(res.errors, r.errors);
        }
    }

    res.code += getErrorScript(res.errors, fileName);

    if (includeSyntaxTree !== true) {
        res.syntaxTree = null;
    }

    return res;
};

/**
 * Generate an error script to include in the template compiled script in order to show errors in the browser when the
 * script is loaded
 */
function getErrorScript (errors, fileName) {
    var r = '';
    if (errors && errors.length) {
        r = ['\r\nrequire("hsp/rt").logErrors("', fileName, '",', JSON.stringify(errors, null), ');\r\n'].join("");
    }
    return r;
}

/**
 * Generate the line map of a compilatin result
 * @param {JSON} res the result object of a compilation - cf. compile function
 * @param {String} file the template file (before compilation)
 */
function generateLineMap (res, file) {
    if (res.errors && res.errors.length) {
        return;
    }
    var st = res.syntaxTree, templates = [];
    // identify the templates in the syntax tree
    for (var i = 0; st.length > i; i++) {
        if (st[i].type === 'template') {
            templates.push(st[i]);
        }
    }

    var nbrOfLinesInCompiledTemplate = 5;
    var lm = [], sz = file.split(/\n/g).length + 1, pos = HEADER_SZ, tpl;
    var pos1 = -1; // position of the next template start
    var pos2 = -1; // position of the next template end
    var tplIdx = -1; // position of the current template

    for (var i = 0; sz > i; i++) {
        if (i === 0 || i === pos2) {
            // end of current template: let's determine next pos1 and pos2
            tplIdx = (i === 0) ? 0 : tplIdx + 1;
            if (tplIdx < templates.length) {
                // there is another template
                tpl = templates[tplIdx];
                pos1 = tpl.startLine;
                pos2 = tpl.endLine;
                if (pos2 < pos1) {
                    // this case should never arrive..
                    pos2 = pos1;
                }
            } else {
                // last template has been found
                tplIdx = pos1 = pos2 = -1;
            }
            if (i === 0) {
                lm[0] = 0;
            }
            i++;
        }
        if (i === pos1) {
            for (var j = pos1, max = pos2 + 1; max > j; j++) {
                // all lines are set to the template start
                lm[i] = pos;
                i++;
            }
            pos += nbrOfLinesInCompiledTemplate;
            i -= 2; // to enter the i===pos2 clause at next step
        } else {
            lm[i] = pos;
            pos++;
        }
    }

    res.lineMap = lm;
}

/**
 * Walker object used to generate the template script and store some contextual information such as errors or scope..
 */
var TemplateWalker = klass({
    $extends : TreeWalker,
    $constructor : function (fileName,dirPath) {
        this.fileName=fileName;
        this.dirPath=dirPath;
        this.templates = {}; // used by processors to store intermediate values in order to ease testing
        this.globals={};     // global validation code for each template - used for unit testing
        this.errors = [];
        this.resetGlobalRefs();
        this.resetScope();
    },

    logError : function (description, errdesc) {
        var desc = {
            description : description
        };
        if (errdesc) {
            if (errdesc.line) {
                desc.line = errdesc.line;
                desc.column = errdesc.column;
            }
            if (errdesc.code) {
                desc.code = errdesc.code;
            }
        }
        this.errors.push(desc);
    },

    // reset the list of global variables that have been found since the last reset
    resetGlobalRefs : function () {
        this._globals=[];
        this._globalKeys={};
    },

    // add a global reference (e.g. "foo") to the current _globals list
    addGlobalRef : function (ref) {
        if (!this._globalKeys[ref]) {
            this._globals.push(ref);
            this._globalKeys[ref]=true;
        }
    },

    // reset the scope variables that are used to determine if a variable name is in the current scope
    resetScope : function () {
        this._scopes = [{}];
        this._scope = this._scopes[0];
    },

    addScopeVariable : function (varname) {
        this._scope[varname] = true;
    },

    rmScopeVariable : function (varname) {
        this._scope[varname] = null;
    },

    isInScope : function (varname) {
        if (varname === "scope") {
            return true; // scope is a reserved key word and is automatically created on the scope object
        }
        return this._scope[varname] ? true : false;
    },

    pushSubScope : function (vararray) {
        var newScope = Object.create(this._scope);
        for (var i = 0, sz = vararray.length; sz > i; i++) {
            newScope[vararray[i]] = true;
        }
        this._scopes.push(newScope);
        this._scope = this._scopes[this._scopes.length - 1];
    },

    popSubScope : function (varnames) {
        this._scopes.pop();
        this._scope = this._scopes[this._scopes.length - 1];
    }
});

},{"../klass":9,"./jsvalidator/validator":5,"./parser":6,"./processors":7,"./treeWalker":8}],"hsp/compiler":[function(require,module,exports){
module.exports=require('F4GJtq');
},{}],5:[function(require,module,exports){
var acorn = require("acorn/acorn");

/**
 * Validate a JavaScript string Return a JSON structure with 'valid' and 'errors' properties e.g. {valid:false,
 * errors:[{msg:'...',lineInfoTxt:'...',lineInfoHTML:'...',loc:{line:2,column:30}'}]}
 */
module.exports.validate = function (input) {
    var res = {
        isValid : true
    };

    try {
        acorn.parse(input, {
            ecmaVersion : 3,
            strictSemicolons : false,
            allowTrailingCommas : false,
            forbidReserved : true
        });
    } catch (ex) {
        res.isValid = false;
        res.errors = [formatError(ex, input)];
    }

    return res;
};

/**
 * Format the error as an error structure with line extract information
 */
function formatError (err, input) {
    var msg = err.toString().replace(/\s*\(\d*\:\d*\)\s*$/i, ''); // remove line number / col number

    var bm = ('' + input.slice(0, err.pos)).match(/.*$/i);
    var am = ('' + input.slice(err.pos)).match(/.*/i);
    var before = bm ? bm[0] : '';
    var after = am ? am[0] : '';

    // Prepare line info for txt display
    var cursorPos = before.length;
    var errChar = (after.length) ? after.slice(0, 1) : 'X';
    var lineStr = before + after;
    var lncursor = [];
    for (var i = 0, sz = lineStr.length; sz > i; i++) {
        lncursor[i] = (i === cursorPos) ? '^' : '-';
    }
    var lineInfoTxt = lineStr + '\r\n' + lncursor.join('');

    // Prepare line info for HTML display
    var lineInfoHTML = ['<span class="code">', before, '<span class="error" title="', msg, '">', errChar, '</span>',
            after.slice(1), '</span>'].join('');

    return {
        description : msg,
        lineInfoTxt : lineInfoTxt,
        lineInfoHTML : lineInfoHTML,
        code : lineStr,
        line : err.loc ? err.loc.line : -1,
        column : err.loc ? err.loc.column : -1
    };

}

},{"acorn/acorn":10}],6:[function(require,module,exports){
(function (__dirname){
var PEG = require("pegjs");
var fs = require("fs");
var grammar = fs.readFileSync(__dirname + "/hspblocks.pegjs", "utf-8");
var klass = require("../klass");
var blockParser = PEG.buildParser(grammar, {
    trackLineAndColumn : true
});

/**
 * Return the list of instruction blocks that compose a template file at this stage the template AST is not complete -
 * cf. parse() function to get the complete syntax tree Note: this function is exposed for unit test purposes and should
 * not be used directly
 * @param {String} template the template to parse
 */
function getBlockList (template) {
    // add a last line feed a the end of the template as the parser parses the plaintext
    // sequences only when ending with a new line sequence (workaround to solve pegjs issue)
    return blockParser.parse(template + "\r\n");
}
exports.getBlockList = getBlockList;

exports.parse = function (template) {
    var res = {};
    try {
        var bl = getBlockList(template);
        var st = new SyntaxTree();
        st.generateTree(bl);
        // st.displayErrors();
        res = {
            syntaxTree : st.tree.content,
            errors : st.errors
        };
    } catch (ex) {
        res = {
            syntaxTree : null,
            errors : [{
                        description : ex.toString(),
                        line : ex.line,
                        column : ex.column
                    }]
        };
    }
    return res;
};

/**
 * Node of the Syntax tree
 */
var Node = klass({
    $constructor : function (type, parent) {
        this.type = type;
        this.parent = parent;
    }
});

var reservedKeywords={
    "event": true,
    "scope": true
};

var SyntaxTree = klass({
    /**
     * Generate the syntax tree from the root block list
     */
    generateTree : function (blockList) {
        this.errors = [];
        this.tree = new Node("file", null);
        this.tree.content = [];

        this._advance(0, blockList, this.tree.content);
    },

    _logError : function (description, errdesc) {
        var desc = {
            description : description
        };
        if (errdesc) {
            if (errdesc.line) {
                desc.line = errdesc.line;
                desc.column = errdesc.column;
            }
            if (errdesc.code) {
                desc.code = errdesc.code;
            }
        }
        this.errors.push(desc);
    },

    displayErrors : function () {
        if (this.errors.length) {
            for (var i = 0, sz = this.errors.length; sz > i; i++) {
                console.log("Error " + (i + 1) + "/" + sz + ": " + this.errors[i].description);
            }
        }
    },

    /**
     * Process a list of blocks and advance the cursor index that scans the collection
     * @param {function} optEndFn an optional end function that takes a node type as argument
     * @return {int} the index of the block where the function stopped or -1 if all blocks have been handled
     */
    _advance : function (startIdx, blocks, out, optEndFn) {
        var b, type;
        if (blocks) {
            for (var i = startIdx, sz = blocks.length; sz > i; i++) {
                b = blocks[i];
                type = b.type;

                if (optEndFn && optEndFn(type, b.name)) {
                    // we stop here
                    return i;
                }
                if (this["_" + type]) {
                    i = this["_" + type](i, blocks, out);
                } else {
                    this._logError("Invalid statement: " + type, b);
                }
            }
            return blocks.length;
        }
    },

    /**
     * Template block management
     */
    _template : function (idx, blocks, out) {
        var n = new Node("template"), b = blocks[idx];
        n.name = b.name;
        if (b.controller) {
            n.controller = b.controller;
            n.controller.ref = b.controllerRef;
        } else {
            n.args = b.args;
            // check args
            for (var i=0,sz=n.args.length;sz>i;i++) {
                if (reservedKeywords[n.args[i]]) {
                    this._logError("Reserved keywords cannot be used as template argument: "+n.args[i], b);
                }
            }
        }
        n.export = b.mod === "export";
        n.startLine = b.line;
        n.endLine = b.endLine;
        n.content = [];
        out.push(n);

        if (b.mod !== '' && b.mod !== "export") {
            this._logError("Invalid template template modifier: " + b.mod, blocks[idx]);
        }

        if (!b.closed) {
            this._logError("Missing end template statement", b);
        }

        // parse sub-list of blocks
        this._advance(0, b.content, n.content);
        return idx;
    },

    /**
     * Catch invalid template definitions
     */
    _invalidtemplate : function (idx, blocks, out) {
        this._logError("Invalid template declaration", blocks[idx]);
        return idx;
    },

    /**
     * Text block management
     */
    _plaintext : function (idx, blocks, out) {
        var n = new Node("plaintext"), b = blocks[idx];
        n.value = b.value;
        out.push(n);
        return idx;
    },

    /**
     * Text block management: regroups adjacent text and expression blocks
     */
    _log : function (idx, blocks, out) {
        var n = new Node("log"), b = blocks[idx],exprs=[],e;
        n.line = b.line;
        n.column = b.column;
        for (var i=0,sz=b.exprs.length;sz>i;i++) {
            e=new HExpression(b.exprs[i], this);
            exprs[i]=e.getSyntaxTree();
        }
        n.exprs=exprs;
        out.push(n);
        return idx;
    },

    /**
     * Text block management: regroups adjacent text and expression blocks
     */
    _text : function (idx, blocks, out) {
        var sz = blocks.length, idx2 = idx, goahead = (sz > idx2), b, buf = [], n = null, insertIdx = -1;

        while (goahead) {
            b = blocks[idx2];
            if (b.type === "text") {
                if (b.value !== "") {
                    buf.push(b);
                }
            } else if (b.type === "expression") {
                if (b.category === "jsexpression") {
                    // pre-process expression
                    var e = new HExpression(b, this);
                    // inject the processed expression in the block list
                    b = blocks[idx2] = e.getSyntaxTree();
                }

                if (b.category === "invalidexpression") {
                    this._logError("Invalid expression", b);
                } else if (b.category !== "functionref") {
                    buf.push(b);
                } else {
                    // this is an insert statement
                    insertIdx = idx2;
                    idx2++; // will be handled below
                    goahead = false;
                }
            } else if (b.type === "comment") {
                // ignore comments
            } else {
                goahead = false;
            }

            if (goahead) {
                idx2++;
                goahead = (sz > idx2);
            }
        }

        if (buf.length === 1 && buf[0].type === "text") {
            // only one text block
            n = new Node("text");
            n.value = buf[0].value;
        } else if (buf.length > 0) {
            // an expression or several blocks have to be aggregated
            n = new Node("textblock");
            n.content = buf;
        }
        if (n) {
            out.push(n);
        }

        if (insertIdx > -1) {
            // an insert block has to be added after the text block
            this._insert(insertIdx, blocks, out);
        }

        // return the last index that was handled
        return idx2 > idx ? idx2 - 1 : idx;
    },

    /**
     * Text block management: regroups adjacent text and expression blocks
     */
    _expression : function (idx, blocks, out) {
        var b = blocks[idx], cat = b.category;
        if (cat === "invalidexpression") {
            this._logError("Invalid expression", b);
            return idx;
        }

        return this._text(idx, blocks, out);
    },

    /**
     * Catch invalid expressions
     */
    _invalidexpression : function (idx, blocks, out) {
        this._logError("Invalid expression", blocks[idx]);
        return idx;
    },

    /**
     * Insert
     */
    _insert : function (idx, blocks, out) {
        var n = new Node("insert"), b = blocks[idx];
        n.path = b.path;
        n.args = b.args;

        if (n.path.length > 1) {
            this._logError("Long paths for insert statements are not supported yet: " + n.path.join("."), b);
        } else {
            out.push(n);
        }
        return idx;
    },

    /**
     * If block management
     */
    _if : function (idx, blocks, out) {
        var n = new Node("if"), b = blocks[idx], lastValidIdx = idx;
        var condition = new HExpression(b.condition, this);
        n.condition = condition.getSyntaxTree();
        n.condition.bound = true;
        n.content1 = [];
        out.push(n);

        var endFound = false, out2 = n.content1, idx2 = idx;

        if (n.condition.type === "invalidexpression") {
            this._logError("Invalid if condition", n.condition);
        }

        while (!endFound) {
            idx2 = this._advance(idx2 + 1, blocks, out2, this._ifEndTypes);
            if (idx2 < 0 || !blocks[idx2]) {
                this._logError("Missing end if statement", blocks[lastValidIdx]);
                endFound = true;
            } else {
                var type = blocks[idx2].type;
                if (type === "endif") {
                    endFound = true;
                } else if (type === "else") {
                    n.content2 = [];
                    out2 = n.content2;
                    lastValidIdx = idx2;
                } else if (type === "elseif") {
                    // consider as a standard else statement
                    n.content2 = [];
                    out2 = n.content2;
                    lastValidIdx = idx2;
                    endFound = true;

                    // process as if it were an if node
                    idx2 = this._if(idx2, blocks, out2);
                }
            }
        }
        return idx2;
    },

    /**
     * Detects if blocks end types
     */
    _ifEndTypes : function (type) {
        return (type === "endif" || type === "else" || type === "elseif");
    },

    _endif : function (idx, blocks, out) {
        // only called in case of error
        var b = blocks[idx];
        this._logError("{/if} statement does not match any {if} block", b);
        return idx;
    },

    _else : function (idx, blocks, out) {
        // only called in case of error
        var b = blocks[idx];
        this._logError("{else} statement found outside any {if} block", b);
        return idx;
    },

    _elseif : function (idx, blocks, out) {
        // only called in case of error
        var b = blocks[idx];
        this._logError("{else if} statement found outside any {if} block", b);
        return idx;
    },

    /**
     * Foreach block management
     */
    _foreach : function (idx, blocks, out) {
        var n = new Node("foreach"), b = blocks[idx];
        n.item = b.item;
        n.key = b.key;
        n.collection = b.colref;
        n.collection.bound = true;
        n.content = [];
        out.push(n);

        var idx2 = this._advance(idx + 1, blocks, n.content, this._foreachEndTypes);
        if (idx2 < 0 || !blocks[idx2]) {
            this._logError("Missing end foreach statement", blocks[idx]);
        }

        return idx2;
    },

    /**
     * Detects foreach end
     */
    _foreachEndTypes : function (type) {
        return (type === "endforeach");
    },

    _endforeach : function (idx, blocks, out) {
        // only called in case of error
        var b = blocks[idx];
        this._logError("{/foreach} statement does not match any {foreach} block", b);
        return idx;
    },

    /**
     * Element block management
     */
    _element : function (idx, blocks, out) {
        return this._elementOrComponent("element", idx, blocks, out);
    },

    /**
     * Component block management
     */
    _component : function (idx, blocks, out) {
        return this._elementOrComponent("component", idx, blocks, out);
    },

    /**
     * Component attribute block management
     */
    _cptattribute : function (idx, blocks, out) {
        return this._elementOrComponent("cptattribute", idx, blocks, out);
    },

    /**
     * Processing function for elements and components
     * @arg blockType {String} "element" or "component"
     */
    _elementOrComponent : function (blockType, idx, blocks, out) {
        var n = new Node(blockType), b = blocks[idx];
        n.name = b.name;
        n.closed = b.closed;
        if (b.ref) {
            // only for components
            n.ref = b.ref;
        }

        // Handle attributes
        var atts = b.attributes, att, att2, type, lc;
        n.attributes = [];

        for (var i = 0, sz = atts.length; sz > i; i++) {
            att = atts[i];
            var sz2 = att.value.length;

            // check if attribute contains uppercase
            lc = att.name.toLowerCase();
            if (lc !== att.name) {
                // this._logError("Invalid attribute name - must be lower case: "+att.name,b);
                // continue;
            }

            if (sz2 === 0) {
                // this case arises when the attibute is empty - so let's create an empty text node
                if (att.value === '') {
                    // attribute has no value - e.g. autocomplete in an input element
                    att2 = {
                        name : att.name,
                        type : "name",
                        line : att.line,
                        column : att.column
                    };
                    n.attributes.push(att2);
                    continue;
                } else {
                    att.value.push({
                        type : "text",
                        value : ""
                    });
                }
                sz2 = 1;
            }
            if (sz2 === 1) {
                // literal or expression
                type = att.value[0].type;
                if (type === "text" || type === "expression") {
                    if (type === "expression") {
                        var v = att.value[0], cat = v.category;
                        if (cat === "jsexpression") {
                            // pre-process expression
                            var e = new HExpression(v, this);
                            // inject the processed expression in the block list
                            att.value[0] = e.getSyntaxTree();
                        } else if (cat === "invalidexpression") {
                            this._logError("Invalid expression", v);
                        } else if (att.name.match(/^on/i) && cat !== "functionref") {
                            this._logError("Event handler attribute only support function expressions", v);
                        }
                    }
                    att2 = att.value[0];
                    att2.name = att.name;
                } else {
                    this._logError("Invalid attribute type: " + type, att);
                    continue;
                }
            } else {
                // length > 1 so attribute is a text block

                // if attribute is an event handler, raise an error
                if (att.name.match(/^on/i)) {
                    this._logError("Event handler attributes don't support text and expression mix", att);
                }
                // raise errors if we have invalid attributes
                for (var j = 0; sz2 > j; j++) {
                    var v = att.value[j];
                    if (v.type === "expression") {
                        if (v.category === "jsexpression") {
                            // pre-process expression
                            var e = new HExpression(v, this);
                            // inject the processed expression in the block list
                            att.value[j] = e.getSyntaxTree();
                        } else if (v.category === "invalidexpression") {
                            this._logError("Invalid expression", v);
                        }
                    }
                }
                att2 = {
                    name : att.name,
                    type : "textblock",
                    content : att.value
                };
            }

            n.attributes.push(att2);
        }

        n.content = [];
        out.push(n);

        var idx2 = idx;
        if (!b.closed) {
            var endFound = false, out2 = n.content, ename = b.name;

            while (!endFound) {
                idx2 = this._advance(idx2 + 1, blocks, out2, function (type, name) {
                    return (type === "end" + blockType); // && name===ename
                });
                if (idx2 < 0 || !blocks[idx2]) {
                    // we didn't find any endelement or endcomponent
                    this._logError("Missing end " + blockType + " </" + ename + ">", b);
                    endFound = true;
                } else {
                    // check if the end name is correct
                    var b2=blocks[idx2];
                    if (b2.type==="endelement" || b2.type==="endcptattribute") {
                        if (blocks[idx2].name !== ename) {
                            this._logError("Missing end " + blockType + " </" + ename + ">", b);
                            idx2 -= 1; // the current end element/component may be caught by a container element
                        }
                    } else {
                        // endcomponent
                        var p1=this._getComponentPathAsString(b.ref), p2=this._getComponentPathAsString(b2.ref);
                        if (p1!==p2) {
                            this._logError("Missing end component </#" + p1 + ">", b);
                            idx2 -= 1; // the current end element/component may be caught by a container element
                        }
                    }
                    endFound = true;
                }
            }
        }

        return idx2;
    },

    /**
     * Transform a component path into a string - useful for error checking
     * If path is invalid null is returned
     * @param {Object} ref the ref structure returned by the PEG parser for components and endcomponents
     */
    _getComponentPathAsString:function(ref) {
        if (ref.category!=="objectref" || !ref.path || !ref.path.length || !ref.path.join) {
            return null;
        }
        return ref.path.join(".");
    },

    /**
     * Catch invalid element errors
     */
    _invalidelement : function (idx, blocks, out) {
        // only called in case of error
        var b = blocks[idx];
        var msg="Invalid HTML element syntax";
        if (b.code && b.code.match(/^<\/?\@/gi)) {
            msg="Invalid component attribute syntax";
        }
        this._logError(msg, b);
        return idx;
    },

    /**
     * Ignore comment blocks
     */
    _comment : function (idx, blocks, out) {
        return idx;
    },

    /**
     * Capture isolated end elements to raise an error
     */
    _endelement : function (idx, blocks, out) {
        // only called in case of error
        var b = blocks[idx], nm = b.name;
        this._logError("End element </" + nm + "> does not match any <" + nm + "> element", b);
        return idx;
    },

    /**
     * Capture isolated end components to raise an error
     */
    _endcomponent: function (idx, blocks, out) {
        // only called in case of error
        var b = blocks[idx], p = this._getComponentPathAsString(b.ref) ;
        this._logError("End component </#" + p + "> does not match any <#" + p + "> component", b);
        return idx;
    },

    /**
     * Capture isolated end component attributes to raise an error
     */
    _endcptattribute: function (idx, blocks, out) {
        // only called in case of error
        var b = blocks[idx], p = b.name ;
        this._logError("End component attribute </@" + p + "> does not match any <@" + p + "> component attribute", b);
        return idx;
    }

});

var HExpression = klass({
    /**
     * Process the HExpression node parsed by the PEG grammar to generate a more digestable format for the syntax tree
     * (note:processing is mostly for the JSExpression parts)
     * @param {JSON} node the node generated by the PEG Grammar (cf. HExpression)
     */
    $constructor : function (node, globalSyntaxTree) {
        this.rootExpression = node;
        this.errors = null;
        this.globalSyntaxTree = globalSyntaxTree;
        if (node.expType) {
            node.type = node.expType;
        }

        if (node.category !== "jsexpression") {
            // we only reprocess jsexpression
            this._st = node;
        } else {
            this._objectRefs = []; // list of objectref expressions found in the jsexpression

            var code = this._process(node);
            this.rootExpression.code = code;
            this._st = {
                type : "expression",
                category : "jsexpression",
                objectrefs : this._objectRefs,
                code : code
            };

            // if we have only one variable, we can simplify the syntaxtree
            if (code === "a0") {
                this._st = this._objectRefs[0];
            } else if (code.match(/^ *$/)) {
                // there is no code to display
                this._st = {
                    "type" : "text",
                    "value" : code
                };
            }

            // add line / column nbr if present
            if (node.line) {
                this._st.line = node.line;
                this._st.column = node.column;
            }

            // check errors
            if (this.errors) {
                for (var i = 0, sz = this.errors.length; sz > i; i++) {
                    globalSyntaxTree._logError(this.errors[i], this.rootExpression);
                }
            }
        }
    },
    /**
     * Return the syntax tree node to put in the global syntax tree
     */
    getSyntaxTree : function () {
        return this._st;
    },

    /**
     * Log an error on the syntax tree associated to this expression
     */
    _logError : function (msg) {
        if (!this.errors) {
            this.errors = [];
        }
        this.errors.push(msg);
    },

    /**
     * Internal recursive method to process a node
     * @param {JSON} node the expression node to be processed
     * @return {String} the JS code associated to this node
     */
    _process : function (node) {
        var r = "";
        switch (node.type) {
            case "expression" :
                r = this._getValue(node);
                break;
            case "BinaryExpression" :
                r = '(' + this._process(node.left) + ' ' + node.operator + ' ' + this._process(node.right) + ')';
                break;
            case "UnaryExpression" : // e.g. !x +x -x typeof x ++x and --x will not be supported
                r = '' + node.operator + '(' + this._process(node.expression) + ')';
                if (node.operator === '++' || node.operator === '--') {
                    this._logError('Unary operator ' + node.operator + ' is not allowed');
                }
                break;
            case "PostfixExpression" : // e.g. x++ or x-- (not allowed)
                r = '' + '(' + this._process(node.expression) + ')' + node.operator;
                this._logError('Postfix operator ' + node.operator + ' is not allowed');
                break;
            case "Variable" :
                r = this._getValue({
                    type : "expression",
                    "category" : "objectref",
                    bound : node.bound,
                    "path" : [node.name]
                });
                break;
            case "PropertyAccess" :
                // this is an object ref
                var n = node, p = [], nm;
                while (n) {
                    nm = n.name;
                    if (nm.type && nm.type === "expression") {
                        p.push(nm.value);
                    } else {
                        p.push(nm);
                    }
                    n = n.base;
                }
                p.reverse();
                r = this._getValue({
                    type : "expression",
                    "category" : "objectref",
                    bound : node.bound,
                    "path" : p
                });
                break;
            case "ConditionalExpression" :
                r = '(' + this._process(node.condition) + '? ' + this._process(node.trueExpression) + ' : '
                        + this._process(node.falseExpression) + ')';
                break;
            case "FunctionCall" :
                // this is an object ref
                var n = node.name, p = [];
                while (n) {
                    p.push(n.name);
                    n = n.base;
                }
                p.reverse();

                var n = {
                    type : "expression",
                    "category" : "functionref",
                    bound : node.bound,
                    "path" : p
                };
                r = this._getValue(n);

                // add arguments
                var args2 = [], args = node.arguments, sz = args ? args.length : 0, e;
                for (var i = 0; sz > i; i++) {
                    if (!args[i].category) {
                        // add category otherwise HExpression will not be parsed
                        args[i].category = "jsexpression";
                    }
                    e = new HExpression(args[i], this.globalSyntaxTree);
                    args2[i] = e.getSyntaxTree();
                }
                n.args = args2;
                break;
            case "CssClassElement" :
                r = "((" + this._process(node.right) + ")? ''+" + this._process(node.left) + ":'')";
                break;
            case "CssClassExpression" :
                var ls = node.list, sz = ls.length, code = [];
                for (var i = 0; sz > i; i++) {
                    code[i] = this._process(ls[i]);
                }
                if (sz < 1) {
                    r = '';
                } else {
                    r = "[" + code.join(",") + "].join(' ')";
                }
                break;
            case "ObjectLiteral":
                var properties = node.properties, size = properties.length, code = [];
                for (var i = 0; size > i; i++) {
                    code[i] = this._process(properties[i]);
                }
                if (size < 1) {
                    r = '';
                } else {
                    r = "{" + code.join(",") + "}";
                }
                break;
            case "PropertyAssignment":
                var name = node.name, child = node.value;
                var code = this._process(child);
                r = name + ":" + code;
                break;
            default :
                this._logError(node.type + '(s) are not supported yet');
                console.warn('[HExpression] ' + node.type + '(s) are not supported yet:');
                console.dir(node);
                break;
        }
        return r;
    },

    /**
     * Return the code value for a node of type "expression" (i.e. literals, objectrefs...)
     */
    _getValue : function (node) {
        var r = '';
        switch (node.category) {
            case "objectref" :
                var sz = this._objectRefs.length, e, pl, ok;

                // check if an indentical expression already exist
                for (var i = 0; sz > i; i++) {
                    e = this._objectRefs[i], pl = e.path.length, ok = true;
                    // only the path may vary
                    if (e.category !== "objectref") {
                        continue;
                    }
                    if (pl === node.path.length) {
                        for (var j = 0; pl > j; j++) {
                            if (e.path[j] !== node.path[j]) {
                                ok = false;
                                break;
                            }
                        }
                        if (ok) {
                            r = "a" + i;
                            break;
                        }
                    }
                }

                if (!r) {
                    // objectref doesn't exist in previous expressions
                    r = "a" + sz; // argument variable
                    this._objectRefs[sz] = node;
                }
                break;
            case "functionref" :
                // add the function call to the object ref list
                // we don't optimize the storeage as it is less likely to have the same combination repeated
                // than with simple object refs
                var sz = this._objectRefs.length;
                r = "a" + sz; // argument variable
                this._objectRefs[sz] = node;
                break;
            case "string" :
                r = '"' + node.value.replace(/\"/g, '\\"') + '"';
                break;
            case "boolean" :
            case "number" :
                r = node.value;
                break;
            case "null" :
                r = "null";
                break;
        }
        return r;
    }
});
}).call(this,"/hsp/compiler")
},{"../klass":9,"fs":"5lNCN0","pegjs":11}],7:[function(require,module,exports){
function escapeNewLines (text) {
    return text.replace(/\r\n?|[\n\u2028\u2029]/g, "\n").replace(/\n/g, "\\n");
}

/**
 * Text outside a template, just return what we've got
 */
exports["plaintext"] = function (node, walker) {
    return node.value;
};

/**
 * Template definition, this is the root of the tree, return a self calling function that recursively applies
 * - walker.walk on its content array
 * - walker.each on its arguments definition, used for simple serialization
 */
exports["template"] = function (node, walker) {
    var tplName = node.name;
    var CRLF = '\r\n';

    // add template arguments to the scope
    if (node.args) {
        for (var i = 0, sz = node.args.length; sz > i; i++) {
            walker.addScopeVariable(node.args[i]);
        }
    } else if (node.controller) {
        walker.addScopeVariable(node.controller.ref); // the controller reference - e.g. "c"
    }

    var tplCode = ["[", walker.walk(node.content, module.exports).join(","), "]"].join("");
    var globals = walker._globals;

    // generate globals validation statement - e.g. var _c;try {_c=c} catch(e) {};
    var gs = [], gsz = globals.length;
    if (gsz) {
        gs = ["  var _"+globals.join(',_')+";"];
        for (var i=0;gsz>i;i++) {
            gs.push( "try {_" + globals[i] + "=" + globals[i] + "} catch(e) {};");
        }
        gs.push(CRLF);
    }
    var gss=gs.join("");

    // reset template scope and global list
    walker.resetScope();
    walker.resetGlobalRefs();

    walker.templates[tplName] = tplCode;

    var exp = '';
    if (node.export === true) {
        exp = ' =exports.' + tplName;
    }

    if (node.controller) {
        var p = node.controller.path;
        return ['var ', tplName, exp, ' = require("hsp/rt").template({ctl:[', p[0], ',', walker.each(p, argAsString),
                '],ref:"', node.controller.ref, '"}, function(n){', CRLF, gss, '  return ', tplCode, ';', CRLF, '});', CRLF].join("");
    } else {
        return ['var ', tplName, exp, ' = require("hsp/rt").template([', walker.each(node.args, argAsString),
                '], function(n){', CRLF, gss, '  return ', tplCode, ';', CRLF, '});', CRLF].join("");
    }
};

/**
 * Generate a text node
 */
exports["text"] = function (node, walker) {
    if (node.value === undefined) {
        console.dir(node);
        return "n.$text(0,[\"\"])";
    }

    return ["n.$text(0,[\"", escapeNewLines(node.value.replace(/"/g, "\\\"")), "\"])"].join('');
};

/**
 * For a given value double it's definition returning "value",value. This method should only be called on object
 * literals (strings)
 */
function argAsString (value) {
    // No need to toString because it's already a string
    return '"' + value + '"';
}

/**
 * Generate a text node
 */
exports["textblock"] = function (node, walker) {
    // we should generate sth like
    // n.$text({e1:[1,"person","firstName"],e2:[1,"person","lastName"]},["Hello ",1," ",2,"!"])
    var tb = formatTextBlock(node, 1, walker);
    return ["n.$text(", tb.expArg, ",", tb.blockArgs, ")"].join('');
};

/**
 * Generate a log expression
 */
exports["log"] = function (node, walker) {
    var e, idx=1, code=[], indexes=[];
    for (var i=0,sz=node.exprs.length;sz>i;i++) {
        e = formatExpression(node.exprs[i], idx, walker);
        idx = e.nextIndex;
        indexes.push(e.exprIdx);
        code.push(e.code);
    }
    return ["n.log({", code.join(",") , "},[", indexes.join(',') , "],'",walker.fileName,"','",walker.dirPath,"',",node.line,",",node.column,")"].join('');
};

/**
 * Generate an if node
 */
exports["if"] = function (node, walker) {
    // we should generate sth like
    // n.$if({e1:[1,"person","firstName"]}, 1, [n.$text({e1:[1,"person","firstName"]},["Hello ",1])], [..])

    var e = formatExpression(node.condition, 1, walker);

    var c1 = ',[]', c2 = '';
    if (node.content1) {
        c1 = ',[' + walker.walk(node.content1, module.exports).join(",") + ']';
    }
    if (node.content2) {
        c2 = ',[' + walker.walk(node.content2, module.exports).join(",") + ']';
    }

    if (e.code !== '') {
        e.code = "{" + e.code + "}";
    }

    return ['n.$if(', e.code, ',', e.exprIdx, c1, c2, ')'].join('');
};

/**
 * Generate a foreach node
 */
exports["foreach"] = function (node, walker) {
    // we should generate sth like
    // n.$foreach( {e1: [1, 0, "things"]}, "thing", "thing_key", 1, [...])

    var e = formatExpression(node.collection, 1, walker);

    var c = '[]';
    if (node.content) {
        // add all contextual variables
        walker.pushSubScope([node.item, node.key, node.item + "_isfirst", node.item + "_islast"]);

        c = '[' + walker.walk(node.content, module.exports).join(",") + ']';

        walker.popSubScope();
    }

    if (e.code !== '') {
        e.code = "{" + e.code + "}";
    }
    var forType = 0; // to support types than 'in'

    return ['n.$foreach(', e.code, ',"', node.key, '","', node.item, '",', forType, ',', e.exprIdx, ',', c, ')'].join('');
};

/*
 * Manage insertion expressions
 */
exports["insert"] = function (node, walker) {
    node.category = "functionref";
    var e = formatExpression(node, 1, walker);
    var exprcode = e.code.length === 0 ? "0" : "{" + e.code + "}";

    return ['n.$insert(', exprcode, ',', e.exprIdx, ')'].join('');
};

/*
 * Manage element and component nodes
 */
function elementOrComponent (node, walker) {
    // we should generate sth like
    // n.elt("div", {e1:[0,0,"arg"]}, {"title":["",1]}, 0, [...])
    var attcontent = "0", evtcontent = "0", exprcode = "0", atts = node.attributes, sz = atts.length;
    if (sz > 0) {
        var list, aname, attlist = [], evtlist = [], exprlist = [], att, type, exprIdx = 1;

        for (var i = 0; sz > i; i++) {
            att = atts[i];
            list = attlist;
            aname = att.name;
            if (att.name.match(/^on/i)) {
                // this is an event handler
                list = evtlist;
                aname = att.name.slice(2);
            }

            type = att.type;
            if (type === "text") {
                list.push('"' + aname + '":"' + att.value + '"');
            } else if (type === "expression") {
                var e = formatExpression(att, exprIdx, walker);
                exprIdx = e.nextIndex;
                exprlist.push(e.code);
                if (list === evtlist) {
                    list.push('"' + aname + '":' + e.exprIdx);
                } else {
                    list.push('"' + aname + '":["",' + e.exprIdx + ']');
                }
            } else if (type === "textblock") {
                var tb = formatTextBlock(att, exprIdx, walker);
                exprIdx = tb.nextIndex;
                if (tb.expArg !== '0') {
                    exprlist.push(tb.expArg.slice(1, -1));
                }
                list.push('"' + aname + '":' + tb.blockArgs);
            } else if (type === "name") {
                list.push('"' + aname + '":null');
            } else {
                walker.logError("Invalid attribute type: " + type);
            }
        }
        if (attlist.length) {
            attcontent = "{" + attlist.join(',') + "}";
        }
        if (evtlist.length) {
            evtcontent = "{" + evtlist.join(',') + "}";
        }
        exprcode = exprlist.length === 0 ? "0" : "{" + exprlist.join(',') + "}";
    }

    var c = '';
    if (node.content && node.content.length) {
        c = ',[' + walker.walk(node.content, module.exports).join(",") + ']';
    }

    return [exprcode, ',', attcontent, ',', evtcontent, c].join('');
}

exports["element"] = function (node, walker) {
    var s = elementOrComponent(node, walker);
    return ['n.elt("', node.name, '",', s, ')'].join('');
};

exports["component"] = function (node, walker) {
    var s = elementOrComponent(node, walker);
    var p = node.ref.path;

    walker.addGlobalRef(p[0]);

    return ['n.cpt([_', p[0], ',"', p.join('","'), '"],', s, ')'].join('');
};

exports["cptattribute"] = function (node, walker) {
    var s = elementOrComponent(node, walker);
    return ['n.catt("', node.name, '",', s, ')'].join('');
};

/**
 * Format an expression according to its category
 * Return the expression string and the next expression index that can be used
 */
function formatExpression (expression, firstIdx, walker) {
    var cat = expression.category, code = '', nextIndex = firstIdx, bound = (expression.bound === false) ? 0 : 1;
    var exprIdx = firstIdx;
    if (cat === 'objectref' || cat === 'functionref') {
        var path = expression.path, argExprs = null, argExprIdx = null, args = expression.args;
        if (path.length === 0) {
            walker.logError("Expression path cannot be empty");
        } else {
            var root = path[0], isRootInScope = walker.isInScope(root);
            var arg1 = isRootInScope ? bound : 2;
            if (root === "event") {
                arg1 = 0;
            }

            if (arg1===2) {
                // root is a global reference
                walker.addGlobalRef(root);
                root="_"+root;
                path[0]="_"+path[0];
            }

            if (cat === 'functionref') {
                arg1 = isRootInScope ? 3 : 4;
                argExprs = [];
                argExprIdx = [];
                var arg, acat, e, idx = exprIdx + 1;
                for (var i = 0, sz = args.length; sz > i; i++) {
                    arg = args[i];
                    acat = arg.category;
                    if (acat === "string" || acat === "boolean" || acat === "number") {
                        continue;
                    }
                    e = formatExpression(arg, idx, walker);
                    argExprs.push(e.code);
                    argExprIdx[i] = e.exprIdx;
                    idx = e.nextIndex;
                }
                nextIndex = idx;
            } else {
                nextIndex++;
            }

            var res, rootRef = path[0];
            if (isRootInScope || root === "event") {
                rootRef = '"' + rootRef + '"';
            }
            var psz = path.length;
            if (psz === 1) {
                res = ['e', exprIdx, ':[', arg1, ',1,', rootRef];
            } else {
                var p = [], pitm;
                p.push(rootRef);
                for (var i = 1; psz > i; i++) {
                    pitm = path[i];
                    if ((typeof pitm) === "string") {
                        p.push('"' + pitm + '"');
                    } else {
                        p.push(pitm);
                    }
                }
                res = ['e', exprIdx, ':[', arg1, ',', psz, ',', p.join(',')];
            }

            if (args && args.length > 0) {
                var acat, arg;
                for (var i = 0, sz = args.length; sz > i; i++) {
                    arg = args[i];
                    acat = arg.category;
                    if (acat === "string") {
                        res.push(',0,"' + escapeNewLines(arg.value.replace(/"/g, "\\\"")) + '"');
                    } else if (acat === "boolean" || acat === "number") {
                        res.push(',0,' + arg.value);
                    } else {
                        // this is not a literal
                        res.push(',1,' + argExprIdx[i]);
                    }
                }
                if (argExprs && argExprs.length > 0) {
                    res.push("],");
                    res.push(argExprs.join(","));
                } else {
                    res.push("]");
                }

            } else {
                res.push("]");
            }
            code = res.join("");
        }

    } else if (cat === 'boolean' || cat === 'number') {
        code = ['e', exprIdx, ':[5,', expression.value, ']'].join('');
        nextIndex++;
    } else if (cat === 'string') {
        code = ['e', exprIdx, ':[5,"', ('' + expression.value).replace(/"/g, "\\\""), '"]'].join('');
        nextIndex++;
    } else if (cat === 'jsexpression') {
        var refs = expression.objectrefs, ref, e, idx = exprIdx + 1, exprs = [], exprIdxs = [];

        if (refs === undefined) {
            console.warn("[formatExpression] The following expression has not been pre-processed - parser should be updated: ");
            console.dir(expression);
        }

        var args = [], sz = refs.length, argSeparator = (sz > 0) ? ',' : '';
        for (var i = 0; sz > i; i++) {
            ref = refs[i];
            args[i] = "a" + i;
            e = formatExpression(ref, idx, walker);
            exprs.push(e.code);
            exprIdxs[i] = e.exprIdx;
            idx = e.nextIndex;
        }
        var func = ['function(', args.join(','), ') {return ', expression.code, ';}'].join('');
        var code0 = ['e', exprIdx, ':[6,', func, argSeparator, exprIdxs.join(','), ']'].join('');
        exprs.splice(0, 0, code0);
        code = exprs.join(',');
        nextIndex = exprIdxs[exprIdxs.length - 1] + 1;
    } else {
        walker.logError("Unsupported expression: " + cat, expression);
    }

    return {
        code : code,
        exprIdx : exprIdx,
        nextIndex : nextIndex
    };
}

/**
 * Format the textblock content for textblock and attribute nodes
 */
function formatTextBlock (node, nextExprIdx, walker) {
    var c = node.content, sz = c.length, itm, expArr = [], args = [], idx = 0; // idx is the index in the $text array
                                                                                // (=args)
    for (var i = 0; sz > i; i++) {
        itm = c[i];
        if (itm.type === "text") {
            if (idx % 2 === 0) {
                // even index: arg must be a string
                args[idx] = '"' + escapeNewLines(itm.value.replace(/"/g, "\\\"")) + '"';
                idx++;
            } else {
                // odd index: arg must be an expression - so add the text to the previous item
                if (idx > 0) {
                    args[idx - 1] = args[idx - 1].slice(0, -1) + escapeNewLines(itm.value.replace(/"/g, "\\\"")) + '"';
                } else {
                    // we should never get there as idx is odd !
                    walker.logError("Invalid textblock structure", node);
                }
            }
        } else if (itm.type === "expression") {
            if (idx % 2 === 0) {
                // even index: arg must be a string
                args[idx] = '""';
                idx++;
            }
            var e = formatExpression(itm, nextExprIdx, walker);
            nextExprIdx = e.nextIndex;
            if (e.code) {
                expArr.push(e.code);
                args[idx] = e.exprIdx; // expression idx
            } else {
                args[idx] = 0; // invalid expression
            }
            idx++;
        }
    }

    var expArg = "0";
    if (expArr.length) {
        expArg = '{' + expArr.join(",") + '}';
    }
    var blockArgs = "[]";
    if (args.length) {
        blockArgs = '[' + args.join(',') + ']';
    }

    return {
        expArg : expArg,
        nextIndex : nextExprIdx,
        blockArgs : blockArgs
    };
}

},{}],8:[function(require,module,exports){
var klass = require("../klass");

var TreeWalker = klass({
    /**
     * Start traversing a parse tree. This method takes the intermediate representation created by the parser and
     * executes, for each of the nodes, a function defined on the processor object
     * @return {[type]} [description]
     */
    walk : function (tree, processor) {
        var out = [];
        if (tree) {
            for (var i = 0; i < tree.length; i += 1) {
                var type = tree[i].type;
                if (processor[type]) {
                    out.push(processor[type](tree[i], this));
                }
            }
        }
        return out;
    },

    /**
     * Execute a callback on each element of an array. The callback receives the value of the array. This method returns
     * an array with the return value of the callbacks if not null.
     */
    each : function (array, callback) {
        var result = [];
        for (var i = 0; i < array.length; i += 1) {
            var value = callback(array[i]);
            if (value !== null) {
                result.push(value);
            }
        }
        return result;
    }

});
exports.TreeWalker = TreeWalker;

},{"../klass":9}],9:[function(require,module,exports){

/*
 * Copyright 2012 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Shortcut to create a JS Object
 * @param {JSON} klassdef the object prototype containing the following special properties $constructor: {function} the
 * object constructor (optional - a new function is automatically created if not provided)
 * @return {function} the object constructor
 */
var klass = function (klassdef) {
    var $c = klassdef.$constructor;
    if (!$c) {
        // no constructor is provided - let's create one
        var ext = klassdef.$extends;
        if (ext) {
            $c = function () {
                ext.apply(this, arguments);
            };
        } else {
            $c = new Function();
        }
        klassdef.$constructor = $c;
    }
    if (klassdef.$extends) {
        // create the new prototype from the parent prototype
        if (!klassdef.$extends.prototype)
            throw new Error("[klass] $extends attribute must be a function");
        var p = createObject(klassdef.$extends.prototype);

        // add prototype properties to the prototype and to the constructor function to allow syntax shortcuts
        // such as ClassA.$constructor()
        for (var k in klassdef) {
            if (klassdef.hasOwnProperty(k)) {
                p[k] = $c[k] = klassdef[k];
            }
        }
        $c.prototype = p;
    } else {
        $c.prototype = klassdef;

        // add prototype properties to the constructor function to allow syntax shortcuts
        // such as ClassA.$constructor()
        for (var k in klassdef) {
            if (klassdef.hasOwnProperty(k)) {
                $c[k] = klassdef[k];
            }
        }
    }

    return $c;
};

// helper function used to create object
function F () {}

/**
 * Create an empty object that extend another object through prototype inheritance
 */
function createObject (o) {
    if (Object.create) {
        return Object.create(o);
    } else {
        F.prototype = o;
        return new F();
    }
}

klass.createObject = createObject;

var metaDataCounter = 0;
/**
 * Generate a unique meta-data prefix Can be used to store object-specific data into another object without much risk of
 * collision (i.e. provided that the object doesn't use properties with the "+XXXX:XXXXXXXX" pattern)
 */
function createMetaDataPrefix () {
    metaDataCounter++;
    return "+" + metaDataCounter + ":";
}
klass.createMetaDataPrefix = createMetaDataPrefix;

module.exports = klass;

},{}],10:[function(require,module,exports){
// Acorn is a tiny, fast JavaScript parser written in JavaScript.
//
// Acorn was written by Marijn Haverbeke and released under an MIT
// license. The Unicode regexps (for identifiers and whitespace) were
// taken from [Esprima](http://esprima.org) by Ariya Hidayat.
//
// Git repositories for Acorn are available at
//
//     http://marijnhaverbeke.nl/git/acorn
//     https://github.com/marijnh/acorn.git
//
// Please use the [github bug tracker][ghbt] to report issues.
//
// [ghbt]: https://github.com/marijnh/acorn/issues
//
// This file defines the main parser interface. The library also comes
// with a [error-tolerant parser][dammit] and an
// [abstract syntax tree walker][walk], defined in other files.
//
// [dammit]: acorn_loose.js
// [walk]: util/walk.js

(function(exports) {
  "use strict";

  exports.version = "0.1.0";

  // The main exported interface (under `self.acorn` when in the
  // browser) is a `parse` function that takes a code string and
  // returns an abstract syntax tree as specified by [Mozilla parser
  // API][api], with the caveat that the SpiderMonkey-specific syntax
  // (`let`, `yield`, inline XML, etc) is not recognized.
  //
  // [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

  var options, input, inputLen, sourceFile;

  exports.parse = function(inpt, opts) {
    input = String(inpt); inputLen = input.length;
    setOptions(opts);
    initTokenState();
    return parseTopLevel(options.program);
  };

  // A second optional argument can be given to further configure
  // the parser process. These options are recognized:

  var defaultOptions = exports.defaultOptions = {
    // `ecmaVersion` indicates the ECMAScript version to parse. Must
    // be either 3 or 5. This
    // influences support for strict mode, the set of reserved words, and
    // support for getters and setter.
    ecmaVersion: 5,
    // Turn on `strictSemicolons` to prevent the parser from doing
    // automatic semicolon insertion.
    strictSemicolons: false,
    // When `allowTrailingCommas` is false, the parser will not allow
    // trailing commas in array and object literals.
    allowTrailingCommas: true,
    // By default, reserved words are not enforced. Enable
    // `forbidReserved` to enforce them.
    forbidReserved: false,
    // When `locations` is on, `loc` properties holding objects with
    // `start` and `end` properties in `{line, column}` form (with
    // line being 1-based and column 0-based) will be attached to the
    // nodes.
    locations: false,
    // A function can be passed as `onComment` option, which will
    // cause Acorn to call that function with `(block, text, start,
    // end)` parameters whenever a comment is skipped. `block` is a
    // boolean indicating whether this is a block (`/* */`) comment,
    // `text` is the content of the comment, and `start` and `end` are
    // character offsets that denote the start and end of the comment.
    // When the `locations` option is on, two more parameters are
    // passed, the full `{line, column}` locations of the start and
    // end of the comments.
    onComment: null,
    // Nodes have their start and end characters offsets recorded in
    // `start` and `end` properties (directly on the node, rather than
    // the `loc` object, which holds line/column data. To also add a
    // [semi-standardized][range] `range` property holding a `[start,
    // end]` array with the same numbers, set the `ranges` option to
    // `true`.
    //
    // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
    ranges: false,
    // It is possible to parse multiple files into a single AST by
    // passing the tree produced by parsing the first file as
    // `program` option in subsequent parses. This will add the
    // toplevel forms of the parsed file to the `Program` (top) node
    // of an existing parse tree.
    program: null,
    // When `location` is on, you can pass this to record the source
    // file in every node's `loc` object.
    sourceFile: null
  };

  function setOptions(opts) {
    options = opts || {};
    for (var opt in defaultOptions) if (!options.hasOwnProperty(opt))
      options[opt] = defaultOptions[opt];
    sourceFile = options.sourceFile || null;
  }

  // The `getLineInfo` function is mostly useful when the
  // `locations` option is off (for performance reasons) and you
  // want to find the line/column position for a given character
  // offset. `input` should be the code string that the offset refers
  // into.

  var getLineInfo = exports.getLineInfo = function(input, offset) {
    for (var line = 1, cur = 0;;) {
      lineBreak.lastIndex = cur;
      var match = lineBreak.exec(input);
      if (match && match.index < offset) {
        ++line;
        cur = match.index + match[0].length;
      } else break;
    }
    return {line: line, column: offset - cur};
  };

  // Acorn is organized as a tokenizer and a recursive-descent parser.
  // The `tokenize` export provides an interface to the tokenizer.
  // Because the tokenizer is optimized for being efficiently used by
  // the Acorn parser itself, this interface is somewhat crude and not
  // very modular. Performing another parse or call to `tokenize` will
  // reset the internal state, and invalidate existing tokenizers.

  exports.tokenize = function(inpt, opts) {
    input = String(inpt); inputLen = input.length;
    setOptions(opts);
    initTokenState();

    var t = {};
    function getToken(forceRegexp) {
      readToken(forceRegexp);
      t.start = tokStart; t.end = tokEnd;
      t.startLoc = tokStartLoc; t.endLoc = tokEndLoc;
      t.type = tokType; t.value = tokVal;
      return t;
    }
    getToken.jumpTo = function(pos, reAllowed) {
      tokPos = pos;
      if (options.locations) {
        tokCurLine = tokLineStart = lineBreak.lastIndex = 0;
        var match;
        while ((match = lineBreak.exec(input)) && match.index < pos) {
          ++tokCurLine;
          tokLineStart = match.index + match[0].length;
        }
      }
      var ch = input.charAt(pos - 1);
      tokRegexpAllowed = reAllowed;
      skipSpace();
    };
    return getToken;
  };

  // State is kept in (closure-)global variables. We already saw the
  // `options`, `input`, and `inputLen` variables above.

  // The current position of the tokenizer in the input.

  var tokPos;

  // The start and end offsets of the current token.

  var tokStart, tokEnd;

  // When `options.locations` is true, these hold objects
  // containing the tokens start and end line/column pairs.

  var tokStartLoc, tokEndLoc;

  // The type and value of the current token. Token types are objects,
  // named by variables against which they can be compared, and
  // holding properties that describe them (indicating, for example,
  // the precedence of an infix operator, and the original name of a
  // keyword token). The kind of value that's held in `tokVal` depends
  // on the type of the token. For literals, it is the literal value,
  // for operators, the operator name, and so on.

  var tokType, tokVal;

  // Interal state for the tokenizer. To distinguish between division
  // operators and regular expressions, it remembers whether the last
  // token was one that is allowed to be followed by an expression.
  // (If it is, a slash is probably a regexp, if it isn't it's a
  // division operator. See the `parseStatement` function for a
  // caveat.)

  var tokRegexpAllowed;

  // When `options.locations` is true, these are used to keep
  // track of the current line, and know when a new line has been
  // entered.

  var tokCurLine, tokLineStart;

  // These store the position of the previous token, which is useful
  // when finishing a node and assigning its `end` position.

  var lastStart, lastEnd, lastEndLoc;

  // This is the parser's state. `inFunction` is used to reject
  // `return` statements outside of functions, `labels` to verify that
  // `break` and `continue` have somewhere to jump to, and `strict`
  // indicates whether strict mode is on.

  var inFunction, labels, strict;

  // This function is used to raise exceptions on parse errors. It
  // takes an offset integer (into the current `input`) to indicate
  // the location of the error, attaches the position to the end
  // of the error message, and then raises a `SyntaxError` with that
  // message.

  function raise(pos, message) {
    var loc = getLineInfo(input, pos);
    message += " (" + loc.line + ":" + loc.column + ")";
    var err = new SyntaxError(message);
    err.pos = pos; err.loc = loc; err.raisedAt = tokPos;
    throw err;
  }

  // ## Token types

  // The assignment of fine-grained, information-carrying type objects
  // allows the tokenizer to store the information it has about a
  // token in a way that is very cheap for the parser to look up.

  // All token type variables start with an underscore, to make them
  // easy to recognize.

  // These are the general types. The `type` property is only used to
  // make them recognizeable when debugging.

  var _num = {type: "num"}, _regexp = {type: "regexp"}, _string = {type: "string"};
  var _name = {type: "name"}, _eof = {type: "eof"};

  // Keyword tokens. The `keyword` property (also used in keyword-like
  // operators) indicates that the token originated from an
  // identifier-like word, which is used when parsing property names.
  //
  // The `beforeExpr` property is used to disambiguate between regular
  // expressions and divisions. It is set on all token types that can
  // be followed by an expression (thus, a slash after them would be a
  // regular expression).
  //
  // `isLoop` marks a keyword as starting a loop, which is important
  // to know when parsing a label, in order to allow or disallow
  // continue jumps to that label.

  var _break = {keyword: "break"}, _case = {keyword: "case", beforeExpr: true}, _catch = {keyword: "catch"};
  var _continue = {keyword: "continue"}, _debugger = {keyword: "debugger"}, _default = {keyword: "default"};
  var _do = {keyword: "do", isLoop: true}, _else = {keyword: "else", beforeExpr: true};
  var _finally = {keyword: "finally"}, _for = {keyword: "for", isLoop: true}, _function = {keyword: "function"};
  var _if = {keyword: "if"}, _return = {keyword: "return", beforeExpr: true}, _switch = {keyword: "switch"};
  var _throw = {keyword: "throw", beforeExpr: true}, _try = {keyword: "try"}, _var = {keyword: "var"};
  var _while = {keyword: "while", isLoop: true}, _with = {keyword: "with"}, _new = {keyword: "new", beforeExpr: true};
  var _this = {keyword: "this"};

  // The keywords that denote values.

  var _null = {keyword: "null", atomValue: null}, _true = {keyword: "true", atomValue: true};
  var _false = {keyword: "false", atomValue: false};

  // Some keywords are treated as regular operators. `in` sometimes
  // (when parsing `for`) needs to be tested against specifically, so
  // we assign a variable name to it for quick comparing.

  var _in = {keyword: "in", binop: 7, beforeExpr: true};

  // Map keyword names to token types.

  var keywordTypes = {"break": _break, "case": _case, "catch": _catch,
                      "continue": _continue, "debugger": _debugger, "default": _default,
                      "do": _do, "else": _else, "finally": _finally, "for": _for,
                      "function": _function, "if": _if, "return": _return, "switch": _switch,
                      "throw": _throw, "try": _try, "var": _var, "while": _while, "with": _with,
                      "null": _null, "true": _true, "false": _false, "new": _new, "in": _in,
                      "instanceof": {keyword: "instanceof", binop: 7, beforeExpr: true}, "this": _this,
                      "typeof": {keyword: "typeof", prefix: true, beforeExpr: true},
                      "void": {keyword: "void", prefix: true, beforeExpr: true},
                      "delete": {keyword: "delete", prefix: true, beforeExpr: true}};

  // Punctuation token types. Again, the `type` property is purely for debugging.

  var _bracketL = {type: "[", beforeExpr: true}, _bracketR = {type: "]"}, _braceL = {type: "{", beforeExpr: true};
  var _braceR = {type: "}"}, _parenL = {type: "(", beforeExpr: true}, _parenR = {type: ")"};
  var _comma = {type: ",", beforeExpr: true}, _semi = {type: ";", beforeExpr: true};
  var _colon = {type: ":", beforeExpr: true}, _dot = {type: "."}, _question = {type: "?", beforeExpr: true};

  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator. `isUpdate` specifies that the node produced by
  // the operator should be of type UpdateExpression rather than
  // simply UnaryExpression (`++` and `--`).
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.

  var _slash = {binop: 10, beforeExpr: true}, _eq = {isAssign: true, beforeExpr: true};
  var _assign = {isAssign: true, beforeExpr: true}, _plusmin = {binop: 9, prefix: true, beforeExpr: true};
  var _incdec = {postfix: true, prefix: true, isUpdate: true}, _prefix = {prefix: true, beforeExpr: true};
  var _bin1 = {binop: 1, beforeExpr: true}, _bin2 = {binop: 2, beforeExpr: true};
  var _bin3 = {binop: 3, beforeExpr: true}, _bin4 = {binop: 4, beforeExpr: true};
  var _bin5 = {binop: 5, beforeExpr: true}, _bin6 = {binop: 6, beforeExpr: true};
  var _bin7 = {binop: 7, beforeExpr: true}, _bin8 = {binop: 8, beforeExpr: true};
  var _bin10 = {binop: 10, beforeExpr: true};

  // Provide access to the token types for external users of the
  // tokenizer.

  exports.tokTypes = {bracketL: _bracketL, bracketR: _bracketR, braceL: _braceL, braceR: _braceR,
                      parenL: _parenL, parenR: _parenR, comma: _comma, semi: _semi, colon: _colon,
                      dot: _dot, question: _question, slash: _slash, eq: _eq, name: _name, eof: _eof,
                      num: _num, regexp: _regexp, string: _string};
  for (var kw in keywordTypes) exports.tokTypes[kw] = keywordTypes[kw];

  // This is a trick taken from Esprima. It turns out that, on
  // non-Chrome browsers, to check whether a string is in a set, a
  // predicate containing a big ugly `switch` statement is faster than
  // a regular expression, and on Chrome the two are about on par.
  // This function uses `eval` (non-lexical) to produce such a
  // predicate from a space-separated string of words.
  //
  // It starts by sorting the words by length.

  function makePredicate(words) {
    words = words.split(" ");
    var f = "", cats = [];
    out: for (var i = 0; i < words.length; ++i) {
      for (var j = 0; j < cats.length; ++j)
        if (cats[j][0].length == words[i].length) {
          cats[j].push(words[i]);
          continue out;
        }
      cats.push([words[i]]);
    }
    function compareTo(arr) {
      if (arr.length == 1) return f += "return str === " + JSON.stringify(arr[0]) + ";";
      f += "switch(str){";
      for (var i = 0; i < arr.length; ++i) f += "case " + JSON.stringify(arr[i]) + ":";
      f += "return true}return false;";
    }

    // When there are more than three length categories, an outer
    // switch first dispatches on the lengths, to save on comparisons.

    if (cats.length > 3) {
      cats.sort(function(a, b) {return b.length - a.length;});
      f += "switch(str.length){";
      for (var i = 0; i < cats.length; ++i) {
        var cat = cats[i];
        f += "case " + cat[0].length + ":";
        compareTo(cat);
      }
      f += "}";

    // Otherwise, simply generate a flat `switch` statement.

    } else {
      compareTo(words);
    }
    return new Function("str", f);
  }

  // The ECMAScript 3 reserved word list.

  var isReservedWord3 = makePredicate("abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile");

  // ECMAScript 5 reserved words.

  var isReservedWord5 = makePredicate("class enum extends super const export import");

  // The additional reserved words in strict mode.

  var isStrictReservedWord = makePredicate("implements interface let package private protected public static yield");

  // The forbidden variable names in strict mode.

  var isStrictBadIdWord = makePredicate("eval arguments");

  // And the keywords.

  var isKeyword = makePredicate("break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this");

  // ## Character categories

  // Big ugly regular expressions that match characters in the
  // whitespace, identifier, and identifier-start categories. These
  // are only applied when a character is found to actually have a
  // code point above 128.

  var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/;
  var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
  var nonASCIIidentifierChars = "\u0371-\u0374\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u0620-\u0649\u0672-\u06d3\u06e7-\u06e8\u06fb-\u06fc\u0730-\u074a\u0800-\u0814\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0840-\u0857\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962-\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09d7\u09df-\u09e0\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5f-\u0b60\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2-\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d46-\u0d48\u0d57\u0d62-\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e34-\u0e3a\u0e40-\u0e45\u0e50-\u0e59\u0eb4-\u0eb9\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f41-\u0f47\u0f71-\u0f84\u0f86-\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1029\u1040-\u1049\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u170e-\u1710\u1720-\u1730\u1740-\u1750\u1772\u1773\u1780-\u17b2\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1920-\u192b\u1930-\u193b\u1951-\u196d\u19b0-\u19c0\u19c8-\u19c9\u19d0-\u19d9\u1a00-\u1a15\u1a20-\u1a53\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b46-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1bb0-\u1bb9\u1be6-\u1bf3\u1c00-\u1c22\u1c40-\u1c49\u1c5b-\u1c7d\u1cd0-\u1cd2\u1d00-\u1dbe\u1e01-\u1f15\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2d81-\u2d96\u2de0-\u2dff\u3021-\u3028\u3099\u309a\ua640-\ua66d\ua674-\ua67d\ua69f\ua6f0-\ua6f1\ua7f8-\ua800\ua806\ua80b\ua823-\ua827\ua880-\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8f3-\ua8f7\ua900-\ua909\ua926-\ua92d\ua930-\ua945\ua980-\ua983\ua9b3-\ua9c0\uaa00-\uaa27\uaa40-\uaa41\uaa4c-\uaa4d\uaa50-\uaa59\uaa7b\uaae0-\uaae9\uaaf2-\uaaf3\uabc0-\uabe1\uabec\uabed\uabf0-\uabf9\ufb20-\ufb28\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";
  var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
  var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

  // Whether a single character denotes a newline.

  var newline = /[\n\r\u2028\u2029]/;

  // Matches a whole line break (where CRLF is considered a single
  // line break). Used to count lines.

  var lineBreak = /\r\n|[\n\r\u2028\u2029]/g;

  // Test whether a given character code starts an identifier.

  function isIdentifierStart(code) {
    if (code < 65) return code === 36;
    if (code < 91) return true;
    if (code < 97) return code === 95;
    if (code < 123)return true;
    return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
  }

  // Test whether a given character is part of an identifier.

  function isIdentifierChar(code) {
    if (code < 48) return code === 36;
    if (code < 58) return true;
    if (code < 65) return false;
    if (code < 91) return true;
    if (code < 97) return code === 95;
    if (code < 123)return true;
    return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
  }

  // ## Tokenizer

  // These are used when `options.locations` is on, for the
  // `tokStartLoc` and `tokEndLoc` properties.

  function line_loc_t() {
    this.line = tokCurLine;
    this.column = tokPos - tokLineStart;
  }

  // Reset the token state. Used at the start of a parse.

  function initTokenState() {
    tokCurLine = 1;
    tokPos = tokLineStart = 0;
    tokRegexpAllowed = true;
    skipSpace();
  }

  // Called at the end of every token. Sets `tokEnd`, `tokVal`, and
  // `tokRegexpAllowed`, and skips the space after the token, so that
  // the next one's `tokStart` will point at the right position.

  function finishToken(type, val) {
    tokEnd = tokPos;
    if (options.locations) tokEndLoc = new line_loc_t;
    tokType = type;
    skipSpace();
    tokVal = val;
    tokRegexpAllowed = type.beforeExpr;
  }

  function skipBlockComment() {
    var startLoc = options.onComment && options.locations && new line_loc_t;
    var start = tokPos, end = input.indexOf("*/", tokPos += 2);
    if (end === -1) raise(tokPos - 2, "Unterminated comment");
    tokPos = end + 2;
    if (options.locations) {
      lineBreak.lastIndex = start;
      var match;
      while ((match = lineBreak.exec(input)) && match.index < tokPos) {
        ++tokCurLine;
        tokLineStart = match.index + match[0].length;
      }
    }
    if (options.onComment)
      options.onComment(true, input.slice(start + 2, end), start, tokPos,
                        startLoc, options.locations && new line_loc_t);
  }

  function skipLineComment() {
    var start = tokPos;
    var startLoc = options.onComment && options.locations && new line_loc_t;
    var ch = input.charCodeAt(tokPos+=2);
    while (tokPos < inputLen && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8329) {
      ++tokPos;
      ch = input.charCodeAt(tokPos);
    }
    if (options.onComment)
      options.onComment(false, input.slice(start + 2, tokPos), start, tokPos,
                        startLoc, options.locations && new line_loc_t);
  }

  // Called at the start of the parse and after every token. Skips
  // whitespace and comments, and.

  function skipSpace() {
    while (tokPos < inputLen) {
      var ch = input.charCodeAt(tokPos);
      if (ch === 32) { // ' '
        ++tokPos;
      } else if(ch === 13) {
        ++tokPos;
        var next = input.charCodeAt(tokPos);
        if(next === 10) {
          ++tokPos;
        }
        if(options.locations) {
          ++tokCurLine;
          tokLineStart = tokPos;
        }
      } else if (ch === 10) {
        ++tokPos;
        ++tokCurLine;
        tokLineStart = tokPos;
      } else if(ch < 14 && ch > 8) {
        ++tokPos;
      } else if (ch === 47) { // '/'
        var next = input.charCodeAt(tokPos+1);
        if (next === 42) { // '*'
          skipBlockComment();
        } else if (next === 47) { // '/'
          skipLineComment();
        } else break;
      } else if ((ch < 14 && ch > 8) || ch === 32 || ch === 160) { // ' ', '\xa0'
        ++tokPos;
      } else if (ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
        ++tokPos;
      } else {
        break;
      }
    }
  }

  // ### Token reading

  // This is the function that is called to fetch the next token. It
  // is somewhat obscure, because it works in character codes rather
  // than characters, and because operator parsing has been inlined
  // into it.
  //
  // All in the name of speed.
  //
  // The `forceRegexp` parameter is used in the one case where the
  // `tokRegexpAllowed` trick does not work. See `parseStatement`.

  function readToken_dot() {
    var next = input.charCodeAt(tokPos+1);
    if (next >= 48 && next <= 57) return readNumber(true);
    ++tokPos;
    return finishToken(_dot);
  }

  function readToken_slash() { // '/'
    var next = input.charCodeAt(tokPos+1);
    if (tokRegexpAllowed) {++tokPos; return readRegexp();}
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(_slash, 1);
  }

  function readToken_mult_modulo() { // '%*'
    var next = input.charCodeAt(tokPos+1);
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(_bin10, 1);
  }

  function readToken_pipe_amp(code) { // '|&'
    var next = input.charCodeAt(tokPos+1);
    if (next === code) return finishOp(code === 124 ? _bin1 : _bin2, 2);
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(code === 124 ? _bin3 : _bin5, 1);
  }

  function readToken_caret() { // '^'
    var next = input.charCodeAt(tokPos+1);
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(_bin4, 1);    
  }

  function readToken_plus_min(code) { // '+-'
    var next = input.charCodeAt(tokPos+1);
    if (next === code) return finishOp(_incdec, 2);
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(_plusmin, 1);    
  }

  function readToken_lt_gt(code) { // '<>'
    var next = input.charCodeAt(tokPos+1);
    var size = 1;
    if (next === code) {
      size = code === 62 && input.charCodeAt(tokPos+2) === 62 ? 3 : 2;
      if (input.charCodeAt(tokPos + size) === 61) return finishOp(_assign, size + 1);
      return finishOp(_bin8, size);
    }
    if (next === 61)
      size = input.charCodeAt(tokPos+2) === 61 ? 3 : 2;
    return finishOp(_bin7, size);
  }
  
  function readToken_eq_excl(code) { // '=!'
    var next = input.charCodeAt(tokPos+1);
    if (next === 61) return finishOp(_bin6, input.charCodeAt(tokPos+2) === 61 ? 3 : 2);
    return finishOp(code === 61 ? _eq : _prefix, 1);
  }

  function getTokenFromCode(code) {
    switch(code) {
      // The interpretation of a dot depends on whether it is followed
      // by a digit.
    case 46: // '.'
      return readToken_dot();

      // Punctuation tokens.
    case 40: ++tokPos; return finishToken(_parenL);
    case 41: ++tokPos; return finishToken(_parenR);
    case 59: ++tokPos; return finishToken(_semi);
    case 44: ++tokPos; return finishToken(_comma);
    case 91: ++tokPos; return finishToken(_bracketL);
    case 93: ++tokPos; return finishToken(_bracketR);
    case 123: ++tokPos; return finishToken(_braceL);
    case 125: ++tokPos; return finishToken(_braceR);
    case 58: ++tokPos; return finishToken(_colon);
    case 63: ++tokPos; return finishToken(_question);

      // '0x' is a hexadecimal number.
    case 48: // '0'
      var next = input.charCodeAt(tokPos+1);
      if (next === 120 || next === 88) return readHexNumber();
      // Anything else beginning with a digit is an integer, octal
      // number, or float.
    case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
      return readNumber(false);

      // Quotes produce strings.
    case 34: case 39: // '"', "'"
      return readString(code);

    // Operators are parsed inline in tiny state machines. '=' (61) is
    // often referred to. `finishOp` simply skips the amount of
    // characters it is given as second argument, and returns a token
    // of the type given by its first argument.

    case 47: // '/'
      return readToken_slash(code);

    case 37: case 42: // '%*'
      return readToken_mult_modulo();

    case 124: case 38: // '|&'
      return readToken_pipe_amp(code);

    case 94: // '^'
      return readToken_caret();

    case 43: case 45: // '+-'
      return readToken_plus_min(code);

    case 60: case 62: // '<>'
      return readToken_lt_gt(code);

    case 61: case 33: // '=!'
      return readToken_eq_excl(code);

    case 126: // '~'
      return finishOp(_prefix, 1);
    }

    return false;
  }

  function readToken(forceRegexp) {
    tokStart = tokPos;
    if (options.locations) tokStartLoc = new line_loc_t;
    if (forceRegexp) return readRegexp();
    if (tokPos >= inputLen) return finishToken(_eof);

    var code = input.charCodeAt(tokPos);
    // Identifier or keyword. '\uXXXX' sequences are allowed in
    // identifiers, so '\' also dispatches to that.
    if (isIdentifierStart(code) || code === 92 /* '\' */) return readWord();
    
    var tok = getTokenFromCode(code);

    if (tok === false) {
      // If we are here, we either found a non-ASCII identifier
      // character, or something that's entirely disallowed.
      var ch = String.fromCharCode(code);
      if (ch === "\\" || nonASCIIidentifierStart.test(ch)) return readWord();
      raise(tokPos, "Unexpected character '" + ch + "'");
    } 
    return tok;
  }

  function finishOp(type, size) {
    var str = input.slice(tokPos, tokPos + size);
    tokPos += size;
    finishToken(type, str);
  }

  // Parse a regular expression. Some context-awareness is necessary,
  // since a '/' inside a '[]' set does not end the expression.

  function readRegexp() {
    var content = "", escaped, inClass, start = tokPos;
    for (;;) {
      if (tokPos >= inputLen) raise(start, "Unterminated regular expression");
      var ch = input.charAt(tokPos);
      if (newline.test(ch)) raise(start, "Unterminated regular expression");
      if (!escaped) {
        if (ch === "[") inClass = true;
        else if (ch === "]" && inClass) inClass = false;
        else if (ch === "/" && !inClass) break;
        escaped = ch === "\\";
      } else escaped = false;
      ++tokPos;
    }
    var content = input.slice(start, tokPos);
    ++tokPos;
    // Need to use `readWord1` because '\uXXXX' sequences are allowed
    // here (don't ask).
    var mods = readWord1();
    if (mods && !/^[gmsiy]*$/.test(mods)) raise(start, "Invalid regexp flag");
    return finishToken(_regexp, new RegExp(content, mods));
  }

  // Read an integer in the given radix. Return null if zero digits
  // were read, the integer value otherwise. When `len` is given, this
  // will return `null` unless the integer has exactly `len` digits.

  function readInt(radix, len) {
    var start = tokPos, total = 0;
    for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
      var code = input.charCodeAt(tokPos), val;
      if (code >= 97) val = code - 97 + 10; // a
      else if (code >= 65) val = code - 65 + 10; // A
      else if (code >= 48 && code <= 57) val = code - 48; // 0-9
      else val = Infinity;
      if (val >= radix) break;
      ++tokPos;
      total = total * radix + val;
    }
    if (tokPos === start || len != null && tokPos - start !== len) return null;

    return total;
  }

  function readHexNumber() {
    tokPos += 2; // 0x
    var val = readInt(16);
    if (val == null) raise(tokStart + 2, "Expected hexadecimal number");
    if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");
    return finishToken(_num, val);
  }

  // Read an integer, octal integer, or floating-point number.
  
  function readNumber(startsWithDot) {
    var start = tokPos, isFloat = false, octal = input.charCodeAt(tokPos) === 48;
    if (!startsWithDot && readInt(10) === null) raise(start, "Invalid number");
    if (input.charCodeAt(tokPos) === 46) {
      ++tokPos;
      readInt(10);
      isFloat = true;
    }
    var next = input.charCodeAt(tokPos);
    if (next === 69 || next === 101) { // 'eE'
      next = input.charCodeAt(++tokPos);
      if (next === 43 || next === 45) ++tokPos; // '+-'
      if (readInt(10) === null) raise(start, "Invalid number")
      isFloat = true;
    }
    if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");

    var str = input.slice(start, tokPos), val;
    if (isFloat) val = parseFloat(str);
    else if (!octal || str.length === 1) val = parseInt(str, 10);
    else if (/[89]/.test(str) || strict) raise(start, "Invalid number");
    else val = parseInt(str, 8);
    return finishToken(_num, val);
  }

  // Read a string value, interpreting backslash-escapes.

  var rs_str = [];

  function readString(quote) {
    tokPos++;
    rs_str.length = 0;
    for (;;) {
      if (tokPos >= inputLen) raise(tokStart, "Unterminated string constant");
      var ch = input.charCodeAt(tokPos);
      if (ch === quote) {
        ++tokPos;
        return finishToken(_string, String.fromCharCode.apply(null, rs_str));
      }
      if (ch === 92) { // '\'
        ch = input.charCodeAt(++tokPos);
        var octal = /^[0-7]+/.exec(input.slice(tokPos, tokPos + 3));
        if (octal) octal = octal[0];
        while (octal && parseInt(octal, 8) > 255) octal = octal.slice(0, octal.length - 1);
        if (octal === "0") octal = null;
        ++tokPos;
        if (octal) {
          if (strict) raise(tokPos - 2, "Octal literal in strict mode");
          rs_str.push(parseInt(octal, 8));
          tokPos += octal.length - 1;
        } else {
          switch (ch) {
          case 110: rs_str.push(10); break; // 'n' -> '\n'
          case 114: rs_str.push(13); break; // 'r' -> '\r'
          case 120: rs_str.push(readHexChar(2)); break; // 'x'
          case 117: rs_str.push(readHexChar(4)); break; // 'u'
          case 85: rs_str.push(readHexChar(8)); break; // 'U'
          case 116: rs_str.push(9); break; // 't' -> '\t'
          case 98: rs_str.push(8); break; // 'b' -> '\b'
          case 118: rs_str.push(11); break; // 'v' -> '\u000b'
          case 102: rs_str.push(12); break; // 'f' -> '\f'
          case 48: rs_str.push(0); break; // 0 -> '\0'
          case 13: if (input.charCodeAt(tokPos) === 10) ++tokPos; // '\r\n'
          case 10: // ' \n'
            if (options.locations) { tokLineStart = tokPos; ++tokCurLine; }
            break;
          default: rs_str.push(ch); break;
          }
        }
      } else {
        if (ch === 13 || ch === 10 || ch === 8232 || ch === 8329) raise(tokStart, "Unterminated string constant");
        rs_str.push(ch); // '\'
        ++tokPos;
      }
    }
  }

  // Used to read character escape sequences ('\x', '\u', '\U').

  function readHexChar(len) {
    var n = readInt(16, len);
    if (n === null) raise(tokStart, "Bad character escape sequence");
    return n;
  }

  // Used to signal to callers of `readWord1` whether the word
  // contained any escape sequences. This is needed because words with
  // escape sequences must not be interpreted as keywords.

  var containsEsc;

  // Read an identifier, and return it as a string. Sets `containsEsc`
  // to whether the word contained a '\u' escape.
  //
  // Only builds up the word character-by-character when it actually
  // containeds an escape, as a micro-optimization.

  function readWord1() {
    containsEsc = false;
    var word, first = true, start = tokPos;
    for (;;) {
      var ch = input.charCodeAt(tokPos);
      if (isIdentifierChar(ch)) {
        if (containsEsc) word += input.charAt(tokPos);
        ++tokPos;
      } else if (ch === 92) { // "\"
        if (!containsEsc) word = input.slice(start, tokPos);
        containsEsc = true;
        if (input.charCodeAt(++tokPos) != 117) // "u"
          raise(tokPos, "Expecting Unicode escape sequence \\uXXXX");
        ++tokPos;
        var esc = readHexChar(4);
        var escStr = String.fromCharCode(esc);
        if (!escStr) raise(tokPos - 1, "Invalid Unicode escape");
        if (!(first ? isIdentifierStart(esc) : isIdentifierChar(esc)))
          raise(tokPos - 4, "Invalid Unicode escape");
        word += escStr;
      } else {
        break;
      }
      first = false;
    }
    return containsEsc ? word : input.slice(start, tokPos);
  }

  // Read an identifier or keyword token. Will check for reserved
  // words when necessary.

  function readWord() {
    var word = readWord1();
    var type = _name;
    if (!containsEsc) {
      if (isKeyword(word)) type = keywordTypes[word];
      else if (options.forbidReserved &&
               (options.ecmaVersion === 3 ? isReservedWord3 : isReservedWord5)(word) ||
               strict && isStrictReservedWord(word))
        raise(tokStart, "The keyword '" + word + "' is reserved");
    }
    return finishToken(type, word);
  }

  // ## Parser

  // A recursive descent parser operates by defining functions for all
  // syntactic elements, and recursively calling those, each function
  // advancing the input stream and returning an AST node. Precedence
  // of constructs (for example, the fact that `!x[1]` means `!(x[1])`
  // instead of `(!x)[1]` is handled by the fact that the parser
  // function that parses unary prefix operators is called first, and
  // in turn calls the function that parses `[]` subscripts — that
  // way, it'll receive the node for `x[1]` already parsed, and wraps
  // *that* in the unary operator node.
  //
  // Acorn uses an [operator precedence parser][opp] to handle binary
  // operator precedence, because it is much more compact than using
  // the technique outlined above, which uses different, nesting
  // functions to specify precedence, for all of the ten binary
  // precedence levels that JavaScript defines.
  //
  // [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser

  // ### Parser utilities

  // Continue to the next token.
  
  function next() {
    lastStart = tokStart;
    lastEnd = tokEnd;
    lastEndLoc = tokEndLoc;
    readToken();
  }

  // Enter strict mode. Re-reads the next token to please pedantic
  // tests ("use strict"; 010; -- should fail).

  function setStrict(strct) {
    strict = strct;
    tokPos = lastEnd;
    skipSpace();
    readToken();
  }

  // Start an AST node, attaching a start offset.

  function node_t() {
    this.type = null;
    this.start = tokStart;
    this.end = null;
  }

  function node_loc_t() {
    this.start = tokStartLoc;
    this.end = null;
    if (sourceFile !== null) this.source = sourceFile;
  }

  function startNode() {
    var node = new node_t();
    if (options.locations)
      node.loc = new node_loc_t();
    if (options.ranges)
      node.range = [tokStart, 0];
    return node;
  }

  // Start a node whose start offset information should be based on
  // the start of another node. For example, a binary operator node is
  // only started after its left-hand side has already been parsed.

  function startNodeFrom(other) {
    var node = new node_t();
    node.start = other.start;
    if (options.locations) {
      node.loc = new node_loc_t();
      node.loc.start = other.loc.start;
    }
    if (options.ranges)
      node.range = [other.range[0], 0];

    return node;
  }

  // Finish an AST node, adding `type` and `end` properties.

  function finishNode(node, type) {
    node.type = type;
    node.end = lastEnd;
    if (options.locations)
      node.loc.end = lastEndLoc;
    if (options.ranges)
      node.range[1] = lastEnd;
    return node;
  }

  // Test whether a statement node is the string literal `"use strict"`.

  function isUseStrict(stmt) {
    return options.ecmaVersion >= 5 && stmt.type === "ExpressionStatement" &&
      stmt.expression.type === "Literal" && stmt.expression.value === "use strict";
  }

  // Predicate that tests whether the next token is of the given
  // type, and if yes, consumes it as a side effect.

  function eat(type) {
    if (tokType === type) {
      next();
      return true;
    }
  }

  // Test whether a semicolon can be inserted at the current position.

  function canInsertSemicolon() {
    return !options.strictSemicolons &&
      (tokType === _eof || tokType === _braceR || newline.test(input.slice(lastEnd, tokStart)));
  }

  // Consume a semicolon, or, failing that, see if we are allowed to
  // pretend that there is a semicolon at this position.

  function semicolon() {
    if (!eat(_semi) && !canInsertSemicolon()) unexpected();
  }

  // Expect a token of a given type. If found, consume it, otherwise,
  // raise an unexpected token error.

  function expect(type) {
    if (tokType === type) next();
    else unexpected();
  }

  // Raise an unexpected token error.

  function unexpected() {
    raise(tokStart, "Unexpected token");
  }

  // Verify that a node is an lval — something that can be assigned
  // to.

  function checkLVal(expr) {
    if (expr.type !== "Identifier" && expr.type !== "MemberExpression")
      raise(expr.start, "Assigning to rvalue");
    if (strict && expr.type === "Identifier" && isStrictBadIdWord(expr.name))
      raise(expr.start, "Assigning to " + expr.name + " in strict mode");
  }

  // ### Statement parsing

  // Parse a program. Initializes the parser, reads any number of
  // statements, and wraps them in a Program node.  Optionally takes a
  // `program` argument.  If present, the statements will be appended
  // to its body instead of creating a new node.

  function parseTopLevel(program) {
    lastStart = lastEnd = tokPos;
    if (options.locations) lastEndLoc = new line_loc_t;
    inFunction = strict = null;
    labels = [];
    readToken();

    var node = program || startNode(), first = true;
    if (!program) node.body = [];
    while (tokType !== _eof) {
      var stmt = parseStatement();
      node.body.push(stmt);
      if (first && isUseStrict(stmt)) setStrict(true);
      first = false;
    }
    return finishNode(node, "Program");
  }

  var loopLabel = {kind: "loop"}, switchLabel = {kind: "switch"};

  // Parse a single statement.
  //
  // If expecting a statement and finding a slash operator, parse a
  // regular expression literal. This is to handle cases like
  // `if (foo) /blah/.exec(foo);`, where looking at the previous token
  // does not help.

  function parseStatement() {
    if (tokType === _slash)
      readToken(true);

    var starttype = tokType, node = startNode();

    // Most types of statements are recognized by the keyword they
    // start with. Many are trivial to parse, some require a bit of
    // complexity.

    switch (starttype) {
    case _break: case _continue:
      next();
      var isBreak = starttype === _break;
      if (eat(_semi) || canInsertSemicolon()) node.label = null;
      else if (tokType !== _name) unexpected();
      else {
        node.label = parseIdent();
        semicolon();
      }

      // Verify that there is an actual destination to break or
      // continue to.
      for (var i = 0; i < labels.length; ++i) {
        var lab = labels[i];
        if (node.label == null || lab.name === node.label.name) {
          if (lab.kind != null && (isBreak || lab.kind === "loop")) break;
          if (node.label && isBreak) break;
        }
      }
      if (i === labels.length) raise(node.start, "Unsyntactic " + starttype.keyword);
      return finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");

    case _debugger:
      next();
      semicolon();
      return finishNode(node, "DebuggerStatement");

    case _do:
      next();
      labels.push(loopLabel);
      node.body = parseStatement();
      labels.pop();
      expect(_while);
      node.test = parseParenExpression();
      semicolon();
      return finishNode(node, "DoWhileStatement");

      // Disambiguating between a `for` and a `for`/`in` loop is
      // non-trivial. Basically, we have to parse the init `var`
      // statement or expression, disallowing the `in` operator (see
      // the second parameter to `parseExpression`), and then check
      // whether the next token is `in`. When there is no init part
      // (semicolon immediately after the opening parenthesis), it is
      // a regular `for` loop.

    case _for:
      next();
      labels.push(loopLabel);
      expect(_parenL);
      if (tokType === _semi) return parseFor(node, null);
      if (tokType === _var) {
        var init = startNode();
        next();
        parseVar(init, true);
        if (init.declarations.length === 1 && eat(_in))
          return parseForIn(node, init);
        return parseFor(node, init);
      }
      var init = parseExpression(false, true);
      if (eat(_in)) {checkLVal(init); return parseForIn(node, init);}
      return parseFor(node, init);

    case _function:
      next();
      return parseFunction(node, true);

    case _if:
      next();
      node.test = parseParenExpression();
      node.consequent = parseStatement();
      node.alternate = eat(_else) ? parseStatement() : null;
      return finishNode(node, "IfStatement");

    case _return:
      if (!inFunction) raise(tokStart, "'return' outside of function");
      next();

      // In `return` (and `break`/`continue`), the keywords with
      // optional arguments, we eagerly look for a semicolon or the
      // possibility to insert one.
      
      if (eat(_semi) || canInsertSemicolon()) node.argument = null;
      else { node.argument = parseExpression(); semicolon(); }
      return finishNode(node, "ReturnStatement");

    case _switch:
      next();
      node.discriminant = parseParenExpression();
      node.cases = [];
      expect(_braceL);
      labels.push(switchLabel);

      // Statements under must be grouped (by label) in SwitchCase
      // nodes. `cur` is used to keep the node that we are currently
      // adding statements to.
      
      for (var cur, sawDefault; tokType != _braceR;) {
        if (tokType === _case || tokType === _default) {
          var isCase = tokType === _case;
          if (cur) finishNode(cur, "SwitchCase");
          node.cases.push(cur = startNode());
          cur.consequent = [];
          next();
          if (isCase) cur.test = parseExpression();
          else {
            if (sawDefault) raise(lastStart, "Multiple default clauses"); sawDefault = true;
            cur.test = null;
          }
          expect(_colon);
        } else {
          if (!cur) unexpected();
          cur.consequent.push(parseStatement());
        }
      }
      if (cur) finishNode(cur, "SwitchCase");
      next(); // Closing brace
      labels.pop();
      return finishNode(node, "SwitchStatement");

    case _throw:
      next();
      if (newline.test(input.slice(lastEnd, tokStart)))
        raise(lastEnd, "Illegal newline after throw");
      node.argument = parseExpression();
      semicolon();
      return finishNode(node, "ThrowStatement");

    case _try:
      next();
      node.block = parseBlock();
      node.handlers = [];
      while (tokType === _catch) {
        var clause = startNode();
        next();
        expect(_parenL);
        clause.param = parseIdent();
        if (strict && isStrictBadIdWord(clause.param.name))
          raise(clause.param.start, "Binding " + clause.param.name + " in strict mode");
        expect(_parenR);
        clause.guard = null;
        clause.body = parseBlock();
        node.handlers.push(finishNode(clause, "CatchClause"));
      }
      node.finalizer = eat(_finally) ? parseBlock() : null;
      if (!node.handlers.length && !node.finalizer)
        raise(node.start, "Missing catch or finally clause");
      return finishNode(node, "TryStatement");

    case _var:
      next();
      node = parseVar(node);
      semicolon();
      return node;

    case _while:
      next();
      node.test = parseParenExpression();
      labels.push(loopLabel);
      node.body = parseStatement();
      labels.pop();
      return finishNode(node, "WhileStatement");

    case _with:
      if (strict) raise(tokStart, "'with' in strict mode");
      next();
      node.object = parseParenExpression();
      node.body = parseStatement();
      return finishNode(node, "WithStatement");

    case _braceL:
      return parseBlock();

    case _semi:
      next();
      return finishNode(node, "EmptyStatement");

      // If the statement does not start with a statement keyword or a
      // brace, it's an ExpressionStatement or LabeledStatement. We
      // simply start parsing an expression, and afterwards, if the
      // next token is a colon and the expression was a simple
      // Identifier node, we switch to interpreting it as a label.

    default:
      var maybeName = tokVal, expr = parseExpression();
      if (starttype === _name && expr.type === "Identifier" && eat(_colon)) {
        for (var i = 0; i < labels.length; ++i)
          if (labels[i].name === maybeName) raise(expr.start, "Label '" + maybeName + "' is already declared");
        var kind = tokType.isLoop ? "loop" : tokType === _switch ? "switch" : null;
        labels.push({name: maybeName, kind: kind});
        node.body = parseStatement();
        labels.pop();
        node.label = expr;
        return finishNode(node, "LabeledStatement");
      } else {
        node.expression = expr;
        semicolon();
        return finishNode(node, "ExpressionStatement");
      }
    }
  }

  // Used for constructs like `switch` and `if` that insist on
  // parentheses around their expression.

  function parseParenExpression() {
    expect(_parenL);
    var val = parseExpression();
    expect(_parenR);
    return val;
  }

  // Parse a semicolon-enclosed block of statements, handling `"use
  // strict"` declarations when `allowStrict` is true (used for
  // function bodies).

  function parseBlock(allowStrict) {
    var node = startNode(), first = true, strict = false, oldStrict;
    node.body = [];
    expect(_braceL);
    while (!eat(_braceR)) {
      var stmt = parseStatement();
      node.body.push(stmt);
      if (first && isUseStrict(stmt)) {
        oldStrict = strict;
        setStrict(strict = true);
      }
      first = false
    }
    if (strict && !oldStrict) setStrict(false);
    return finishNode(node, "BlockStatement");
  }

  // Parse a regular `for` loop. The disambiguation code in
  // `parseStatement` will already have parsed the init statement or
  // expression.

  function parseFor(node, init) {
    node.init = init;
    expect(_semi);
    node.test = tokType === _semi ? null : parseExpression();
    expect(_semi);
    node.update = tokType === _parenR ? null : parseExpression();
    expect(_parenR);
    node.body = parseStatement();
    labels.pop();
    return finishNode(node, "ForStatement");
  }

  // Parse a `for`/`in` loop.

  function parseForIn(node, init) {
    node.left = init;
    node.right = parseExpression();
    expect(_parenR);
    node.body = parseStatement();
    labels.pop();
    return finishNode(node, "ForInStatement");
  }

  // Parse a list of variable declarations.

  function parseVar(node, noIn) {
    node.declarations = [];
    node.kind = "var";
    for (;;) {
      var decl = startNode();
      decl.id = parseIdent();
      if (strict && isStrictBadIdWord(decl.id.name))
        raise(decl.id.start, "Binding " + decl.id.name + " in strict mode");
      decl.init = eat(_eq) ? parseExpression(true, noIn) : null;
      node.declarations.push(finishNode(decl, "VariableDeclarator"));
      if (!eat(_comma)) break;
    }
    return finishNode(node, "VariableDeclaration");
  }

  // ### Expression parsing

  // These nest, from the most general expression type at the top to
  // 'atomic', nondivisible expression types at the bottom. Most of
  // the functions will simply let the function(s) below them parse,
  // and, *if* the syntactic construct they handle is present, wrap
  // the AST node that the inner parser gave them in another node.

  // Parse a full expression. The arguments are used to forbid comma
  // sequences (in argument lists, array literals, or object literals)
  // or the `in` operator (in for loops initalization expressions).

  function parseExpression(noComma, noIn) {
    var expr = parseMaybeAssign(noIn);
    if (!noComma && tokType === _comma) {
      var node = startNodeFrom(expr);
      node.expressions = [expr];
      while (eat(_comma)) node.expressions.push(parseMaybeAssign(noIn));
      return finishNode(node, "SequenceExpression");
    }
    return expr;
  }

  // Parse an assignment expression. This includes applications of
  // operators like `+=`.

  function parseMaybeAssign(noIn) {
    var left = parseMaybeConditional(noIn);
    if (tokType.isAssign) {
      var node = startNodeFrom(left);
      node.operator = tokVal;
      node.left = left;
      next();
      node.right = parseMaybeAssign(noIn);
      checkLVal(left);
      return finishNode(node, "AssignmentExpression");
    }
    return left;
  }

  // Parse a ternary conditional (`?:`) operator.

  function parseMaybeConditional(noIn) {
    var expr = parseExprOps(noIn);
    if (eat(_question)) {
      var node = startNodeFrom(expr);
      node.test = expr;
      node.consequent = parseExpression(true);
      expect(_colon);
      node.alternate = parseExpression(true, noIn);
      return finishNode(node, "ConditionalExpression");
    }
    return expr;
  }

  // Start the precedence parser.

  function parseExprOps(noIn) {
    return parseExprOp(parseMaybeUnary(noIn), -1, noIn);
  }

  // Parse binary operators with the operator precedence parsing
  // algorithm. `left` is the left-hand side of the operator.
  // `minPrec` provides context that allows the function to stop and
  // defer further parser to one of its callers when it encounters an
  // operator that has a lower precedence than the set it is parsing.

  function parseExprOp(left, minPrec, noIn) {
    var prec = tokType.binop;
    if (prec != null && (!noIn || tokType !== _in)) {
      if (prec > minPrec) {
        var node = startNodeFrom(left);
        node.left = left;
        node.operator = tokVal;
        next();
        node.right = parseExprOp(parseMaybeUnary(noIn), prec, noIn);
        var node = finishNode(node, /&&|\|\|/.test(node.operator) ? "LogicalExpression" : "BinaryExpression");
        return parseExprOp(node, minPrec, noIn);
      }
    }
    return left;
  }

  // Parse unary operators, both prefix and postfix.

  function parseMaybeUnary(noIn) {
    if (tokType.prefix) {
      var node = startNode(), update = tokType.isUpdate;
      node.operator = tokVal;
      node.prefix = true;
      next();
      node.argument = parseMaybeUnary(noIn);
      if (update) checkLVal(node.argument);
      else if (strict && node.operator === "delete" &&
               node.argument.type === "Identifier")
        raise(node.start, "Deleting local variable in strict mode");
      return finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
    }
    var expr = parseExprSubscripts();
    while (tokType.postfix && !canInsertSemicolon()) {
      var node = startNodeFrom(expr);
      node.operator = tokVal;
      node.prefix = false;
      node.argument = expr;
      checkLVal(expr);
      next();
      expr = finishNode(node, "UpdateExpression");
    }
    return expr;
  }

  // Parse call, dot, and `[]`-subscript expressions.

  function parseExprSubscripts() {
    return parseSubscripts(parseExprAtom());
  }

  function parseSubscripts(base, noCalls) {
    if (eat(_dot)) {
      var node = startNodeFrom(base);
      node.object = base;
      node.property = parseIdent(true);
      node.computed = false;
      return parseSubscripts(finishNode(node, "MemberExpression"), noCalls);
    } else if (eat(_bracketL)) {
      var node = startNodeFrom(base);
      node.object = base;
      node.property = parseExpression();
      node.computed = true;
      expect(_bracketR);
      return parseSubscripts(finishNode(node, "MemberExpression"), noCalls);
    } else if (!noCalls && eat(_parenL)) {
      var node = startNodeFrom(base);
      node.callee = base;
      node.arguments = parseExprList(_parenR, false);
      return parseSubscripts(finishNode(node, "CallExpression"), noCalls);
    } else return base;
  }

  // Parse an atomic expression — either a single token that is an
  // expression, an expression started by a keyword like `function` or
  // `new`, or an expression wrapped in punctuation like `()`, `[]`,
  // or `{}`.

  function parseExprAtom() {
    switch (tokType) {
    case _this:
      var node = startNode();
      next();
      return finishNode(node, "ThisExpression");
    case _name:
      return parseIdent();
    case _num: case _string: case _regexp:
      var node = startNode();
      node.value = tokVal;
      node.raw = input.slice(tokStart, tokEnd);
      next();
      return finishNode(node, "Literal");

    case _null: case _true: case _false:
      var node = startNode();
      node.value = tokType.atomValue;
      node.raw = tokType.keyword
      next();
      return finishNode(node, "Literal");

    case _parenL:
      var tokStartLoc1 = tokStartLoc, tokStart1 = tokStart;
      next();
      var val = parseExpression();
      val.start = tokStart1;
      val.end = tokEnd;
      if (options.locations) {
        val.loc.start = tokStartLoc1;
        val.loc.end = tokEndLoc;
      }
      if (options.ranges)
        val.range = [tokStart1, tokEnd];
      expect(_parenR);
      return val;

    case _bracketL:
      var node = startNode();
      next();
      node.elements = parseExprList(_bracketR, true, true);
      return finishNode(node, "ArrayExpression");

    case _braceL:
      return parseObj();

    case _function:
      var node = startNode();
      next();
      return parseFunction(node, false);

    case _new:
      return parseNew();

    default:
      unexpected();
    }
  }

  // New's precedence is slightly tricky. It must allow its argument
  // to be a `[]` or dot subscript expression, but not a call — at
  // least, not without wrapping it in parentheses. Thus, it uses the 

  function parseNew() {
    var node = startNode();
    next();
    node.callee = parseSubscripts(parseExprAtom(), true);
    if (eat(_parenL)) node.arguments = parseExprList(_parenR, false);
    else node.arguments = [];
    return finishNode(node, "NewExpression");
  }

  // Parse an object literal.

  function parseObj() {
    var node = startNode(), first = true, sawGetSet = false;
    node.properties = [];
    next();
    while (!eat(_braceR)) {
      if (!first) {
        expect(_comma);
        if (options.allowTrailingCommas && eat(_braceR)) break;
      } else first = false;

      var prop = {key: parsePropertyName()}, isGetSet = false, kind;
      if (eat(_colon)) {
        prop.value = parseExpression(true);
        kind = prop.kind = "init";
      } else if (options.ecmaVersion >= 5 && prop.key.type === "Identifier" &&
                 (prop.key.name === "get" || prop.key.name === "set")) {
        isGetSet = sawGetSet = true;
        kind = prop.kind = prop.key.name;
        prop.key = parsePropertyName();
        if (tokType !== _parenL) unexpected();
        prop.value = parseFunction(startNode(), false);
      } else unexpected();

      // getters and setters are not allowed to clash — either with
      // each other or with an init property — and in strict mode,
      // init properties are also not allowed to be repeated.

      if (prop.key.type === "Identifier" && (strict || sawGetSet)) {
        for (var i = 0; i < node.properties.length; ++i) {
          var other = node.properties[i];
          if (other.key.name === prop.key.name) {
            var conflict = kind == other.kind || isGetSet && other.kind === "init" ||
              kind === "init" && (other.kind === "get" || other.kind === "set");
            if (conflict && !strict && kind === "init" && other.kind === "init") conflict = false;
            if (conflict) raise(prop.key.start, "Redefinition of property");
          }
        }
      }
      node.properties.push(prop);
    }
    return finishNode(node, "ObjectExpression");
  }

  function parsePropertyName() {
    if (tokType === _num || tokType === _string) return parseExprAtom();
    return parseIdent(true);
  }

  // Parse a function declaration or literal (depending on the
  // `isStatement` parameter).

  function parseFunction(node, isStatement) {
    if (tokType === _name) node.id = parseIdent();
    else if (isStatement) unexpected();
    else node.id = null;
    node.params = [];
    var first = true;
    expect(_parenL);
    while (!eat(_parenR)) {
      if (!first) expect(_comma); else first = false;
      node.params.push(parseIdent());
    }

    // Start a new scope with regard to labels and the `inFunction`
    // flag (restore them to their old value afterwards).
    var oldInFunc = inFunction, oldLabels = labels;
    inFunction = true; labels = [];
    node.body = parseBlock(true);
    inFunction = oldInFunc; labels = oldLabels;

    // If this is a strict mode function, verify that argument names
    // are not repeated, and it does not try to bind the words `eval`
    // or `arguments`.
    if (strict || node.body.body.length && isUseStrict(node.body.body[0])) {
      for (var i = node.id ? -1 : 0; i < node.params.length; ++i) {
        var id = i < 0 ? node.id : node.params[i];
        if (isStrictReservedWord(id.name) || isStrictBadIdWord(id.name))
          raise(id.start, "Defining '" + id.name + "' in strict mode");
        if (i >= 0) for (var j = 0; j < i; ++j) if (id.name === node.params[j].name)
          raise(id.start, "Argument name clash in strict mode");
      }
    }

    return finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression");
  }

  // Parses a comma-separated list of expressions, and returns them as
  // an array. `close` is the token type that ends the list, and
  // `allowEmpty` can be turned on to allow subsequent commas with
  // nothing in between them to be parsed as `null` (which is needed
  // for array literals).

  function parseExprList(close, allowTrailingComma, allowEmpty) {
    var elts = [], first = true;
    while (!eat(close)) {
      if (!first) {
        expect(_comma);
        if (allowTrailingComma && options.allowTrailingCommas && eat(close)) break;
      } else first = false;

      if (allowEmpty && tokType === _comma) elts.push(null);
      else elts.push(parseExpression(true));
    }
    return elts;
  }

  // Parse the next token as an identifier. If `liberal` is true (used
  // when parsing properties), it will also convert keywords into
  // identifiers.

  function parseIdent(liberal) {
    var node = startNode();
    node.name = tokType === _name ? tokVal : (liberal && !options.forbidReserved && tokType.keyword) || unexpected();
    next();
    return finishNode(node, "Identifier");
  }

})(typeof exports === "undefined" ? (self.acorn = {}) : exports);

},{}],11:[function(require,module,exports){
/*
 * PEG.js 0.7.0
 *
 * http://pegjs.majda.cz/
 *
 * Copyright (c) 2010-2012 David Majda
 * Licensend under the MIT license.
 */
var PEG = (function(undefined) {

var PEG = {
  /* PEG.js version (uses semantic versioning). */
  VERSION: "0.7.0",

  /*
   * Generates a parser from a specified grammar and returns it.
   *
   * The grammar must be a string in the format described by the metagramar in
   * the parser.pegjs file.
   *
   * Throws |PEG.parser.SyntaxError| if the grammar contains a syntax error or
   * |PEG.GrammarError| if it contains a semantic error. Note that not all
   * errors are detected during the generation and some may protrude to the
   * generated parser and cause its malfunction.
   */
  buildParser: function(grammar, options) {
    return PEG.compiler.compile(PEG.parser.parse(grammar), options);
  }
};

/* Thrown when the grammar contains an error. */

PEG.GrammarError = function(message) {
  this.name = "PEG.GrammarError";
  this.message = message;
};

PEG.GrammarError.prototype = Error.prototype;

/* Like Python's |range|, but without |step|. */
function range(start, stop) {
  if (stop === undefined) {
    stop = start;
    start = 0;
  }

  var result = new Array(Math.max(0, stop - start));
  for (var i = 0, j = start; j < stop; i++, j++) {
    result[i] = j;
  }
  return result;
}

function find(array, callback) {
  var length = array.length;
  for (var i = 0; i < length; i++) {
    if (callback(array[i])) {
      return array[i];
    }
  }
}

function contains(array, value) {
  /*
   * Stupid IE does not have Array.prototype.indexOf, otherwise this function
   * would be a one-liner.
   */
  var length = array.length;
  for (var i = 0; i < length; i++) {
    if (array[i] === value) {
      return true;
    }
  }
  return false;
}

function each(array, callback) {
  var length = array.length;
  for (var i = 0; i < length; i++) {
    callback(array[i], i);
  }
}

function map(array, callback) {
  var result = [];
  var length = array.length;
  for (var i = 0; i < length; i++) {
    result[i] = callback(array[i], i);
  }
  return result;
}

function pluck(array, key) {
  return map(array, function (e) { return e[key]; });
}

function keys(object) {
  var result = [];
  for (var key in object) {
    result.push(key);
  }
  return result;
}

function values(object) {
  var result = [];
  for (var key in object) {
    result.push(object[key]);
  }
  return result;
}

/*
 * Returns a string padded on the left to a desired length with a character.
 *
 * The code needs to be in sync with the code template in the compilation
 * function for "action" nodes.
 */
function padLeft(input, padding, length) {
  var result = input;

  var padLength = length - input.length;
  for (var i = 0; i < padLength; i++) {
    result = padding + result;
  }

  return result;
}

/*
 * Returns an escape sequence for given character. Uses \x for characters <=
 * 0xFF to save space, \u for the rest.
 *
 * The code needs to be in sync with the code template in the compilation
 * function for "action" nodes.
 */
function escape(ch) {
  var charCode = ch.charCodeAt(0);
  var escapeChar;
  var length;

  if (charCode <= 0xFF) {
    escapeChar = 'x';
    length = 2;
  } else {
    escapeChar = 'u';
    length = 4;
  }

  return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
}

/*
 * Surrounds the string with quotes and escapes characters inside so that the
 * result is a valid JavaScript string.
 *
 * The code needs to be in sync with the code template in the compilation
 * function for "action" nodes.
 */
function quote(s) {
  /*
   * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a string
   * literal except for the closing quote character, backslash, carriage return,
   * line separator, paragraph separator, and line feed. Any character may
   * appear in the form of an escape sequence.
   *
   * For portability, we also escape escape all control and non-ASCII
   * characters. Note that "\0" and "\v" escape sequences are not used because
   * JSHint does not like the first and IE the second.
   */
  return '"' + s
    .replace(/\\/g, '\\\\')  // backslash
    .replace(/"/g, '\\"')    // closing quote character
    .replace(/\x08/g, '\\b') // backspace
    .replace(/\t/g, '\\t')   // horizontal tab
    .replace(/\n/g, '\\n')   // line feed
    .replace(/\f/g, '\\f')   // form feed
    .replace(/\r/g, '\\r')   // carriage return
    .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape)
    + '"';
}

/*
 * Escapes characters inside the string so that it can be used as a list of
 * characters in a character class of a regular expression.
 */
function quoteForRegexpClass(s) {
  /*
   * Based on ECMA-262, 5th ed., 7.8.5 & 15.10.1.
   *
   * For portability, we also escape escape all control and non-ASCII
   * characters.
   */
  return s
    .replace(/\\/g, '\\\\')  // backslash
    .replace(/\//g, '\\/')   // closing slash
    .replace(/\]/g, '\\]')   // closing bracket
    .replace(/-/g, '\\-')    // dash
    .replace(/\0/g, '\\0')   // null
    .replace(/\t/g, '\\t')   // horizontal tab
    .replace(/\n/g, '\\n')   // line feed
    .replace(/\v/g, '\\x0B') // vertical tab
    .replace(/\f/g, '\\f')   // form feed
    .replace(/\r/g, '\\r')   // carriage return
    .replace(/[\x01-\x08\x0E-\x1F\x80-\uFFFF]/g, escape);
}

/*
 * Builds a node visitor -- a function which takes a node and any number of
 * other parameters, calls an appropriate function according to the node type,
 * passes it all its parameters and returns its value. The functions for various
 * node types are passed in a parameter to |buildNodeVisitor| as a hash.
 */
function buildNodeVisitor(functions) {
  return function(node) {
    return functions[node.type].apply(null, arguments);
  };
}

function findRuleByName(ast, name) {
  return find(ast.rules, function(r) { return r.name === name; });
}
PEG.parser = (function(){
  /*
   * Generated by PEG.js 0.7.0.
   *
   * http://pegjs.majda.cz/
   */
  
  function quote(s) {
    /*
     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
     * string literal except for the closing quote character, backslash,
     * carriage return, line separator, paragraph separator, and line feed.
     * Any character may appear in the form of an escape sequence.
     *
     * For portability, we also escape escape all control and non-ASCII
     * characters. Note that "\0" and "\v" escape sequences are not used
     * because JSHint does not like the first and IE the second.
     */
     return '"' + s
      .replace(/\\/g, '\\\\')  // backslash
      .replace(/"/g, '\\"')    // closing quote character
      .replace(/\x08/g, '\\b') // backspace
      .replace(/\t/g, '\\t')   // horizontal tab
      .replace(/\n/g, '\\n')   // line feed
      .replace(/\f/g, '\\f')   // form feed
      .replace(/\r/g, '\\r')   // carriage return
      .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape)
      + '"';
  }
  
  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "grammar": parse_grammar,
        "initializer": parse_initializer,
        "rule": parse_rule,
        "choice": parse_choice,
        "sequence": parse_sequence,
        "labeled": parse_labeled,
        "prefixed": parse_prefixed,
        "suffixed": parse_suffixed,
        "primary": parse_primary,
        "action": parse_action,
        "braced": parse_braced,
        "nonBraceCharacters": parse_nonBraceCharacters,
        "nonBraceCharacter": parse_nonBraceCharacter,
        "equals": parse_equals,
        "colon": parse_colon,
        "semicolon": parse_semicolon,
        "slash": parse_slash,
        "and": parse_and,
        "not": parse_not,
        "question": parse_question,
        "star": parse_star,
        "plus": parse_plus,
        "lparen": parse_lparen,
        "rparen": parse_rparen,
        "dot": parse_dot,
        "identifier": parse_identifier,
        "literal": parse_literal,
        "string": parse_string,
        "doubleQuotedString": parse_doubleQuotedString,
        "doubleQuotedCharacter": parse_doubleQuotedCharacter,
        "simpleDoubleQuotedCharacter": parse_simpleDoubleQuotedCharacter,
        "singleQuotedString": parse_singleQuotedString,
        "singleQuotedCharacter": parse_singleQuotedCharacter,
        "simpleSingleQuotedCharacter": parse_simpleSingleQuotedCharacter,
        "class": parse_class,
        "classCharacterRange": parse_classCharacterRange,
        "classCharacter": parse_classCharacter,
        "bracketDelimitedCharacter": parse_bracketDelimitedCharacter,
        "simpleBracketDelimitedCharacter": parse_simpleBracketDelimitedCharacter,
        "simpleEscapeSequence": parse_simpleEscapeSequence,
        "zeroEscapeSequence": parse_zeroEscapeSequence,
        "hexEscapeSequence": parse_hexEscapeSequence,
        "unicodeEscapeSequence": parse_unicodeEscapeSequence,
        "eolEscapeSequence": parse_eolEscapeSequence,
        "digit": parse_digit,
        "hexDigit": parse_hexDigit,
        "letter": parse_letter,
        "lowerCaseLetter": parse_lowerCaseLetter,
        "upperCaseLetter": parse_upperCaseLetter,
        "__": parse___,
        "comment": parse_comment,
        "singleLineComment": parse_singleLineComment,
        "multiLineComment": parse_multiLineComment,
        "eol": parse_eol,
        "eolChar": parse_eolChar,
        "whitespace": parse_whitespace
      };
      
      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "grammar";
      }
      
      var pos = 0;
      var reportFailures = 0;
      var rightmostFailuresPos = 0;
      var rightmostFailuresExpected = [];
      
      function padLeft(input, padding, length) {
        var result = input;
        
        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }
        
        return result;
      }
      
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        var escapeChar;
        var length;
        
        if (charCode <= 0xFF) {
          escapeChar = 'x';
          length = 2;
        } else {
          escapeChar = 'u';
          length = 4;
        }
        
        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }
      
      function matchFailed(failure) {
        if (pos < rightmostFailuresPos) {
          return;
        }
        
        if (pos > rightmostFailuresPos) {
          rightmostFailuresPos = pos;
          rightmostFailuresExpected = [];
        }
        
        rightmostFailuresExpected.push(failure);
      }
      
      function parse_grammar() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse___();
        if (result0 !== null) {
          result1 = parse_initializer();
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result3 = parse_rule();
            if (result3 !== null) {
              result2 = [];
              while (result3 !== null) {
                result2.push(result3);
                result3 = parse_rule();
              }
            } else {
              result2 = null;
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, initializer, rules) {
              return {
                type:        "grammar",
                initializer: initializer !== "" ? initializer : null,
                rules:       rules,
                startRule:   rules[0].name
              };
            })(pos0, result0[1], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_initializer() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_action();
        if (result0 !== null) {
          result1 = parse_semicolon();
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, code) {
              return {
                type: "initializer",
                code: code
              };
            })(pos0, result0[0]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_rule() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_identifier();
        if (result0 !== null) {
          result1 = parse_string();
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result2 = parse_equals();
            if (result2 !== null) {
              result3 = parse_choice();
              if (result3 !== null) {
                result4 = parse_semicolon();
                result4 = result4 !== null ? result4 : "";
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, name, displayName, expression) {
              return {
                type:        "rule",
                name:        name,
                displayName: displayName !== "" ? displayName : null,
                expression:  expression
              };
            })(pos0, result0[0], result0[1], result0[3]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_choice() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_sequence();
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = parse_slash();
          if (result2 !== null) {
            result3 = parse_sequence();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = parse_slash();
            if (result2 !== null) {
              result3 = parse_sequence();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, head, tail) {
              if (tail.length > 0) {
                var alternatives = [head].concat(map(
                    tail,
                    function(element) { return element[1]; }
                ));
                return {
                  type:         "choice",
                  alternatives: alternatives
                };
              } else {
                return head;
              }
            })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_sequence() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = [];
        result1 = parse_labeled();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_labeled();
        }
        if (result0 !== null) {
          result1 = parse_action();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, elements, code) {
              var expression = elements.length !== 1
                ? {
                    type:     "sequence",
                    elements: elements
                  }
                : elements[0];
              return {
                type:       "action",
                expression: expression,
                code:       code
              };
            })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          result0 = [];
          result1 = parse_labeled();
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_labeled();
          }
          if (result0 !== null) {
            result0 = (function(offset, elements) {
                return elements.length !== 1
                  ? {
                      type:     "sequence",
                      elements: elements
                    }
                  : elements[0];
              })(pos0, result0);
          }
          if (result0 === null) {
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_labeled() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_identifier();
        if (result0 !== null) {
          result1 = parse_colon();
          if (result1 !== null) {
            result2 = parse_prefixed();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, label, expression) {
              return {
                type:       "labeled",
                label:      label,
                expression: expression
              };
            })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_prefixed();
        }
        return result0;
      }
      
      function parse_prefixed() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_and();
        if (result0 !== null) {
          result1 = parse_action();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, code) {
              return {
                type: "semantic_and",
                code: code
              };
            })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_and();
          if (result0 !== null) {
            result1 = parse_suffixed();
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, expression) {
                return {
                  type:       "simple_and",
                  expression: expression
                };
              })(pos0, result0[1]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            result0 = parse_not();
            if (result0 !== null) {
              result1 = parse_action();
              if (result1 !== null) {
                result0 = [result0, result1];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, code) {
                  return {
                    type: "semantic_not",
                    code: code
                  };
                })(pos0, result0[1]);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              pos0 = pos;
              pos1 = pos;
              result0 = parse_not();
              if (result0 !== null) {
                result1 = parse_suffixed();
                if (result1 !== null) {
                  result0 = [result0, result1];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
              if (result0 !== null) {
                result0 = (function(offset, expression) {
                    return {
                      type:       "simple_not",
                      expression: expression
                    };
                  })(pos0, result0[1]);
              }
              if (result0 === null) {
                pos = pos0;
              }
              if (result0 === null) {
                result0 = parse_suffixed();
              }
            }
          }
        }
        return result0;
      }
      
      function parse_suffixed() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_primary();
        if (result0 !== null) {
          result1 = parse_question();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, expression) {
              return {
                type:       "optional",
                expression: expression
              };
            })(pos0, result0[0]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_primary();
          if (result0 !== null) {
            result1 = parse_star();
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, expression) {
                return {
                  type:       "zero_or_more",
                  expression: expression
                };
              })(pos0, result0[0]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            result0 = parse_primary();
            if (result0 !== null) {
              result1 = parse_plus();
              if (result1 !== null) {
                result0 = [result0, result1];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, expression) {
                  return {
                    type:       "one_or_more",
                    expression: expression
                  };
                })(pos0, result0[0]);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              result0 = parse_primary();
            }
          }
        }
        return result0;
      }
      
      function parse_primary() {
        var result0, result1, result2;
        var pos0, pos1, pos2, pos3;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_identifier();
        if (result0 !== null) {
          pos2 = pos;
          reportFailures++;
          pos3 = pos;
          result1 = parse_string();
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result2 = parse_equals();
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos3;
            }
          } else {
            result1 = null;
            pos = pos3;
          }
          reportFailures--;
          if (result1 === null) {
            result1 = "";
          } else {
            result1 = null;
            pos = pos2;
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, name) {
              return {
                type: "rule_ref",
                name: name
              };
            })(pos0, result0[0]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_literal();
          if (result0 === null) {
            pos0 = pos;
            result0 = parse_dot();
            if (result0 !== null) {
              result0 = (function(offset) { return { type: "any" }; })(pos0);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              result0 = parse_class();
              if (result0 === null) {
                pos0 = pos;
                pos1 = pos;
                result0 = parse_lparen();
                if (result0 !== null) {
                  result1 = parse_choice();
                  if (result1 !== null) {
                    result2 = parse_rparen();
                    if (result2 !== null) {
                      result0 = [result0, result1, result2];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
                if (result0 !== null) {
                  result0 = (function(offset, expression) { return expression; })(pos0, result0[1]);
                }
                if (result0 === null) {
                  pos = pos0;
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_action() {
        var result0, result1;
        var pos0, pos1;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        result0 = parse_braced();
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, braced) { return braced.substr(1, braced.length - 2); })(pos0, result0[0]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("action");
        }
        return result0;
      }
      
      function parse_braced() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 123) {
          result0 = "{";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"{\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse_braced();
          if (result2 === null) {
            result2 = parse_nonBraceCharacter();
          }
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_braced();
            if (result2 === null) {
              result2 = parse_nonBraceCharacter();
            }
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 125) {
              result2 = "}";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"}\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, parts) {
              return "{" + parts.join("") + "}";
            })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_nonBraceCharacters() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_nonBraceCharacter();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_nonBraceCharacter();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, chars) { return chars.join(""); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_nonBraceCharacter() {
        var result0;
        
        if (/^[^{}]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[^{}]");
          }
        }
        return result0;
      }
      
      function parse_equals() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 61) {
          result0 = "=";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"=\"");
          }
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) { return "="; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_colon() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 58) {
          result0 = ":";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\":\"");
          }
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) { return ":"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_semicolon() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 59) {
          result0 = ";";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\";\"");
          }
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) { return ";"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_slash() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 47) {
          result0 = "/";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"/\"");
          }
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) { return "/"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_and() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 38) {
          result0 = "&";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"&\"");
          }
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) { return "&"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_not() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 33) {
          result0 = "!";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"!\"");
          }
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) { return "!"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_question() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 63) {
          result0 = "?";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"?\"");
          }
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) { return "?"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_star() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 42) {
          result0 = "*";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"*\"");
          }
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) { return "*"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_plus() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 43) {
          result0 = "+";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"+\"");
          }
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) { return "+"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_lparen() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 40) {
          result0 = "(";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"(\"");
          }
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) { return "("; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_rparen() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 41) {
          result0 = ")";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\")\"");
          }
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) { return ")"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_dot() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 46) {
          result0 = ".";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\".\"");
          }
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) { return "."; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_identifier() {
        var result0, result1, result2;
        var pos0, pos1;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        result0 = parse_letter();
        if (result0 === null) {
          if (input.charCodeAt(pos) === 95) {
            result0 = "_";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"_\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 36) {
              result0 = "$";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"$\"");
              }
            }
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse_letter();
          if (result2 === null) {
            result2 = parse_digit();
            if (result2 === null) {
              if (input.charCodeAt(pos) === 95) {
                result2 = "_";
                pos++;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("\"_\"");
                }
              }
              if (result2 === null) {
                if (input.charCodeAt(pos) === 36) {
                  result2 = "$";
                  pos++;
                } else {
                  result2 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"$\"");
                  }
                }
              }
            }
          }
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_letter();
            if (result2 === null) {
              result2 = parse_digit();
              if (result2 === null) {
                if (input.charCodeAt(pos) === 95) {
                  result2 = "_";
                  pos++;
                } else {
                  result2 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"_\"");
                  }
                }
                if (result2 === null) {
                  if (input.charCodeAt(pos) === 36) {
                    result2 = "$";
                    pos++;
                  } else {
                    result2 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"$\"");
                    }
                  }
                }
              }
            }
          }
          if (result1 !== null) {
            result2 = parse___();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, head, tail) {
              return head + tail.join("");
            })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("identifier");
        }
        return result0;
      }
      
      function parse_literal() {
        var result0, result1, result2;
        var pos0, pos1;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        result0 = parse_doubleQuotedString();
        if (result0 === null) {
          result0 = parse_singleQuotedString();
        }
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 105) {
            result1 = "i";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"i\"");
            }
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result2 = parse___();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, value, flags) {
              return {
                type:       "literal",
                value:      value,
                ignoreCase: flags === "i"
              };
            })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("literal");
        }
        return result0;
      }
      
      function parse_string() {
        var result0, result1;
        var pos0, pos1;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        result0 = parse_doubleQuotedString();
        if (result0 === null) {
          result0 = parse_singleQuotedString();
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, string) { return string; })(pos0, result0[0]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("string");
        }
        return result0;
      }
      
      function parse_doubleQuotedString() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 34) {
          result0 = "\"";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\\"\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse_doubleQuotedCharacter();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_doubleQuotedCharacter();
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 34) {
              result2 = "\"";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"\\\"\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, chars) { return chars.join(""); })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_doubleQuotedCharacter() {
        var result0;
        
        result0 = parse_simpleDoubleQuotedCharacter();
        if (result0 === null) {
          result0 = parse_simpleEscapeSequence();
          if (result0 === null) {
            result0 = parse_zeroEscapeSequence();
            if (result0 === null) {
              result0 = parse_hexEscapeSequence();
              if (result0 === null) {
                result0 = parse_unicodeEscapeSequence();
                if (result0 === null) {
                  result0 = parse_eolEscapeSequence();
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_simpleDoubleQuotedCharacter() {
        var result0, result1;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        pos2 = pos;
        reportFailures++;
        if (input.charCodeAt(pos) === 34) {
          result0 = "\"";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\\"\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 92) {
            result0 = "\\";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"\\\\\"");
            }
          }
          if (result0 === null) {
            result0 = parse_eolChar();
          }
        }
        reportFailures--;
        if (result0 === null) {
          result0 = "";
        } else {
          result0 = null;
          pos = pos2;
        }
        if (result0 !== null) {
          if (input.length > pos) {
            result1 = input.charAt(pos);
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("any character");
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, char_) { return char_; })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_singleQuotedString() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 39) {
          result0 = "'";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"'\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse_singleQuotedCharacter();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_singleQuotedCharacter();
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 39) {
              result2 = "'";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"'\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, chars) { return chars.join(""); })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_singleQuotedCharacter() {
        var result0;
        
        result0 = parse_simpleSingleQuotedCharacter();
        if (result0 === null) {
          result0 = parse_simpleEscapeSequence();
          if (result0 === null) {
            result0 = parse_zeroEscapeSequence();
            if (result0 === null) {
              result0 = parse_hexEscapeSequence();
              if (result0 === null) {
                result0 = parse_unicodeEscapeSequence();
                if (result0 === null) {
                  result0 = parse_eolEscapeSequence();
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_simpleSingleQuotedCharacter() {
        var result0, result1;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        pos2 = pos;
        reportFailures++;
        if (input.charCodeAt(pos) === 39) {
          result0 = "'";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"'\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 92) {
            result0 = "\\";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"\\\\\"");
            }
          }
          if (result0 === null) {
            result0 = parse_eolChar();
          }
        }
        reportFailures--;
        if (result0 === null) {
          result0 = "";
        } else {
          result0 = null;
          pos = pos2;
        }
        if (result0 !== null) {
          if (input.length > pos) {
            result1 = input.charAt(pos);
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("any character");
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, char_) { return char_; })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_class() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 91) {
          result0 = "[";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"[\"");
          }
        }
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 94) {
            result1 = "^";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"^\"");
            }
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result2 = [];
            result3 = parse_classCharacterRange();
            if (result3 === null) {
              result3 = parse_classCharacter();
            }
            while (result3 !== null) {
              result2.push(result3);
              result3 = parse_classCharacterRange();
              if (result3 === null) {
                result3 = parse_classCharacter();
              }
            }
            if (result2 !== null) {
              if (input.charCodeAt(pos) === 93) {
                result3 = "]";
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\"]\"");
                }
              }
              if (result3 !== null) {
                if (input.charCodeAt(pos) === 105) {
                  result4 = "i";
                  pos++;
                } else {
                  result4 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"i\"");
                  }
                }
                result4 = result4 !== null ? result4 : "";
                if (result4 !== null) {
                  result5 = parse___();
                  if (result5 !== null) {
                    result0 = [result0, result1, result2, result3, result4, result5];
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, inverted, parts, flags) {
              var partsConverted = map(parts, function(part) { return part.data; });
              var rawText = "["
                + inverted
                + map(parts, function(part) { return part.rawText; }).join("")
                + "]"
                + flags;
        
              return {
                type:       "class",
                inverted:   inverted === "^",
                ignoreCase: flags === "i",
                parts:      partsConverted,
                // FIXME: Get the raw text from the input directly.
                rawText:    rawText
              };
            })(pos0, result0[1], result0[2], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("character class");
        }
        return result0;
      }
      
      function parse_classCharacterRange() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_classCharacter();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 45) {
            result1 = "-";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"-\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_classCharacter();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, begin, end) {
              if (begin.data.charCodeAt(0) > end.data.charCodeAt(0)) {
                throw new this.SyntaxError(
                  "Invalid character range: " + begin.rawText + "-" + end.rawText + "."
                );
              }
        
              return {
                data:    [begin.data, end.data],
                // FIXME: Get the raw text from the input directly.
                rawText: begin.rawText + "-" + end.rawText
              };
            })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_classCharacter() {
        var result0;
        var pos0;
        
        pos0 = pos;
        result0 = parse_bracketDelimitedCharacter();
        if (result0 !== null) {
          result0 = (function(offset, char_) {
              return {
                data:    char_,
                // FIXME: Get the raw text from the input directly.
                rawText: quoteForRegexpClass(char_)
              };
            })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_bracketDelimitedCharacter() {
        var result0;
        
        result0 = parse_simpleBracketDelimitedCharacter();
        if (result0 === null) {
          result0 = parse_simpleEscapeSequence();
          if (result0 === null) {
            result0 = parse_zeroEscapeSequence();
            if (result0 === null) {
              result0 = parse_hexEscapeSequence();
              if (result0 === null) {
                result0 = parse_unicodeEscapeSequence();
                if (result0 === null) {
                  result0 = parse_eolEscapeSequence();
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_simpleBracketDelimitedCharacter() {
        var result0, result1;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        pos2 = pos;
        reportFailures++;
        if (input.charCodeAt(pos) === 93) {
          result0 = "]";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"]\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 92) {
            result0 = "\\";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"\\\\\"");
            }
          }
          if (result0 === null) {
            result0 = parse_eolChar();
          }
        }
        reportFailures--;
        if (result0 === null) {
          result0 = "";
        } else {
          result0 = null;
          pos = pos2;
        }
        if (result0 !== null) {
          if (input.length > pos) {
            result1 = input.charAt(pos);
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("any character");
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, char_) { return char_; })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_simpleEscapeSequence() {
        var result0, result1, result2;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 92) {
          result0 = "\\";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\\\\"");
          }
        }
        if (result0 !== null) {
          pos2 = pos;
          reportFailures++;
          result1 = parse_digit();
          if (result1 === null) {
            if (input.charCodeAt(pos) === 120) {
              result1 = "x";
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\"x\"");
              }
            }
            if (result1 === null) {
              if (input.charCodeAt(pos) === 117) {
                result1 = "u";
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"u\"");
                }
              }
              if (result1 === null) {
                result1 = parse_eolChar();
              }
            }
          }
          reportFailures--;
          if (result1 === null) {
            result1 = "";
          } else {
            result1 = null;
            pos = pos2;
          }
          if (result1 !== null) {
            if (input.length > pos) {
              result2 = input.charAt(pos);
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("any character");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, char_) {
              return char_
                .replace("b", "\b")
                .replace("f", "\f")
                .replace("n", "\n")
                .replace("r", "\r")
                .replace("t", "\t")
                .replace("v", "\x0B"); // IE does not recognize "\v".
            })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_zeroEscapeSequence() {
        var result0, result1;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 2) === "\\0") {
          result0 = "\\0";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\\\0\"");
          }
        }
        if (result0 !== null) {
          pos2 = pos;
          reportFailures++;
          result1 = parse_digit();
          reportFailures--;
          if (result1 === null) {
            result1 = "";
          } else {
            result1 = null;
            pos = pos2;
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) { return "\x00"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_hexEscapeSequence() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 2) === "\\x") {
          result0 = "\\x";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\\\x\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_hexDigit();
          if (result1 !== null) {
            result2 = parse_hexDigit();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, h1, h2) {
              return String.fromCharCode(parseInt(h1 + h2, 16));
            })(pos0, result0[1], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_unicodeEscapeSequence() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 2) === "\\u") {
          result0 = "\\u";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\\\u\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_hexDigit();
          if (result1 !== null) {
            result2 = parse_hexDigit();
            if (result2 !== null) {
              result3 = parse_hexDigit();
              if (result3 !== null) {
                result4 = parse_hexDigit();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, h1, h2, h3, h4) {
              return String.fromCharCode(parseInt(h1 + h2 + h3 + h4, 16));
            })(pos0, result0[1], result0[2], result0[3], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_eolEscapeSequence() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 92) {
          result0 = "\\";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\\\\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_eol();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, eol) { return eol; })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_digit() {
        var result0;
        
        if (/^[0-9]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[0-9]");
          }
        }
        return result0;
      }
      
      function parse_hexDigit() {
        var result0;
        
        if (/^[0-9a-fA-F]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[0-9a-fA-F]");
          }
        }
        return result0;
      }
      
      function parse_letter() {
        var result0;
        
        result0 = parse_lowerCaseLetter();
        if (result0 === null) {
          result0 = parse_upperCaseLetter();
        }
        return result0;
      }
      
      function parse_lowerCaseLetter() {
        var result0;
        
        if (/^[a-z]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[a-z]");
          }
        }
        return result0;
      }
      
      function parse_upperCaseLetter() {
        var result0;
        
        if (/^[A-Z]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[A-Z]");
          }
        }
        return result0;
      }
      
      function parse___() {
        var result0, result1;
        
        result0 = [];
        result1 = parse_whitespace();
        if (result1 === null) {
          result1 = parse_eol();
          if (result1 === null) {
            result1 = parse_comment();
          }
        }
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_whitespace();
          if (result1 === null) {
            result1 = parse_eol();
            if (result1 === null) {
              result1 = parse_comment();
            }
          }
        }
        return result0;
      }
      
      function parse_comment() {
        var result0;
        
        reportFailures++;
        result0 = parse_singleLineComment();
        if (result0 === null) {
          result0 = parse_multiLineComment();
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("comment");
        }
        return result0;
      }
      
      function parse_singleLineComment() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        if (input.substr(pos, 2) === "//") {
          result0 = "//";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"//\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          pos2 = pos;
          reportFailures++;
          result2 = parse_eolChar();
          reportFailures--;
          if (result2 === null) {
            result2 = "";
          } else {
            result2 = null;
            pos = pos2;
          }
          if (result2 !== null) {
            if (input.length > pos) {
              result3 = input.charAt(pos);
              pos++;
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("any character");
              }
            }
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            pos2 = pos;
            reportFailures++;
            result2 = parse_eolChar();
            reportFailures--;
            if (result2 === null) {
              result2 = "";
            } else {
              result2 = null;
              pos = pos2;
            }
            if (result2 !== null) {
              if (input.length > pos) {
                result3 = input.charAt(pos);
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("any character");
                }
              }
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_multiLineComment() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        if (input.substr(pos, 2) === "/*") {
          result0 = "/*";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"/*\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          pos2 = pos;
          reportFailures++;
          if (input.substr(pos, 2) === "*/") {
            result2 = "*/";
            pos += 2;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("\"*/\"");
            }
          }
          reportFailures--;
          if (result2 === null) {
            result2 = "";
          } else {
            result2 = null;
            pos = pos2;
          }
          if (result2 !== null) {
            if (input.length > pos) {
              result3 = input.charAt(pos);
              pos++;
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("any character");
              }
            }
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            pos2 = pos;
            reportFailures++;
            if (input.substr(pos, 2) === "*/") {
              result2 = "*/";
              pos += 2;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"*/\"");
              }
            }
            reportFailures--;
            if (result2 === null) {
              result2 = "";
            } else {
              result2 = null;
              pos = pos2;
            }
            if (result2 !== null) {
              if (input.length > pos) {
                result3 = input.charAt(pos);
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("any character");
                }
              }
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            if (input.substr(pos, 2) === "*/") {
              result2 = "*/";
              pos += 2;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"*/\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_eol() {
        var result0;
        
        reportFailures++;
        if (input.charCodeAt(pos) === 10) {
          result0 = "\n";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\n\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 2) === "\r\n") {
            result0 = "\r\n";
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"\\r\\n\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 13) {
              result0 = "\r";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"\\r\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 8232) {
                result0 = "\u2028";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"\\u2028\"");
                }
              }
              if (result0 === null) {
                if (input.charCodeAt(pos) === 8233) {
                  result0 = "\u2029";
                  pos++;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"\\u2029\"");
                  }
                }
              }
            }
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("end of line");
        }
        return result0;
      }
      
      function parse_eolChar() {
        var result0;
        
        if (/^[\n\r\u2028\u2029]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\n\\r\\u2028\\u2029]");
          }
        }
        return result0;
      }
      
      function parse_whitespace() {
        var result0;
        
        reportFailures++;
        if (/^[ \t\x0B\f\xA0\uFEFF\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[ \\t\\x0B\\f\\xA0\\uFEFF\\u1680\\u180E\\u2000-\\u200A\\u202F\\u205F\\u3000]");
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("whitespace");
        }
        return result0;
      }
      
      
      function cleanupExpected(expected) {
        expected.sort();
        
        var lastExpected = null;
        var cleanExpected = [];
        for (var i = 0; i < expected.length; i++) {
          if (expected[i] !== lastExpected) {
            cleanExpected.push(expected[i]);
            lastExpected = expected[i];
          }
        }
        return cleanExpected;
      }
      
      function computeErrorPosition() {
        /*
         * The first idea was to use |String.split| to break the input up to the
         * error position along newlines and derive the line and column from
         * there. However IE's |split| implementation is so broken that it was
         * enough to prevent it.
         */
        
        var line = 1;
        var column = 1;
        var seenCR = false;
        
        for (var i = 0; i < Math.max(pos, rightmostFailuresPos); i++) {
          var ch = input.charAt(i);
          if (ch === "\n") {
            if (!seenCR) { line++; }
            column = 1;
            seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            line++;
            column = 1;
            seenCR = true;
          } else {
            column++;
            seenCR = false;
          }
        }
        
        return { line: line, column: column };
      }
      
      
      var result = parseFunctions[startRule]();
      
      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |pos === input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |pos < input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |pos === 0|
       *   - |rightmostFailuresExpected| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || pos !== input.length) {
        var offset = Math.max(pos, rightmostFailuresPos);
        var found = offset < input.length ? input.charAt(offset) : null;
        var errorPosition = computeErrorPosition();
        
        throw new this.SyntaxError(
          cleanupExpected(rightmostFailuresExpected),
          found,
          offset,
          errorPosition.line,
          errorPosition.column
        );
      }
      
      return result;
    },
    
    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };
  
  /* Thrown when a parser encounters a syntax error. */
  
  result.SyntaxError = function(expected, found, offset, line, column) {
    function buildMessage(expected, found) {
      var expectedHumanized, foundHumanized;
      
      switch (expected.length) {
        case 0:
          expectedHumanized = "end of input";
          break;
        case 1:
          expectedHumanized = expected[0];
          break;
        default:
          expectedHumanized = expected.slice(0, expected.length - 1).join(", ")
            + " or "
            + expected[expected.length - 1];
      }
      
      foundHumanized = found ? quote(found) : "end of input";
      
      return "Expected " + expectedHumanized + " but " + foundHumanized + " found.";
    }
    
    this.name = "SyntaxError";
    this.expected = expected;
    this.found = found;
    this.message = buildMessage(expected, found);
    this.offset = offset;
    this.line = line;
    this.column = column;
  };
  
  result.SyntaxError.prototype = Error.prototype;
  
  return result;
})();
PEG.compiler = {
  /*
   * Names of passes that will get run during the compilation (in the specified
   * order).
   */
  appliedPassNames: [
    "reportMissingRules",
    "reportLeftRecursion",
    "removeProxyRules",
    "computeVarNames",
    "computeParams"
  ],

  /*
   * Generates a parser from a specified grammar AST. Throws |PEG.GrammarError|
   * if the AST contains a semantic error. Note that not all errors are detected
   * during the generation and some may protrude to the generated parser and
   * cause its malfunction.
   */
  compile: function(ast, options) {
    var that = this;

    each(this.appliedPassNames, function(passName) {
      that.passes[passName](ast);
    });

    var source = this.emitter(ast, options);
    var result = eval(source);
    result._source = source;

    return result;
  }
};

/*
 * Compiler passes.
 *
 * Each pass is a function that is passed the AST. It can perform checks on it
 * or modify it as needed. If the pass encounters a semantic error, it throws
 * |PEG.GrammarError|.
 */
PEG.compiler.passes = {
  /* Checks that all referenced rules exist. */
  reportMissingRules: function(ast) {
    function nop() {}

    function checkExpression(node) { check(node.expression); }

    function checkSubnodes(propertyName) {
      return function(node) { each(node[propertyName], check); };
    }

    var check = buildNodeVisitor({
      grammar:      checkSubnodes("rules"),
      rule:         checkExpression,
      choice:       checkSubnodes("alternatives"),
      sequence:     checkSubnodes("elements"),
      labeled:      checkExpression,
      simple_and:   checkExpression,
      simple_not:   checkExpression,
      semantic_and: nop,
      semantic_not: nop,
      optional:     checkExpression,
      zero_or_more: checkExpression,
      one_or_more:  checkExpression,
      action:       checkExpression,

      rule_ref:
        function(node) {
          if (!findRuleByName(ast, node.name)) {
            throw new PEG.GrammarError(
              "Referenced rule \"" + node.name + "\" does not exist."
            );
          }
        },

      literal:      nop,
      any:          nop,
      "class":      nop
    });

    check(ast);
  },

  /* Checks that no left recursion is present. */
  reportLeftRecursion: function(ast) {
    function nop() {}

    function checkExpression(node, appliedRules) {
      check(node.expression, appliedRules);
    }

    function checkSubnodes(propertyName) {
      return function(node, appliedRules) {
        each(node[propertyName], function(subnode) {
          check(subnode, appliedRules);
        });
      };
    }

    var check = buildNodeVisitor({
      grammar:     checkSubnodes("rules"),

      rule:
        function(node, appliedRules) {
          check(node.expression, appliedRules.concat(node.name));
        },

      choice:      checkSubnodes("alternatives"),

      sequence:
        function(node, appliedRules) {
          if (node.elements.length > 0) {
            check(node.elements[0], appliedRules);
          }
        },

      labeled:      checkExpression,
      simple_and:   checkExpression,
      simple_not:   checkExpression,
      semantic_and: nop,
      semantic_not: nop,
      optional:     checkExpression,
      zero_or_more: checkExpression,
      one_or_more:  checkExpression,
      action:       checkExpression,

      rule_ref:
        function(node, appliedRules) {
          if (contains(appliedRules, node.name)) {
            throw new PEG.GrammarError(
              "Left recursion detected for rule \"" + node.name + "\"."
            );
          }
          check(findRuleByName(ast, node.name), appliedRules);
        },

      literal:      nop,
      any:          nop,
      "class":      nop
    });

    check(ast, []);
  },

  /*
   * Removes proxy rules -- that is, rules that only delegate to other rule.
   */
  removeProxyRules: function(ast) {
    function isProxyRule(node) {
      return node.type === "rule" && node.expression.type === "rule_ref";
    }

    function replaceRuleRefs(ast, from, to) {
      function nop() {}

      function replaceInExpression(node, from, to) {
        replace(node.expression, from, to);
      }

      function replaceInSubnodes(propertyName) {
        return function(node, from, to) {
          each(node[propertyName], function(subnode) {
            replace(subnode, from, to);
          });
        };
      }

      var replace = buildNodeVisitor({
        grammar:      replaceInSubnodes("rules"),
        rule:         replaceInExpression,
        choice:       replaceInSubnodes("alternatives"),
        sequence:     replaceInSubnodes("elements"),
        labeled:      replaceInExpression,
        simple_and:   replaceInExpression,
        simple_not:   replaceInExpression,
        semantic_and: nop,
        semantic_not: nop,
        optional:     replaceInExpression,
        zero_or_more: replaceInExpression,
        one_or_more:  replaceInExpression,
        action:       replaceInExpression,

        rule_ref:
          function(node, from, to) {
            if (node.name === from) {
              node.name = to;
            }
          },

        literal:      nop,
        any:          nop,
        "class":      nop
      });

      replace(ast, from, to);
    }

    var indices = [];

    each(ast.rules, function(rule, i) {
      if (isProxyRule(rule)) {
        replaceRuleRefs(ast, rule.name, rule.expression.name);
        if (rule.name === ast.startRule) {
          ast.startRule = rule.expression.name;
        }
        indices.push(i);
      }
    });

    indices.reverse();

    each(indices, function(index) {
      ast.rules.splice(index, 1);
    });
  },

  /*
   * Computes names of variables used for storing match results and parse
   * positions in generated code. These variables are organized as two stacks.
   * The following will hold after running this pass:
   *
   *   * All nodes except "grammar" and "rule" nodes will have a |resultVar|
   *     property. It will contain a name of the variable that will store a
   *     match result of the expression represented by the node in generated
   *     code.
   *
   *   * Some nodes will have a |posVar| property. It will contain a name of the
   *     variable that will store a parse position in generated code.
   *
   *   * All "rule" nodes will contain |resultVars| and |posVars| properties.
   *     They will contain a list of values of |resultVar| and |posVar|
   *     properties used in rule's subnodes. (This is useful to declare
   *     variables in generated code.)
   */
  computeVarNames: function(ast) {
    function resultVar(index) { return "result" + index; }
    function posVar(index)    { return "pos"    + index; }

    function computeLeaf(node, index) {
      node.resultVar = resultVar(index.result);

      return { result: 0, pos: 0 };
    }

    function computeFromExpression(delta) {
      return function(node, index) {
        var depth = compute(
              node.expression,
              {
                result: index.result + delta.result,
                pos:    index.pos    + delta.pos
              }
            );

        node.resultVar = resultVar(index.result);
        if (delta.pos !== 0) {
          node.posVar = posVar(index.pos);
        }

        return {
          result: depth.result + delta.result,
          pos:    depth.pos    + delta.pos
        };
      };
    }

    var compute = buildNodeVisitor({
      grammar:
        function(node, index) {
          each(node.rules, function(node) {
            compute(node, index);
          });
        },

      rule:
        function(node, index) {
          var depth = compute(node.expression, index);

          node.resultVar  = resultVar(index.result);
          node.resultVars = map(range(depth.result + 1), resultVar);
          node.posVars    = map(range(depth.pos),        posVar);
        },

      choice:
        function(node, index) {
          var depths = map(node.alternatives, function(alternative) {
            return compute(alternative, index);
          });

          node.resultVar = resultVar(index.result);

          return {
            result: Math.max.apply(null, pluck(depths, "result")),
            pos:    Math.max.apply(null, pluck(depths, "pos"))
          };
        },

      sequence:
        function(node, index) {
          var depths = map(node.elements, function(element, i) {
            return compute(
              element,
              { result: index.result + i, pos: index.pos + 1 }
            );
          });

          node.resultVar = resultVar(index.result);
          node.posVar    = posVar(index.pos);

          return {
            result:
              node.elements.length > 0
                ? Math.max.apply(
                    null,
                    map(depths, function(d, i) { return i + d.result; })
                  )
                : 0,

            pos:
              node.elements.length > 0
                ? 1 + Math.max.apply(null, pluck(depths, "pos"))
                : 1
          };
        },

      labeled:      computeFromExpression({ result: 0, pos: 0 }),
      simple_and:   computeFromExpression({ result: 0, pos: 1 }),
      simple_not:   computeFromExpression({ result: 0, pos: 1 }),
      semantic_and: computeLeaf,
      semantic_not: computeLeaf,
      optional:     computeFromExpression({ result: 0, pos: 0 }),
      zero_or_more: computeFromExpression({ result: 1, pos: 0 }),
      one_or_more:  computeFromExpression({ result: 1, pos: 0 }),
      action:       computeFromExpression({ result: 0, pos: 1 }),
      rule_ref:     computeLeaf,
      literal:      computeLeaf,
      any:          computeLeaf,
      "class":      computeLeaf
    });

    compute(ast, { result: 0, pos: 0 });
  },

  /*
   * This pass walks through the AST and tracks what labels are visible at each
   * point. For "action", "semantic_and" and "semantic_or" nodes it computes
   * parameter names and values for the function used in generated code. (In the
   * emitter, user's code is wrapped into a function that is immediately
   * executed. Its parameter names correspond to visible labels and its
   * parameter values to their captured values). Implicitly, this pass defines
   * scoping rules for labels.
   *
   * After running this pass, all "action", "semantic_and" and "semantic_or"
   * nodes will have a |params| property containing an object mapping parameter
   * names to the expressions that will be used as their values.
   */
  computeParams: function(ast) {
    var envs = [];

    function scoped(f) {
      envs.push({});
      f();
      envs.pop();
    }

    function nop() {}

    function computeForScopedExpression(node) {
      scoped(function() { compute(node.expression); });
    }

    function computeParams(node) {
      var env = envs[envs.length - 1], params = {}, name;

      for (name in env) {
        params[name] = env[name];
      }
      node.params = params;
    }

    var compute = buildNodeVisitor({
      grammar:
        function(node) {
          each(node.rules, compute);
        },

      rule:         computeForScopedExpression,

      choice:
        function(node) {
          scoped(function() { each(node.alternatives, compute); });
        },

      sequence:
        function(node) {
          var env = envs[envs.length - 1], name;

          function fixup(name) {
            each(pluck(node.elements, "resultVar"), function(resultVar, i) {
              if ((new RegExp("^" + resultVar + "(\\[\\d+\\])*$")).test(env[name])) {
                env[name] = node.resultVar + "[" + i + "]"
                          + env[name].substr(resultVar.length);
              }
            });
          }

          each(node.elements, compute);

          for (name in env) {
            fixup(name);
          }
        },

      labeled:
        function(node) {
          envs[envs.length - 1][node.label] = node.resultVar;

          scoped(function() { compute(node.expression); });
        },

      simple_and:   computeForScopedExpression,
      simple_not:   computeForScopedExpression,
      semantic_and: computeParams,
      semantic_not: computeParams,
      optional:     computeForScopedExpression,
      zero_or_more: computeForScopedExpression,
      one_or_more:  computeForScopedExpression,

      action:
        function(node) {
          scoped(function() {
            compute(node.expression);
            computeParams(node);
          });
        },

      rule_ref:     nop,
      literal:      nop,
      any:          nop,
      "class":      nop
    });

    compute(ast);
  }
};
/* Emits the generated code for the AST. */
PEG.compiler.emitter = function(ast, options) {
  options = options || {};
  if (options.cache === undefined) {
    options.cache = false;
  }
  if (options.trackLineAndColumn === undefined) {
    options.trackLineAndColumn = false;
  }

  /*
   * Codie 1.1.0
   *
   * https://github.com/dmajda/codie
   *
   * Copyright (c) 2011-2012 David Majda
   * Licensend under the MIT license.
   */
  var Codie = (function(undefined) {

  function stringEscape(s) {
    function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

    /*
     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
     * string literal except for the closing quote character, backslash,
     * carriage return, line separator, paragraph separator, and line feed.
     * Any character may appear in the form of an escape sequence.
     *
     * For portability, we also escape escape all control and non-ASCII
     * characters. Note that "\0" and "\v" escape sequences are not used
     * because JSHint does not like the first and IE the second.
     */
    return s
      .replace(/\\/g,   '\\\\') // backslash
      .replace(/"/g,    '\\"')  // closing double quote
      .replace(/\x08/g, '\\b')  // backspace
      .replace(/\t/g,   '\\t')  // horizontal tab
      .replace(/\n/g,   '\\n')  // line feed
      .replace(/\f/g,   '\\f')  // form feed
      .replace(/\r/g,   '\\r')  // carriage return
      .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
      .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
      .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
      .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
  }

  function push(s) { return '__p.push(' + s + ');'; }

  function pushRaw(template, length, state) {
    function unindent(code, level, unindentFirst) {
      return code.replace(
        new RegExp('^.{' + level +'}', "gm"),
        function(str, offset) {
          if (offset === 0) {
            return unindentFirst ? '' : str;
          } else {
            return "";
          }
        }
      );
    }

    var escaped = stringEscape(unindent(
          template.substring(0, length),
          state.indentLevel(),
          state.atBOL
        ));

    return escaped.length > 0 ? push('"' + escaped + '"') : '';
  }


  var Codie = {
    /* Codie version (uses semantic versioning). */
    VERSION: "1.1.0",

    /*
     * Specifies by how many characters do #if/#else and #for unindent their
     * content in the generated code.
     */
    indentStep: 2,

    /* Description of #-commands. Extend to define your own commands. */
    commands: {
      "if":   {
        params:  /^(.*)$/,
        compile: function(state, prefix, params) {
          return ['if(' + params[0] + '){', []];
        },
        stackOp: "push"
      },
      "else": {
        params:  /^$/,
        compile: function(state) {
          var stack = state.commandStack,
              insideElse = stack[stack.length - 1] === "else",
              insideIf   = stack[stack.length - 1] === "if";

          if (insideElse) { throw new Error("Multiple #elses."); }
          if (!insideIf)  { throw new Error("Using #else outside of #if."); }

          return ['}else{', []];
        },
        stackOp: "replace"
      },
      "for":  {
        params:  /^([a-zA-Z_][a-zA-Z0-9_]*)[ \t]+in[ \t]+(.*)$/,
        init:    function(state) {
          state.forCurrLevel = 0;  // current level of #for loop nesting
          state.forMaxLevel  = 0;  // maximum level of #for loop nesting
        },
        compile: function(state, prefix, params) {
          var c = '__c' + state.forCurrLevel, // __c for "collection"
              l = '__l' + state.forCurrLevel, // __l for "length"
              i = '__i' + state.forCurrLevel; // __i for "index"

          state.forCurrLevel++;
          if (state.forMaxLevel < state.forCurrLevel) {
            state.forMaxLevel = state.forCurrLevel;
          }

          return [
            c + '=' + params[1] + ';'
              + l + '=' + c + '.length;'
              + 'for(' + i + '=0;' + i + '<' + l + ';' + i + '++){'
              + params[0] + '=' + c + '[' + i + '];',
            [params[0], c, l, i]
          ];
        },
        exit:    function(state) { state.forCurrLevel--; },
        stackOp: "push"
      },
      "end":  {
        params:  /^$/,
        compile: function(state) {
          var stack = state.commandStack, exit;

          if (stack.length === 0) { throw new Error("Too many #ends."); }

          exit = Codie.commands[stack[stack.length - 1]].exit;
          if (exit) { exit(state); }

          return ['}', []];
        },
        stackOp: "pop"
      },
      "block": {
        params: /^(.*)$/,
        compile: function(state, prefix, params) {
          var x = '__x', // __x for "prefix",
              n = '__n', // __n for "lines"
              l = '__l', // __l for "length"
              i = '__i'; // __i for "index"

          /*
           * Originally, the generated code used |String.prototype.replace|, but
           * it is buggy in certain versions of V8 so it was rewritten. See the
           * tests for details.
           */
          return [
            x + '="' + stringEscape(prefix.substring(state.indentLevel())) + '";'
              + n + '=(' + params[0] + ').toString().split("\\n");'
              + l + '=' + n + '.length;'
              + 'for(' + i + '=0;' + i + '<' + l + ';' + i + '++){'
              + n + '[' + i +']=' + x + '+' + n + '[' + i + ']+"\\n";'
              + '}'
              + push(n + '.join("")'),
            [x, n, l, i]
          ];
        },
        stackOp: "nop"
      }
    },

    /*
     * Compiles a template into a function. When called, this function will
     * execute the template in the context of an object passed in a parameter and
     * return the result.
     */
    template: function(template) {
      var stackOps = {
        push:    function(stack, name) { stack.push(name); },
        replace: function(stack, name) { stack[stack.length - 1] = name; },
        pop:     function(stack)       { stack.pop(); },
        nop:     function()            { }
      };

      function compileExpr(state, expr) {
        state.atBOL = false;
        return [push(expr), []];
      }

      function compileCommand(state, prefix, name, params) {
        var command, match, result;

        command = Codie.commands[name];
        if (!command) { throw new Error("Unknown command: #" + name + "."); }

        match = command.params.exec(params);
        if (match === null) {
          throw new Error(
            "Invalid params for command #" + name + ": " + params + "."
          );
        }

        result = command.compile(state, prefix, match.slice(1));
        stackOps[command.stackOp](state.commandStack, name);
        state.atBOL = true;
        return result;
      }

      var state = {               // compilation state
            commandStack: [],     //   stack of commands as they were nested
            atBOL:        true,   //   is the next character to process at BOL?
            indentLevel:  function() {
              return Codie.indentStep * this.commandStack.length;
            }
          },
          code = '',              // generated template function code
          vars = ['__p=[]'],      // variables used by generated code
          name, match, result, i;

      /* Initialize state. */
      for (name in Codie.commands) {
        if (Codie.commands[name].init) { Codie.commands[name].init(state); }
      }

      /* Compile the template. */
      while ((match = /^([ \t]*)#([a-zA-Z_][a-zA-Z0-9_]*)(?:[ \t]+([^ \t\n][^\n]*))?[ \t]*(?:\n|$)|#\{([^}]*)\}/m.exec(template)) !== null) {
        code += pushRaw(template, match.index, state);
        result = match[2] !== undefined && match[2] !== ""
          ? compileCommand(state, match[1], match[2], match[3] || "") // #-command
          : compileExpr(state, match[4]);                             // #{...}
        code += result[0];
        vars = vars.concat(result[1]);
        template = template.substring(match.index + match[0].length);
      }
      code += pushRaw(template, template.length, state);

      /* Check the final state. */
      if (state.commandStack.length > 0) { throw new Error("Missing #end."); }

      /* Sanitize the list of variables used by commands. */
      vars.sort();
      for (i = 0; i < vars.length; i++) {
        if (vars[i] === vars[i - 1]) { vars.splice(i--, 1); }
      }

      /* Create the resulting function. */
      return new Function("__v", [
        '__v=__v||{};',
        'var ' + vars.join(',') + ';',
        'with(__v){',
        code,
        'return __p.join("").replace(/^\\n+|\\n+$/g,"");};'
      ].join(''));
    }
  };

  return Codie;

  })();

  var templates = (function() {
    var name,
        templates = {},
        sources = {
          grammar: [
            '(function(){',
            '  /*',
            '   * Generated by PEG.js 0.7.0.',
            '   *',
            '   * http://pegjs.majda.cz/',
            '   */',
            '  ',
            /* This needs to be in sync with |quote| in utils.js. */
            '  function quote(s) {',
            '    /*',
            '     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a',
            '     * string literal except for the closing quote character, backslash,',
            '     * carriage return, line separator, paragraph separator, and line feed.',
            '     * Any character may appear in the form of an escape sequence.',
            '     *',
            '     * For portability, we also escape escape all control and non-ASCII',
            '     * characters. Note that "\\0" and "\\v" escape sequences are not used',
            '     * because JSHint does not like the first and IE the second.',
            '     */',
            '     return \'"\' + s',
            '      .replace(/\\\\/g, \'\\\\\\\\\')  // backslash',
            '      .replace(/"/g, \'\\\\"\')    // closing quote character',
            '      .replace(/\\x08/g, \'\\\\b\') // backspace',
            '      .replace(/\\t/g, \'\\\\t\')   // horizontal tab',
            '      .replace(/\\n/g, \'\\\\n\')   // line feed',
            '      .replace(/\\f/g, \'\\\\f\')   // form feed',
            '      .replace(/\\r/g, \'\\\\r\')   // carriage return',
            '      .replace(/[\\x00-\\x07\\x0B\\x0E-\\x1F\\x80-\\uFFFF]/g, escape)',
            '      + \'"\';',
            '  }',
            '  ',
            '  var result = {',
            '    /*',
            '     * Parses the input with a generated parser. If the parsing is successfull,',
            '     * returns a value explicitly or implicitly specified by the grammar from',
            '     * which the parser was generated (see |PEG.buildParser|). If the parsing is',
            '     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.',
            '     */',
            '    parse: function(input, startRule) {',
            '      var parseFunctions = {',
            '        #for rule in node.rules',
            '          #{string(rule.name) + ": parse_" + rule.name + (rule !== node.rules[node.rules.length - 1] ? "," : "")}',
            '        #end',
            '      };',
            '      ',
            '      if (startRule !== undefined) {',
            '        if (parseFunctions[startRule] === undefined) {',
            '          throw new Error("Invalid rule name: " + quote(startRule) + ".");',
            '        }',
            '      } else {',
            '        startRule = #{string(node.startRule)};',
            '      }',
            '      ',
            '      #{posInit("pos")};',
            '      var reportFailures = 0;', // 0 = report, anything > 0 = do not report
            '      #{posInit("rightmostFailuresPos")};',
            '      var rightmostFailuresExpected = [];',
            '      #if options.cache',
            '        var cache = {};',
            '      #end',
            '      ',
            /* This needs to be in sync with |padLeft| in utils.js. */
            '      function padLeft(input, padding, length) {',
            '        var result = input;',
            '        ',
            '        var padLength = length - input.length;',
            '        for (var i = 0; i < padLength; i++) {',
            '          result = padding + result;',
            '        }',
            '        ',
            '        return result;',
            '      }',
            '      ',
            /* This needs to be in sync with |escape| in utils.js. */
            '      function escape(ch) {',
            '        var charCode = ch.charCodeAt(0);',
            '        var escapeChar;',
            '        var length;',
            '        ',
            '        if (charCode <= 0xFF) {',
            '          escapeChar = \'x\';',
            '          length = 2;',
            '        } else {',
            '          escapeChar = \'u\';',
            '          length = 4;',
            '        }',
            '        ',
            '        return \'\\\\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), \'0\', length);',
            '      }',
            '      ',
            '      #if options.trackLineAndColumn',
            '        function clone(object) {',
            '          var result = {};',
            '          for (var key in object) {',
            '            result[key] = object[key];',
            '          }',
            '          return result;',
            '        }',
            '        ',
            '        function advance(pos, n) {',
            '          var endOffset = pos.offset + n;',
            '          ',
            '          for (var offset = pos.offset; offset < endOffset; offset++) {',
            '            var ch = input.charAt(offset);',
            '            if (ch === "\\n") {',
            '              if (!pos.seenCR) { pos.line++; }',
            '              pos.column = 1;',
            '              pos.seenCR = false;',
            '            } else if (ch === "\\r" || ch === "\\u2028" || ch === "\\u2029") {',
            '              pos.line++;',
            '              pos.column = 1;',
            '              pos.seenCR = true;',
            '            } else {',
            '              pos.column++;',
            '              pos.seenCR = false;',
            '            }',
            '          }',
            '          ',
            '          pos.offset += n;',
            '        }',
            '        ',
            '      #end',
            '      function matchFailed(failure) {',
            '        if (#{posOffset("pos")} < #{posOffset("rightmostFailuresPos")}) {',
            '          return;',
            '        }',
            '        ',
            '        if (#{posOffset("pos")} > #{posOffset("rightmostFailuresPos")}) {',
            '          rightmostFailuresPos = #{posClone("pos")};',
            '          rightmostFailuresExpected = [];',
            '        }',
            '        ',
            '        rightmostFailuresExpected.push(failure);',
            '      }',
            '      ',
            '      #for rule in node.rules',
            '        #block emit(rule)',
            '        ',
            '      #end',
            '      ',
            '      function cleanupExpected(expected) {',
            '        expected.sort();',
            '        ',
            '        var lastExpected = null;',
            '        var cleanExpected = [];',
            '        for (var i = 0; i < expected.length; i++) {',
            '          if (expected[i] !== lastExpected) {',
            '            cleanExpected.push(expected[i]);',
            '            lastExpected = expected[i];',
            '          }',
            '        }',
            '        return cleanExpected;',
            '      }',
            '      ',
            '      #if !options.trackLineAndColumn',
            '        function computeErrorPosition() {',
            '          /*',
            '           * The first idea was to use |String.split| to break the input up to the',
            '           * error position along newlines and derive the line and column from',
            '           * there. However IE\'s |split| implementation is so broken that it was',
            '           * enough to prevent it.',
            '           */',
            '          ',
            '          var line = 1;',
            '          var column = 1;',
            '          var seenCR = false;',
            '          ',
            '          for (var i = 0; i < Math.max(pos, rightmostFailuresPos); i++) {',
            '            var ch = input.charAt(i);',
            '            if (ch === "\\n") {',
            '              if (!seenCR) { line++; }',
            '              column = 1;',
            '              seenCR = false;',
            '            } else if (ch === "\\r" || ch === "\\u2028" || ch === "\\u2029") {',
            '              line++;',
            '              column = 1;',
            '              seenCR = true;',
            '            } else {',
            '              column++;',
            '              seenCR = false;',
            '            }',
            '          }',
            '          ',
            '          return { line: line, column: column };',
            '        }',
            '      #end',
            '      ',
            '      #if node.initializer',
            '        #block emit(node.initializer)',
            '      #end',
            '      ',
            '      var result = parseFunctions[startRule]();',
            '      ',
            '      /*',
            '       * The parser is now in one of the following three states:',
            '       *',
            '       * 1. The parser successfully parsed the whole input.',
            '       *',
            '       *    - |result !== null|',
            '       *    - |#{posOffset("pos")} === input.length|',
            '       *    - |rightmostFailuresExpected| may or may not contain something',
            '       *',
            '       * 2. The parser successfully parsed only a part of the input.',
            '       *',
            '       *    - |result !== null|',
            '       *    - |#{posOffset("pos")} < input.length|',
            '       *    - |rightmostFailuresExpected| may or may not contain something',
            '       *',
            '       * 3. The parser did not successfully parse any part of the input.',
            '       *',
            '       *   - |result === null|',
            '       *   - |#{posOffset("pos")} === 0|',
            '       *   - |rightmostFailuresExpected| contains at least one failure',
            '       *',
            '       * All code following this comment (including called functions) must',
            '       * handle these states.',
            '       */',
            '      if (result === null || #{posOffset("pos")} !== input.length) {',
            '        var offset = Math.max(#{posOffset("pos")}, #{posOffset("rightmostFailuresPos")});',
            '        var found = offset < input.length ? input.charAt(offset) : null;',
            '        #if options.trackLineAndColumn',
            '          var errorPosition = #{posOffset("pos")} > #{posOffset("rightmostFailuresPos")} ? pos : rightmostFailuresPos;',
            '        #else',
            '          var errorPosition = computeErrorPosition();',
            '        #end',
            '        ',
            '        throw new this.SyntaxError(',
            '          cleanupExpected(rightmostFailuresExpected),',
            '          found,',
            '          offset,',
            '          errorPosition.line,',
            '          errorPosition.column',
            '        );',
            '      }',
            '      ',
            '      return result;',
            '    },',
            '    ',
            '    /* Returns the parser source code. */',
            '    toSource: function() { return this._source; }',
            '  };',
            '  ',
            '  /* Thrown when a parser encounters a syntax error. */',
            '  ',
            '  result.SyntaxError = function(expected, found, offset, line, column) {',
            '    function buildMessage(expected, found) {',
            '      var expectedHumanized, foundHumanized;',
            '      ',
            '      switch (expected.length) {',
            '        case 0:',
            '          expectedHumanized = "end of input";',
            '          break;',
            '        case 1:',
            '          expectedHumanized = expected[0];',
            '          break;',
            '        default:',
            '          expectedHumanized = expected.slice(0, expected.length - 1).join(", ")',
            '            + " or "',
            '            + expected[expected.length - 1];',
            '      }',
            '      ',
            '      foundHumanized = found ? quote(found) : "end of input";',
            '      ',
            '      return "Expected " + expectedHumanized + " but " + foundHumanized + " found.";',
            '    }',
            '    ',
            '    this.name = "SyntaxError";',
            '    this.expected = expected;',
            '    this.found = found;',
            '    this.message = buildMessage(expected, found);',
            '    this.offset = offset;',
            '    this.line = line;',
            '    this.column = column;',
            '  };',
            '  ',
            '  result.SyntaxError.prototype = Error.prototype;',
            '  ',
            '  return result;',
            '})()'
          ],
          rule: [
            'function parse_#{node.name}() {',
            '  #if options.cache',
            '    var cacheKey = "#{node.name}@" + #{posOffset("pos")};',
            '    var cachedResult = cache[cacheKey];',
            '    if (cachedResult) {',
            '      pos = #{posClone("cachedResult.nextPos")};',
            '      return cachedResult.result;',
            '    }',
            '    ',
            '  #end',
            '  #if node.resultVars.length > 0',
            '    var #{node.resultVars.join(", ")};',
            '  #end',
            '  #if node.posVars.length > 0',
            '    var #{node.posVars.join(", ")};',
            '  #end',
            '  ',
            '  #if node.displayName !== null',
            '    reportFailures++;',
            '  #end',
            '  #block emit(node.expression)',
            '  #if node.displayName !== null',
            '    reportFailures--;',
            '    if (reportFailures === 0 && #{node.resultVar} === null) {',
            '      matchFailed(#{string(node.displayName)});',
            '    }',
            '  #end',
            '  #if options.cache',
            '    ',
            '    cache[cacheKey] = {',
            '      nextPos: #{posClone("pos")},',
            '      result:  #{node.resultVar}',
            '    };',
            '  #end',
            '  return #{node.resultVar};',
            '}'
          ],
          choice: [
            '#block emit(alternative)',
            '#block nextAlternativesCode'
          ],
          "choice.next": [
            'if (#{node.resultVar} === null) {',
            '  #block code',
            '}'
          ],
          sequence: [
            '#{posSave(node)};',
            '#block code'
          ],
          "sequence.iteration": [
            '#block emit(element)',
            'if (#{element.resultVar} !== null) {',
            '  #block code',
            '} else {',
            '  #{node.resultVar} = null;',
            '  #{posRestore(node)};',
            '}'
          ],
          "sequence.inner": [
            '#{node.resultVar} = [#{pluck(node.elements, "resultVar").join(", ")}];'
          ],
          simple_and: [
            '#{posSave(node)};',
            'reportFailures++;',
            '#block emit(node.expression)',
            'reportFailures--;',
            'if (#{node.resultVar} !== null) {',
            '  #{node.resultVar} = "";',
            '  #{posRestore(node)};',
            '} else {',
            '  #{node.resultVar} = null;',
            '}'
          ],
          simple_not: [
            '#{posSave(node)};',
            'reportFailures++;',
            '#block emit(node.expression)',
            'reportFailures--;',
            'if (#{node.resultVar} === null) {',
            '  #{node.resultVar} = "";',
            '} else {',
            '  #{node.resultVar} = null;',
            '  #{posRestore(node)};',
            '}'
          ],
          semantic_and: [
            '#{node.resultVar} = (function(#{(options.trackLineAndColumn ? ["offset", "line", "column"] : ["offset"]).concat(keys(node.params)).join(", ")}) {#{node.code}})(#{(options.trackLineAndColumn ? ["pos.offset", "pos.line", "pos.column"] : ["pos"]).concat(values(node.params)).join(", ")}) ? "" : null;'
          ],
          semantic_not: [
            '#{node.resultVar} = (function(#{(options.trackLineAndColumn ? ["offset", "line", "column"] : ["offset"]).concat(keys(node.params)).join(", ")}) {#{node.code}})(#{(options.trackLineAndColumn ? ["pos.offset", "pos.line", "pos.column"] : ["pos"]).concat(values(node.params)).join(", ")}) ? null : "";'
          ],
          optional: [
            '#block emit(node.expression)',
            '#{node.resultVar} = #{node.resultVar} !== null ? #{node.resultVar} : "";'
          ],
          zero_or_more: [
            '#{node.resultVar} = [];',
            '#block emit(node.expression)',
            'while (#{node.expression.resultVar} !== null) {',
            '  #{node.resultVar}.push(#{node.expression.resultVar});',
            '  #block emit(node.expression)',
            '}'
          ],
          one_or_more: [
            '#block emit(node.expression)',
            'if (#{node.expression.resultVar} !== null) {',
            '  #{node.resultVar} = [];',
            '  while (#{node.expression.resultVar} !== null) {',
            '    #{node.resultVar}.push(#{node.expression.resultVar});',
            '    #block emit(node.expression)',
            '  }',
            '} else {',
            '  #{node.resultVar} = null;',
            '}'
          ],
          action: [
            '#{posSave(node)};',
            '#block emit(node.expression)',
            'if (#{node.resultVar} !== null) {',
            '  #{node.resultVar} = (function(#{(options.trackLineAndColumn ? ["offset", "line", "column"] : ["offset"]).concat(keys(node.params)).join(", ")}) {#{node.code}})(#{(options.trackLineAndColumn ? [node.posVar + ".offset", node.posVar + ".line", node.posVar + ".column"] : [node.posVar]).concat(values(node.params)).join(", ")});',
            '}',
            'if (#{node.resultVar} === null) {',
            '  #{posRestore(node)};',
            '}'
          ],
          rule_ref: [
            '#{node.resultVar} = parse_#{node.name}();'
          ],
          literal: [
            '#if node.value.length === 0',
            '  #{node.resultVar} = "";',
            '#else',
            '  #if !node.ignoreCase',
            '    #if node.value.length === 1',
            '      if (input.charCodeAt(#{posOffset("pos")}) === #{node.value.charCodeAt(0)}) {',
            '    #else',
            '      if (input.substr(#{posOffset("pos")}, #{node.value.length}) === #{string(node.value)}) {',
            '    #end',
            '  #else',
            /*
             * One-char literals are not optimized when case-insensitive
             * matching is enabled. This is because there is no simple way to
             * lowercase a character code that works for character outside ASCII
             * letters. Moreover, |toLowerCase| can change string length,
             * meaning the result of lowercasing a character can be more
             * characters.
             */
            '    if (input.substr(#{posOffset("pos")}, #{node.value.length}).toLowerCase() === #{string(node.value.toLowerCase())}) {',
            '  #end',
            '    #if !node.ignoreCase',
            '      #{node.resultVar} = #{string(node.value)};',
            '    #else',
            '      #{node.resultVar} = input.substr(#{posOffset("pos")}, #{node.value.length});',
            '    #end',
            '    #{posAdvance(node.value.length)};',
            '  } else {',
            '    #{node.resultVar} = null;',
            '    if (reportFailures === 0) {',
            '      matchFailed(#{string(string(node.value))});',
            '    }',
            '  }',
            '#end'
          ],
          any: [
            'if (input.length > #{posOffset("pos")}) {',
            '  #{node.resultVar} = input.charAt(#{posOffset("pos")});',
            '  #{posAdvance(1)};',
            '} else {',
            '  #{node.resultVar} = null;',
            '  if (reportFailures === 0) {',
            '    matchFailed("any character");',
            '  }',
            '}'
          ],
          "class": [
            'if (#{regexp}.test(input.charAt(#{posOffset("pos")}))) {',
            '  #{node.resultVar} = input.charAt(#{posOffset("pos")});',
            '  #{posAdvance(1)};',
            '} else {',
            '  #{node.resultVar} = null;',
            '  if (reportFailures === 0) {',
            '    matchFailed(#{string(node.rawText)});',
            '  }',
            '}'
          ]
        };

    for (name in sources) {
      templates[name] = Codie.template(sources[name].join('\n'));
    }

    return templates;
  })();

  function fill(name, vars) {
    vars.string  = quote;
    vars.pluck   = pluck;
    vars.keys    = keys;
    vars.values  = values;
    vars.emit    = emit;
    vars.options = options;

    /* Position-handling macros */
    if (options.trackLineAndColumn) {
      vars.posInit    = function(name) {
        return "var "
             + name
             + " = "
             + "{ offset: 0, line: 1, column: 1, seenCR: false }";
      };
      vars.posClone   = function(name) { return "clone(" + name + ")"; };
      vars.posOffset  = function(name) { return name + ".offset"; };

      vars.posAdvance = function(n)    { return "advance(pos, " + n + ")"; };
    } else {
      vars.posInit    = function(name) { return "var " + name + " = 0"; };
      vars.posClone   = function(name) { return name; };
      vars.posOffset  = function(name) { return name; };

      vars.posAdvance = function(n) {
        return n === 1 ? "pos++" : "pos += " + n;
      };
    }
    vars.posSave    = function(node) {
      return node.posVar + " = " + vars.posClone("pos");
    };
    vars.posRestore = function(node) {
      return "pos" + " = " + vars.posClone(node.posVar);
    };

    return templates[name](vars);
  }

  function emitSimple(name) {
    return function(node) { return fill(name, { node: node }); };
  }

  var emit = buildNodeVisitor({
    grammar: emitSimple("grammar"),

    initializer: function(node) { return node.code; },

    rule: emitSimple("rule"),

    /*
     * The contract for all code fragments generated by the following functions
     * is as follows.
     *
     * The code fragment tries to match a part of the input starting with the
     * position indicated in |pos|. That position may point past the end of the
     * input.
     *
     * * If the code fragment matches the input, it advances |pos| to point to
     *   the first chracter following the matched part of the input and sets
     *   variable with a name stored in |node.resultVar| to an appropriate
     *   value. This value is always non-|null|.
     *
     * * If the code fragment does not match the input, it returns with |pos|
     *   set to the original value and it sets a variable with a name stored in
     *   |node.resultVar| to |null|.
     *
     * The code can use variables with names stored in |resultVar| and |posVar|
     * properties of the current node's subnodes. It can't use any other
     * variables.
     */

    choice: function(node) {
      var code, nextAlternativesCode;

      for (var i = node.alternatives.length - 1; i >= 0; i--) {
        nextAlternativesCode = i !== node.alternatives.length - 1
          ? fill("choice.next", { node: node, code: code })
          : '';
        code = fill("choice", {
          alternative:          node.alternatives[i],
          nextAlternativesCode: nextAlternativesCode
        });
      }

      return code;
    },

    sequence: function(node) {
      var code = fill("sequence.inner", { node: node });

      for (var i = node.elements.length - 1; i >= 0; i--) {
        code = fill("sequence.iteration", {
          node:    node,
          element: node.elements[i],
          code:    code
        });
      }

      return fill("sequence", { node: node, code: code });
    },

    labeled: function(node) { return emit(node.expression); },

    simple_and:   emitSimple("simple_and"),
    simple_not:   emitSimple("simple_not"),
    semantic_and: emitSimple("semantic_and"),
    semantic_not: emitSimple("semantic_not"),
    optional:     emitSimple("optional"),
    zero_or_more: emitSimple("zero_or_more"),
    one_or_more:  emitSimple("one_or_more"),
    action:       emitSimple("action"),
    rule_ref:     emitSimple("rule_ref"),
    literal:      emitSimple("literal"),
    any:          emitSimple("any"),

    "class": function(node) {
      var regexp;

      if (node.parts.length > 0) {
        regexp = '/^['
          + (node.inverted ? '^' : '')
          + map(node.parts, function(part) {
              return part instanceof Array
                ? quoteForRegexpClass(part[0])
                  + '-'
                  + quoteForRegexpClass(part[1])
                : quoteForRegexpClass(part);
            }).join('')
          + ']/' + (node.ignoreCase ? 'i' : '');
      } else {
        /*
         * Stupid IE considers regexps /[]/ and /[^]/ syntactically invalid, so
         * we translate them into euqivalents it can handle.
         */
        regexp = node.inverted ? '/^[\\S\\s]/' : '/^(?!)/';
      }

      return fill("class", { node: node, regexp: regexp });
    }
  });

  return emit(ast);
};

return PEG;

})();

if (typeof module !== "undefined") {
  module.exports = PEG;
}

},{}]},{},["F4GJtq"])