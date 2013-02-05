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