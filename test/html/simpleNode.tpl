# template hello4(person)
   Hello {person.firstName} !
   <div>xxx</div>
# /template

EOT

{
    "type" : "template",
    "name" : ["hello4"],
    "args" : ["person"],
    "content" : [{
                "type" : "text",
                "content" : "Hello "
            }, {
                "type" : "value",
                "args" : ["person", "firstName"],
                "bind" : false
            }, {
                "type" : "text",
                "content" : " !\r\n   "
            }, {
                "type" : "element",
                "name" : "div",
                "attr" : [],
                "content" : [{
                            "type" : "text",
                            "content" : "xxx"
                        }],
                "empty" : false
            }, {
                "type" : "text",
                "content" : "\r\n"
            }]
}

EOT

Hello brave user !
<div>xxx</div>

ARGS

[{
    "firstName" : "brave user"
}]