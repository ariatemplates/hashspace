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
                baseUrl: "/"
            },
            resolver: {
                "default" : (location.href.indexOf("dev") !== -1 ? {
                    "uglify-js" : "/libs/uglify-js"
                } : {})
            }
        }
    </script>
    <script src="/dist/<%=version%>/hashspace-noder.min.js" type="text/javascript"></script>
    <script src="/dist/<%=version%>/hashspace-noder-gestures.min.js" type="text/javascript"></script>
    <script src="/playground/playground-samples-all.js" type="text/javascript"></script>
    <script src="/playground/playground-all.js" type="text/javascript"></script>
    <script type="noder">
        window.hashspace_version = "<%=version%>";
        var Playground = require("/playground/playground");
        var playground = new Playground("main", location.href.indexOf("dev") !== -1);
        var sample = window.location.hash.length > 0 ? window.location.hash.substr(1) : 0;
        playground.showSample(sample);

        Router({
            ':key': playground.loadSample.bind(playground)
        }).init();
    </script>
---

<div id="main"></div>
