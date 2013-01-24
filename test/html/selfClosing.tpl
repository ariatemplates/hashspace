# template image(path)
  <img src="http://someting.com/{path}"/>
# /template

EOT
{
    "type" : "template",
    "name" : "image",
    "args" : ["path"],
    "content" : [{
                "type" : "element",
                "name" : "img",
                "attr" : [{
                            "name" : "src",
                            "value" : ["http://someting.com/", {
                                        "type" : "value",
                                        "args" : ["path"],
                                        "bind" : false
                                    }],
                            "isStatic" : false,
                            "quote" : "\""
                        }],
                "empty" : true
            }, {
                "type" : "text",
                "content" : "\r\n"
            }]
}

EOT

<img src="http://someting.com/pathValue">

ARGS

["pathValue"]