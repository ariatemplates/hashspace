
This example originally demonstrated in the [react framework][react] documentation shows a simple example of data-binding. The timer object is updated every second, and the elapsed time is automatically updated in the template.

[#output]

The most important point to understand is that **hashspace is reprocessing JavaScript** to introduce a partial polyfill to [Object.observe][objobserve] in order to detect changes that occur to JavaScript objects. Hashspace actually uses a transpiler to encapsulate assignments with an internal **$set()** method that performs the assignment and notifies the potential observers. You can see the result [here][timer.hsp].

In the mid-term the *$set()* utility will become obsolete once the [Object.observe][objobserve] feature is implemented by all web-browsers - and hashspace will rely on the browser's Object.observe implementation.

The $set function has the following signature:
	
	$set(object_or_array, propertyName_or_index, value);

(This will perform:  `object_or_array[propertyName_or_index] = value;`)

You can also note the **klass** utility that is used to create the **Timer** constructor. This utility is used internally by hashspace to simplify JavaScript Object-Oriented notation and manage prototype-based inheritance.

[react]: http://facebook.github.io/react/
[objobserve]: http://www.youtube.com/watch?v=VO--VXFJnmE
[timer.hsp]: /samples/timer/timer.hsp