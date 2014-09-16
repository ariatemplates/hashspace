title: Javascript Framework
cssclass: home
mappings:
  MANTRA_BEGIN: <div class="mantra">
  MANTRA_END: </div>
  CONTENT_BEGIN: <article class="columns"><div class="column">
  CONTENT_END: </div></article>
---

[MANTRA_BEGIN]
## Web fuel for the long run
### Hashspace is a powerful and lightweight JavaScript template engine that focuses on simplicity and efficiency. <br /><br />It is free and open-source.
[MANTRA_END]

[CONTENT_BEGIN]
## Easy
#### Syntax
Hashspace turns static HTML pages into dynamic templates with the help of a few easy to learn statements that feel very natural to use:

```html
{if tasklist.length > 0}
  <ul>
  {foreach task in tasklist}
    <li class="{{'done': task.completed, 'ongoing': !task.completed}}">
      {task.description}
    </li>
  {/foreach}
  </ul>
{/if}
```

#### Errors management

Templates are compiled into pure JavaScript modules, which is great because browsers don’t need extra processing to run them.
The generation of meaningful errors is another nice feature that makes debugging straightforward:

```bash
Fatal error: HSP compilation error in src/hello.hsp (2,3): Missing end if statement
Fatal error: HSP compilation error in src/hello.hsp (2,3): Missing end element &lt;/h1>
```

## Performant

Working with templates means that, at any given time, only the necessary markup is processed and displayed on the browser: no more juggling with `display:none` and keeping useless elements active inside the DOM.

## Powerful

Hashspace takes care for you of the finicky plumbing required to synchronize the DOM and the data model so that you focus on what matters: designing your interface.

Implicit bindings modify your model as soon as a value is changed in the user interface while, conversely, changes in the data model will automatically reflect on the display.
And because Hashspace uses a virtual DOM for its computations, these updates are optimized and actual DOM manipulations are kept to a minimum.

## Future-proof

We believe in standards and best practices, so we built Hashspace with these in mind so that your code stays as much forward-compatible as possible.

The engine is compatible with [CommonJS dependency management](http://noder-js.ariatemplates.com) principles and the upcoming object.observe() implementation.
Hashspace components (have a look at the [playground](/playground/)) also bring forward the much anticipated web components and make them available to every supported browser today.


## Robust

Hashspace’s code reliability is monitored by a comprehensive test suite.
Each new feature is reviewed and checked before it is integrated.
The people behind Hashspace have years of experience in framework design and building solid solutions, mostly thanks to the work they put in [Aria Templates](http://ariatemplates.com).

[CONTENT_END]

---

#### Code Samples

To illustrate all these points, we crafted both a dynamic live [playground](/playground/) and an implementation of the [TodoMVC](/todomvc/) application using Hashspace. You can read more information about the todoMVC project [here](http://todomvc.com/).

