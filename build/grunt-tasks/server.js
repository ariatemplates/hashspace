var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var path = require("path");

var renderer = require("../../compiler/renderer");
var compiler = require("../../compiler/codeGenerator");

module.exports = function(grunt) {
	grunt.registerTask('server', 'Start an express web server', function () {
		grunt.config.requires('server.port');
		grunt.config.requires('server.base');
		grunt.config.requires('server.templateExtension');

		var port = grunt.config('server.port');
		grunt.log.writeln('Starting express web server on port ' + port + '.');

		server.listen(port);

		// Views can be everywhere
		app.set("views", grunt.config('server.base'));

		// Log requests
		if (grunt.option('verbose')) {
			app.use(express.logger());
		}

		// Serve compiled templates through the view engine
		var ext = grunt.config('server.templateExtension');
		app.engine(ext, renderer.__express);
		app.use(function (req, res, next) {
			// extname return a ".ext", configuration asks only for "ext"
			if (path.extname(req.url) === "." + ext) {
				// The first character is '/', remove it to have relative paths
				res.render(req.url.substring(1));
			} else {
				next();
			}
		});

		// Serve static files from the public folder, that is the root
		app.use(express.static(path.join(__dirname, "../../public")));
		// Serve also static files from the configured folder
		app.use(express.static(grunt.config('server.base')));

		io.sockets.on('connection', function (socket) {
			socket.emit('welcome', "hello!");

			socket.on('editor change', function (data) {
				try {
					var js = compiler.compile(data.text);

					socket.emit('compilation done', {
						error : false,
						code : js
					});
				} catch (ex) {
					console.log(ex);
					socket.emit('compilation done', {
						error : ex.message,
						offset : ex.offset,
						line : ex.line,
						column : ex.column
					});
				}
			});
		});
	});
};