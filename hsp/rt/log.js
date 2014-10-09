/*
 * Copyright 2014 Amadeus s.a.s.
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

var loggers=[];

var validTypes={
    "debug":true,
    "error":true,
    "warning":true,
    "info":true
};

/**
 * Analyse log arguments to determine if the last argument is a meta-data argument - cf. log()
 * @param {Array} args array of Object or String - last item may be a meta-data argument
 * @return {Object} structure composed of 2 parts
 *       items: {Object|String} items to be logged
 *       metaData: {Object} - empty object if not found
 */
function getLogArgs(args) {
    // iterate over args to create a real array
    if (!args || !args.length) {
        return {items:[],metaData:{}};
    }
    var items=[], md={}, itm;
    for (var i=0, sz=args.length; sz>i; i++) {
        itm=args[i];
        if (i>0 && i===sz-1) {
            // itm could be a meta-data argument
            if (typeof(itm)==="object" && itm.type && typeof(itm.type)==="string" && validTypes[itm.type]) {
                // this is a meta-data argument
                md=itm;
            } else {
                items[i]=itm;
            }
        } else {
            items[i]=itm;
        }
    }
    return {items:items,metaData:md};
}

/**
 * Log a message - support an indefinite nbr of arguments such as console.log()
 * Last argument can be an optional object containing meta data associated to the log
 * @param {Object|String} the first piece to log
 * @param {Object|String} the 2nd piece to log
 * ...
 * @param {Object|String} the nth piece to log
 * @parma {Object} context data associated to the message and that can be used by specialized loggers
 *       to better integrate the logs in the calling application. These data should contain all the variables
 *       integrated in the msg argument (for instance to allow for localization in a different language)
 *       The following properties are recommended, and should be considered as reserved keywords 
 *       (i.e. they should not be used for another purpose)
 *           { 
 *               type: {String} Message type: "info", "error", "warning" or "debug" 
 *               id: {String|Number} Unique message identifier       
 *               message: {String} The default message - in english (will be automatically set from the msg argument)
 *               file: {String} File name associated to the message 
 *               dir: {String} Directory path corresponding to the file
 *               code: {String} Some piece of code associated to the message
 *               line: {Number} Line number associated to the message (e.g. for errors)
 *               column: {Number} Column number associated to the message (e.g. for errors)
 *           }
 * NB: what determines if the last argument is an object or the meta-data is the presence of a valid type, and
 *     an argument index > 0
 */
var log=function() {
    logMsg("debug", arguments, false);
};

/**
 * Add a logger to the logger list
 * The logger function will be added to the first position of the logger list, and will have the 
 * possibilty to prevent other loggers to get the message by returning false.
 * @param {Function} logger a logger function that will receive a message object as argument
 *       the message object has the same structure as the 2nd argument of the log() method
 */
log.addLogger=function (logger) {
    if (logger) {
        loggers.unshift(logger);
    }
};

/**
 * Remove a specific logger from the logger list
 */
log.removeLogger=function (logger) {
    if (loggers && loggers.length) {
        for (var i=0,sz=loggers.length;sz>i;i++) {
            if (loggers[i]===logger) {
                loggers.splice(i,1);
                sz-=1;
                i-=1;
            }
        }
    }
};

/**
 * Empty the logger list
 */
log.removeAllLoggers=function () {
    loggers=[];
};

/**
 * Tell how many loggers are registered
 */
log.getNbrOfLoggers=function() {
    return loggers.length;
};

/**
 * Log an error message
 * Same interface as log() but with an error type
 */
log.error=function() {
    logMsg("error", arguments, true);
};

/**
 * Log a warning message
 * Same interface as log() but with a warning type
 */
log.warning=function() {
    logMsg("warning", arguments, true);
};

/**
 * Log an info message
 * Same interface as log() but with an info type
 */
log.info=function() {
    logMsg("info", arguments, true);
};

