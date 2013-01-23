# template instruction (obj)
# for something in obj
   <span># insert another() {something.text}</span>
# /for
The one above is not an insert instruction
# if false
  This should not be in the output
# /if
  # if (obj && false)
    This neither
  # /if
# /template

EOT

{
   "args":[
      "obj"
   ],
   "content":[
      {
         "args":{
            "collection":{
               "type":"IdentifierLiteral",
               "value":[
                  "obj"
               ]
            },
            "iterator":"something"
         },
         "content":[
            {
               "attr":[

               ],
               "content":[
                  {
                     "content":"# insert another() ",
                     "type":"text"
                  },
                  {
                     "args":[
                        "something",
                        "text"
                     ],
                     "bind":false,
                     "type":"value"
                  }
               ],
               "empty":false,
               "name":"span",
               "type":"element"
            },
            {
               "content":"\r\n",
               "type":"text"
            }
         ],
         "name":"for",
         "type":"instruction"
      },
      {
         "content":"The one above is not an insert instruction\r\n",
         "type":"text"
      },
      {
         "args":{
            "type":"BooleanLiteral",
            "value":false
         },
         "content":[
            {
               "content":"This should not be in the output\r\n",
               "type":"text"
            }
         ],
         "name":"if",
         "type":"instruction"
      },
      {
         "args":{
            "left":{
               "name":"obj",
               "type":"Variable"
            },
            "operator":"&&",
            "right":{
               "type":"BooleanLiteral",
               "value":false
            },
            "type":"BinaryExpression"
         },
         "content":[
            {
               "content":"This neither\r\n  ",
               "type":"text"
            }
         ],
         "name":"if",
         "type":"instruction"
      }
   ],
   "name":"instruction",
   "type":"template"
}

EOT

<span># insert another() One</span>
<span># insert another() Two</span>
<span># insert another() Three</span>
The one above is not an insert instruction

ARGS

[
  [
    {"text" : "One"},
    {"text" : "Two"},
    {"text" : "Three"}
  ]
]