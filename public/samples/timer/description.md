
This example originally demonstrated in the [react framework][react] documentation shows a simple example of data-binding. The timer object is updated every second, and the elapsed time is automatically updated in the template.

[#output]

The most important point to note in this example is the **json** utility that has to be used to update objects or values in the data-model. This utility ensures that objects observing the data-model will be notified of the changes. In the mid-term this utility should become obsolete once the [Object.observe][objobserve] feature is implemented by all web-browsers.

The main method of this json utility is the *json.set* method that has the following signature:

`json.set(object_or_array, propertyName_or_index, value)`

This utility has also other array-specific methods that are illustrated in other samples.

You can also note the **klass** utility that is used to create the **Timer** constructor. This utility is used internally by hashspace to simplify JavaScript class notation and manage prototype-based inheritance.


[react]: http://facebook.github.io/react/
[objobserve]: http://www.youtube.com/watch?v=VO--VXFJnmE
