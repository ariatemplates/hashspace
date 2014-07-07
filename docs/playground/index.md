title: Playground
cssclass: playground
headerscripts: |
    <link rel="stylesheet" type="text/css" href="/css/samples.css" />
footerscripts: |
    <script src="/libs/ace.js" type="text/javascript" charset="utf-8"></script>
    <script src="/libs/Chart.min.js" type="text/javascript" charset="utf-8"></script>
    <script src="/libs/director.min.js"></script>
    <script src="/libs/noder.dev.min.js">
        {
            packaging: {
                baseUrl: "/",
                preprocessors: [{
                    pattern: /\.hsp$/,
                    module: "hsp/compiler/compile"
                }, {
                    pattern: /^(?!hsp\/|libs\/).*\.js$/,
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

        var playground = new Playground("main");
        playground.showSample(0);
        Router({
                ':key': playground.loadSample.bind(playground)
        }).init();
    </script>
---

<div id="main"></div>
