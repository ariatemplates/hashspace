var klass = require("hsp/klass"),
    doc=require("hsp/document"),
    hsp=require("hsp/rt"),
    fireEvent=require("hsp/utils/eventgenerator").fireEvent,
    log=require("hsp/rt/log"),
    $set=require("hsp/$set"),
    $=require("hsp/utils/jquery-1.10.2.min.js");

var HtException=klass({
    $constructor:function(code,text) {
        this.code=code;
        this.text=text;
    },
    toString:function() {
        return this.text;
    }
});

/**
 * JQuery Selection wrapper
 * Exposes useful methods for hashspace template tests
 **/
var SelectionWrapper=klass({
    $constructor:function(jqSelection) {
        this.$selection=jqSelection;
        this.length=jqSelection.length;
    },
    /**
     * Further refine the selection by applying a new selector
     * @param {Selector} selector the selector expression (jquery selector syntax)
     **/
    find:function(selector) {
        return new SelectionWrapper(this.$selection.find(selector));
    },
    /**
     * Return the textual content of the selection. Will recursively go through all DOM sub-nodes
     * and concatenate the different text node content
     **/
    text:function() {
        return this.$selection.text();
    },
    /**
     * Return the selection corresponding to the nth element in the selection
     * @param {integer} idx the position of the element (first index = 0)
     **/
    item:function(idx) {
        if (idx<0 || idx>this.length-1) {
            return null;
        }
        return new SelectionWrapper(this.$selection.eq(idx));
    },
    /**
     * Simulates click event and trigger hashspace refresh
     **/
    click:function() {
        if (this.length!==1) {
            throw new HtException(1,"[hashtester] click() method can only be called on single-element selections");
        }
        var elt=this.$selection[0];
        fireEvent("mousedown",elt);
        fireEvent("mouseup",elt);
        var res=fireEvent("click",elt);
        hsp.refresh();
        return res;
    },
    /**
     * Simulates dblclick event and trigger hashspace refresh
     **/
    dblclick:function() {
        if (this.length!==1) {
            throw new HtException(1,"[hashtester] dblclick() method can only be called on single-element selections");
        }
        var elt=this.$selection[0];
        fireEvent("mousedown",elt);
        fireEvent("mouseup",elt);
        fireEvent("mousedown",elt);
        fireEvent("mouseup",elt);
        var res=fireEvent("dblclick",elt);
        hsp.refresh();
        return res;
    },
    type:function(text) {
        // TODO - cf. syn: https://github.com/bitovi/syn/blob/master/src/key.js
    },
    /**
     * Return the value of input or textarea elements
     */
    value:function() {
        if (this.length!==1) {
            throw new HtException(1,"[hashtester] value() method can only be called on single-element selections");
        }
        // TODO support textarea
        return this.$selection[0].value;
    },
    /**
     * Tells if the first element in the selection is assigned a given CSS class
     * @param {String} cssClassName the class name to check
     **/
    hasClass:function(cssClassName) {
        if (this.length!==1) {
            throw new HtException(1,"[hashtester] hasClass() method can only be called on single-element selections");
        }
        return this.$selection.hasClass(cssClassName);
    }
});

/**
 * Create a new test context 
 * A test context is a function object that has the following properties:
 * - container: {DOMElement} a DON element to insert the template in
 * - $dispose: {Function} a function to call to clean the context
 */
module.exports.newTestContext = function() {
    var container=doc.createElement("div");
    var eltsToDispose=[];
    var logs=[];
    var logger=function(msg) {
        logs.push(msg);
    };
    log.addLogger(logger);
    
    var h=function(selector) {
        var sel=$(container).find(selector);

        if (sel) {
            return new SelectionWrapper(sel);
        } else {
            return null;
        }
    };
    h.container=container;
    h.$dispose=function() {
        this.container=null;
        for (var i=0, sz=eltsToDispose.length;sz>i;i++) {
            eltsToDispose[i].$dispose();
        }
        eltsToDispose=null;
        log.removeLogger(logger);
    };
    h.$set=function(o,p,v) {
        $set(o,p,v);
        hsp.refresh();
    };
    h.logs=function(idx) {
        if (idx===undefined) {
            return logs;
        }
        return logs[idx];
    };
    h.logs.clear=function() {
        logs=[];
    };
    return h;
};
