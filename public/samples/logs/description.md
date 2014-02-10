This example shows how to trace data that are used in a template. It also shows how to retrieve the logs to manage errors at application level, instead of displaying errors in the browser console.

[#output]

As you can see logs can be generated from a template through the **{log}** statement. It supports multiple arguments that are automatically concatenated as one string. The first level of object properties and array items are automatically displayed, so that all objects accessible at a template position can be discovered through **{log scope}**

The **{log}** statement will automatically create a new log when one of the log argument changes.

On the JavaScript side, hashspace offers a specific **log** library - cf. *require("hsp/rt/log")*. This library offers simple logging features that allows to log messages to the same place as the **{log}** statement. The log data can then be retrieved by registering a logger function through **log.addLogger()**. This function will receive structured log messages that can be handled at application level. The main methods of the **log** library are the following:

 - *log(msg[,data])* to log debug data
 - *log.info(msg[,data])* to log informative data
 - *log.warning(msg[,data])* to log warning information
 - *log.error(msg[,data])* to log errors

All these methods accept a second optional argument used to pass contextual information. This argument is a JSON structure that accepts the following properties:

 - *id*: {String|Number} Unique message identifier
 - *type*: {String} Message type: "info", "error", "warning" or "debug" 
 - *message*: {String} The default message - in english (will be automatically set from the msg argument)
 - *file*: {String} File name associated to the message 
 - *dir*: {String} Directory path corresponding to the file
 - *code*: {String} Some piece of code associated to the message
 - *line*: {Number} Line number associated to the message (e.g. for errors)
 - *column*: {Number} Column number associated to the message (e.g. for errors) 