/**
 * Return the default formatting associated to a message
 * @param {Object} msg the message object - same structure as for the logger argument
 *        cf. addLogger()
 * @return {String} the formatted message
 */
log.format=function (msg) {
    var out=[];
    out.splice(out.length,0,"[",msg.type);
    if (msg.file) {
        out.splice(out.length,0,": ",msg.file);
    }
    out.splice(out.length,0,"] ",msg.message);
    if (msg.line || msg.column) {
        out.splice(out.length,0," (");
        if (msg.line) {
            out.splice(out.length,0,"line:",msg.line);
        }
        if (msg.column) {
            if (msg.line) {
                out.splice(out.length,0,", column:",msg.column);
            } else {
                out.splice(out.length,0,"column:",msg.column);
            }
        }
        out.splice(out.length,0,")");
    }
    if (msg.code) {
        out.splice(out.length,0,"\r\n>> ", msg.code);
    }
    return out.join("");
};

function logMsg(type,args,forceType) {
    var args=getLogArgs(args);
    var items=args.items, md=args.metaData, sz=items.length, s;

    if (forceType || !md.type) {
        md.type=type;
    }

    if (sz===0) {
        md.message='';
    } else if (sz===1) {
        md.message=formatValue(items[0]);
    } else {
        // translate items to log message and concatenate them
        var out=[];
        for (var i=0;sz>i;i++) {
            s=formatValue(items[i]);
            if (s!=='') {
                out.push(s);
            }
        }
        md.message = out.join(' ');
        md.messages = out; // Array might be better if user wants some custom formatting
    }

    if (loggers && loggers.length) {
        var stop=false;
        for (var i=0,sz=loggers.length;sz>i;i++) {
            stop=!loggers[i](md);
            if (stop) {
                break;
            }
        }
    } else {
        defaultLogger(md);
    }
}

function defaultLogger(msg) {
    var methods={
        "info":"info",
        "error":"error",
        "warning":"warn",
        "debug":"log"
    };

    if (typeof(console)!==undefined) {
        console[methods[msg.type]](log.format(msg));
    }
}

/**
 * Sort function
 */
function lexicalSort(a,b) {
    if (a>b) return 1;
    if (a<b) return -1;
    return 0;
}

/**
 * Format a JS entity for the log
 * @param v {Object} the value to format
 * @param depth {Number} the formatting of objects and arrays (default: 1)
 */
function formatValue(v,depth) {
    if (depth===undefined || depth===null) {
        depth=1;
    }
    var tp=typeof(v), val;
    if (v===null) {
        return "null";
    } else if (v===undefined) {
        return "undefined";
    } else if (tp==='object') {
        if (depth>0) {
            var properties=[];
            if (v.constructor===Array) {
                for (var i=0,sz=v.length;sz>i;i++) {
                    val=v[i];
                    if (typeof(val)==='string') {
                        properties.push(i+':"'+formatValue(val,depth-1)+'"');
                    } else {
                        properties.push(i+":"+formatValue(val,depth-1));
                    }
                }
                return "["+properties.join(", ")+"]";
            } else {
                var keys=[];
                for (var k in v) {
                    if (k.match(/^\+/)) {
                        // this is a meta-data property
                        continue;
                    }
                    keys.push(k);
                }
                // sort keys as IE 8 uses a different order than other browsers
                keys.sort(lexicalSort);

                for (var i=0,sz=keys.length;sz>i;i++) {
                    val=v[keys[i]];
                    if (typeof(val)==='string') {
                        properties.push(keys[i]+':"'+formatValue(val,depth-1)+'"');
                    } else {
                        properties.push(keys[i]+':'+formatValue(val,depth-1));
                    }
                }
                return "{"+properties.join(", ")+"}";
            }
        } else {
            if (v.constructor===Array) {
                return "Array["+v.length+"]";
            } else if (v.constructor===Function) {
                return "Function";
            } else {
                return "Object";
            }
        }
    } else if (tp==='function') {
        return "Function";
    } else {
        return ''+v;
    }
}

module.exports = log;
