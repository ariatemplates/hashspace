var klass = require("../../klass");
var TreeWalker = require("./treeWalker").TreeWalker;

/**
 * Walker object used to generate the template script and store some contextual information such as errors or scope..
 */
var TemplateWalker = klass({
    $extends : TreeWalker,
    $constructor : function (fileName,dirPath) {
        this.fileName=fileName;
        this.dirPath=dirPath;
        this.templates = {}; // used by processors to store intermediate values in order to ease testing
        this.globals={};     // global validation code for each template - used for unit testing
        this.errors = [];
        this.resetGlobalRefs();
        this.resetScope();
    },

    logError : function (description, errdesc) {
        var desc = {
            description : description
        };
        if (errdesc) {
            if (errdesc.line) {
                desc.line = errdesc.line;
                desc.column = errdesc.column;
            }
            if (errdesc.code) {
                desc.code = errdesc.code;
            }
        }
        this.errors.push(desc);
    },

    // reset the list of global variables that have been found since the last reset
    resetGlobalRefs : function () {
        this._globals=[];
        this._globalKeys={};
    },

    // add a global reference (e.g. "foo") to the current _globals list
    addGlobalRef : function (ref) {
        if (!this._globalKeys[ref]) {
            this._globals.push(ref);
            this._globalKeys[ref]=true;
        }
    },

    // reset the scope variables that are used to determine if a variable name is in the current scope
    resetScope : function () {
        this._scopes = [{}];
        this._scope = this._scopes[0];
    },

    addScopeVariable : function (varname) {
        this._scope[varname] = true;
    },

    rmScopeVariable : function (varname) {
        this._scope[varname] = null;
    },

    isInScope : function (varname) {
        if (varname === "scope") {
            return true; // scope is a reserved key word and is automatically created on the scope object
        }
        return this._scope[varname] ? true : false;
    },

    pushSubScope : function (vararray) {
        var newScope = Object.create(this._scope);
        for (var i = 0, sz = vararray.length; sz > i; i++) {
            newScope[vararray[i]] = true;
        }
        this._scopes.push(newScope);
        this._scope = this._scopes[this._scopes.length - 1];
    },

    popSubScope : function (varnames) {
        this._scopes.pop();
        this._scope = this._scopes[this._scopes.length - 1];
    }
});
exports.TemplateWalker = TemplateWalker;