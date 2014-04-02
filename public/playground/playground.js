
// Playground controller

var hsp = require("hsp/rt"),
    klass = require("hsp/klass"),
    log = require("hsp/rt/log"),
    json = require("hsp/json"),
    layout = require("./layout.hsp"),
    samples = require("../samples/samples"),
    jx = require("./jx"),
    md = require("./markdown");

var count = 0; // number of playgrounds that have been created
var playgrounds = {}; // collection of playground instances

var Playground = module.exports = klass({
    containerId : "",

    /**
     * Class constructor
     * @param {String} containerId the id of the html element where the playground should be displayed
     */
    $constructor : function (containerId) {
        count++;
        this.idx = count;
        playgrounds['p' + this.idx] = this; // register in the global list - cf. notifyScriptError

        this.containerId = containerId;
        this.data = {
            errors:[],
            sampleIndex : -1,
            sampleTitle : "",
            isSampleListVisible : false,
            files : [],
            samples : samples
        };
    },

    $dispose : function () {
        // deregister from main collection
        playgrounds['p' + this.idx] = null;
    },

    /**
     * Initialize the editor component
     */
    initEditor : function () {
        if (!this.editor) {
            var editor = this.editor = ace.edit("playgroundEditor");
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
                var d = self.data, fileName = d.samples[d.sampleIndex].files[0].src;
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
    notifyScriptError : function (playgroundIdx, errorDescription, fileName) {
        var err = {
            message : '' + errorDescription,
            type: 'error'
        };
        playgrounds['p' + playgroundIdx].log(err);
    },

    /**
     * Compile and update the code associated to one of the sample files
     */
    compileAndUpdate : function (fileName, newCode) {
        // alert(fileName+" : "+newCode);
        var code = (newCode + '').replace(/\&/g, "\\u0026").replace(/\+/g, "\\u002B").replace(/\?/g, "\\u003F"), self = this;

        jx.load("hsp/compile?src=" + code, function (error, code) {
            if (error) {
                console.warn("[compileAndUpdate] " + error.text + " (" + error.status + ")");
            } else {
                var d = self.data, spl = samples[d.sampleIndex], moduleName = "samples/" + spl.folder + "/" + fileName;
                try {
                    // reset errors
                    d.errors.splice(0,d.errors.length);
                    
                    log.removeAllLoggers();
                    log.addLogger(self.log.bind(self));

                    // empty cache if already filled
                    if (require.cache[moduleName]) {
                        require.cache[moduleName] = null;
                    }

                    noder.execute(code, moduleName).then(function () {
                    }, function (ex) {
                        self.notifyScriptError(self.idx, ex, fileName);
                    }).end();
                } catch (ex) {
                    console.warn("[compileAndUpdate] " + ex.message + " (line:" + ex.line + ", column:" + ex.column
                            + ")");
                }
            }
        }, "text", "POST");
    },

    /**
     * Show a particular sample
     * @param {Integer} sampleIdx the index of the sample in the sample collection
     */
    showSample : function (sampleIdx) {
        // load layout template
        layout.mainLayout(this.data, this).render(this.containerId);
        this.initEditor();
        this.loadSample(sampleIdx);
    },

    loadSample : function (idx) {
        var spl = samples[idx], self = this, d = this.data;

        if (spl.description) {
            jx.load("samples/" + spl.folder + "/" + spl.description, function (error, data) {
                if (!error) {
                    var desc = document.getElementById("description");
                    var h = md.toHTML(data); // 'Hello *World*! [#output] [#snippet 0]'
                    h = h.replace(/\[\#output\]/i, '<div id="output" class="output"></div><div id="logs" class="logoutput"></div>');
                    desc.innerHTML = h;
                    if (!d.errors) {
                        json.set(d, "errors", []);
                    }
                    layout.errorList(d.errors).render("logs");
                }
            });
        }

        json.set(d, "sampleIndex", idx);
        json.set(d, "sampleTitle", spl.title);
        json.set(d, "files", spl.files);
        jx.load("samples/" + spl.folder + "/" + spl.files[0].src, function (error, data) {
            if (!error) {
                self.editor.setValue(data, -1);
            }
        });
        this.hideSampleList();
    },

    log : function (msg) {
        this.data.errors.push(msg);
        return false;
    },

    showSampleList : function (evt) {
        json.set(this.data, "isSampleListVisible", true);
        evt.cancelBubble = true;
    },

    hideSampleList : function () {
        json.set(this.data, "isSampleListVisible", false);
    }
});
