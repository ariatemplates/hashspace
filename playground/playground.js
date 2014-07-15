// Playground controller

var jx = require("/libs/jx");
var markdown = require("/libs/markdown");

var hsp = require("hsp/rt");
var compile = require("hsp/compiler/compile");
var klass = require("hsp/klass");
var log = require("hsp/rt/log");

var layout = require("./layout.hsp");
var samples = require("../samples/samples");





var samplesMap = {}; // a map of the samples, using their containing folders as keys
for (var index = 0, length = samples.length; index < length; index++) {
    var sample = samples[index];

    sample.index = index;
    samplesMap[sample.folder] = sample;
}

var count = 0; // number of playgrounds that have been created
var playgrounds = {}; // collection of playground instances



var Playground = module.exports = klass({
    containerId : "",

    /**
     * Class constructor
     * @param {String} containerId the id of the HTML element where the playground should be displayed
     */
    $constructor : function (containerId) {
        count++;
        this.idx = count;
        playgrounds['p' + this.idx] = this; // register in the global list - cf. notifyScriptError

        this.containerId = containerId;
        this.data = {
            errors : [],
            sampleIndex : -1,
            sampleTitle : "",
            files : [],
            samples : samples,
            navCollapsed : false,
            navHover : false,
            splitterPos : "50%"
        };
    },

    $dispose : function () {
        // unregister from main collection
        playgrounds['p' + this.idx] = null;
    },

    /**
     * Initialize the editor component
     */
    initEditor : function () {
        if (!this.editor) {
            var editor = this.editor = ace.edit("editor");
            editor.setShowPrintMargin(false);
            editor.setReadOnly(false);
            editor.setTheme("ace/theme/crimson_editor");
            // other themes tomorrow: ok tomorrow_night_blue

            var session = editor.getSession();
            session.setMode("ace/mode/javascript");

            // listen to editor change events to automatically trigger new compilation
            var self = this;
            this.changeTimeout = null; // timeout used to buffer changes before asking the server to compile again
            session.on('change', function () {
                // clear previous timeout if previous change hasn't been submitted
                if (self.changeTimeout) {
                    clearTimeout(self.changeTimeout);
                    self.changeTimeout = null;
                }
                // only one file for now
                var data = self.data;
                var fileName = data.samples[data.sampleIndex].files[0].src;
                self.changeTimeout = setTimeout(function () {
                    // the value is evaluated once the socket replies with a compiled template
                    self.changeTimeout = null;
                    self.compileAndUpdate(fileName, self.editor.getValue());
                }, 200);
            });
        }
    },

    /**
     * static method called
     */
    notifyScriptError : function (playgroundIndex, errorDescription, fileName) {
        var error = {
            message : '' + errorDescription,
            type: 'error'
        };
        playgrounds['p' + playgroundIndex].log(error);
    },

    /**
     * Compile and update the code associated to one of the sample files
     */
    compileAndUpdate : function (fileName, newCode) {
        // alert(fileName + " : " + newCode);
        var self = this;

        var callback = function (error, code) {
            if (error) {
                console.warn("[compileAndUpdate] " + error.text + " (" + error.status + ")");
            } else {
                var data = self.data;
                var sample = samples[data.sampleIndex];
                var moduleName = "samples/" + sample.folder + "/" + fileName;

                try {
                    // reset errors
                    data.errors.splice(0, data.errors.length);

                    log.removeAllLoggers();
                    log.addLogger(self.log.bind(self));

                    // empty cache if already filled
                    if (require.cache[moduleName]) {
                        require.cache[moduleName] = null;
                    }

                    noder.execute(code, moduleName).then(function () {
                    }, function (exception) {
                        self.notifyScriptError(self.idx, exception, fileName);
                    }).end();
                } catch (exception) {
                    console.warn("[compileAndUpdate] " + exception.message + " (line:" + exception.line + ", column:" + exception.column
                            + ")");
                }
            }
        };

        var compiledCode = compile(newCode, fileName);
        callback(null, compiledCode);
    },

    /**
     * Show a particular sample
     * @param {Integer} index the index of the sample in the sample collection
     */
    showSample : function (index) {
        // load layout template
        layout.mainLayout(this.data, this).render(this.containerId);
        this.initEditor();
        this.loadSample(index);
    },

    loadSample : function (index) {
        var sample;
        if (typeof index === 'number') {
            sample = samples[index];
        } else {
            sample = samplesMap[index];
        }
        var self = this;
        var data = this.data;

        if (!sample.description) {
            sample.description = "description.md";
        }

        jx.load("/samples/" + sample.folder + "/" + sample.description, function (error, data) {
            if (!error) {
                var descriptionElement = document.getElementById("description");

                var descriptionContent = markdown.toHTML(data); // 'Hello *World*! [#output] [#snippet 0]'
                descriptionContent = descriptionContent.replace(
                    /\[\#output\]/i,
                    '<div id="output" class="output"></div><div id="logs" class="logoutput"></div>'
                );

                descriptionElement.innerHTML = descriptionContent;

                if (!data.errors) {
                    data.errors = [];
                }

                layout.errorList(data.errors).render("logs");
            }
        });

        data.sampleIndex = sample.index;
        data.sampleTitle = sample.title;
        data.files = sample.files;

        jx.load("/samples/" + sample.folder + "/" + sample.files[0].src, function (error, data) {
            if (!error) {
                self.editor.setValue(data, -1);
            }
        });
    },

    log : function (message) {
        this.data.errors.push(message);
        return false;
    }
});
