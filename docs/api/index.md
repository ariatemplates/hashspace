title: API Reference
cssclass: api
mappings:
  CONTENT_BEGIN: <article class="columns"><div class="column">
  CONTENT_END: </div></article>
  WIP: <div id="wip">Work in progress</div>
---

[WIP]

[CONTENT_BEGIN]
# API Reference

## General setup

#### Runtime libraries

TDB

---

#### Dependency management

TDB

---

#### Template bootstrap

To use a root template inside any `.html` page you have to use [noderjs](http://noder-js.ariatemplates.com).
Simply require the template file, and specify the `div` reference to which you want to render it.

```html
<div id="mydiv"></div>
<script type="text/javascript" src="noder-js.min.js"></script>
<script type="noder">
  var mytpl = require("path/to/mytpl");
  mytpl.render("mydiv");
</script>
```

The `div` reference can be either:

* a `"string"` id.
* an `HTMLElement` directly.

## Compiler usage and options


## Template statements

#### Template definition

Inside an `.hsp` file, you can define a template using `#template` statement. A single `.hsp` can define multiple templates.

```cs
#template tplname(arg1, arg2)
  //your template code goes here
  <div>Hello world</div>
#/template
```

---

#### Text output `{expression}`

TDB

---

#### Conditions `{if}`, `{else}` and `{else if}`

TDB

---

#### Loops `{foreach}`

TDB

---

#### html elements `<div class="">...</div>`

TDB

---

#### Logs `{log myvar}`

TDB

---

#### Scoped variables `{let myvar = [1, 2, 3]}`

TDB

---

#### Component template definitions `#template mycpt using ctrl:MyController`

TDB

---

#### Component and sub-template calls `<#mycpt attr="hello" />`

TDB

---

#### Component elements `<@body class="foo">...</@body>`

TDB


## Expressions

#### Text expressions ` {'details: '+(a.b.myValue*3)+' '+a.getDetails()}`

TDB

---

#### Function expressions `title="{a.b.getTooltip(d1,d2)}"`

TDB

---

#### Event handlers ` onclick="{a.b.doThis(event, mydata)}"`

TDB

---

#### CSS expressions `class="{'urgent':msg.urgency, msg.category}"`

TDB


## Special HTML element attributes

#### Model

TDB

---

#### Gesture events

TDB


## Interfaces

#### Component controllers

##### General life cycle

TDB

---

##### Attributes

Component attributes allow you to define the public API of the controller itself. People, or yourself, using the component knows what are the options to be used.

Hashspace natively supports different types of attributes:

* The basic types attributes, to be declared when defining your component class:

  ```json
  attributes: {
    "count": { type: "int", defaultvalue: 0 },
    "price": { type: "float", defaultvalue: 19.90 },
    "active": { type: "boolean", defaultvalue: true },
    "label": { type: "string", defaultvalue: "Label" }
  }
  ```
* We also support `callback` attributes. They are especially useful to be associated with you r component external events based API.

  ```json
  attributes: {
    onclick: { type: "callback" },
    onselect: { type: "callback" }
  }
  ```

  Usage of such an attribute is simple: call it whenever you need it. You don't even have to test for the actual presence of a function behind it. If the attribute is `undefined` hashspace provides a default empty function to void the execution.

  ```javascript
  onSelected: function(event, index) {
    // no need to test for existence. simply use it!
    this.onselect(index);
  }
  ```
* Last type of supported attribute is `template`. Those attributes are references to an existing template definition, or even inline template code to be used from within the component.

  Let's consider this component definition:

  ```javascript
  var MyCpt = Class({
    attributes: {
      header: { type: "template" },
      body: { type: "template", defaultcontent: true }
    }
  });
  ```

  ```cs
  #template mycpt using ctrl:MyCpt
    <header>
      <#ctrl.header />
    </header>
    <section>
      <#ctrl.body />
    </section>
  #/template
  ```
  In terms of usage, it would be done with several different syntaxes:

  ```html
  <!-- First one, with header as an attribute, and body as the default content -->
  <div>
    <#mycpt label="This is my header">
      This is my body <!--templating syntax could be used here ! -->
    </#mycpt>
  </div>

  <!-- With header and body as embedded attribute elements -->
  <div>
    <#mycpt>
      <@header>This is my header</@header>
      <@body>
        {foreach name in names}
          <div>{name}</div>
        {/foreach}
      </@body>
    </#mycpt>
  </div>
  ```

---

##### Elements

`template` type attributes are great to templatize the content of you component. But you can't use them publicly more than one time in your component content.

```cs
<#mycpt>
  <@header>This is my header</@header>
  <@header>This is my header</@header> <!-- Can't do that with template attribute -->
</#mycpt>
```

Elements are here to address this lack. They are somehow smarter `template` attributes. With them, you have the ability to use them as collections (or iterative elements).

```json
elements: {
  option: { type: "template" }
}
```

```cs
<#mylist>
  <@option>item 1</@option>
  <@option>item 2</@option>
  <@option>item 3</@option>
</#mylist>

To have an overview on how to use `template` elements, have a look at [content property](#content-property)

---

##### $init()

TBD

---

##### $dispose()

TBD

---

##### $render()

TBD

---

##### $getElement()

TBD

---

##### onXxxChange()

TBD

---

##### Content property

TBD

---

##### Attributes properties

TBD


## JavaScript libraries

#### Class utility `require("hsp/klass")`

##### $constructor()

TBD

##### $extends: ParentClass

TBD

##### $dispose()

TBD

##### Accessing parent class methods

TBD


#### Model updates

##### Object update

TBD

##### Array update

TBD

---

#### Hashspace runtime `require("hsp/rt")`

##### hsp.refresh()

TBD

##### hsp.template()

TBD

---

#### Logging `require("hsp/rt/log")`

##### log() and log.debug()

TBD

##### log.warning()

TBD

##### log.error()

TBD

##### log.info()

TBD

##### Multiple loggers with log.addLogger()

TBD


## Tests with Hashtester `require("hsp/utils/hashtester")`

#### Create a `new TestContext()`

TBD

---

#### Test context usage

TBD

##### Selector accessor `.()`

* ###### `.find()`

  TBD

* ###### `.text()`

  TBD

* ###### `.value()`

  TBD

* ###### `.attribute()`

  TBD

* ###### `.hasClass()`

  TBD

* ###### `.item()`

  TBD

* ###### `.click()`

  TBD

* ###### `.dblclick()`

  TBD

* ###### `.type()`

  TBD


##### logs()

* ###### `.clear()`

  TBD

##### $set()

TBD

##### $dispose()

TBD

[CONTENT_END]
