var express = require('express');
var app = express();
var server = require('http').createServer(app);
var path = require("path");
var request = require("request");

var renderer = require("../compiler/renderer");
var compiler = require("../compiler/compiler");

module.exports = function(grunt) {
    grunt.registerTask('hspserver', 'Start a web server to server compiled templates on the fly', function () {
        grunt.config.requires('hspserver.port');
        grunt.config.requires('hspserver.base');
        grunt.config.requires('hspserver.templateExtension');

        var port = grunt.config('hspserver.port');
        var base = grunt.config('hspserver.base');
        var ext = grunt.config('hspserver.templateExtension');

        grunt.log.writeln('Starting express web server on port ' + port + '.');

        server.listen(port);

        // Views can be everywhere in the public folder
        app.set("views", path.join(base, "public"));

        // Log requests
        if (grunt.option('verbose')) {
            app.use(express.logger());
        }

        // Serve compiled templates through the view engine
        app.engine(ext, renderer.renderFile);

        app.use(express.bodyParser());

        app.use(function (req, res, next) {
            // extname return a ".ext", configuration asks only for "ext"
            if (path.extname(req.url) === "." + ext) {
                // The first character is '/', remove it to have relative paths
                res.render(req.url.substring(1));
                res.set("Content-Type","application/javascript");
            } else if (req.url==="/hsp/compile") {
                var src=req.body.src;
                if (src) {
                    src=(''+src).replace(/\\u0026/gi,"&").replace(/\\u002B/gi,"+").replace(/\\u003F/gi,"?");
                    // compile src
                    var r=renderer.renderString(src);
                    if (r.serverErrors && r.serverErrors.length) {
                        res.send(500,r.serverErrors[0].description);
                    } else {
                        res.send(200,r.code);
                    }
                } else {
                    res.send(500,"[/hsp/compile] src parameter is undefined");
                }
            } else {
                next();
            }
        });

        // Serve static files from the public folder, that is the root
        app.use(express.static(path.join(base, "public")));

        // Serve also static files from the configured folder
        app.use(express.static(grunt.config('hspserver.base')));

    });
};

