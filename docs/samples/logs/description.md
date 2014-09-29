This example shows how to trace data that are used in a template. It also shows how to retrieve the logs to manage errors at application level, instead of displaying errors in the browser console.

[#output]

As you can see logs can be generated from a template through the **{log}** statement. It supports multiple arguments that are automatically concatenated as one string. The first level of object properties and array items are automatically displayed, so that all objects accessible at a template position can be discovered through **{log $scope}**

The **{log}** statement will automatically create a new log when one of the log argument changes.

On the JavaScript side, Hashspace offers a specific **log** library - cf. *require("hsp/rt/log")*. This library offers simple logging features that allows to log messages to the same place as the **{log}** statement. The log data can then be retrieved by registering a logger function through **log.addLogger()**. This function will receive structured log messages that can be handled at application level. The main methods of the **log** library are the following:

 - *log(obj1 [, obj2, ..., objN, metaData])* : to log debug data
 - *log.info(obj1 [, obj2, ..., objN, metaData])* : to log informative data
 - *log.warning(obj1 [, obj2, ..., objN, metaData])* : to log warning information
 - *log.error(obj1 [, obj2, ..., objN, metaData])* : to log errors

All these methods accept an optional 'last' argument used to pass contextual information. This argument is a JSON structure that must have a valid **type** attribute (that is either "info", "error", "warning" or "debug"). The following other properties could be added as well:

 - *id*: {String|Number} Unique message identifier
 - *message*: {String} The default message - in English (will be automatically set from the msg argument)
 - *file*: {String} File name associated to the message 
 - *dir*: {String} Directory path corresponding to the file
 - *code*: {String} Some piece of code associated to the message
 - *line*: {Number} Line number associated to the message (e.g. for errors)
 - *column*: {Number} Column number associated to the message (e.g. for errors) 