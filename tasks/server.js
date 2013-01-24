var express = require('express');
var app = express()
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var compiler = require("../hsp/compiler");

module.exports = function(grunt) {
	grunt.registerTask('server', 'Start an express web server', function () {
		grunt.config.requires('server.port');
		grunt.config.requires('server.base');

		var port = grunt.config('server.port');
		grunt.log.writeln('Starting express web server on port ' + port + '.');

		server.listen(port);

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