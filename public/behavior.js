(function () {
    // Template editor
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/crimson_editor");
    editor.setTheme("ace/theme/crimson_editor");
    editor.setShowPrintMargin(false);
    editor.setReadOnly(true);

    // Console editor
    var consoleEditor = ace.edit("console");
    consoleEditor.setTheme("ace/theme/crimson_editor");
    consoleEditor.getSession().setMode("ace/mode/javascript");
    consoleEditor.setShowPrintMargin(false);
    consoleEditor.setReadOnly(true);

    var resultPanel = document.getElementById("result");
    var logsPanel = document.getElementById("logs");

    // Utility method to log error messages in the logs panel
    var log = function (line, column, message) {
        var exceptionInfo = [line || "?", column || "?", message];

        var node = document.createElement("p");
        var text = document.createTextNode("[Line %1, Column %2] %3".replace(/%[0-9]+/g, function (token) {
            return exceptionInfo[parseInt(token.substring(1), 10) - 1] || token;
        }));
        node.appendChild(text);

        if (logsPanel.firstChild) {
            logsPanel.insertBefore(node, logsPanel.firstChild);
        } else {
            logsPanel.appendChild(node);
        }
    };
    log.info = function (message) {
        var node = document.createElement("pre");
        var text = document.createTextNode(message);
        node.appendChild(text);

        if (logsPanel.firstChild) {
            logsPanel.insertBefore(node, logsPanel.firstChild);
        } else {
            logsPanel.appendChild(node);
        }
    };

    var on = function (element, event, callback) {
        if (element.addEventListener) {
            element.addEventListener(event, callback, false);
        } else if (element.attachEvent)  {
            element.attachEvent("on" + event, callback);
        }
    };

    // IO socket, used to ask the server to compile our templates
    var socket = io.connect(window.location.origin);
    var snippets = {};

    var titleText = document.getElementById("title");
    var moreSnippetsLink = document.getElementById("getSnippet");
    var closeSnippetsLink = document.getElementById("closeSnippetDialog");
    var snippetsDialog = document.getElementById("snippetDialog");
    var snippetDialogBody = document.getElementById("snippetDialogBody");

    // The socket is connected, we can start compiling
    socket.on('welcome', function (data) {
        var changeTimeout;
        // Whenever I modify the template part I want to compile it again
        editor.getSession().on('change', function () {
            // but only after a small timeout, I don't want to be flooded by logs when I type
            clearTimeout(changeTimeout);
            changeTimeout = setTimeout(function () {
                // the value is evaluated once the socket replies with a compiled template
                socket.emit('editor change', {
                    text : editor.getValue()
                });
            }, 60);
        });

        if (data.error) {
            snippetDialogBody.innerHTML = data.error;
        } else {
            snippetsDialog.className += " hidden";
            editor.setReadOnly(false);
            consoleEditor.setReadOnly(false);

            var list = "<ul class='gists'>";
            var firstGist = true;
            for (var gistId in data.gists) {
                if (data.gists.hasOwnProperty(gistId)) {
                    var gist = data.gists[gistId];
                    if (gist.files["console.js"] && gist.files.template) {
                        // this is an hashspace gist
                        var description = gist.description.replace(/^hashspace\s+/, "");
                        list += "<li class='gist'><a href='#' data-gist='" + gistId + "'>" + description + "</a></li>";
                        var consoleText = gist.files["console.js"].raw_text;
                        var templateText = gist.files.template.raw_text;
                        snippets[gistId] = {
                            console : consoleText,
                            template : templateText,
                            description : description
                        };

                        if (firstGist) {
                            editor.setValue(templateText, 1);
                            consoleEditor.setValue(consoleText, 1);
                            titleText.innerHTML = description;
                            firstGist = false;

                            /*socket.emit('editor change', {
                                text : templateText
                            });*/
                        }
                    }
                }
            }
            list += "</ul>";

            setTimeout(function () {
                snippetDialogBody.innerHTML = list;
            }, 400);
        }

        socket.on('compilation done', function (data) {
            if (data.error) {
                log(data.line, data.column, data.error);
            } else {
                evaluateOutput(data.code);
            }
        });

        var executeCodeCallback = function () {
            var callMe = new Function("json", "vscope", "log", "hsp", '"use strict";' + consoleEditor.getValue());

            var logScope = function (text) {
                if (!text) {
                    text = "";
                } else {
                    text += "\n";
                }
                log.info(text + JSON.stringify(runningModule.out.vscope, function (key, value) {
                    if (key === "#scope") {
                        return "#scope";
                    }
                    return value;
                }, "\t"));
            };
            var hspObject = {
                refresh : function () {
                    runningModule.out.refresh();
                }
            };
            callMe(runningModule.json, runningModule.out.vscope, logScope, hspObject);
        };
        consoleEditor.commands.addCommand({
            name: "executeConsole",
            bindKey: {
                win: 'ctrl-space',
                mac: 'command-space'
            },
            exec: executeCodeCallback
        });
        var executeButton = document.getElementById("execute");
        on(executeButton, "click", executeCodeCallback);
    });

    // Variable holding the last correctly evaluated template module
    var runningModule;

    // Evaluate the compiled template in noder and display its output
    var evaluateOutput = function (code) {
        var runningCode = "(" + evaluateOutput.runInNoder.toString().replace("__CODE__", code) + ")()";

        //comment the following line to see the code generated by the template parser in the console
        //console.log(code);
        
        try {
            noder.execute(runningCode).then(function (module) {
                runningModule = module;
                
                resultPanel.innerHTML = "";

                // TODO call hsp.display(resultPanel, module.out)
                module.out.appendToDOM(resultPanel);
            });
        } catch (ex) {
            log(ex.line, ex.column, ex.message);
        }
    };
    evaluateOutput.runInNoder = function () {
        // It's not needed here, but this goes in noder, so its simpler to reuse later
        var json = require("hsp/json");

        function display (tplName, args) {
            var templateOut = tplName.apply({}, args);

            module.exports = {
                template : tplName,
                args : args,
                out : templateOut,
                json : json
            };
        };
        __CODE__
    };

    
    on(moreSnippetsLink, "click", function () {
        // this is just because IE doesn't have classlist or trim...
        var oldClass = snippetsDialog.className;
        snippetsDialog.className = oldClass.replace("hidden", "").replace(/^\s+|\s+$/g, "");
    });
    on(closeSnippetsLink, "click", function () {
        snippetsDialog.className += " hidden";
    });
    on(snippetDialogBody, "click", function (event) {
        event = event || window.event;
        var target = event.target || event.srcElement;

        var gistId = target.getAttribute("data-gist");
        if (gistId) {
            event.cancelBubble = true;
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            if (event.preventDefault) {
                event.preventDefault();
            }

            var gist = snippets[gistId];
            titleText.innerHTML = gist.description;
            editor.setValue(gist.template, 1);
            consoleEditor.setValue(gist.console, 1);

            socket.emit('editor change', {
                text : gist.template
            });

            snippetsDialog.className += " hidden";

            return false;
        }
    });
})();
