# hashspace compiler #

## Introduction ##

In hashspace, compiling means transforming a template from the specific syntax into a javascript string.
For example, this template
```
<template hello(person)>
    Hello {person.name}!
</template>
```
becomes `n.$text({e1:[1,2,"person","name"]},["Hello ",1,"!"])`

## Compilation process ##

The compilation is in fact a 3 steps process:
- First, the **parser** transforms the template into a flat list of blocks, thanks to a PEG grammar.
- Then, the **treebuilder** builds a syntax tree from the flat list.
- Finally, the **jsgenerator** generates the javascript string and validates it.

### Sample ###
Initial template:
```
<template hello(person)>
    Hello {person.name}!
</template>
```

Parser output:
```
{
    "type": "template",
    "name": "hello",
    "args": [ "person"],
    "content": [
        {
            "type": "text", "value": "Hello "
        }, {
            "type": "expression",
            "expType": "PropertyAccess",
            "category": "jsexpression",
            "bound": true,
            "base": {type:"Variable", name:"person"},
            "name": "name"
        }, {
            "type": "text", "value": "!"
        }
    ]
}
```

TreeBuilder output:
```
{
    "type": "template",
    "name": "hello",
    "args": ["person"],
    "content": [
        {
            "type": "textblock",
            "content": [
                {
                    "type": "text", "value": "Hello "
                }, {
                    "type": "expression",
                    "category": "objectref",
                    "bound": true,
                    "path": [ "person", "name" ]
                }, {
                    "type": "text", "value": "!"
                }
            ]
        }
    ]
}
```

JSGenerator output:
```
n.$text({e1:[1,2,"person","name"]},["Hello ",1,"!"])
```

### More samples ###
The tests of the compiler are actually samples with the 4 steps:
https://github.com/ariatemplates/hashspace/tree/master/test/compiler/samples
https://github.com/ariatemplates/hashspace/tree/master/test/compiler/errsamples