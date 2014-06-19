var fs = require("fs");
var path = require("path");
var Q = require("q");
var phantom = require("node-phantom");
var http = require("http");
var path = require("path");
var parser = require("../../compiler/parser");
var parseTree = require("./parseTree");
var codeGenerator = require("../../compiler/codeGenerator");

/**
 * Parse a template content and return the parser intermediate representation. This function wraps already the template
 * content inside opening / closing template tags
 * @param {String} template Template content
 * @return {Object} Intermediate representation (tree)
 */
exports.parse = function (template) {
    try {
        var parsedContent = parser.parse(["{template test()}", template, "{/template}"].join("\n"));

        // there's only one template
        return parseTree.create(parsedContent[0]);
    } catch (ex) {
        // Otherwise the log message in the console is unreadable
        throw new Error(ex);
    }
};

exports.compile = function (template) {
    try {
        return codeGenerator.compile(template);
    } catch (ex) {
        // Otherwise the log message in the console is unreadable
        throw new Error(ex);
    }
};

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
        var expectedHtml = parts[1].split("ARGS");
        allTemplates[templateName] = {
            content : parts[0].trim(),
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

var mockResponder = {
    code : null,

    getCode : function () {
        return this.code;
    },

    setCode : function (compiled) {
        this.code = compiled;
    }
};

var server;
var phantom_proxy;
var phantom_page;

exports.startServer = function (callback) {
    server = http.createServer(function (request, response) {
        if (request.url.indexOf("index") !== -1) {
            response.writeHead(200, {
                "Content-Type" : "text/html"
            });
            response.end([
                    "<html><head>",
                    "<script type='text/javascript' src='http://localhost:" + server.address().port
                            + "/node_modules/noder-js/dist/browser/noder.min.js'></script>",
                    "</head><body><script type='noder'>",
                    mockResponder.getCode(),
                    "</script></body></html>"].join(""), "utf8");
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
        phantom.create(function (err, proxy) {
            phantom_proxy = proxy;
            proxy.createPage(function (err, page) {
                phantom_page = page;
                callback();
            });
        });
    });
    server.listen(0);
};

exports.run = function (code, args, callback) {
    var executableCode = "(" + executeInPhantom.toString().replace("__CODE__", code) + ")(" + JSON.stringify(args)
            + ")";
    mockResponder.setCode(executableCode);

    phantom_page.open("http://localhost:" + server.address().port + "/index");
    phantom_page.onCallback = function (data) {
        callback(data);
    };
};

exports.stopServer = function (callback) {
    phantom_proxy.exit();
    server.close(function () {
        callback();
    });
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
}