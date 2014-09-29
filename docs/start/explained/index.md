title: Getting started
cssclass: api-shared getting-started
mappings:
  CONTENT_BEGIN: <article class="columns"><div>
  CONTENT_END: </div></article>
---

[CONTENT_BEGIN]

# Getting started with Hashspace: explained

To get started with Hashspace, you have two options: either compile the Hashspace files (`*.hsp`)
to JavaScript on the server side (during build time), or compile them dynamically in the browser
(useful for debugging and rapid prototyping).

The examples on this page assume that you have [Node](http://nodejs.org) platform installed on your machine,
though this is not necessary for in-browser template interpretation.

## On-the-fly (in-browser) compilation

Let's first have a look with on-the-fly compilation. This is a good option if you're just starting
development and care more about developer's productivity than page load performance.

If you want to have on-the-fly in-browser compilation, you may go with Hashspace + NoderJS duo.

First, let's create a simple HSP file and a controller:

#### `hello.hsp`

````
var HelloCtrl = require("./HelloCtrl");

<template Hello using ctrl:HelloCtrl>
   <p>Hello, {ctrl.name}!</p>

   <input model="{ctrl.name}">
   <button onclick="{ctrl.clear()}">Clear</button>
</template>

module.exports = Hello;
```

#### `HelloCtrl.js`

```
var klass = require("hsp/klass");

var HelloCtrl = klass({
    // declaring "name" attribute so that we can pass it
    // when instantiating a template via `Hello({name:"World"})`
    $attributes: {
        "name" : { type : "string" }
    },
    clear : function () {
        this.name = "";
    }
});

module.exports = HelloCtrl;
```

Now we need an HTML file that will take care of rendering the template.

- First (1), we need to load noderJS -- the CommonJS loader necessary for loading our
modules -- and tell it via the configuration parameter that whenever it encounters an HTTP request for:

  - `*.hsp` file, then the downloaded file should be
    additionally **compiled in the browser** by an appropriate compiler module
    (see `preprocessors` config) to the pure JavaScript code that the browser understands.

  - `*.js` file, then the downloaded file should be **rewritten with Hashspace transpiler**:
    all occurrences of code like `foo.bar = 42` will be rewritten to `$set(foo, "bar", 42)`,
    so that Hashspace automatic data bindings work correctly (actually, this step is not
    needed -- but otherwise you'd have to remember to use `$set` yourself in all JS code,
    which can be tedious and error-prone).

- Then, we need to load Hashspace runtime and the mentioned Hashspace in-browser compiler (2).

- Next, we need an HTML element in which our template will be rendered. In (3), we're creating
a `<div id="output" />`.

- Finally (4), we're ready to start our application: create a `<script type="application/x-noder">` that will
be executed via noderJS, which fetches and evaluates the `hello.hsp` template. The HSP file exports
a `Hello` template, which we then instantiate and call its `render` method which renders its HTML output
in an HTML element with given id (`output` in this example).

#### `index.htm` (using source HSP files)

```
<!DOCTYPE html>
<html>
  <head>
    <!-- 1: load noderJS with appropriate config -->
    <script src="http://noder-js.ariatemplates.com/dist/v1.5.0/noder.dev.js" type="text/javascript">
    {
      packaging: {
        preprocessors: [{
          pattern: /\.hsp$/,
          module: "hsp/compiler/compile"
        }, {
          pattern: /\.js$/,
          module: "hsp/transpiler/transpile"
        }]
      }
    }
    </script>

    <!-- 2: load Hashspace and Hashspace compiler -->
    <script src="http://hashspace.ariatemplates.com/dist/0.0.4/hashspace-noder.js" type="text/javascript"></script>
    <script src="http://hashspace.ariatemplates.com/dist/0.0.4/hashspace-noder-compiler.js" type="text/javascript"></script>

    <!-- 4: ready to load our HSP file! -->
    <script type="application/x-noder">
        var Hello = require('hello.hsp');
        Hello({name:"World"}).render("output");
    </script>
  </head>
  <body>
    <!-- 3: the output element -->
    <div id="output"></div>
  </body>
</html>
```

Now to see the effects of our effort, we just need to start an HTTP server
(since in most modern browsers, `XMLHttpRequest`s from `file://` protocol are disabled for security reasons).

For instance, we may use a simple zero-configuration `http-server` module from npm.

- `$ npm install -g http-server`
- `$ cd /path/to/my/app`
- `$ http-server`
- navigate to `http://localhost:8080/index.htm` in a browser.

## Server-side compilation

When your application is getting mature, it's better to precompile Hashspace templates
at build time, so that the web browser has less work to do and, in turn, renders them faster.

We'll consider the two sample files presented earlier. We'll just slightly tweak the HTML file,
and introduce compiler & transpiler scripts.

To get the possibility to use the compiler and transpiler, we need to install Hashspace:

- `$ npm install hashspace`

If you prefer bare-metal solutions, you may use essentially the following one-liners
of NodeJS code to transform a piece of Hashspace to JavaScript:

```
var compiledHS = require('hashspace').compiler.compile(inputHSCode, inputHSFileName).code;
```
```
var transpiledJS = require('hashspace/hsp/transpiler/transpile')(inputJSCode, inputJSFileName);
```

In a more real-world example we would read files from disk and output the transformed ones
to disk as well, in a separate directory. We could do this with the following NodeJS program:

#### `compile.js`

```
var fs = require('fs');
var hscompiler = require('hashspace').compiler;

var cfg = {
    inputFile : "src/hello.hsp",
    outputFile : "out/hello.hsp.js"
};

var fileContents = fs.readFileSync(cfg.inputFile, "utf-8");
var output = hscompiler.compile(fileContents, cfg.inputFile);
if (!fs.existsSync("out")) {
    fs.mkdirSync("out");
}
fs.writeFileSync(cfg.outputFile, output.code);
```

A similar program to transpile JS to `$set`-syntax:

#### `transpile.js`

```
var fs = require('fs');
var transpile = require('hashspace/hsp/transpiler/transpile');

var cfg = {
    inputFile : "src/HelloCtrl.js",
    outputFile : "out/HelloCtrl.js"
};

var fileContents = fs.readFileSync(cfg.inputFile, "utf-8");
var output = transpile(fileContents, cfg.inputFile);
if (!fs.existsSync("out")) {
    fs.mkdirSync("out");
}
fs.writeFileSync(cfg.outputFile, output);
```

Running the following command will now produce the output files:

- `$ node compile`
- `$ node transpile`

Two remarks:

- We named the output HSP file with `.js` extension since it's a valid JS file, though actually
we may name it whatever we like, e.g. just keep the `.hsp` extension.
- Of course those are a simple examples compiling one hardcoded file at a time. In your script you'd
have to traverse a set of input files yourself, or use existing tools (read further).

Finally, we need a proper `index.htm` file. However this time we don't need to include a compiler script
nor to set-up NoderJS's preprocessors. Apart from that, we need to, obviously, require a compiled file.

#### `index.htm` (using compiled HSP files)

```
<!DOCTYPE html>
<html>
  <head>
    <!-- 1: load noderJS -->
    <script src="http://noder-js.ariatemplates.com/dist/v1.5.0/noder.dev.js" type="text/javascript"></script>

    <!-- 2: load Hashspace -->
    <script src="http://hashspace.ariatemplates.com/dist/0.0.4/hashspace-noder.js" type="text/javascript"></script>

    <!-- 4: ready to load our compiled HSP file! -->
    <script type="application/x-noder">
        var Hello = require('out/hello.hsp.js');
        Hello({name:"World"}).render("output");
    </script>
  </head>
  <body>
    <!-- 3: the output element -->
    <div id="output"></div>
  </body>
</html>
```

As suggested earlier, we can now

- run `$ http-server`
- and navigate to `http://localhost:8080/index.htm` in a browser to see the output.

### GulpJS packages

If you're using [gulpjs](http://gulpjs.com/), you may use dedicated tasks for compiling Hashspace files.
You can have a look at a
[sample Hashspace Hello World application with Gulp setup](https://github.com/PK1A/hsp-hello-gulp)
which makes use of `gulp-hsp-compiler` and `gulp-hsp-transpiler` npm packages.

## Appendix: where to get Hashspace and noderJS builds

In the above examples, we've used certain released versions of Hashspace and noder.
You can see the available versions under the following URLs:

- [Hashspace releases](https://github.com/ariatemplates/hashspace/tree/gh-pages/dist/)
- [noderJS releases](https://github.com/ariatemplates/noder-js/tree/gh-pages/dist/)

If you want to use the latest improvements in not-yet-released code, you may use SNAPSHOT versions.

