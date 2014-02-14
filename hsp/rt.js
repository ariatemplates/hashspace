
/*
 * Copyright 2012 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Hash Space runtime
require("hsp/es5");
var klass = require("hsp/klass"),
    log = require("hsp/rt/log"),
    $root = require("hsp/rt/$root"),
    $RootNode = $root.$RootNode,
    $InsertNode = $root.$InsertNode,
    $CptNode = $root.$CptNode,
    $CptAttElement = $root.$CptAttElement,
    cptwrapper = require("hsp/rt/cptwrapper");


var NodeGenerator = klass({
    /**
     * NodeGenerator constructor
     * @param {Array|TNode} nodedefs tree root of node generators created by the template pre-processor
     */
    $constructor : function (nodedefs) {
        this.nodedefs = nodedefs;
    },

    /**
     * Main method called to generate the document fragment associated to a template for a given set of arguments This
     * creates a new set of node instances from the node definitions passed in the ng constructor
     * @param {Array} scopevars the list of the scope variables (actually the template arguments) - e.g.
     * ["person",person] odd indexes correspond to argument values / even indexes correspond to argument names
     * @param {Object} ctlWrapper the controller observer - if any
     * @param {Map} ctlInitAtts the init value of the controller attributes (optional) - e.g.
     * {value:'123',mandatory:true}
     */
    process : function (tplctxt, scopevars, ctlWrapper, ctlInitArgs) {
        var vs = {}, nm, argNames = []; // array of argument names
        if (scopevars) {
            for (var i = 0, sz = scopevars.length; sz > i; i += 2) {
                nm = scopevars[i];
                vs[nm] = scopevars[i + 1]; // feed the vscope
                argNames.push(nm);
            }
        }
        vs["scope"] = vs; // self reference (used for variables - cf. expression handler)

        var root = null;
        if (tplctxt.$constructor && (tplctxt.$constructor === $InsertNode || tplctxt.$constructor === $CptNode)) {
            // we use the insert node as root node
            root = tplctxt;
            root.init(vs, this.nodedefs, argNames, ctlWrapper, ctlInitArgs);
        } else {
            root = new $RootNode(vs, this.nodedefs, argNames, ctlWrapper, ctlInitArgs);
        }

        return root;
    }
});

var tplRefresh = []; // List of templates pending refresh
var tplTimeoutId = null; // Timer id to trigger refresh automatically

/**
 * Refresh method that automatically refreshes all templates that may haven been impacted by changes in data structures
 * This method is automatically triggered by a setTimeout and doesn't need to be explicitelly called
 */
var refresh = module.exports.refresh = function () {
    var t;
    if (tplTimeoutId) {
        clearTimeout(tplTimeoutId);
        tplTimeoutId = null;
    }
    while (t = tplRefresh.shift()) {
        t.refresh();
    }
};

var refreshTimeout = function () {
    tplTimeoutId = null;
    refresh();
};

/**
 * Add a template to the list of templates that must be refreshed when all changes are done in the data structures. This
 * is automatically called by the template $Root node (cf. TNode.onPropChange())
 */
refresh.addTemplate = function (tpl) {
    var idx = tplRefresh.indexOf(tpl);
    if (idx < 0) {
        tplRefresh.push(tpl);
        if (!tplTimeoutId) {
            tplTimeoutId = setTimeout(refreshTimeout, 0);
        }
    }
};

/**
 * Display a template inside an HTML container sample usage: hsp.display(myTemplate(param1,param2),"mydiv");
 * @param {$RootNode} tplResult the template node generated by a template
 * @param {string|DOMElement} container the HTML container element or its id
 * @param {Boolean} replace if true, the template result will replace the element content - otherwise it will be
 * appended (default: true)
 */
module.exports.display = function (tplResult, container, replace) {
    // TODO - Validate argument types / implement nice error messages
    if (container && tplResult) {
        if (tplResult.render === undefined || tplResult.render.constructor !== Function) {
            throw new Error("[hsp.display] Invalid argument: tplResult is not a valid template result");
        } else {
            tplResult.render(container, replace);
        }
    }
};

