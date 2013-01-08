hashspace
=========

Hashspace is currently an experimental client-side HTML template engine. Its purpose is to provide a powerful and light-weight way to create adanced web-pages containing application logic.

The key targetted features are:
- a simple an natural template syntax
- bi-directional data-binding on any HTML element property (attributes and content)
- light-weight (target: <20kb minified compressed for the runtime library)
- support of sub-templates and widget libraries
- support of advanced expressions

cf. [this article][key_features_blog] for more information

Once fully developed it should be composed of 2 main parts:
- a file pre-processor that will translate the HTML templates into JavaScript functions (cf. spec files for the syntax)
- a runtime library that will interpret the templates dynamically

Currently only some parts of the runtime are developed:
- json wrapper to set properties in a data object and automatically trigger notifications to observer objects
- text nodes
- data binding on properties
- element nodes (e.g. div, span, section, h1...)
- # if statements
- # insert statements
- # foreach statements
- array data-bindings (i.e. automatic refresh of foreach nodes when the foreach array is changed)

Please refer to the unit-tests suites in the spec folder for more details.

The samples folder also contains a pseudo-code implementation of what could be the [todomvc][todomvc] implementation with hashspace (some syntax pieces and implementation details still TBD)

As you will note, hashspace has many similarities with [angular JS][angular] as it implements the same type of algorithm that binds the HTML DOM to a JavaScript data structure. However the purpose of hashspace is not to implement a full framework as angular - but simply the HTML rendering part. Besides its pre-processor+runtime architecture will allow keeping the runtime as small as possible, while supporting advanced features - such as error managment and advanced expressions, as they may mainly impact the parser that will not be part of the runtime.


[key_features_blog]: http://ariatemplates.com/blog/2012/11/key-features-for-client-side-templates/
[todomvc]: http://addyosmani.github.com/todomvc/
[angular]:http://angularjs.org/
