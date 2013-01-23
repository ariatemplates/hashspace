# template modifiers()
{bound}
{<not.bound}
# /template

EOT

{
    "type" : "template",
    "name" : "modifiers",
    "args" : [],
    "content" : [{
                "type" : "value",
                "args" : ["bound"],
                "bind" : false
            }, {
                "type" : "text",
                "content" : "\r\n"
            }, {
                "type" : "value",
                "args" : ["not", "bound"],
                "bind" : true
            }, {
                "type" : "text",
                "content" : "\r\n"
            }]
}

EOT

