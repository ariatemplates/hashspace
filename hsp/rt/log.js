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

/**
 * Log a message
 * @param {String} type the type of message: "info", "error", "warning" or "debug" (default)
 * @param {String} msg the message to log
 * @parma {Object} context data associated to the message and that can be used by specialized loggers
 *       to better integrate the logs in the calling application. These data should contain all the variables
 *       integrated in the msg argument (for instance to allow for localization in a different language)
 *       The following properties are recommended, and should be considered as reserved keywords 
 *       (i.e. they should not be used for another purpose)
 *           { 
 *               id: {String|Number} Unique message identifier
 *               type: {String} Message type: "info", "error", "warning" or "debug" 
 *               message: {String} The default message - in english (will be automatically set from the msg argument)
 *               file: {String} File name associated to the message 
 *               dir: {String} Directory path corresponding to the file
 *               code: {String} Some piece of code associated to the message
 *               line: {Number} Line number associated to the message (e.g. for errors)
 *               column: {Number} Column number associated to the message (e.g. for errors)
 *           }
 */
var log=function(msg, data) {
    var stop=false;
    if (!data) {
        data={};
    }
    if (!data.type) {
        data.type="debug";
    } else {
        var tp=data.type;
        if (tp!=="debug" && tp!="error" && tp!=="warning" && tp!=="info") {
            // invalid message type
            log.error("Invalid message type: "+tp,{invalidType:tp});
            data.type="debug";
        }
    }
    data.message=msg;

    if (loggers && loggers.length) {
        for (var i=0,sz=loggers.length;sz>i;i++) {
            stop=!loggers[i](data);
            if (stop) {
                break;
            }
        }
    } else {
        defaultLogger(data);
    }
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
 * Shortcut to log() - if no data is provided, an object will be created with the "error" type
 */
log.error=function(msg, data) {
    logMsg("error", msg, data);
};

/**
 * Log a warning message
 * Shortcut to log() - if no data is provided, an object will be created with the "warning" type
 */
log.warning=function(msg, data) {
    logMsg("warning", msg, data);
};

/**
 * Log an info message
 * Shortcut to log() - if no data is provided, an object will be created with the "info" type
 */
log.info=function(msg, data) {
    logMsg("info", msg, data);
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

function logMsg(type,msg,data) {
    if (!data) {
        data={};
    }
    data.type=type;
    log(msg, data);
}

function defaultLogger(msg) {
    var methods={
        "info":"info",
        "error":"error",
        "warning":"warn",
        "debug":"log"
    };

    console[methods[msg.type]](log.format(msg));
}

module.exports = log;
