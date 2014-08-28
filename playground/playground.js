var $set=require("hsp/$set"); // Playground controller

var hsp = require("hsp/rt");
var klass = require("hsp/klass");
var log = require("hsp/rt/log");
var compile;

var layout = require("./layout.hsp.js");
var samples = require("../samples/samples");

var samplesMap = {}; // a map of the samples, using their containing folders as keys
for (var index = 0, length = samples.length; index < length; index++) {
    var sample = samples[index];

    $set(sample, "index", index);
    $set(samplesMap, sample.folder, sample);
}

var count = 0; // number of playgrounds that have been created
var playgrounds = {}; // collection of playground instances

var Playground = $set(module, "exports", klass({
    containerId : "",

    /**
     * Class constructor
     * @param {String} containerId the id of the HTML element where the playground should be displayed
     */
    $constructor : function (containerId, devMode) {
        count++;
        $set(this, "idx", count);
        $set(playgrounds, 'p' + this.idx, this); // register in the global list - cf. notifyScriptError

        $set(this, "containerId", containerId);
        $set(this, "devMode", devMode);
        $set(this, "data", {
            errors : [],
            sampleIndex : -1,
            sampleTitle : "",
            samples : samples,
            navCollapsed : false,
            navHover : false,
            splitterPos : "50%"
        });


        if (!devMode) {
            var compiler = document.createElement("script");
            $set(compiler, "type", "text/javascript");
            $set(compiler, "src", "/dist/" + window.hashspace_version + "/hashspace-noder-compiler.min.js");
            document.querySelector("head").appendChild(compiler);
        }
    },

    $dispose : function () {
        // unregister from main collection
        $set(playgrounds, 'p' + this.idx, null);
    },

    /**
     * Initialize the editor component
     */
    initEditor : function () {
        if (!this.editor) {
            var editor = $set(this, "editor", ace.edit("editor"));
            editor.setShowPrintMargin(false);
            editor.setReadOnly(false);
            editor.setTheme("ace/theme/crimson_editor");
            // other themes tomorrow: ok tomorrow_night_blue

            var session = editor.getSession();
            session.setMode("ace/mode/javascript");

            // listen to editor change events to automatically trigger new compilation
            var self = this;
            $set(this, "changeTimeout", null); // timeout used to buffer changes before asking the server to compile again
            session.on('change', function () {
                // clear previous timeout if previous change hasn't been submitted
                if (self.changeTimeout) {
                    clearTimeout(self.changeTimeout);
                    $set(self, "changeTimeout", null);
                }

                var data = self.data;
                var sample = data.samples[data.sampleIndex];
                var fileName = sample.files[0].src;

                $set(self, "changeTimeout", setTimeout(function () {
                    $set(self, "changeTimeout", null);
                    if (sample.changed) {
                        self.compileAndUpdate(fileName, self.editor.getValue());
                    } else {
                        $set(sample, "changed", true);
                        self.executeSampleTpl(sample);
                    }
                }, 100));
            });
        }
    },

    executeSampleTpl: function(sample) {
        var template = sample.sample.template,
            data = sample.sample.data || [];
        if (typeof data === 'function') {
            data = data.call(sample.sample);
        }
        template.apply(sample.sample, data).render("output");
    },

    /**
     * Notify the playground about compilation errors
     * @static
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
                        $set(require.cache, moduleName, null);
                    }

                    // reexecute the module
                    noder.execute(code, moduleName).then(function (sampleExports) {
                        var spl = data.samples[data.sampleIndex];
                        $set(spl, "sample", sampleExports);
                        self.executeSampleTpl(spl);
                    }, function (exception) {
                        self.notifyScriptError(self.idx, exception, fileName);
                    }).end();
                } catch (exception) {
                    console.warn("[compileAndUpdate] " + exception.message + " (line:" + exception.line +
                                 ", column:" + exception.column + ")");
                }
            }
        };

        if (!compile) {
            compile = module.require("hsp/compiler/compile");
        }

        var compiledCode = compile(newCode, fileName);
        callback(null, compiledCode);
    },

    /**
     * Initialize the playground layout, and load a sample
     * @param {Integer|String} index the index of the sample in the sample collection, or its name (folder based)
     */
    showSample : function (index) {
        // load layout template
        layout.mainLayout(this.data, this).render(this.containerId);
        this.initEditor();
        this.loadSample(index);
    },

    /**
     * Show a particular sample
     * @param {Integer|String} index the index of the sample in the sample collection, or its name (folder based)
     */
    loadSample : function (index) {
        var sample = (typeof index === 'number') ? samples[index] : samplesMap[index];

        if (this.data.sampleIndex === sample.index) return;

        $set(sample, "changed", sample.changed || false);

        $set(this.data, "errors", []);
        layout.errorList(this.data.errors).render("logs");

        $set(this.data, "sampleIndex", sample.index);
        $set(this.data, "sampleTitle", sample.title);
        this.editor.setValue(sample.files[0].text, -1);
    },

    log : function (message) {
        this.data.errors.push(message);
        return false;
    }
}));