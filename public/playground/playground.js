
// Playground controller

var hsp=require("hsp/rt"),
    klass=require("hsp/klass"),
    layout=require("./layout.hsp"),
    samples=require("../samples/samples"),
    jx=require("./jx"),
    md=require("./markdown"),
    json=require("hsp/json");

var Playground = module.exports = klass({
    containerId:"",

    /**
     * Class constructor
     * @param {String} containerId the id of the html element where the playground should be displayed
     */
    $constructor:function(containerId) {
        this.containerId=containerId;
        this.data={
            sampleIndex:-1,
            sampleTitle:"",
            isSampleListVisible:false,
            files:[],
            samples:samples
        }

        hsp.useLogger(this.logErrors.bind(this));
    },

    /**
     * Initialize the editor component
     */
    initEditor:function() {
        if (!this.editor) {
            var editor = this.editor = ace.edit("playgroundEditor");
            editor.setShowPrintMargin(false);
            editor.setReadOnly(false);
            editor.setTheme("ace/theme/crimson_editor");
            // other themes tomorrow: ok tomorrow_night_blue
            var session=editor.getSession();
            session.setMode("ace/mode/javascript");
            
            // listen to editor change events to automatically trigger new compilation
            var self=this;
            this.changeTimeout=null; // timeout used to buffer changes before asking the server to compile again
            session.on('change', function () {
                // clear previous timeout if previous change hasn't been submitted
                if (self.changeTimeout) {
                    clearTimeout(self.changeTimeout);
                    self.changeTimeout=null;
                }
                // only one file for now
                var d=self.data, fileName=d.samples[d.sampleIndex].files[0].src;
                self.changeTimeout = setTimeout(function () {
                    // the value is evaluated once the socket replies with a compiled template
                    self.changeTimeout=null;
                    self.compileAndUpdate(fileName,self.editor.getValue());
                }, 200);
            });
        }
    },

    /**
     * Compile and update the code associated to one of the sample files
     */
    compileAndUpdate:function(fileName,newCode) {
        //alert(fileName+" : "+newCode);
        var code=(newCode+'').replace(/\&/g,"\\u0026"), self=this;

        jx.load("hsp/compile?src="+code, function(error,code) {
            if (error) {
                console.warn("[compileAndUpdate] "+error.text+" ("+error.status+")");
            } else {
                var d=self.data, spl=samples[d.sampleIndex], moduleName="samples/"+spl.folder+"/"+fileName;
                try {
                    // reset errors
                    json.set(d,"errors",null);

                    // empty cache if already filled
                    if (require.cache[moduleName]) {
                        require.cache[moduleName]=null;
                    }
                    noder.execute(code,moduleName); //.then(function (module) {});
                } catch (ex) {
                    console.warn("[compileAndUpdate] "+ex.message+" (line:"+ex.line+", column:"+ex.column+")");
                }
            }
        }, "text", "POST");
    },

    /**
     * Show a particular sample
     * @param {Integer} sampleIdx the index of the sample in the sample collection
     */
    showSample:function(sampleIdx) {
        // load layout template
        hsp.display(this.containerId,layout.mainLayout(this.data,this));
        this.initEditor();
        this.loadSample(sampleIdx);
    },

    loadSample:function(idx) {
        var spl=samples[idx], self=this, d=this.data;

        if (spl.description) {
            jx.load("samples/"+spl.folder+"/"+spl.description, function(error,data) {
                if (!error) {
                    var d=document.getElementById("description");
                    var h=md.toHTML(data); //'Hello *World*! [#output] [#snippet 0]'
                    h=h.replace(/\[\#output\]/i,'<div id="output" class="output"></div>');
                    d.innerHTML=h;
                }
            });
        }

        json.set(d,"sampleIndex",idx);
        json.set(d,"sampleTitle",spl.title);
        json.set(d,"files",spl.files);
        jx.load("samples/"+spl.folder+"/"+spl.files[0].src, function(error,data) {
            if (!error) {
                self.editor.setValue(data,-1);
            }
        });
    },

    logErrors:function(fileName,errors) {
        var d=this.data;
        json.set(d,"errors", errors);
        hsp.display("output",layout.errorList(d.errors));
        return false;
    },

    showSampleList:function(evt) {
        json.set(this.data,"isSampleListVisible",true);
        evt.cancelBubble=true;
    },

    hideSampleList:function() {
        json.set(this.data,"isSampleListVisible",false);
    }
});
