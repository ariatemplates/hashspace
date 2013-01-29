var fs = require("fs");
var path = require("path");
var Q = require("q");
var vm = require("vm");
var phantom = require("node-phantom");
var http = require("http");
var path = require("path");
var parser = require("../../compiler/parser");
var parseTree = require("./parseTree");

/**
 * Parse a template content and return the parser intermediate representation. 
 * This function wraps already the template content inside opening / closing template tags
 * @param  {String} template Template content
 * @return {Object}          Intermediate representation (tree)
 */
exports.parse = function (template) {
	try {
		var parsedContent = parser.parse([
			"# template test()",
			template,
			"# /template"
		].join("\n"));

		// there's only one template
		return parseTree.create(parsedContent[0]);
	} catch (ex) {
		// Otherwise the log message in the console is unreadable
		throw new Error(ex);
	}
}

var allTemplates = {};

function getTemplateDeferred (file) {
	var deferred = Q.defer();
	if (path.basename(file).charAt(0) !== "_") {
		fs.readFile(file, "utf-8", function (error, text) {
			if (error) {
				// I claim that I never get here because I already did a readdir, but there might be a read error
				deferred.reject(new Error(error));
			} else {
				storeTemplate(file, text);
				deferred.resolve(text);
			}
		});
	} else {
		// exclude files starting with _ to be able to run only some tests selectively
		deferred.resolve("");
	}
	return deferred.promise;
}

function storeTemplate (fileName, content) {
	var templateName = path.basename(fileName);
	var parts = content.split("EOT");

	try {
		var expectedHtml = parts[2].split("ARGS");
		allTemplates[templateName] = {
			content : parts[0].trim(),
			tree : JSON.parse(parts[1] || "{}"),
			html : expectedHtml[0],
			args : JSON.parse(expectedHtml[1] || "[]")
		};
	} catch (ex) {
		console.error("Error while reading", fileName);
		console.log(ex);
	}
}

exports.getTemplates = function (basePath, callback) {
	fs.readdir(basePath, function (err, templates) {
		templates.reduce(function (working, fileName) {
			return working.then(getTemplateDeferred.bind(null, path.join(basePath, fileName)));
		}, Q.resolve(templates)).then(function () {
			callback(allTemplates);
		});
	});
};


function callSingleCallback (templateName, template, onEach) {
	var deferred = Q.defer();

	onEach(templateName, template, function () {
		deferred.resolve();
	});

	return deferred.promise;
}

exports.each = function (onEach, finalCallback) {
	var templates = Object.keys(allTemplates);

	templates.reduce(function (working, templateName) {
		return working.then(callSingleCallback.bind(null, templateName, allTemplates[templateName], onEach));
	}, Q.resolve(templates)).then(function () {
		finalCallback();
	});
};

exports.run = function (code, args, callback) {
	var executableCode = "(" + executeInPhantom.toString().replace("__CODE__", code) + ")(" + JSON.stringify(args) + ")";
	//console.log("RUN THIS", executableCode);

	var server = http.createServer(function (request, response) {
		if (request.url.indexOf("index") !== -1) {
			response.writeHead(200, {
				"Content-Type" : "text/html"
			});
			response.end([
				"<html><head>",
				"<script type='text/javascript' src='http://localhost:" + server.address().port + "/lib/noder.min.js'></script>",
				"</head><body><script type='noder'>",
				executableCode,
				"</script></body></html>"
			].join(""), "utf8");
		} else {
			var file = path.join(__dirname, "../../", request.url);
			fs.readFile(file, "utf-8", function (err, content) {
				response.writeHead(err ? 500 : 200, {
					"Content-Type" : "text/javascript"
				});
				response.end(content, "utf8");
			});
		}
	});
	server.on("listening", function () {
		//console.log("Server started on", server.address().port);
		
		phantom.create(function (err, proxy) {
			proxy.createPage(function (err, page) {
				// The page will open and execute the wrapped script that calls a callback
				page.open("http://localhost:" + server.address().port + "/index");
				page.onCallback = function (data) {
					proxy.exit();
					server.close(function () {
						callback(data);
					});
				};
			});
		});
	});
	server.listen(0);
};

function executeInPhantom (args) {
	var res;
	try {
		var structure = (__CODE__).apply({}, args);
		var div = document.createElement("div");
		div.appendChild(structure.node);

		res = {
			structure : structure,
			html : div.innerHTML
		};
	} catch (ex) {
		res = {
			error : ex
		};
	}
	window.callPhantom(res);
};