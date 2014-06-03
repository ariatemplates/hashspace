
This sample shows a special type of expression that is particularly convenient for class attributes:

[#output]

As you can see in the example, this expression is structured as a comma-separated list of sub-expressions that can have the following forms:

+ either a **hashspace expression** - a subset of the JavaScript expression syntax, such as
 - a string - e.g. *"urgent"* - in this case this will be considered as a mandatory class element
 - a path resolving to a string - e.g. *msg.category* to use dynamic class elements
 - a more complex expression - e.g. *'type'+msg.urgency* to build a more dynamic class element
+ or a **pair of hashspace expressions** separated by a colon - e.g. *'urgent' : msg.urgency===1*
 - the first expression will be resolved as the class element that should be inserted (e.g. *'urgent'*)
 - whereas the second expression should resolve to a boolean to tell if the class element should be inserted or not (e.g. *msg.urgency===1*)
