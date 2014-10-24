# Parser #

The **parser** is the first step of the compilation process.  
It parses the hashspace syntax and builds a flat list of the blocks which compose the template.  

The parsing is done thanks to the PEG.js library, for more information see http://pegjs.majda.cz/  
The grammar is stored in the `hspblocks.pegjs` file, which is itself compiled into javascript  during the pre-publish grunt task.

## Input ##
The hashspace template source code, e.g.:
```
<template id="test" args="person">
    <div title="Some text" id="{person.id}" class="{person.gender} {person.category}">
        Hello {person.name}!
    </div>
</template>
```

## Output ##
The flat list of blocks, e.g.:
```
{
  "type": "template",
  "name": "test",
  "args": ["person"],
  "content": [
      {type:"element", name:"div", closed:false, attributes:[
          {type:"attribute", name:"title", value:[{type:"text", value:"Some text"}]},
          {type:"attribute", name:"id", value:[{type:"expression", "category": "jsexpression", expType:"PropertyAccess", "bound": true, base:{type:"Variable"name:"person"}, name:"id"}]},
            {type:"attribute", name:"class", value:[
              {type:"expression", "category": "jsexpression", expType:"PropertyAccess", "bound": true, base:{type:"Variable", name:"person"}, name:"gender"},
              {type:"text", value:" "},
              {type:"expression", "category": "jsexpression", expType:"PropertyAccess", "bound": true, base:{type:"Variable", name:"person"}, name:"category"}
          ]}
      ]},
      {"type": "text","value": "Hello "},
      {"type": "expression", "category": "jsexpression", expType:"PropertyAccess", "bound": true, base:{type:"Variable", name:"person"}, name:"name"},
      {"type": "text","value": "! "},
      {"type": "endelement",name:"div"}
  ]
}
```
The list is available in the `"content"` attribute.

## Blocks ##

The blocks returned are defined in the PEG grammar.  
They all have a **type** property which is the primary key.  
Some of them have a **category** property which is the secondary key.  
  
Here is an extract of the grammar listing all the possible blocks: 

### Hashspace specific blocks ###

```
TextBlock
{type:"plaintext", value:lines.join('')}

TemplateBlock
- Template with a controller
{type:"template", name:name, mod:mod, controller:args.ctl, controllerRef: args.ctlref, line:line, column:column}
- Template without a controller
{type:"template", name:name, mod:mod, args:(args==='')? []:args, line:line, column:column}

TemplateEnd
{type:"/template",line:line,column:column}}

TplTextBlock "text"
{type:"text", value:chars.join(''), line:line, column:column}

InvalidBlock
{type:"invalidblock", code:chars.join(''), line:line, column:column}

IfBlock
{type:"if", condition:expr, line:line, column:column}

ElseIfBlock
{type:"elseif", condition:expr, line:line, column:column}

ElseBlock
{type:"else", line:line, column:column}

EndIfBlock
{type:"endif", line:line, column:column}

CommentBlock
{type:"comment", value:chars.join('')}

HTMLCommentBlock
{type:"comment", value:chars.join('')}

ForeachBlock
{type:"foreach", item:args.item, key:args.key, colref:args.colref, line:line, column:column}

EndForeachBlock
{type:"endforeach", line:line, column:column}

HTMLElement
{type:"element", name:name, closed:(end!==""), attributes:atts, line:line, column:column}

EndHTMLElement
{type:"endelement", name:name, line:line, column:column}

HspComponent
{type:"component", ref:ref, closed:(end!==""), attributes:atts, line:line, column:column}

EndHspComponent
{type:"endcomponent", ref:ref, line:line, column:column}

HspCptAttribute
{type:"cptattribute", name:ref, closed:(end!==""), attributes:atts, line:line, column:column}

EndHspCptAttribute
{type:"endcptattribute", name:ref, line:line, column:column}

InvalidHTMLElement
{type:"invalidelement", code:'<'+code.join(''), line:line, column:column}

HTMLAttribute
{type:"attribute", name:name, value:v, line:line, column:column}

HTMLAttributeText
{type:"text", value:chars.join('')}

LogBlock
{type:"log",exprs:exprs, line:line, column:column}

LetBlock
{type:"let",assignments:asn, line:line, column:column}

ExpressionBlock
{type:"expression", category: "jsexpression", expType: //see JS blocks below}

InvalidExpression
{type:"expression", category: "invalidexpression", r.code=code.join('')}

HExpressionCssClassElt
{type:"CssClassElement", left:head, right:tail}

InvalidExpressionValue
{type:"invalidexpression", code:chars.join(''), line:line, column:column}
```

### Javascript general blocks ###

```
JSLiteral
- NullLiteral     { return {type:"expression", category: "null", code:"null"};}
- BooleanLiteral  { return {type:"expression", category: "boolean", value:v.value, code:""+v.value};}
- NumericLiteral  { return {type:"expression", category: "number", value: v, code:""+v};}
- StringLiteral   { return {type:"expression", category: "string",  value: v, code:""+v};}

NullLiteral
{type: "nullliteral", value: null }

BooleanLiteral
- True  { return { type: "booleanliteral", value: true  }; }
- False { return { type: "booleanliteral", value: false }; }

PrimaryExpression  
{ type: "Variable", name: name, code:name }

ArrayLiteral
{
  type:     "ArrayLiteral",
  elements: elements !== "" ? elements : []
}

ObjectLiteral
{
  type:       "ObjectLiteral",
  properties: properties !== "" ? properties[0] : []
}

PropertyAssignment // changed
{
  type:  "PropertyAssignment",
  name:  name,
  value: value
}

MemberExpression
{
  type: "PropertyAccess",
  base: result,
  name: accessors[i]
}

CallExpression
{
  type:      "FunctionCall",
  name:      name,
  arguments: arguments
}

    {
      type:      "FunctionCallArguments",
      arguments: arguments
    }
    {
        type: "PropertyAccessProperty",
        name: name
    }

PostfixExpression
{
  type:       "PostfixExpression",
  operator:   operator,
  expression: expression
}

UnaryExpression
{
  type:       "UnaryExpression",
  operator:   operator,
  expression: expression
}

MultiplicativeExpression
AdditiveExpression
ShiftExpression
RelationalExpression
RelationalExpressionNoIn
EqualityExpression
EqualityExpressionNoIn
BitwiseANDExpression
BitwiseANDExpressionNoIn
BitwiseXORExpression
BitwiseXORExpressionNoIn
BitwiseORExpression
BitwiseORExpressionNoIn
LogicalANDExpression
LogicalANDExpressionNoIn
LogicalORExpression
LogicalORExpressionNoIn
Expression
ExpressionNoIn
{
  type:     "BinaryExpression",
  operator: tail[i][1],
  left:     result,
  right:    tail[i][3]
}

ConditionalExpression
ConditionalExpressionNoIn
{
  type:            "ConditionalExpression",
  condition:       condition,
  trueExpression:  trueExpression,
  falseExpression: falseExpression
}

AssignmentExpression
AssignmentExpressionNoIn
{
  type:     "AssignmentExpression",
  operator: operator,
  left:     left,
  right:    right
}
```