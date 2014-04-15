title: Playground
cssclass: playground
headerscripts: |
  <link rel="stylesheet" type="text/css" href="/css/samples.css" />
footerscripts: |
  <script src="/libs/ace.js" type="text/javascript" charset="utf-8"></script>
  <script src="/libs/Chart.min.js" type="text/javascript" charset="utf-8"></script>
  <script src="http://noder-js.ariatemplates.com/dist/v1.2.1/noder.dev.min.js">
    {
      packaging: {
        baseUrl: "/",
        preprocessors: [{
          pattern: /\.hsp$/,
          module: "hsp/compiler/compile"
        }, {
          pattern: /^(?!hsp\/|libs\/).*\.(hsp|js)$/,
          module: "hsp/transpiler/transpile"
        }]
      },
      resolver: {
        "default" : {
          "uglify-js" : "/libs/uglify-js"
        }
      }
    }
  </script>
  <script src="/dist/<%=version%>/hashspace-noder.min.js" type="text/javascript"></script>
  <script src="/dist/<%=version%>/hashspace-noder-compiler.min.js" type="text/javascript"></script>
  <script type="noder">
    var Playground = require("/playground/playground");
    var pg = new Playground("main");
    pg.showSample(0);
  </script>
---

<div id="main"></div>
