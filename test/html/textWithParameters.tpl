# template hello3(firstName, lastName)
   Hello {firstName} {lastName}
   
   World !
# /template

EOT

{
    "type" : "template",
    "name" : ["hello3"],
    "args" : ["firstName", "lastName"],
    "content" : [{
                "type" : "text",
                "content" : "Hello "
            }, {
                "type" : "value",
                "args" : ["firstName"],
                "bind" : false
            }, {
                "type" : "text",
                "content" : " "
            }, {
                "type" : "value",
                "args" : ["lastName"],
                "bind" : false
            }, {
                "type" : "text",
                "content" : "\r\n   \r\n   World !\r\n"
            }]
}