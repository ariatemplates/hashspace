var klass = require("hsp/klass"),
    doc=require("hsp/document"),
    hsp=require("hsp/rt"),
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

function triggerEvent(eventName,DOMElt) {
    var  res;
    if (doc.createEvent) {
        var evt=new Event(eventName);
        //var evt=document.createEvent("HTMLEvents");
        //evt.initEvent("name-of-custom-event", true, true);
        res=DOMElt.dispatchEvent(evt);
    } else {
        // IE case
        var evt = doc.createEventObject();
        evt.eventType = eventName;
        res=DOMElt.fireEvent("on" + eventName, evt);
    }
    return res;
}

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
        // TODO emulate mousedown/mouseup
        var res=triggerEvent("click",this.$selection[0]);
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
        // for IE look at http://stackoverflow.com/questions/2490825/how-to-trigger-event-in-javascript
        // TODO emulate mousedown/mouseup twice prior to triggering dblclick
        var res=triggerEvent("dblclick",this.$selection[0]);
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
    var f=function(selector) {
        var sel=$(container).find(selector);

        if (sel) {
            return new SelectionWrapper(sel);
        } else {
            return null;
        }
    };
    f.container=container;
    f.$dispose=function() {
        this.container=null;
        for (var i=0, sz=eltsToDispose.length;sz>i;i++) {
            eltsToDispose[i].$dispose();
        }
        eltsToDispose=null;
    };
    return f;
};
