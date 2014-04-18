
This sample shows how a view can be dynamically updated with a non-predefined template:

[#output]

As templates can be used as properties of objects, they can be changed dynamically. The template insertion mechanism will automatically detect the reference change and unload the previous template before loading the new one. Template attributes can also be passed and changed dynamically.

**Note:** template can only be changed like this if they are referenced as a property of an object which is present in the template scope (ctxt object in this example)

