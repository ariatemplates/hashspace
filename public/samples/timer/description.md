
This example originally demonstrated in the [react framework][react] documentation shows a simple example of data-binding. The timer object is updated every second, and the elapsed time is automatically updated in the template.

[#output]

The most important point to note in this example is the **$set** utility that has to be used to update objects or values in the data-model. This utility ensures that objects observing the data-model will be notified of the changes. In the mid-term this utility should become obsolete once the [Object.observe][objobserve] feature is implemented by all web-browsers.

The $set function has the following signature:
	
	$set(object_or_array, propertyName_or_index, value);

(This will perform:  `object_or_array[propertyName_or_index] = value;`)

You can also note the **klass** utility that is used to create the **Timer** constructor. This utility is used internally by hashspace to simplify JavaScript Object-Oriented notation and manage prototype-based inheritance.

[react]: http://facebook.github.io/react/
[objobserve]: http://www.youtube.com/watch?v=VO--VXFJnmE
