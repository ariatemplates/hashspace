
This event shows how DOM events can be simply caught in hashspace: for this you have to use a function expression that refers to a function that can be reached in the template scope:

[#output]

In this example the event handler function - *changeMessage* - will change the message object used by the template instance, and of course the data-binding engine will automatically update the DOM once all JavaScript instructions are executed.

This example also shows how to insert conditional DOM content through an *{if}* statement. This conditional statement can be used to insert new nodes or simply text. On contrary to many template engines, hashspace doesn't force you to create an HTML container element to include conditional content.
