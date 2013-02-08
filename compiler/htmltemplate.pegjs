/*
 * Grammar for hashspace.
 * A Template file contains blocks of plain text / templates
 *
 * A template must start on a new line and looks like
 *   # template name()
 *     text, HTML nodes
 *     # instructions on their own single line
 *   # /template
 *
 * Anything outside is simply left untouched
 */

start
  = S? begin:OutsideTemplate? templates:(S? Template S? OutsideTemplate?)+ {
    var result = begin.value ? [begin] : [];
    for (var i = 0; i < templates.length; i += 1) {
      // [1] is Template, it must be there
      result.push(templates[i][1]);
      // [3] is OutsideTemplate, it might be empty
      if (templates[i][3].value) {
        result.push(templates[i][3]);
      }
    }
    return result;
  }

/***  STATEMENTS  ***/


// # template name()
//    anything here
// # /template
Template
  = instruction:TemplateInstruction content:TemplateContent TemplateInstructionEnd {
    return {
      type : "template",
      name : instruction.name,
      args : instruction.args,
      content : content
    }
  }

// These are in the form {something goes here}
ValueExpression
  = ValueTokenBegin bind:BindingModifierToken? value:ObjectIdentifier ValueTokenEnd {
    return {
      type : "value",
      args : value.path,
      bind : !!bind // it only says if there's a modifier or not, doesn't specify the default behavior
    }
  }

// Could be single line or compounds
//   # insert anotherTemplate()
// or
//   # if (something)
//      Anything here
//   # /if
Instruction
  = _ instruction:(InstructionInsert / InstructionElement) _ EOL {
    // I want the instructions to start on a new line
    return instruction;
  }

// Element instructions have an opening and closing line, they contain text / HTML elements
InstructionElement
  = InstructionBegin _ instruction:(StatementIf / StatementForeach) {
    return {
      type : "instruction",
      name : instruction.name,
      content : instruction.content,
      args : instruction.args
    };
  }

// # if (condition)
// # else
// # /if
// TODO
StatementIf
  = instruction:InstructionIf thenBlock:TemplateContent elseBlock:(InstructionElse TemplateContent)? InstructionIfEnd {
    return {
      type : "instruction",
      name : "if",
      args : instruction.condition,
      content : [thenBlock, elseBlock ? elseBlock[1] : []]
    };
  }

StatementForeach
  = instruction:InstructionForeach content:TemplateContent InstructionForeachEnd {
    return {
      type : "instruction",
      name : instruction.token,
      args : instruction.expression,
      content : content
    };
  }

/*############
  INSTRUCTIONS  
#############*/
// Instruction must end with and EOL but don't consume this character, because it might be needed by inner instructions

// # template name()
TemplateInstruction
  = _ InstructionBegin _ TemplateToken _ name:Identifier _ args:ArgumentsDefinition _ EOL {
    return {
      name : name,
      args : args
    }
  }

// # /template
TemplateInstructionEnd
  = S? _ InstructionBegin _ "/" TemplateToken _ EOL?


// # insert name(arguments)
InstructionInsert
  = InstructionBegin _ name:InstructionInsertToken _ tpl:Identifier _ args:ArgumentsCallWithLiterals {
    return {
      type : "instruction",
      name : name,
      args : {
        template : tpl,
        args : args
      }
    };
  }

// # if (condition)
InstructionIf
  = IfToken _ condition:(("(" _ exp:ObjectIdentifier _ ")") {return exp;} / ObjectIdentifier) _ EOL {
    // In JavaScript the condition would be an Expression, we limit it to ObjectIdentifier
    return {
      condition : condition
    };
  }

// # else
InstructionElse
  = InstructionBegin _ ElseToken _ EOL

// # /if
InstructionIfEnd
  = InstructionBegin _ "/" _ IfToken

// # foreach (iterator in container)
InstructionForeach
  = token:HashspaceForToken _ 
  expression:(
    InstructionForeachExpression
    / ("(" _ exp:InstructionForeachExpression _ ")") {return exp;}
  ) _ EOL {
    return {
      token : token,
      expression : expression
    };
  }

