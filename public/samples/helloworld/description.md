
Here is one of the most simple example that can be written with hashspace

[#output]

## How does it work?

Actually it is quite simple: hashspace uses an offline compiler to **transform templates into javascript functions** that have the same name and arguments as the template definition (cf. result [here][hello.hsp])

Then calling the template function generates a **template node** that can be inserted in the DOM through its **render()** method.

As templates are functions, it means that the same template can be used to generate multiple fragments of the same DOM - usually with different arguments, of course. 

As hashspace relies on a [commonJS] dependency manager, it also means that templates can be easily exported to be used from other files (cf. *sub-template* example).

*NB: Feel free to play with the template on the right side and see the results as you type*

[commonJS]: http://www.commonjs.org/
[hello.hsp]: /samples/helloworld/hello.hsp
