/*
 * Grammar for hashspace.
 * At the time of writing a file can only contain a single template that look like
 *   # template
 *     text, HTML nodes
 *     # instructions on their own single line
 *   # /template
 */

start
  = Template  // TODO should include blank characters before / after the template

Template
  = instruction:TemplateInstruction content:TemplateContent TemplateInstructionEnd {
  	return {
  		type : "template",
  		name : instruction.name,
  		args : instruction.args,
  		content : content
  	}
  }

TemplateInstruction
  = _ InstructionBegin _ TemplateToken _ name:IdentifierName* _ args:InstructionArguments? _ InstructionEnd {
  	return {
  		name : name,
  		args : args
  	}
  }

TemplateInstructionEnd
  = S? _ InstructionBegin _ "/" TemplateToken _ InstructionEnd*

TemplateContent
  = S? elements:(element / S / ("#" [^ ] / [^#<&])+)* {
  	var content = [];
  	// Note that white spaces found here are between the close of a tag and the beginning of another
  	// These can be safely ignored
  	for (var i = 0, len = elements.length; i < len; i += 1) {
  		// Each of these is either an element node or plain text
  		var element = elements[i];
  		if (element.type) {
  			if (element.type !== "space") {
  				// Don't want to store empty spaces between closed tags
  				content.push(elements[i]);
  			}
  		} else {
  			//console.log("Found a character, what to do???", element);
  			content.push({
  				type : "text",
  				content : element.join("")
  			});
  		}
  	}
  	return content;
  }


// Instructions must be on a single line, no html is allowed in them, but we might have optional parameters
Instruction
  = _ InstructionBegin _ InstrucionName _ InstructionArguments? _ InstructionEnd

InstrucionName
  = chars:IdentifierName* { return chars.join(""); }  //Allow any JS identifier, even reserved keywords

InstructionArguments
  = "(" _ args:InstructionArgumentList? _ ")" {
  	return args || [];
  }

InstructionArgumentList  // similar to FormalParameterList but we don't allow new lines in it
  = head:Identifier tail:(_ "," _ Identifier)* {
  	var result = [head];
  	for (var i = 0, len = tail.length; i < len; i += 1) {
  		result.push(tail[i][3]);
  	}
  	return result;
  }



/*####################
  Hashspace Keywords
#####################*/
InstructionBegin = "# "
InstructionEnd = EOL+
TemplateToken = "template"



/*################
  Base symbols
#################*/
// Any padding excluding line breaks
_
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
//  / [\u10000-\u10FFFF]	/* any Unicode character, excluding the surrogate blocks, FFFE, and FFFF. */

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
  = empty:("\u0020" / "\u0009" / "\u000D" / "\u000A")+ {
  	return {
  		type : "space",
  		content : empty.join("")
  	}
  }

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
  		attr : start.attributes,
  		content : content,
  		empty : false
  	};
  }

EmptyElemTag
  = "<" name:Name attributes:(S Attribute)* S? "/>" {
  	// attributes is an array of alternating white spaces and attributes
  	var attr = [];
  	for (var i = 0, len = attributes.length; i < len; i += 1) {
  		attr.push(attributes[i][1]);
  	}

  	return {
  		type : "element",
  		name : name,
  		attr : attr,
  		empty : true
  	};
  }

STag
  = "<" name:Name attributes:(S Attribute)* S? ">" {
  	return {
  		name : name,
  		attr : attributes
  	};
  }

content
  = before:CharData? after:((element / Reference / Comment) CharData?)* {
  	// This is inside an html tag, so spaces might be needed, return the text content if any
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
// FIXME this was the standard definition it includes CDATA and Process Instructions
// = CharData? ((element / Reference / CDSect / PI / Comment) CharData?)*

CharData  // All text that is not markup constitutes the character data of the document.
  = !([^<&]* "]]>" [^<&]*) chars:[^<&]* {
  	return {
  		type : "text",
  		content : chars.join("")
  	};
  }
// = [^<&]* - ([^<&]* "]]>" [^<&]*)

ETag
  = "</" Name S? ">"

Attribute
  = name:Name Eq value:AttValue {
  	return [name, value[1].join("")];
  }

AttValue
  = '"' ([^<&"] / Reference)* '"'
  / "'" ([^<&'] / Reference)* "'"

Reference
  = EntityRef / CharRef

EntityRef
  = "&" Name ";"

CharRef
  = "%" Name ";"

Eq
  = S? "=" S?

Comment
  = "<!--" chars:(!"-" Char / ('-' !"-" Char))* "-->" {
  	return "";
  	// just ignore comments
  }

/*  The following grammar is not supported by PEG
Comment
  = "<!--" ((Char - '-') / ('-' (Char - '-')))* "-->"

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
  = NullToken { return { type: "NullLiteral" }; }

BooleanLiteral
  = TrueToken  { return { type: "BooleanLiteral", value: true  }; }
  / FalseToken { return { type: "BooleanLiteral", value: false }; }

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