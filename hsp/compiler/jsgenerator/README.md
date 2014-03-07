# JS Generator #

The **jsgenerator** is the third and last step of the compilation process.  
It generates the final compiled template as a javascript string, using the syntax tree built previously.

## Input ##
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

## Output ##
The compiled template, e.g.:
```
n.elt(  "div", 
    {e1:[1,2,"person","id"],e2:[1,2,"person","gender"],e3:[1,2,"person","category"]} ,
    {"title":"Some text","id":["",1],"class":["",2," ",3]},
    0,[
        n.$text({e1:[1,2,"person","name"]},["Hello ",1,"! "])
    ]
)
```

## Algorithm ##

The first part of this step is the actual generation.  
It is done thanks to the TemplateWalker class (which extend TreeWalker).  
It walks the SyntaxTree built previously and manages each node with a processor, depending on its type.  
Each processor generates a javascript string for the node and its children.  
  
Once the generation is done, the resulting javascript string is validated with the *acorn* parser.