// iterator in container
InstructionForeachExpression
  = iterator:Identifier _ token:(InToken) _ collection:ObjectIdentifier {
    return {
      iterator : iterator,
      keyword : token,
      collection : collection
    };
  }

// # /foreach
InstructionForeachEnd
  = InstructionBegin _ "/" _ HashspaceForToken


/*#########
  ELEMENTS
##########*/


// Identifies a property of an object, e.g. 'car.engine.horsepower'
// each of the dot properties must be a valid JavaScript identifier
ObjectIdentifier
  = head:Identifier tail:("." Identifier)* {
    var result = [head];
    for (var i = 0, len = tail.length; i < len; i += 1) {
      result.push(tail[i][1]);
    }
    return {
      type : "ObjectIdentifier",
      path : result
    };
  }

// Defines the arguments of a function definition. This is equivalent to a function signature
// It only allows Identifiers
// (one, two)
ArgumentsDefinition
  = "(" _ first:Identifier? others:(_ "," _ Identifier)* _ ")" {
    var args = first ? [first] : [];
    for (var i = 0, len = others.length; i < len; i += 1) {
      args.push(others[i][3]);
    }
    return args;
   }

// Defines the arguments of a 'call' instruction. This is equivalent to calling a function
// This element allows ObjectIdentifiers as well as Literals
// (one.two, true)
ArgumentsCallWithLiterals
  = "(" _ first:SimpleAssignmentExpression? others:(_ "," _ SimpleAssignmentExpression)* _ ")" {
    var args = first ? [first] : [];
    for (var i = 0, len = others.length; i < len; i += 1) {
      args.push(others[i][3]);
    }
    return args;
  }

// Looks like a JavaScript Assignment Expression but is simple because it doesn't allow operators (like 'a = 12')
// It contains also Hashspace Object Identifiers (a.b.c)
SimpleAssignmentExpression
  = ObjectIdentifier
  / Literal
  / SimpleArrayLiteral
  / SimpleObjectLiteral
/// IdentifierLiteral

// Anything that can be inside a template statement, this could be 
// * plain text
// * HTML element
// * ValueExpression (e.g. template variables)
// * Instruction like '# insert' or '# if'
// Template content always follow an instruction. The first EOL should be discarded in some cases
TemplateContent
  = elements:(element / ValueExpression / (EOL? instruction:Instruction) {return instruction;} / InsideTemplate)* {
    var content = [];
    // Note that here we are ignoring only the space before the first element, all the others should be considered because
    // they might be part of a text node
    for (var i = 0, len = elements.length; i < len; i += 1) {
      // Each of these is either an element node or plain text
      var element = elements[i];
      if (element.type) {
        content.push(elements[i]);
      } else {
        content.push({
          type : "text",
          value : element
        });
      }
    }
    return content;
  }

