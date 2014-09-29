
This example shows how to populate a list with a *foreach* statement and how to implement different displays for each list item. In this particular example this is illustrated with: 

 + a specific css class for some items - in this case, the *special* css class is set when the person name is *Bart*, and the *details* class is set when the item is clicked.
 + different information per item - here the *$showdetails* boolean property is set when an item is clicked, which activates the age display

[#output]

This example also shows that event handlers can get contextual parameters - such as the person argument in the *toggleDetails* function - which greatly simplifies event handler callbacks. Similarly, it is possible to pass the event object to the event handler by using the *event* keyword as one of the callback arguments (note that the event can be passed at any argument position). In this example it would look like this:

`onclick="{toggleDetails(p,$event)}"`  

Last but not least, the event handler can stop the default behaviour by returning *false* - this behaviour is shown in the todo list example.

