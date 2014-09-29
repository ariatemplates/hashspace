This example shows how to develop a simple pagination component based on [bootstrap][bootstrap] CSS framework

[#output]

As you can see, supporting custom events in a component simply requires two lines of code:

 - in the component *$attributes* section, the developer needs to declare the callback attribute - such as *onpageselect* in this example. Note that the event name should be lower case to follow the HTML conventions.
 - in the method where the event needs to be raised, you simply need to call the event callback and pass the event object properties as argument - c.f. *this.onpageselect({pageNumber:this.activepage})* in this example

[bootstrap]: http://getbootstrap.com/
