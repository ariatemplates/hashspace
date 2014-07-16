
Here is one of the simplest example that can be written with Hashspace

[#output]

#### How does it work?

Actually it is quite simple: Hashspace uses an offline compiler to **transform templates into JavaScript functions** that have the same name and arguments as the template definition.

Then calling the template function generates a **template node** that can be inserted in the DOM through its **render()** method.

As templates are functions, it means that the same template can be used to generate multiple fragments of the same DOM - usually with different arguments, of course.

As Hashspace currently relies on a [commonJS] dependency manager, it also means that templates can be easily exported to be used from other files (cf. *sub-template* example).

To be able to execute the sample code you can read on the left, the playground needs to know which template function
has to be executed, and what data to be injected.

Hence this code at the bottom:

```javascript
module.exports = {
  template: hello, // javascript reference to the template function
  data: [ "World" ] // the data to be injected
}
```

Each sample will declare this export object to be compatible with the playground application.

*NB: In future releases, Hashspace should provide compilation options to generate code independent from commonJS so that any module system can be used*

[commonJS]: http://www.commonjs.org/
[hello.hsp]: /samples/helloworld/hello.hsp
