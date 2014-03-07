# Tree Builder #

The **treebuilder** is the second step of the compilation process.  
From the list of blocks created by the **parser**, it builds a syntax tree.  
  
This step is also responsible for transforming HTML entities to UTF8, and to ensure that reserved keywords (event, scope) are not used.

## Input ##
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

## Output ##
The syntax tree, e.g.:
```
{
    "type": "template",
    "name": "test",
    "args": ["person"],
    "content": [
      {type:"element", name:"div", closed:false, attributes:[
          {name:"title", type:"text", value:"Some text"},
          {name:"id", type:"expression", "category": "objectref", "bound": true, "path": [ "person", "id" ]},
          {name:"class", type:"textblock", content:[
            {type:"expression", "category": "objectref", "bound": true, "path": [ "person", "gender" ]},
            {type:"text", value:" "},
            {type:"expression", "category": "objectref", "bound": true, "path": [ "person", "category" ]}
          ]}
      ],"content": [
        { "type": "textblock", "content": [
            {"type": "text","value": "Hello "},
            {"type": "expression", "category": "objectref", "bound": true, "path": [ "person", "name" ]},
            {"type": "text","value": "! "}
         ]}
      ]}
    ]
}
```

## Algorithm ##
The main process of the treebuilder is the `generateTree()` function in SyntaxTree class.  
It loops over the list of blocks created by the parser.  
For each type of block, there is an associated method manage it. By convention, type *xyz* is managed by the `__xyz` function.  

Depending on the type of the block, the process will decide if it has go deeper or not in the syntax tree.  
This is done by recursive calls to the `_advance` function.  
For example, a *foreach* block means that the next ones will be children, until a *endfroeach* block is found.  
