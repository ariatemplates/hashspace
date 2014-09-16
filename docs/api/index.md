title: API Reference
cssclass: api-shared api
mappings:
  CONTENT_BEGIN: <article class="columns"><div>
  CONTENT_END: </div></article>
  WIP: <div id="wip">Work in progress</div>
---

[WIP]

[CONTENT_BEGIN]
# API Reference

## General setup

#### Template bootstrap

One way to use a template inside any `.html` page is to use [noderjs](http://noder-js.ariatemplates.com).
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

TBD

## Template statements

#### Template definition

Inside an `.hsp` file, you can define a template using `{template}` statement. A single `.hsp` can define multiple templates.

```cs
{template tplname(arg1, arg2)}
  //your template code goes here
  <div>Hello world</div>
{/template}
```

A template has the following properties:

* __a name__: the name of the local reference to the template
* __formal parameters__: a list of names for formal parameters. Inside the template, the names are used as references to the actual parameters. From the outside, actual parameters can be given __by both position and name__, depending on how the template is instantiated.

The template definition accepts an optional prefix `export`, which adds the template reference under a property of the wrapping module's `exports`: it follows the CommonJS specifications. The property gets the same name as the template.

Technically, a template is compiled by the engine and converted to a function (whose name is the template's one), which when get called returns a template instance bound to the given actual parameters.

---

#### Text output `{expression}`

All `{...}` occurrences which don't correspond to a statement are expressions. Have a look at the dedicated [section](#expressions) to see the list of supported expressions.

---

#### Conditions `{if}`, `{else}` and `{else if}`

You can define conditional parts of a template using the `{if}/{else if}/{else}` statements.

This statement is a block statement.

Note that as a kind of alternative, in some cases a ternary expression can be used instead of the statement.

```cs
{template example(context)}
  Number is:
  {if context.number < 0}
    negative
  {else if context.number > 0}
    positive
  {else}
    null
  {/if}
  &nbsp;({context.number === 0 ? 'null' : context.number}).
{/template}
```

---

#### Loops `{foreach}`

Use the `{foreach value in array}` or `{foreach index, value in array}` expression to iterate over an array.

This statement is a block statement.

Note that the statement creates its own local environment containing the reference to the current value and possibly the one to the current index.

```cs
{template example(array)}
  <ul>
  {foreach index, value in array}
    <li onclick="{process(value)}">{index}: {value}</li>
  {/foreach}
  </ul>
{/template}
```

---

#### html elements `<div class="">...</div>`

Templates contain enhanced HTML elements.

HTML elements in templates are almost like standard elements, but they have a special syntax allowing the use of __expressions and statements__.

Expressions can be found anywhere in text content of block elements. Expressions can also be found in values of tags' attributes. However, there are different kind of expressions and there can be restrictions in some cases (required to use a specific kind or forbidden to use some).

Statements on the other hand can only be found inside the content of block elements (and not the tag). There are _block_ and _inline_ statements, and they follow the same strict rules of nesting as XHTML elements, which means for instance that you can't surround an opening tag with a block statement.

For more information on expressions and statements, please refer to their corresponding sections.

```cs
<div id="{myid}">
  {if displayed}
    <div>
      Some text with variable content: {content}
    </div>
  {/if}
</div>

```

---

#### Logs `{log myvar}`

Logs the given values.

This statement is an inline statement.

As for other statements, its parameters are observed, so that __a new__ log entry will be issued anytime one of these parameters changes.



The log statement relies on the available logging methods, and uses specifically the `log` one. To know more about logging, please refer to the dedicated documentation section.

It will forward all the given parameters, and add its own metadata with the following values:

* `type`: `"debug"`
* `file`: the file name in which the statement is used
* `dir`: the path of the directory in which the file is
* `line`: the line number in which the statement appears in the file
* `column`: the column number in which the statement appears on the line

```cs
{template example()}
  {log scope}
{/template}
```

---

#### Scoped variables `{let myvar = [1, 2, 3]}`

Creates local variables in the current environment.

This statement is an inline statement.

Creating a local variable means declaring its name and initializing its value, with the common syntax: `reference = value`. The statement allows creating multiple variables in a row, using the comma to separate each.

The scope of the created variable is the container block in which the statement appears. This can be one of:

* template blocks
* html block elements
* condition blocks: `{if}`, `{else if}` or `{else}`
* `{foreach}` block

`{let}` statements __MUST__ appear at the beginning of the blocks in which they are used!

```hashspace
{template example()}
  {let tpl = "Variable in template environment"}

  <div>
    {let htmlBlock = "Variable in HTML block environment"}
  </div>

  {if condition}
    {let if_ = "Variable in if environment"}
  {else if condition2}
    {let elseIf = "Variable in an elseif environment"}
  {else}
    {let else_= "Variable in else environment"}
  {/if}

  {foreach value in container}
    {let foreach_ = "Variable in foreach environment"}
  {/foreach}
{/template}
```

---

#### Component template definitions `{template mycpt using ctrl:MyController}`

Defines a component, that is a template tied to a specific _class_ to be used as controller.

A template is considered as a component as soon as it uses the `using` keyword. The latter defines which class to use to build an instance of the controller, and under which name this instance will be referred inside the template.

Controllers are just a specific kind of class whose features are focused on interaction with templates. More information on what controllers really are and how they work is available in a [dedicated section](#interfaces) in this documentation.

---

#### Sub-template calls `<#mytemplate attr1="hello" />`

Full syntax looks like this: `<#subTemplateReference param1="param1Value param2="param2Value"/>` or `<#subTemplateReference param1="param1Value param2="param2Value"> ... </#subTemplateReference>`.

It is intended to look like a standard HTML element in use: it is an element with a name and attributes, and that can be used with or without any child elements.

The above means mainly two important things:

* parameters of the template (equivalent of element attributes) are __passed by name__, not by position
* it not only instantiates the template but also renders it automatically in a DOM element inserted exactly where the statement is used

There is also an additional subtlety regarding the passing of the parameters. As said, they are passed by name, so if you use `<tplref arg1="..." />` for a template defined like this `{template(whatever, arg1)}`, `arg1` will be properly passed, wherever it is defined in the parameters list. However the actual subtlety resides in the __first__ parameter of the function: if it doesn't match any attribute name, it is not left `undefined` as one could think. Instead, it refers to an object built from the attribute/value pairs. In our little example, `whatever` would refer to an object like this: `{arg1: "..."}`. This is implicitely due to the internal way hashspace is managing components instantiation (components are discussed later in this documentation).

__Reference__:

Note also that the statement is not expecting a simple template name, it takes a reference to it. The syntax limits it to be a simple reference access (which means that it can't be returned by a function call, that the ternary operator can't be used, etc.)

__Using a template as a container__:

Using a template as a container with child elements is only useful if you have to pass `template` attributes' values to the subtemplate. It is not oftenly used, and you might prefer implement here a [component](#interfaces) instead.

---

#### Component calls `<#mycpt attr="hello" />`

Instantiating a component is more or less defined like a template could be instantiated. The syntax remains the same.

The following rules mentioned for template instantiation also apply to components:

* the statement expects a reference to the component
* it can be declared as self-closed or defining a content with child elements
* the attributes of the statement are used to build an object with properties matching their names

Using a component with some nested child elements is actually really useful. The content inside the block is used to fulfill some of the attributes of the controller.

This content can have 2 forms, which cannot be mixed:

* a classical template content, with text, elements, statements, etc.
* a set of sub-attribute elements, each containing template content (as for previous point)

See [below](#interfaces) for more information about the different types of attributes, including `template`.

---

#### Component elements `<@body class="foo">...</@body>`

These elements are a reference to some special component attributes. You can only use them from within a component.
Please refer to their specific [section](#elements) for more information and samples.


## Expressions

#### Text expressions ` {'details: ' + (a.b.myValue*3) + ' ' + a.getDetails()}`

Expressions which don't fall into a specific category are _text expressions_.

A text expression is evaluated and its return value is converted to a string.

This string is then output in place of the expression.

```cs
<div class={element.tag.class}>
  {element.text.content}
</div>
```

---

#### Function expressions `title="{a.b.getTooltip(d1,d2)}"`

A function expression is an expression executing a function call.

Function expressions are useful for event handlers, but they can also be used to fetch any content: the return value of the function will be used as the output value of the expression.

The parameters of the function are observed (if applicable) to enable _refreshing_ the expression.

Note that the syntax doesn't allow you to directly access a property of the returned object, so you can't write something like this: `{cb().prop}`

```hashspace
{capitalize(context.name) + "."}
```

---

#### Conditionnal expressions `{"value": isOutput}`

Conditionally outputs a value.

We'll consider two parts in this kind of expression: the __left expression__, before the colon, and the __right expression__ which lays after. Note that they are not surrounded by braces in this case, only the global one is.

Those parts can be any simple expressions, which means not compound nor conditional ones.

The right one determines whether the result of the left one should be output or not: yes if the right part is truthy, no otherwise.

---

#### CSS expressions `class="{msg.category} {{'urgent':msg.urgency}}"` or compound expressions

You can combine several expressions into one expression statement using the comma; note that there is only one pair of braces which is for the compound expression, subexpressions being delimited by commas.

The results of the expressions will be concatenated with a single white space before it is output.

Because of the space which always gets _inserted between the expressions_, it does not suit all use cases. However, this is perfect to define the `class` attribute of a HTML element for instance.

```cs
<div class="{msg.category} {{'urgent':msg.urgency}}"></div>
```

## Modifiers

It is possible to specify functions to adapt the value of an expression to the desired display, but also to provide them with arguments or to combine them through piped expressions.

e.g.
```{some.expression|modifier1:arg2:arg3|modifier2}```

There are two ways to use modifiers:

* as simple functions that take the value to be modified as first argument;
* as objects that expose transformation functions: if the transformation method is called apply, it is implicitly used in the pipe expression, even if it is not specified (you can just use the object reference); an object is helpful to hold states, and manage more complex cases without overloading the main controller with this logic.

In both cases the rest of the arguments have to be separated by colons in the expression as shown in the previous snippet.

In order to avoid side effects, you must pay attention in modifying and returning __a copy__ of the original value passed as argument, and not the original value itself.

## Special HTML element attributes

#### Event handlers ` onclick="{a.b.doThis(event, mydata)}"`

Event handler attributes of HTML elements accept function expressions.

This means that instead of giving a piece of JavaScript code to be executed in the global environment, you can use the standard call mechanisms, in the environment of the current module (file).

Event handlers have a particularity though: in your function call, you can pass the `event` object to your handler function. This `event` object is implicitly available in the context of your expression, but it is not automatically passed, so you need to explicitly pass it if you want to have it available in your function.

```cs
{template example()}
  <span onclick="{handler(event)}">Click me</span>
{/template}

function handler(event) {
  // ...
}
```

---

#### Model attribute

Input elements have special consideration by the engine to handle UI data binding.

They are elements like others, so they support expressions with observing mechanisms inside their attributes, including the `value` attribute.

However the input value is changed from a user interaction and therefore the value referenced by the expression used in the `value` should reflect this change.

This process is know as _data binding_. The binding update occurs on `input` events.

##### Text based input and textarea

The engine also introduces a new attribute, called `model`. For most input types and textarea, this can be used interchangeably with `value`. However, for some of them like input type radio, the `value` and `model` attributes have distinct, specific roles.

```html
<input type="text" value="{data.text}" />
<input type="text" model="{data.text}" /> <!--Will do the same-->
<textarea model="{data.text}"></textarea>
```

##### Input type radio `<input type="radio" />`

Radio buttons are a specific kind of inputs, since they behave as a group of values where only one is _selected_ at a time.

The relevant value is thus not anymore attached to one single input, but to a group of inputs. Each of those inputs holds a specific alternative for the value, and when it gets selected, this alternative becomes the value of the group.

To handle easy data binding from many values to one value, a new attribute has been introduced, called `model`.

Put the reference of the model to bind inside `model` (using an expression), and put the specific value attached to an input inside `value`.

When a button gets selected, the reference in `model` is updated to the `value` of this button.

Doing it this way also allows the engine to automatically detect and create button groups: all buttons whose bound model is the same belong to the same group.

```html
<input type="radio" model="{data.value}" value="{data.choice1}" />
<input type="radio" model="{data.value}" value="{data.choice2}" />
<input type="radio" model="{data.value}" value="{data.choice3}" />
```

---

#### Gestures event handlers attributes

The engine adds a bunch of attributes to HTML elements to add support for gesture events.

_Gesture_ attributes are like other attributes expecting event handlers (e.g. `onclick`, etc.), so you can use function expressions with it.

Currently, here are the attributes for supported events:

* tap: `ontap`, `ontapstart`, `ontapcancel`
* longpress: `onlongpress`, `onlongpressstart`, `onlongpresscancel`
* single tap: `onsingletap`, `onsingletapstart`, `onsingletapcancel`
* double tap: `ondoubletap`, `ondoubletapstart`, `ondoubletapcancel`
* drag: `ondrag`, `ondragstart`, `ondragmove`, `ondragcancel`
* swipe: `onswipe`, `onswipestart`, `onswipemove`, `onswipecancel`
* pinch: `onpinch`, `onpinchstart`, `onpinchmove`, `onpinchcancel`


__Example:__

```html
<div ontap="{ontapHandler(event)}" ontapstart="{ontapHandler(event)}" ontapcancel="{ontapHandler(event)}"></div>
```

## Interfaces

#### Component controllers

##### General life cycle

When a component template is instantiated, a new instance of its controller is created and bound to the defined variable name, whose scope is the template. After instantiating its controller and performing all sorts of internal processing, the template calls its `$init` method, if defined.

Then, in order to be displayed for the first time, an internal refresh occurs, followed by the execution of `$refresh()` if defined.

A the end of the life cycle, when the component is not needed anymore, the `$dipose()` method, if defined, is executed.

---

##### Attributes

Defines the attributes of the controller, also considered as the attributes of the component.

In the _klass_ definition of the controller, a specific property called `attributes` is used to define the attributes of the controller/component. It allows you to define the public API of the controller itself.

It expects a map of attribute names (the keys) with their definitions (the values).

Here are the properties used to define a single attribute:

* `type`: defines the type of the property. Input values will be converted to that type or validated to conform to it. Specific types are discussed in sections below.
* `binding`: can be set to `"none"` (default), `"1-way"` or `"2-way"`. See below for more information about binding.
* `defaultValue`: used as the attribute value if its input value is __strictly__ `undefined`
* `defaultContent`: specific for attributes of type `template`, please see corresponding section for more information.

---

##### Attributes Types

Hashspace natively supports different types of attributes:

* __Basic types__

  The basic types attributes, to be declared when defining your component class:

  ```json
  attributes: {
    "count": { type: "int", defaultValue: 0 },
    "price": { type: "float", defaultValue: 19.90 },
    "active": { type: "boolean", defaultValue: true },
    "label": { type: "string", defaultValue: "Label" }
  }
  ```

  * `int`: the input value is converted using [`parseInt`](http://devdocs.io/javascript/global_objects/parseint), with a radix of 10
  * `float`: the input value is converted using [`parseFloat`](http://devdocs.io/javascript/global_objects/parsefloat)
  * `boolean`: evaluates to `true` if the input value is strictly equal to one of: `true`, `1`, `'1'` or `'true'`. Evaluates to `false` otherwise.
  * `string`: the input value is converted using the concatenation with an empty string
  * `object`: _no processing of the input value_

* __Callback type__

  We also support `callback` attributes. They are especially useful to be associated with you r component external events based API.

  ```json
  attributes: {
    onclick: { type: "callback" },
    onselect: { type: "callback" }
  }
  ```

  Attributes of type callback have strict restrictions, and they are used to define new event handlers on the component.

  Usage of such an attribute is simple: call it whenever you need it. You don't even have to test for the actual presence of a function behind it. If the attribute is `undefined` hashspace provides a default empty function to void the execution.

  ```javascript
  onSelected: function(event, index) {
    // no need to test for existence. simply use it!
    event.index = index; // We enrich the event object with what is needed
    this.onselect(event);
  }
  ```

  Attributes of type `callback` behave like event handlers, and expect the same content as them: usually function expressions. From a user point of view, there is thus no change compared to a standard `onclick` handler for instance.

  The `event` argument is optionnal, hashspace takes care of creating one for you if not provided:

  * if no argument is specified, the object is simply created, with this property
  * if the first argument is specified, it must:
    1. explicitly be an object
    2. not define a property named `type`, to avoid accidental overriding


* __Template type__

  Last type of supported attribute is `template`. Those attributes are references to an existing template definition, or even inline template code to be used from within the component.

  Let's consider this component definition:

  ```javascript
  var MyCpt = klass({
    attributes: {
      header: { type: "template" },
      body: { type: "template", defaultcontent: true }
    }
  });
  ```

  ```cs
  {template mycpt using ctrl:MyCpt}
    <header>
      <#ctrl.header />
    </header>
    <section>
      <#ctrl.body />
    </section>
  {/template}
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

##### Content property

In order to use a `template` attribute, the template controller has to declare an attribute of such a type.

When the component content is defined, it is automatically bound to this attribute (if only a `template` attribute is defined), or to the only attribute having the defaultContent flag set to true. 

---

##### Attributes bindings

_Binding_ means linking two references, so that they point to the same value when one is changed. More concretely in this context it means:

* updating the value of the attribute in the component if something outside bound to it changes: this is the _1-way_ binding
* updating the value of anything outside bound to the attribute when the latter is directly changed: this is the counterpart of the _1-way_ (no option for that)
* doing both: this is the _2-way_ binding
* doing none: this is the _none_ option

__Example:__

```json
attributes: {
  attr: {type: "string", defaultValue: "", binding: "2-way"}
}
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
```

To have an overview on how to use `template` elements, have a look at [content property](#content-property)

---

##### $init()

A user method to initialize the instance.

This method, if defined, is called after the instance has been built, and the attributes initialized. This is the last step of the process of creating a new instance.

__Don't forget to call the parent's `$init` method when appropriate!__

```javascript
var Controller = klass({
  $init: function() {
    // ...
  }
});
```

---

##### $dispose()

A user method to clean properly a _destroyed_ instance.

This method is automatically called when the component instance is not used anymore by any other template. This means that it will be called even if it's not actually collected by the underlying system's garbage collector.

Use it to do some custom cleanup process.

__Don't forget to call the parent's `$dispose` method when appropriate!__

```javascript
var Controller = klass({
  $dispose: function() {
    // ...
  }
});
```

---

##### $render()

A user method called after a component has been refreshed. Usefull in case you need to use third party libraries.

```javascript
var Controller = klass({
  $refresh: function() {
    // ...
  }
});
```
---

##### $getElement(index)

A method provided by controllers to retrieve an HTML element in the component.

First, this method actually takes into account only HTML Elements. All other types of HTML nodes (mainly text nodes) will be ignored in the process.

Then, this takes into account only top-level elements. The hierarchy of nodes is not traversed.

It is especially useful when you implement your own `$refresh()` method.

Note that the index is 0-based.

```cs
var Controller = klass({
  $refresh: function() {
    console.log(this.$getElement(0)); // div
    console.log(this.$getElement(1)); // hr
  }
});

{template example using controller:Controller}
  <div>
    <span></span>
  </div>
  Ignored text
  <hr />
{/template}
```

---

##### on&lt;Attribute&gt;Change(newValue, oldValue)

User methods whose names follow a specific pattern, used to react to change events triggered by attributes.

When a property's value changes, __and if the property is bound in at least one way__, the engine automatically calls - if defined - a method of the controller whose name is built from the name of the property:

* the name of the property is taken and its first letter is upper cased, the rest is left untouched
* the function must then be named like this: `"on" + transformedName + "Change"`

Now, let's talk quickly about what is a property change. A property's value is said to have changed when the reference associated to the property has changed, nothing more. That means that all inplace transformations are not taken into account, since the property will still refer to the same object.

__Important note__: any property change occurring in a change handler doesn't trigger any change event. That means that no change handler for any property will be called. This is done to prevent a possible automatic infinite recursive call to the current change handler (either directly or by some sorts of side-effects).

```javascript
var Controller = klass({
  attributes: {
    text: {type: "string", binding: "1-way"}
  },
  onTextChange: function(newValue, oldValue) {
    // ...
  },
});
```

## JavaScript libraries

#### Class utility `require("hsp/klass")`

A utility to define (JavaScript) classes easily.

What this utility does is very simple: it returns a constructor function with a properly set prototype.

The function `klass` expects a class definition as an object. All non-specific properties present in this object are put in a newly created prototype object, than set as the prototype of the constructor function that `klass` returns.

Specific properties on their side are various and are described in sections below.

```javascript
var klass = require("hsp/klass");

var myClass = klass({
  $constructor: {
    // ...
  },
  method1: function() {
    // ...
  }
  // ...
});
```

##### $constructor()

User method called when building a new instance of the class.

It is equivalent to defining any custom constructor function: it works on a freshly created object available as `this` and doesn't need to return it.

If no `$constructor` method is provided, `klass` will automatically build one, which will simply call the constructor function of the parent class, if any.

__Don't forget to call the parent class' `$constructor` method when appropriate!__

```javascript
var myClass = klass({
  $constructor: function() {
    // this....
  }
});
```

##### $extends: ParentClass

A reference to the parent class, for prototypal inheritance.

```javascript
var Parent = klass({
  // ...
});

var Child = klass({
  $extends: Parent
  // ...
});
```

##### $dispose()

User method called to properly clean a _destroyed_ instance.

##### Accessing parent class methods

TBD


#### Model updates

##### Object update

TBD

##### Array update

`Array` methods have been reimplemented to make native arrays observable.

The following standard methods of Array's prototype have been overridden for this purpose: [`splice`](http://devdocs.io/javascript/global_objects/array/splice), [`push`](http://devdocs.io/javascript/global_objects/array/push), [`pop`](http://devdocs.io/javascript/global_objects/array/pop), [`shift`](http://devdocs.io/javascript/global_objects/array/shift), [`unshift`](http://devdocs.io/javascript/global_objects/array/unshift), [`reverse`](http://devdocs.io/javascript/global_objects/array/reverse), [`sort`](http://devdocs.io/javascript/global_objects/array/sort).

This means that listeners added on the array will be notified about the inplace changes made using these functions. This makes them compatible with the automatic refresh mechanism of templates.

In addition to those methods, one more has been added: `splice2`, `Array.prototype.splice2(index, howMany, elements)`

Equivalent of standard [`splice`](http://devdocs.io/javascript/global_objects/array/splice) but using a list of items instead of relying on the variable length of the arguments list.

This method implements observing mechanisms.

```javascript
var array = ['a', 'b', 'e', 'f'];
array.splice2(2, 0, ['c', 'd']); // => ['a', 'b', 'c', 'd', 'e', 'f']

```
---

#### Hashspace runtime `require("hsp/rt")`

##### hsp.refresh()

TBD

##### hsp.template()

TBD

---

#### Logging `require("hsp/rt/log")`

A logging utility.

Logging is managed at application level, which means that there is only one logging context.

First, attach loggers with `log.addLogger(callback)`: they will receive the log entries when they are pushed.

Then, to create and push a log entry, you can use one of the logging methods or the `{log}` statement which works the same but sets itself more contextual information.

Note that there is a specific logger built in the engine itself, which will also receive the entries that are pushed after all the other (user) loggers have processed. However if one of the latter returns `false`, this built-in will be skipped.

Here are the properties of a log entry:

* `type {String}`: The level of the log, that you can use to filter the entries. Will always be one of: `"info"`, `"error"`, `"warning"` or `"debug"`.
* `message {String}`: The message of the log.
* `id {String|Number}`: You can use it to identify your entries.
* `file {String}`: The name of the file where the entry was issued.
* `dir {String}`: The name of the directory containing the previously mentioned file.
* `code {String}`: You can use it to specify a piece of code illustrating your message.
* `line {Number}`: The line number associated to the entry; usually it corresponds to where you pushed the entry.
* `column {Number}`: The column number associated to the entry inside the previously mentioned line.


##### log()

Creates and pushes a log entry.

It takes two types of arguments:

* A variable list of any kind of object: each will be converted to a string and then they will all be concatenated using a single white space. Finally, this will be used as the value for the `message` property of the entry.
* An optional set of metadata that mainly matches the properties of the created entry (see below).

The very last argument will be interpreted as the metadata object only if:

1. it is not the first argument and,
1. it is an object:
  1. which contains a property `type` and,
  1. whose value exactly corresponds to one of those we can find in entries' `type` property

Here are the properties of the metadata object and how they are used to build the log entry:

* `type {String|Number}`: Will set the `type` of the entry, and by definition will always be one of the accepted types.
* `id`, `file`, `dir`, `code`, `line`, `column`: sets the corresponding property of the entry.

__Example:__

```javascript
var log = require("hsp/rt/log");

log("The message", {
  type: "debug"
});
```

##### log.debug(object... [, metaData)])

Equivalent to `log` but sets the `type` property to `"debug"`.

```javascript
var log = require("hsp/rt/log");

log.debug("Debug message");
```

##### log.info(object... [, metaData)])

Equivalent to `log` but sets the `type` property to `"info"`.

```javascript
var log = require("hsp/rt/log");

log.info("Info message");

```

##### log.warning(object... [, metaData)])

Equivalent to `log` but sets the `type` property to `"warning"`.

```javascript
var log = require("hsp/rt/log");

log.warning("Warning message");

```

##### log.error(object... [, metaData)])

Equivalent to `log` but sets the `type` property to `"error"`.

```javascript
var log = require("hsp/rt/log");

log.error("Error message");
```

##### Multiple loggers with log.addLogger()

Adds a logger to the logging utility.

The `handler` is a function receiving the log entry.

If the function returns a falsy value (therefore including the case where it doesn't return anything explicitly), the main logger (at engine level) will not receive this entry.

```javascript
var log = require("hsp/rt/log");

log.addLogger(function(entry) {
  console.log(entry)
  return false;
});
```


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
