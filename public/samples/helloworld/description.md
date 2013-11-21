
Here is one of the most simple example that can be written with hashspace

[#output]

To be more precise, the next example is even more simple as hashspace templates don't require to use html elements, and can be used without any parameters (feel free to update it in the live editor on your right):

  `# template hello ` 
  `        Hello World! ` 
  `# /template `   

Anyway, the most important point to understand is that **the hashsapce compiler transforms templates into javascript functions** that have the same name and arguments as the template definition.

The second important point is to understand how templates are used in html pages. For this you have to call the **hsp.diplay** method that has the following signature:

` hsp.diplay(template_return_value, dom_element_or_id)`

As templates are functions, it means that the same template can be used to generate multiple fragments of the same DOM - usually with different arguments of course.

You may also wonder where the *hsp* object comes from: it is actually automatically inserted at the beginning of any template files through the following declaration:

` var hsp=require("hsp/rt");`  

You can also directly see the compiled javascript file resulting from the hashspace compilation by typing its url in your browser. For this first example, you can see it here:

[samples/helloworld/hello.hsp][hello.hsp]

[hello.hsp]: /samples/helloworld/hello.hsp