/**
 * Helper to create template functions
 * @param {Array|Object} arg the list of argument names - e.g. ["label", "value"]
 * @param {Function} contentFunction a function returning the structure of the template e.g. function(n) { return
 * [n.$text({e1:[0,0,"label"],e2:[1,0,"value"]},["",1,": ",2])] }
 */
module.exports.template = function (arg, contentFunction) {
    // closure variables
    var ng = new NodeGenerator(null), args = [], sz = 0, hasController = false, Ctl = null;
    if (arg.constructor === Array) {
        sz = arg.length;
        for (var i = 0; sz > i; i++) {
            args.push(arg[i]);
            args.push(null);
        }
    } else {
        // this template is associated to a controller
        hasController = true;
        // arg is a controller reference - let's check if it is valid
        Ctl = $root.getObject(arg.ctl);

        var err = null;
        if (Ctl === null) {
            err = "Undefined component controller: " + arg.ctl.slice(1).join(".");
        } else if (Ctl.constructor !== Function) {
            err = "Component controller must be a function: " + arg.ctl.slice(1).join(".");
        }
        if (err) {
            log.error(err);
            throw err;
        }

        // add the controller reference to the template scope
        args[0] = arg.ref;
    }

    var f = function () {
        var cw = null, cptInitArgs = null;
        if (!ng.nodedefs) {
            try {
                ng.nodedefs = contentFunction(nodes);
            } catch (ex) {
                // TODO: add template and file name in error description
                if (ex.constructor === ReferenceError) {
                    throw "Invalid reference: " + (ex.message || ex.description);
                } else {
                    throw ex;
                }
            }
        }
        if (hasController) {
            cw=cptwrapper.createCptWrapper(Ctl, arguments.length>1? arguments[1] : null);
            args[1] = cw.cpt;
        } else {
            for (var i = 0; sz > i; i++) {
                args[1 + 2 * i] = arguments[i];
            }
        }
        if (arguments.length > 0) {
            cptInitArgs = arguments[0];
        }
        return ng.process(this, args, cw, cptInitArgs);
    };
    f.isTemplate = true;
    f.controllerConstructor = Ctl;
    return f;
};


/**
 * Helper function used by the hashspace compiler to raise errors from the generated scripts when syntax is invalid
 */
module.exports.logErrors = function (fileName, errors) {
    if (errors && errors.length) {
        var err, code;
        for (var i=0,sz=errors.length;sz>i;i++) {
            err=errors[i];
            code=null;
            if (err.lineInfoTxt) {
                code = err.lineInfoTxt.replace(/\r?\n/gi, "\r\n>> ");
            } else if (err.code) {
                code = err.code;
            }
            log.error(err.description,{
                file:fileName,
                line:err.line,
                column:err.column,
                code:code
            });
        }
    }
};

/**
 * Collection of the node types supported by the NodeGenerator This collection is attached to the Nodegenerator
 * constructor through a nodes property
 */
var nodes = {};

var nodeList = [
    "$text", require("hsp/rt/$text"),
    "$if", require("hsp/rt/$if"),
    "$insert", $InsertNode,
    "$foreach", require("hsp/rt/$foreach"),
    "elt", require("hsp/rt/eltnode"),
    "cpt", $CptNode,
    "catt", $CptAttElement,
    "log", require("hsp/rt/$log")
];

for (var i = 0, sz = nodeList.length; sz > i; i += 2) {
    createShortcut(nodeList[i], nodeList[i + 1]);
}

/**
 * Create shortcut functions on the nodes collection to simplify the template functions e.g. nodes.$text=function(exps,
 * textcfg) {return new $TextNode(exps, textcfg);}
 */
function createShortcut (tagName, tagConstructor) {
    nodes[tagName] = function (a1, a2, a3, a4, a5, a6) {
        return new tagConstructor(a1, a2, a3, a4, a5, a6);
    };
}
