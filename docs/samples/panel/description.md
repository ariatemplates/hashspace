This example demonstrates how a component can define and use *template* attributes - that is attribute that can contain HTML, template control statements or sub-components.

[#output]

To support *template* attribute(s) the template controller simply needs to declare an attribute with the type **template**. If there is only one attribute of this type, then the component content will be automatically associated to this attribute (e.g. *body* in the second panel). However, if there are multiple *template* attributes, the default attribute must be identified with the **defaultContent** flag.

In this example you can also see that template attributes can be used in different manners:

 - as standard text attributes if HTML content is not required (cf. 1st panel of the *test* template)
 - as default content (2nd panel)
 - or as explicit sub-attribute nodes (cf. **<@head>** and **<@body>** in the 3rd panel)

