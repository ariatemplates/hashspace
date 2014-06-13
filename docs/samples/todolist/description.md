
This example is also borrowed from [react framework][react] documentation and shows a basic todo list implementation:

[#output]

Here the argument passed to the template is a small controller object that exposes:

+ the todo list data model - composed for this example of a simple list, and of a property to store the todo item that is being created
+ the action that can be peformed on this data model - in this case the *addItem* method.

Using a controller object offers the possibility to support multiple instances of the same template in the same page - of course on condition that the template doesn't use fixed html ids.

A more complete implementation of the todo example can be found [here][todomvchsp] (should be soon part of the [todomvc][todomvc] site) - code is available on [github][todomvcgh]

The compiled code can be viewed here: [samples/todolist/todolist.hsp][todolist.hsp]


[todolist.hsp]: /samples/todolist/todolist.hsp
[react]: http://facebook.github.io/react/
[todomvchsp]: /todomvc/
[todomvc]: http://todomvc.com/
[todomvcgh]: https://github.com/ariatemplates/hashspace/tree/master/docs/todomvc
