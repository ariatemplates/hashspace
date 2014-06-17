
Here is one of the most simple example that can be written with hashspace

[#output]

#### How does it work?

Actually it is quite simple: hashspace uses an offline compiler to **transform templates into javascript functions** that have the same name and arguments as the template definition.

Then calling the template function generates a **template node** that can be inserted in the DOM through its **render()** method.

As templates are functions, it means that the same template can be used to generate multiple fragments of the same DOM - usually with different arguments, of course.

As hashspace currently relies on a [commonJS] dependency manager, it also means that templates can be easily exported to be used from other files (cf. *sub-template* example). 

*NB: In future releases, hashspace should provide compilation options to generate code independent from commonJS so that any module system can be used*

[commonJS]: http://www.commonjs.org/
[hello.hsp]: /samples/helloworld/hello.hsp
