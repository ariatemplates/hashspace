title: Getting started
cssclass: api-shared getting-started
mappings:
  CONTENT_BEGIN: <article class="columns"><div>
  CONTENT_END: </div></article>
---

[CONTENT_BEGIN]

# Getting started with Hashspace

This is a quick start guide for creating a Hello World application with Hashspace.
It should take no more than 10-15 minutes to get through it.
If you want to get more explanations, head to [Getting Started Explained](./explained) page.

The examples later on this page assume that you have [Node](http://nodejs.org) platform (v0.10.x)
installed on your machine, though this is not necessary for in-browser template interpretation.


## First template and controller

First, let's create a simple Hashspace template `Hello` and a controller:

#### `/src/hello.hsp`

````
var HelloCtrl = require("./HelloCtrl");

<template Hello using ctrl:HelloCtrl>
   <p>Hello, {ctrl.name}!</p>

   <input model="{ctrl.name}">
   <button onclick="{ctrl.clear()}">Clear</button>
</template>

module.exports = Hello;
```

#### `/src/HelloCtrl.js`

```
var klass = require("hsp/klass");

var HelloCtrl = klass({
    $attributes: {
        "name" : { type : "string" }
    },
    clear : function () {
        this.name = "";
    }
});

module.exports = HelloCtrl;
```

Now we need an HTML file (let's call it `index.htm`) that will take care of
instantiating and rendering the template. The contents of this file will differ
depending on which workflow we use - we'll cover that shortly.

At this point, it's also important to note that **Hashspace projects should be served
from HTTP server** and not through the `file://` protocol. See the
[appendix](#appendix-running-an-http-server) at the end of this document
for more information.

## Precompilation vs on-the-fly compilation

To run your Hashspace application, you have two options:
- have your files compiled dynamically in the browser, or
- set up your dev environment to precompile the Hashspace and JavaScript files before they reach the browser, e.g.
  - have a dedicated build & deploy script, or
  - configure a file watcher which runs the compilation whenever some `.hsp` or `.js` file changes on disk

## On-the-fly (in-browser) compilation

**Note that applications using in-browser compilation will be significantly less performant
than the ones using precompiled templates. Use the in-browser compilation only to get
started and for rapid prototyping.
Once you're familiar with Hashspace, you should switch to the precompilation workflow.**

We need to include the following in the page:

- Hashspace runtime
- Hashspace compiler
- appropriate settings for our CommonJS module loader to precompile templates before executing them

#### `/index.htm` (using source HSP files)

```
<!DOCTYPE html>
<html>
  <head>
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
    <script src="http://hashspace.ariatemplates.com/dist/0.0.4/hashspace-noder.js" type="text/javascript"></script>
    <script src="http://hashspace.ariatemplates.com/dist/0.0.4/hashspace-noder-compiler.js" type="text/javascript"></script>
    <script type="application/x-noder">
        var Hello = require('src/hello.hsp');
        Hello({name:"World"}).render("output");
    </script>
  </head>
  <body>
    <div id="output"></div>
  </body>
</html>
```

Now we can start our server, go to http://localhost:8080/index.htm and see our app up and running!

You can also see live demo below as a [plunk](http://plnkr.co/edit/ccFBySeRB2Yme2pHOHih) (click "preview"):

<div class="snippet">
<iframe src="http://embed.plnkr.co/ccFBySeRB2Yme2pHOHih/hello.hsp" style="height:250px; width:100%;">
</iframe>
</div>

## "Server-side" precompilation

The recommended workflow is to have your templates precompiled before they reach the web browser,
so that they are rendered faster. For development, you may set up a file watch task
which performs the compilation any time your input files change. You may also make it a deploy-time task.

How do we get our templates precompiled? The easiest way is to set up [gulpjs](http://gulpjs.com/)
script to do it for us.
The following script reads `.js` and `.hsp` files from `src` folder and creates their
precompiled equivalents in `dist` folder.

#### `/gulpfile.js`

```
var gulp = require('gulp');
var hsp = require('gulp-hashspace');

gulp.task('default', function() {
    gulp.src('src/**/*.hsp')
        .pipe(hsp.compile())
        .pipe(gulp.dest('dist'));

    gulp.src('src/**/*.js')
        .pipe(hsp.transpile())
        .pipe(gulp.dest('dist'));
});
```

Let's install `gulp`, `gulp-hashspace` (this can take a minute or two) and run the script:

- `$ npm install -g gulp`
- `$ npm install gulp gulp-hashspace`
- `$ gulp`

Now we can tweak `index.htm` to take advantage of the precompiled HSP and JS files:
we can remove the compiler script and preprocessing config, and naturally we should
change the require path to use `dist` folder:

#### `/index.htm` (using precompiled HSP files)

```
<!DOCTYPE html>
<html>
  <head>
    <script src="http://noder-js.ariatemplates.com/dist/v1.5.0/noder.dev.js" type="text/javascript"></script>
    <script src="http://hashspace.ariatemplates.com/dist/0.0.4/hashspace-noder.js" type="text/javascript"></script>
    <script type="application/x-noder">
        var Hello = require('dist/hello.hsp');
        Hello({name:"World"}).render("output");
    </script>
  </head>
  <body>
    <div id="output"></div>
  </body>
</html>
```

We're now ready to start the server, go to http://localhost:8080/index.htm and see our app up and running!

For a more elaborate example, you can have a look at
[sample Hashspace Hello World application with Gulp setup](https://github.com/PK1A/hsp-hello-gulp)
which, among others, additionally sets up file watching to recompile the files just when they change.

## Further reading

If you want:

- more explanations on module loading & precompilation,
- to know how to craft the precompilation yourself (without using gulp),

head to [Getting Started Explained](./explained) article.

## Appendix: Running an HTTP server

It's important to note that Hashspace's module loader uses `XMLHttpRequest` for fetching dependencies,
and since in most modern browsers, `XMLHttpRequest`s from `file://` protocol are disabled for security reasons,
**it's best to serve your application through an HTTP server** even for local development.

- If you have a server installed on your machine (e.g. Apache), you may create
your project in its DocumentRoot folder.
- If you have Python or NodeJS installed, you may start a static HTTP server, serving
files from current directory on port 8080, as follows:
  - Python 2:
    - `$ cd /path/to/my/app`
    - `$ python -m SimpleHTTPServer 8080`
  - Python 3:
    - `$ cd /path/to/my/app`
    - `$ python -m http.server 8080`
  - NodeJS:
    - `$ npm install -g http-server`
    - `$ cd /path/to/my/app`
    - `$ http-server -p 8080`

Then you should be able to navigate to `http://localhost:8080/` in a browser
and see your files.

## Appendix: where to get Hashspace and noderJS builds

In the above examples, we've used certain released versions of Hashspace and noderJS.
You can see the available versions under the following URLs:

- [Hashspace releases](https://github.com/ariatemplates/hashspace/tree/gh-pages/dist/)
- [noderJS releases](https://github.com/ariatemplates/noder-js/tree/gh-pages/dist/)

If you want to use the latest improvements in not-yet-released code, you may use SNAPSHOT versions.

### HTTPS considerations

We've used the following code to include noderJS and Hashspace from the CDN:

    <script src="http://noder-js.ariatemplates.com/dist/v1.5.0/noder.dev.js" type="text/javascript"></script>
    <script src="http://hashspace.ariatemplates.com/dist/0.0.4/hashspace-noder.js" type="text/javascript"></script>

However if you serve your page over HTTPS, those scripts will fail to load due to mixed content error (since those are HTTP URLs). If you need to load those files over HTTPS, you might use the following equivalents:


    <script src="//ariatemplates.github.io/noder-js/dist/v1.5.0/noder.dev.js" type="text/javascript"></script>
    <script src="//ariatemplates.github.io/hashspace/dist/0.0.4/hashspace-noder.js" type="text/javascript"></script>

Under the hood, those are the same files served from Github's `gh-pages` branch. Leading `//` in the URL means: use the same protocol for dependencies as the one of the viewed page (HTTP or HTTPS).
