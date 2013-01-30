(function () {
    // Template editor
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/crimson_editor");

    // Console editor
    var consoleEditor = ace.edit("console");
    consoleEditor.setTheme("ace/theme/crimson_editor");
    consoleEditor.getSession().setMode("ace/mode/javascript");

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
            logsPanel.insertBefore(node, logsPanel.firstChild)
        } else {
            logsPanel.appendChild(node);
        }
    };
    log.info = function (text) {
        var node = document.createElement("pre");
        var text = document.createTextNode(text);
        node.appendChild(text);

        if (logsPanel.firstChild) {
            logsPanel.insertBefore(node, logsPanel.firstChild)
        } else {
            logsPanel.appendChild(node);
        }
    };

    // IO socket, used to ask the server to compile our templates
    var socket = io.connect(window.location.origin);

    // The socket is connected, we can start compiling
    socket.on('welcome', function (data) {
        editor.setValue(initialEditor, 1);
        consoleEditor.setValue(initialConsole, 1);

        // Whenever I modify the template part I want to compile it again
        editor.getSession().on('change', function () {
            // the value is evaluated once the socket replies with a compiled template
            socket.emit('editor change', {
                text : editor.getValue()
            });
        });

        socket.emit('editor change', {
            text : initialEditor
        });

        socket.on('compilation done', function (data) {
            if (data.error) {
                log(data.line, data.column, data.error);
            } else {
                evaluateOutput(data.code);
            }
        });

        consoleEditor.commands.addCommand({
            name: "executeConsole",
            bindKey: {
                win: 'ctrl-space',
                mac: 'command-space'
            },
            exec: function (editor) {
                var callMe = new Function("json", "vscope", "log", "refresh", '"use strict";' + editor.getValue());

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
                var refreshScoped = function () {
                    runningModule.out.refresh();
                };
                callMe(runningModule.json, runningModule.out.vscope, logScope, refreshScoped);
            }
        });
    });

    // Variable holding the last correctly evaluated template module
    var runningModule;

    // Evaluate the compiled template in noder and display its output
    var evaluateOutput = function (code) {
        var runningCode = "(" + evaluateOutput.runInNoder.toString().replace("__CODE__", code) + ")()";

        try {
            noder.execute(runningCode).then(function (module) {
                runningModule = module;
                
                resultPanel.innerHTML = "";
                resultPanel.appendChild(module.out.node);
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

    // Initial editor text
    var initialEditor = [
        "// Define a datamodel",
        "var model = {",
        "    name : 'Peter',",
        "    age : 30",
        "};",
        "",
        "# template welcome(person)",
        "   Hello {person.name}, you're {:person.age} years old and you're age won't change",
        "# /template",
        "",
        "// In this file you can have multiple templates or JavaScript object",
        "// this line tells the editor which template should be displayed in the output panel",
        "// and what are its arguments (second parameter should be an array)",
        "display(welcome, [model]);"
    ].join("\n");
    var initialConsole = [
        "// In this console you can interact with the model",
        "// without causing a recompilation of the template",
        "// ",
        "// The model is accessible with the name `vscope`",
        "// You can display it calling `log()`",
        "// You can interact with it using the `json` helper",
        "// To refresh a template, call `refresh()`",
        "// ",
        "// Try for instance the following code",
        "// Hint: Press Ctrl+Space to execute it",
        " ",
        "log('Before json.set');",
        "json.set(vscope.person, 'name', 'James');",
        "json.set(vscope.person, 'age', 40);",
        "log('After json.set');",
        "refresh();"
    ].join("\n");
})()