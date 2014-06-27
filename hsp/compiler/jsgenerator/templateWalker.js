var klass = require("../../klass");
var TreeWalker = require("./treeWalker").TreeWalker;

/**
 * Walker object used to generate the template script and store some contextual information such as errors or scope..
 */
var TemplateWalker = klass({
    $extends : TreeWalker,

    /**
     * Constructor.
     * @param {String} fileName the name of the file being compiled.
     * @param {String} dirPath the directory path.
     * @param {String} mode the type of module system the code shold comply with: either "commonJS" or "global"
     * @param {String} globalRef the name of the runtime global reference when the "global" mode is used (default: "hsp")
     */
    $constructor : function (fileName, dirPath, mode, globalRef) {
        this.fileName = fileName;
        this.dirPath = dirPath;
        this.templates = {}; // used by processors to store intermediate values in order to ease testing
        this.globals={};     // global validation code for each template - used for unit testing
        this.errors = [];
        this.resetGlobalRefs();
        this.resetScope();
        this.mode={};
        if (mode==="global") {
            this.mode.isGlobal=true;
        } else if (mode==="commonJS" || mode===undefined) {
            this.mode.isCommonJS=true;
        } else {
            this.logError("Invalid compilation mode option: "+mode);
        }
        this.globalRef=globalRef? globalRef : "hsp";
    },

    /**
     * Adds an error to the current error list.
     * @param {String} description the error description
     * @param {Object} errdesc additional object (block, node, ...) which can contain additional info about the error (line/column number, code).
     */
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

    /**
     * Resets the list of global variables that have been found since the last reset
     */
    resetGlobalRefs : function () {
        this._globals=[];
        this._globalKeys={};
    },

    /**
     * Adds a global reference (e.g. "foo") to the current _globals list.
     * @param {String} ref the reference key.
     */
    addGlobalRef : function (ref) {
        if (!this._globalKeys[ref]) {
            this._globals.push(ref);
            this._globalKeys[ref]=true;
        }
    },

    /**
     * Resets the scope variables that are used to determine if a variable name is in the current scope.
     */
    resetScope : function () {
        this._scopes = [{}];
        this._scope = this._scopes[0];
    },

    /**
     * Adds a scope variable.
     * @param {String} varName the variable name.
     */
    addScopeVariable : function (varName) {
        this._scope[varName] = true;
    },

    /**
     * Removes a scope variable.
     * @param {String} varName the variable name.
     */
    rmScopeVariable : function (varName) {
        this._scope[varName] = null;
    },

    /**
     * Checks if a scope variable exists.
     * @param {String} varName the variable name.
     * @return {Boolean} true if it exists.
     */
    isInScope : function (varName) {
        if (varName === "scope") {
            return true; // scope is a reserved key word and is automatically created on the scope object
        }
        return this._scope[varName] ? true : false;
    },

    /**
     * Pushes a sub scope.
     * @param {Array} varArray an array of variable.
     */
    pushSubScope : function (varArray) {
        var newScope = Object.create(this._scope);
        for (var i = 0; i < varArray.length; i++) {
            newScope[varArray[i]] = true;
        }
        this._scopes.push(newScope);
        this._scope = this._scopes[this._scopes.length - 1];
    },

    /**
     * Pops a sub scope.
     */
    popSubScope : function () {
        this._scopes.pop();
        this._scope = this._scopes[this._scopes.length - 1];
    }
});
exports.TemplateWalker = TemplateWalker;