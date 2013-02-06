var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var path = require("path");
var request = require("request");
var Q = require("q");

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
			socket.on('get snippets', function () {
				request({
					url : "https://api.github.com/users/piuccio/gists",
					json : true
				}, function (error, response, body) {
					if (error) {
						socket.emit('snippets', {
							error : error
						});
					} else {
						// The API only sends back the raw url, get the file content
						var gists = {};
						body.reduce(function (working, gist) {
							return working.then(getGistFiles.bind(null, gist, gists));
						}, Q.resolve(body)).then(function () {
							socket.emit('snippets', {
								error : false,
								gists : gists
							});
						});
					}
				});
			});

			socket.emit('welcome', "hello!");
		});
	});
};

function getGistFiles (gist, gists) {
	var deferred = Q.defer();
	if (gist.files["console.js"] && gist.files.template) {
		// Valid hashspace gist
		Q.all([
			Q.nfcall(request, gist.files["console.js"].raw_url),
			Q.nfcall(request, gist.files.template.raw_url)
		]).then(function (result) {
			// result[i] -> is the i-th request done through Q.all
			// result[i][j] -> is the j-th parameter in the request callback
			gists[gist.id] = gist;
			gists[gist.id].files["console.js"].raw_text = result[0][1];
			gists[gist.id].files.template.raw_text = result[1][1];

			deferred.resolve("");
		}, function (error) {
			deferred.reject(new Error(error));
		});
	} else {
		deferred.resolve("");
	}
	return deferred.promise;
}
