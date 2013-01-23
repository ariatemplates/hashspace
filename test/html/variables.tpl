# template variables (one, two, two2,_)
  Variables might be inside some text {one}
  <span>Inside a tag body {two.content}</span>
  Inside an attribute<div class="{one}&nbsp;two">
     As part of an attribute <span class='strong {two2.style.classname}'>{two.innerText}</span>
  </div>
  Not yet as attribute name or tag name

  There might be multiple value in an attribute
  <article style="{two2.color}='{two2.colorValue}';" staticAttribute="no&#20;variables&#20;here">
  	 As {_.well} as {_.inside} an html {_.element}
  </article>Note that _ has no space in the template argument
# /template


EOT

{
    "type" : "template",
    "name" : "variables",
    "args" : ["one", "two", "two2", "_"],
    "content" : [{
                "type" : "text",
                "content" : "Variables might be inside some text "
            }, {
                "type" : "value",
                "args" : ["one"],
                "bind" : false
            }, {
                "type" : "text",
                "content" : "\r\n  "
            }, {
                "type" : "element",
                "name" : "span",
                "attr" : [],
                "content" : [{
                            "type" : "text",
                            "content" : "Inside a tag body "
                        }, {
                            "type" : "value",
                            "args" : ["two", "content"],
                            "bind" : false
                        }],
                "empty" : false
            }, {
                "type" : "text",
                "content" : "\r\n  Inside an attribute"
            }, {
                "type" : "element",
                "name" : "div",
                "attr" : [{
                            "name" : "class",
                            "value" : [{
                                        "type" : "value",
                                        "args" : ["one"],
                                        "bind" : false
                                    }, "&nbsp;two"],
                            "isStatic" : false,
                            "quote" : "\""
                        }],
                "content" : [{
                            "type" : "text",
                            "content" : "\r\n     As part of an attribute "
                        }, {
                            "type" : "element",
                            "name" : "span",
                            "attr" : [{
                                        "name" : "class",
                                        "value" : ["strong ", {
                                                    "type" : "value",
                                                    "args" : ["two2", "style", "classname"],
                                                    "bind" : false
                                                }],
                                        "isStatic" : false,
                                        "quote" : "'"
                                    }],
                            "content" : [{
                                        "type" : "value",
                                        "args" : ["two", "innerText"],
                                        "bind" : false
                                    }],
                            "empty" : false
                        }, {
                            "type" : "text",
                            "content" : "\r\n  "
                        }],
                "empty" : false
            }, {
                "type" : "text",
                "content" : "\r\n  Not yet as attribute name or tag name\r\n\r\n  There might be multiple value in an attribute\r\n  "
            }, {
                "type" : "element",
                "name" : "article",
                "attr" : [{
                            "name" : "style",
                            "value" : [{
                                        "type" : "value",
                                        "args" : ["two2", "color"],
                                        "bind" : false
                                    }, "='", {
                                        "type" : "value",
                                        "args" : ["two2", "colorValue"],
                                        "bind" : false
                                    }, "';"],
                            "isStatic" : false,
                            "quote" : "\""
                        }, {
                            "name" : "staticAttribute",
                            "value" : ["no&#20;variables&#20;here"],
                            "isStatic" : true,
                            "quote" : "\""
                        }],
                "content" : [{
                            "type" : "text",
                            "content" : "\r\n  \t As "
                        }, {
                            "type" : "value",
                            "args" : ["_", "well"],
                            "bind" : false
                        }, {
                            "type" : "text",
                            "content" : " as "
                        }, {
                            "type" : "value",
                            "args" : ["_", "inside"],
                            "bind" : false
                        }, {
                            "type" : "text",
                            "content" : " an html "
                        }, {
                            "type" : "value",
                            "args" : ["_", "element"],
                            "bind" : false
                        }, {
                            "type" : "text",
                            "content" : "\r\n  "
                        }],
                "empty" : false
            }, {
                "type" : "text",
                "content" : "Note that _ has no space in the template argument\r\n"
            }]
}

EOT

Variables might be inside some text oneIs1
<span>Inside a tag body some content</span>
Inside an attribute<div class="oneIs1&amp;nbsp;two">
As part of an attribute <span class='strong class2'>Text from variables</span>
</div>
Not yet as attribute name or tag name

There might be multiple value in an attribute
<article style="color='pink';" staticAttribute="no&amp;#20;variables&amp;#20;here">
As well as inside an html element
</article>Note that _ has no space in the template argument

ARGS

["oneIs1", {
    "content" : "some content",
    "innerText" : "Text from variables"
}, {
    "style" : {
        "classname" : "class2"
    },
    "colorValue" : "pink",
    "color" : "color"
}, {
    "well" : "well",
    "inside" : "inside",
    "element" : "element"
}]