// This seems convoluted but what it means is:
// - either any character that is not a '#'
// - or a '#' that is not part of a TemplateInstruction
OutsideTemplate
  = chars:([^#] / (&"#" !TemplateInstruction "#") { return "#"; })* {
    return {
      type : "plainText",
      value :  chars.join("")
    };
  }

// This is the plain text that might be inside a template. It's any symbol unless it's the start of more
// specialized elements
InsideTemplate
 = chars:(
    (!(element / ValueExpression / EOL Instruction / TemplateInstructionEnd / InstructionForeachEnd / InstructionElse / InstructionIfEnd) letter:.) { return letter; }
  )+ {
  return chars.join("");
 }

// A callback attribute for an HTML element
// onclick, ontap, onwhatever
AttributeCallback
  = "on" event:Name {
    return event;
  }

// What goes in the callback attribute, must be a method call on a local or global scope where arguments are
// - ObjectIdentifier
// - Literal
AttributeCallbackValue
  = quote:'"' _ ValueTokenBegin _ method:ObjectIdentifier _ args:ArgumentsCallWithLiterals _ ValueTokenEnd _ '"' {
    return {
      quote : quote,
      method : method,
      args : args
    };
  }
  / quote:"'" _ ValueTokenBegin _ method:ObjectIdentifier _ args:ArgumentsCallWithLiterals _ ValueTokenEnd _ "'" {
    return {
      quote : quote,
      method : method,
      args : args
    };
  }

/*
TODO, commented out because I don't know how to handle it in the compiled code,
the best would be to include [] brackets in ObjectIdentifier
IdentifierLiteral
  = base:Identifier assign:("[" _ SimpleAssignmentExpression _ "]" / "." _ Identifier)* {
    var args = [base];
    for (var i = 0; i < assign.length; i += 1) {
      args.push(assign[i][2]);
    }

    return {
      type : "IdentifierLiteral",
      value : args
    };
  }
*/


/*##################
  Hashspace Tokens
###################*/
InstructionBegin = "# "
InstructionEnd = _ &EOL
TemplateToken = "template"
BindingModifierToken = ":"
ValueTokenBegin = "{"
ValueTokenEnd = "}"
InstructionInsertToken = "insert"
HashspaceForToken = "foreach"

/*################
  Base symbols
#################*/
// Any padding excluding line breaks
_
  = WhiteSpace*

// two underscores is used by JavaScript example to include new lines, we prefer to ignore it
__
  = WhiteSpace*

WhiteSpace
  = [\t\v\f \u00A0\uFEFF]

EOL "end of line"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028" // line separator
  / "\u2029" // paragraph separator



/*!
 * This part is taken from the HTML + XML specifications and defines well-formed XML Documents
 * http://www.w3.org/TR/html5/syntax.html#syntax
 * http://www.w3.org/TR/REC-xml/#sec-documents
 */
Char
  = "\u0009"   // tab
  / "\u000A"   // space
  / "\u000D"   // carriage return
  / [\u0020-\uD7FF]
  / [\uE000-\uFFFD]
//  / [\u10000-\u10FFFF]  /* any Unicode character, excluding the surrogate blocks, FFFE, and FFFF. */

NameStartChar
  = [a-z]
  / [A-Z]
  / ":"
  / "_"
  / [\u00C0-\u00D6]
  / [\u00D8-\u00F6]
  / [\u00F8-\u02FF]
  / [\u0370-\u037D]
  / [\u037F-\u1FFF]
  / [\u200C-\u200D]
  / [\u2070-\u218F]
  / [\u2C00-\u2FEF]
  / [\u3001-\uD7FF]
  / [\uF900-\uFDCF]
  / [\uFDF0-\uFFFD]
//  / [\u10000-\uEFFFF]   This character range doesn't seem to work in JS

S "white space" //consists of one or more space (#x20) characters, carriage returns, line feeds, or tabs.
  = empty:("\u0020" / "\u0009" / "\u000D" / "\u000A")+

NameChar
  = NameStartChar / "-" / "." / [0-9] / "\u00B7" / [\u0300-\u036F] / [\u203F-\u2040]


Name
  = first:NameStartChar next:(NameChar)* {
    return first + next.join("");
  }

element
  = EmptyElemTag
  / start:STag content:content ETag {
    return {
      type : "element",
      name : start.name,
      attr : start.attr,
      events : start.events,
      content : content,
      empty : false
    };
  }

EmptyElemTag
  = "<" name:Name attributes:(S text:Attribute {return text;})* S? "/>" {
    var attr = [];
    var events = [];
    for (var i = 0; i < attributes.length; i += 1) {
      if (attributes[i].type === "EventCallback") {
        events.push(attributes[i]);
      } else {
        attr.push(attributes[i]);
      }
    }
    return {
      type : "element",
      name : name,
      attr : attr,
      events : events,
      empty : true
    };
  }

STag
  = "<" name:Name attributes:(S text:Attribute {return text;})* S? ">" {
    var attr = [];
    var events = [];
    for (var i = 0; i < attributes.length; i += 1) {
      if (attributes[i].type === "EventCallback") {
        events.push(attributes[i]);
      } else {
        attr.push(attributes[i]);
      }
    }
    return {
      name : name,
      attr : attr,
      events : events
    };
  }

content
  = before:CharData? after:((element / Reference / Comment / ValueExpression) CharData?)* {
    // This is inside an HTML tag, so spaces might be needed, return the text content if any
    var content = [];
    if (before) {
      // could be an empty line
      content.push(before);
    }
    for (var i = 0, len = after.length; i < len; i += 1) {
      var children = after[i];
      if (children[0]) {
        // this is either an element / Reference / Comment that might want to be discarded
        content.push(children[0]);
      }
      if (children[1]) {
        // this is the CharData at the end of this tag
        content.push(children[1]);
      }
    }

    return content;
  }
// The standard definition of content includes also CDATA and Process Instructions


CharData  // All text that is not markup constitutes the character data of the document.
  = !([^<&]* "]]>" [^<&]*) chars:(!ValueTokenBegin singleChar:[^<&] {return singleChar;})* {
    if (chars.length) {
      return {
        type : "text",
        value : chars.join("")
      };
    }
    // If we didn't catch anything just return undefined -> empty string, it's filtered out later
  }

ETag
  = "</" Name S? ">"

Attribute
  = name:AttributeCallback Eq callback:AttributeCallbackValue {
    return {
      type : "EventCallback",
      name : name,
      quote : callback.quote,
      args : {
        method : callback.method,
        args : callback.args
      }
    }
  }
  / name:Name Eq list:AttValue {
    var valueDescription = [];
    var isStatic = true;
    var buffer = "";
    // list has 3 values: ['quote', 'value', 'quote']
    for (var i = 0, len = list[1].length; i < len; i += 1) {
      var value = list[1][i];
      if (value.type) {
        // There is a value expression in this attribute
        isStatic = false;
        if (buffer) {
          // Store whatever text we had so far
          valueDescription.push(buffer);
          buffer = "";
        }
        valueDescription.push(value);
      } else {
        // This is just a character or Reference
        buffer += value;
      }
    }

    // In case the buffer is not yet empty
    if (buffer) {
      valueDescription.push(buffer);
    }

    return {
      type : "ElementAttribute",
      name : name,
      value : valueDescription,
      isStatic : isStatic,
      quote : list[0]
    }
  }

AttValue
  = '"' what:(!ValueTokenBegin character:[^<&"] {return character} / Reference / ValueExpression)* '"'
  / "'" what:(!ValueTokenBegin character:[^<&'] {return character} / Reference / ValueExpression)* "'"

Reference
  = EntityRef / CharRef

EntityRef
  = "&" name:Name ";" {
    return "&" + name + ";"
  }

CharRef
  = "&#" digits:[0-9]+ ";" {
    return "&#" + digits.join("") + ";"
  }

Eq
  = S? "=" S?

Comment
  = "<!--" chars:(!"-" Char / ('-' !"-" Char))* "-->" {
    return "";
    // just ignore HTML comments
  }

/*  The following grammar is not supported by PEG, should be converted but I prefer to ignore them altogether
// CDATA Sections
CDSect = CDStart CData CDEnd
CDStart = "<![CDATA["
CData = (Char* - (Char* "]]>" Char*))
CDEnd = "]]>"

// Processing instructions
PI = '<?' PITarget (S (Char* - (Char* '?>' Char*)))? '?>'
PITarget = Name - (('X' | 'x') ('M' | 'm') ('L' | 'l'))
*/




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
  = start:IdentifierStart parts:IdentifierPart* {
      return start + parts.join("");
    }

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
  = Keyword
  / FutureReservedWord
  / NullLiteral
  / BooleanLiteral

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
  = NullToken { return { type: "NullLiteral", value: null }; }

BooleanLiteral
  = TrueToken  { return { type: "BooleanLiteral", value: true  }; }
  / FalseToken { return { type: "BooleanLiteral", value: false }; }

Literal
  = NullLiteral
  / BooleanLiteral
  / value:NumericLiteral {
      return {
        type:  "NumericLiteral",
        value: value
      };
    }
  / value:StringLiteral {
      return {
        type:  "StringLiteral",
        value: value
      };
    }

NumericLiteral "number"
  = literal:(HexIntegerLiteral / DecimalLiteral) !IdentifierStart {
      return literal;
    }

HexIntegerLiteral
  = "0" [xX] digits:HexDigit+ { return parseInt("0x" + digits.join("")); }

HexDigit
  = [0-9a-fA-F]

DecimalLiteral
  = before:DecimalIntegerLiteral
      "."
    after:DecimalDigits?
    exponent:ExponentPart? {
      return parseFloat(before + "." + after + exponent);
    }
  / "." after:DecimalDigits exponent:ExponentPart? {
      return parseFloat("." + after + exponent);
    }
  / before:DecimalIntegerLiteral exponent:ExponentPart? {
      return parseFloat(before + exponent);
    }

DecimalIntegerLiteral
  = "0" / digit:NonZeroDigit digits:DecimalDigits? { return digit + digits; }

DecimalDigits
  = digits:DecimalDigit+ { return digits.join(""); }

DecimalDigit
  = [0-9]

NonZeroDigit
  = [1-9]

ExponentPart
  = indicator:ExponentIndicator integer:SignedInteger {
    return indicator + integer;
  }

ExponentIndicator
  = [eE]

SignedInteger
  = sign:[-+]? digits:DecimalDigits { return sign + digits; }

StringLiteral "string"
  = parts:('"' DoubleStringCharacters? '"' / "'" SingleStringCharacters? "'") {
      return parts[1];
    }

DoubleStringCharacters
  = chars:DoubleStringCharacter+ { return chars.join(""); }

SingleStringCharacters
  = chars:SingleStringCharacter+ { return chars.join(""); }

DoubleStringCharacter
  = !('"' / "\\" / EOL) char_:SourceCharacter { return char_;     }
  / "\\" sequence:EscapeSequence                         { return sequence;  }

SingleStringCharacter
  = !("'" / "\\" / EOL) char_:SourceCharacter { return char_;     }
  / "\\" sequence:EscapeSequence                         { return sequence;  }

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
  = "x" h1:HexDigit h2:HexDigit {
      return String.fromCharCode(parseInt("0x" + h1 + h2));
    }

UnicodeEscapeSequence
  = "u" h1:HexDigit h2:HexDigit h3:HexDigit h4:HexDigit {
      return String.fromCharCode(parseInt("0x" + h1 + h2 + h3 + h4));
    }

SimpleObjectLiteral
  = "{" _ first:SimplePropertyAssignment? others:(_ "," _ SimplePropertyAssignment)* _ "}" {
    var object = {};

    if (first) {
      object[first.name] = first.value.value;

      for (var i = 0; i < others.length; i += 1) {
        object[others[i][3].name] = others[i][3].value.value;
      }
    }
    
    return {
      type: "ObjectLiteral",
      value: object
    };
  }

// it doesn't include get and set keyword from JavaScript 1.8.5
SimplePropertyAssignment
  = name:PropertyName _ ":" _ value:SimpleAssignmentExpression {
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

SimpleArrayLiteral
  = "[" _ elements:SimpleElementList? _ (Elision _)? "]" {
    // Convert back the inner literals
    var value = [];
    for (var i = 0; i < elements.length; i += 1) {
      value.push(elements[i].value);
    }

    return {
      type: "ArrayLiteral",
      value: value
    };
  }

SimpleElementList
  = (Elision _)?
    head:SimpleAssignmentExpression
    tail:(_ "," _ Elision? _ SimpleAssignmentExpression)* {
      var result = [head];
      for (var i = 0; i < tail.length; i++) {
        result.push(tail[i][5]);
      }
      return result;
    }

/* Tokens */

BreakToken      = "break"            !IdentifierPart
CaseToken       = "case"             !IdentifierPart
CatchToken      = "catch"            !IdentifierPart
ContinueToken   = "continue"         !IdentifierPart
DebuggerToken   = "debugger"         !IdentifierPart
DefaultToken    = "default"          !IdentifierPart
DeleteToken     = "delete"           !IdentifierPart { return "delete"; }
DoToken         = "do"               !IdentifierPart
ElseToken       = "else"             !IdentifierPart
FalseToken      = "false"            !IdentifierPart
FinallyToken    = "finally"          !IdentifierPart
ForToken        = "for"              !IdentifierPart
FunctionToken   = "function"         !IdentifierPart
GetToken        = "get"              !IdentifierPart
IfToken         = "if"               !IdentifierPart
InstanceofToken = "instanceof"       !IdentifierPart { return "instanceof"; }
InToken         = "in"               !IdentifierPart { return "in"; }
NewToken        = "new"              !IdentifierPart
NullToken       = "null"             !IdentifierPart
ReturnToken     = "return"           !IdentifierPart
SetToken        = "set"              !IdentifierPart
SwitchToken     = "switch"           !IdentifierPart
ThisToken       = "this"             !IdentifierPart
ThrowToken      = "throw"            !IdentifierPart
TrueToken       = "true"             !IdentifierPart
TryToken        = "try"              !IdentifierPart
TypeofToken     = "typeof"           !IdentifierPart { return "typeof"; }
VarToken        = "var"              !IdentifierPart
VoidToken       = "void"             !IdentifierPart { return "void"; }
WhileToken      = "while"            !IdentifierPart
WithToken       = "with"             !IdentifierPart


/* ===== A.3 Expressions ===== */
// With respect to the original version we allow only Simple Object literals to avoid functions
PrimaryExpression
  = ThisToken       { return { type: "This" }; }
  / name:Identifier { return { type: "Variable", name: name }; }
  / Literal
  / ArrayLiteral
  / SimpleObjectLiteral  // !! this is different from JavaScript example
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

/* we don't want this becase it contains function calls
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

PropertyAssignment
  = name:PropertyName __ ":" __ value:AssignmentExpression {
      return {
        type:  "PropertyAssignment",
        name:  name,
        value: value
      };
    }
  / GetToken __ name:PropertyName __
    "(" __ ")" __
    "{" __ body:FunctionBody __ "}" {
      return {
        type: "GetterDefinition",
        name: name,
        body: body
      };
    }
  / SetToken __ name:PropertyName __
    "(" __ param:PropertySetParameterList __ ")" __
    "{" __ body:FunctionBody __ "}" {
      return {
        type:  "SetterDefinition",
        name:  name,
        param: param,
        body:  body
      };
    }
*/

PropertyName
  = IdentifierName
  / StringLiteral
  / NumericLiteral

PropertySetParameterList
  = Identifier

MemberExpression
  = base:(
        PrimaryExpression
/*      / FunctionExpression  // !! removed
      / NewToken __ constructor:MemberExpression __ args:Arguments {
          return {
            type:        "NewOperator",
            constructor: constructor,
            arguments:   args
          };
        }  */
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

NewExpression
  = MemberExpression
  / NewToken __ constructor:NewExpression {
      return {
        type:        "NewOperator",
        constructor: constructor,
        arguments:   []
      };
    }

CallExpression
  = base:(
      name:MemberExpression __ args:Arguments {
        return {
          type:      "FunctionCall",
          name:      name,
          arguments: args
        };
      }
    )
    argumentsOrAccessors:(
        __ args:Arguments {
          return {
            type:      "FunctionCallArguments",
            arguments: args
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
  = "(" __ args:ArgumentList? __ ")" {
    return args !== "" ? args : [];
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

UnaryOperator
  = DeleteToken
  / VoidToken
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