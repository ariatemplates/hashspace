
This example shows how custom components can be developed with Hashspace. Unlike classic templates, component templates define their own controller that can expose attributes that will be automatically bound to the component attributes used in the caller template. 

In this example, we create a simple timer component that counts elapsed seconds. It supports a single optional attribute to set the init timer value.

[#output]

The differences with the non-componentized timer sample are that:

- the *timer* template doesn't use function arguments, but declares its controller through the **using [name]:[controller]** syntax
- the controller instance (in this case *Timer*) is automatically created when the component is used - this is why the two *timer* instances show different values
- **the controller *init* function is automatically called once all attributes have been created and initialized** with the values provided by the component host. The *init* method allows then to create and initialize internal properties that will be exposed to the template only. It is important to note that attributes will be automatically created and don't need to be created in the controller's constructor (empty in this example).
- the controller public attributes (here *initvalue*) have to be declared through the **$attributes** collection attached to the controller prototype
- when an attribute is set by an external object (e.g. the host or the component template), the **$on[AttributeName]Change** method is called if the attribute binding is declared as *1-way* or *2-way*. This allows synchronization of internal properties bound to public attributes - but we don't need this possibility in this example.
