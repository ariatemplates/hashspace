
This sample shows how to split a template in smaller templates that can be used and shared independently.

[#output]

You can note the **export** keyword that automatically publishes the template on the *module.exports* interface (cf. [Common JS modules][cjs]). This way one can easily build libaries of templates that can be used from any JavaScript modules.

The code generated for this example by the hashspace compiler can be viewed here:

[samples/subtemplates/subtemplates.hsp][subtemplates.hsp]

[cjs]: http://wiki.commonjs.org/wiki/Modules/1.1
[subtemplates.hsp]: samples/subtemplates/subtemplates.hsp
