
This sample shows a special type of expression that is particularly convenient for class attributes:

[#output]

As you can see in the example, you can combine static values and expressions inside the "class" attribute.
If an expression is used it can evaluate to either:

+ a string - e.g. *msg.category* - in this case it will be interpreted as class names to add
+ an object - e.g. *{'urgent' : msg.urgency===1}*
 - each key in an object is interpreted as a class name that should be inserted (e.g. *'urgent'*)
 - whereas the expression in the value part should resolve to a boolean to tell if the class element should be
 inserted or not (e.g. *msg.urgency===1*)

You can use more complex expression - e.g. *'type'+msg.urgency* to build a more dynamic class element.