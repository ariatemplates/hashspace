This example demonstrates how a component can define and use its own sub-elements to support more complex use cases such as lists.

[#output]

As you can see from the sample code, supporting sub-elements requires few basic steps:

 - first, the sub-elements have to be declared through a **$elements** collection on the component's prototype.
 - then, the component's template simply needs to scan the **$content** collection that is automatically created on the controller instance to reference the element entities used in the component's parent template.

The *$content* collection is an ordered list that can be dynamically modified through *{if}* or *{foreach}* control statements. When template attributes are used in combination with sub-elements, the *$content* collection will not reference them, as the template attributes will be directly referenced and as such don't need to be integrated in the element's content collection (cf. *@head* attribute in the example).
