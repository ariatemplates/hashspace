# template hello4()
   <div><span>Some text here
   	<!-- even a - comment -->
   	and some <strong>other</strong> text here</span></div>
# /template

EOT

{
    "type" : "template",
    "name" : "hello4",
    "args" : [],
    "content" : [{
                "type" : "element",
                "name" : "div",
                "attr" : [],
                "content" : [{
                            "type" : "element",
                            "name" : "span",
                            "attr" : [],
                            "content" : [{
                                        "type" : "text",
                                        "content" : "Some text here\r\n   \t"
                                    }, {
                                        "type" : "text",
                                        "content" : "\r\n   \tand some "
                                    }, {
                                        "type" : "element",
                                        "name" : "strong",
                                        "attr" : [],
                                        "content" : [{
                                                    "type" : "text",
                                                    "content" : "other"
                                                }],
                                        "empty" : false
                                    }, {
                                        "type" : "text",
                                        "content" : " text here"
                                    }],
                            "empty" : false
                        }],
                "empty" : false
            }, {
                "type" : "text",
                "content" : "\r\n"
            }]
}

EOT

<div><span>Some text here and some <strong>other</strong> text here</span></div>