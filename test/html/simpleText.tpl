# template hello2(firstName, lastName)
   Hello dear
   World !
# /template

EOT

{
    "type" : "template",
    "name" : ["hello2"],
    "args" : ["firstName", "lastName"],
    "content" : [{
                "type" : "text",
                "content" : "Hello dear\r\n   World !\r\n"
            }]
}