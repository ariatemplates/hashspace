# template empty (obj)
Some text here
# insert anotherTemplate(obj.one, obj.two, obj[3].four, true, 12, null, "string", ['array'], {object : true})
<div>Hi!</div>
# /template

EOT

{
   "args":[
      "obj"
   ],
   "content":[
      {
         "content":"Some text here\r\n",
         "type":"text"
      },
      {
         "args":{
            "args":[
               {
                  "type":"IdentifierLiteral",
                  "value":[
                     "obj",
                     "one"
                  ]
               },
               {
                  "type":"IdentifierLiteral",
                  "value":[
                     "obj",
                     "two"
                  ]
               },
               {
                  "type":"IdentifierLiteral",
                  "value":[
                     "obj",
                     {
                        "type":"NumericLiteral",
                        "value":3
                     },
                     "four"
                  ]
               },
               {
                  "type":"BooleanLiteral",
                  "value":true
               },
               {
                  "type":"NumericLiteral",
                  "value":1
               },
               {
                  "type":"NullLiteral"
               },
               {
                  "type":"StringLiteral",
                  "value":"string"
               },
               {
                  "elements":[
                     {
                        "type":"StringLiteral",
                        "value":"array"
                     }
                  ],
                  "type":"ArrayLiteral"
               },
               {
                  "properties":[
                     {
                        "name":"object",
                        "type":"PropertyAssignment",
                        "value":{
                           "type":"BooleanLiteral",
                           "value":true
                        }
                     }
                  ],
                  "type":"ObjectLiteral"
               }
            ],
            "base":"anotherTemplate"
         },
         "name":"insert",
         "type":"instruction"
      },
      {
         "attr":[

         ],
         "content":[
            {
               "content":"Hi!",
               "type":"text"
            }
         ],
         "empty":false,
         "name":"div",
         "type":"element"
      },
      {
         "content":"\r\n",
         "type":"text"
      }
   ],
   "name":"empty",
   "type":"template"
}

EOT

Some text here
<div>Hi!</div>

ARGS

[]