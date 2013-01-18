# template  multiple ()   
  <div>One</div>
  <div>Two</div>
  <div>Three</div><div>Four has no space</div>
# /template

EOT
{
    "type" : "template",
    "name" : ["multiple"],
    "args" : [],
    "content" : [{
                "type" : "element",
                "name" : "div",
                "attr" : [],
                "content" : [{
                            "type" : "text",
                            "content" : "One"
                        }],
                "empty" : false
            }, {
                "type" : "text",
                "content" : "\r\n  "
            }, {
                "type" : "element",
                "name" : "div",
                "attr" : [],
                "content" : [{
                            "type" : "text",
                            "content" : "Two"
                        }],
                "empty" : false
            }, {
                "type" : "text",
                "content" : "\r\n  "
            }, {
                "type" : "element",
                "name" : "div",
                "attr" : [],
                "content" : [{
                            "type" : "text",
                            "content" : "Three"
                        }],
                "empty" : false
            }, {
                "type" : "element",
                "name" : "div",
                "attr" : [],
                "content" : [{
                            "type" : "text",
                            "content" : "Four has no space"
                        }],
                "empty" : false
            }, {
                "type" : "text",
                "content" : "\r\n"
            }]
}

EOT

<div>One</div>
<div>Two</div>
<div>Three</div>
<div>Four has no space</div>