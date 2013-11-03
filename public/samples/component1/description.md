
This example shows how custom components can be developed with hashspace. Unlike classic templates, component templates define their own controller that can expose attributes that will be automatically bound to the component attributes used in the caller template. 

In this example, we create a simple timer component that counts elapsed seconds. It supports a single optional attribute to set the init timer value.

[#output]

The differences with the non-componentized timer sample are that:

- the *timer* template doesn't use function arguments, but declares its controller through the **using [name]:[controller]** syntax
- the controller instance (in this case *Timer*) is automatically created when the component is used - this is why the two *timer* instances show different values
- the controller public attributes (here *initvalue*) have to be declared through the an **attributes** collection attached to the controller instance
- when an attribute is set by an external object (e.g. the host or the component template), the **onAttributeChange** method is called, which allows to synchronize internal properties bound to public attributes (such as the *elapsedTime* property in this example)
- the *onAttributeChange* method takes a **change** argument that has the following properties (similar to Object.observe() btw.):
  - **name**: the name of the property that changed
  - **object**: the object holding the property that changed (here the *attributes* controller property)
  - **type**: the change type - e.g. *new*, *updated*, *splice*, *shift* or *pop*
  - **newValue**: the new value of the property
  - **oldValue**: the previous value of the property
