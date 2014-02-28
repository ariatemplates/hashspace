[![Build Status](https://secure.travis-ci.org/ariatemplates/hashspace.png)](http://travis-ci.org/ariatemplates/hashspace)
[![devDependency Status](https://david-dm.org/ariatemplates/hashspace/status.png?branch=master)](https://david-dm.org/ariatemplates/hashspace#info=dependencies)
[![devDependency Status](https://david-dm.org/ariatemplates/hashspace/dev-status.png?branch=master)](https://david-dm.org/ariatemplates/hashspace#info=devDependencies)

hashspace
=========

Hashspace is a client-side HTML template engine - currently under construction. Its purpose is to provide a powerful and light-weight way to create adanced web-pages containing application logic.

The key targetted features are:
- a simple an natural template syntax thanks to an offline compiler
- bi-directional data-binding on any HTML element property (attributes and content)
- light-weight (target: <20kb minified compressed for the runtime library)
- support of sub-templates and widget libraries
- support of advanced expressions

Hashspace is composed of 2 main parts:
- a file pre-processor that translates the HTML templates into JavaScript functions (cf. compiler test files for the syntax)
- a runtime library that interprets the compiled templates dynamically

Please refer to the samples in the unit-tests suites in the 'test/compiler or 'test/rt' folders for more details.
The `public/samples` folder also contains a pseudo-code implementation of what should be the [todomvc][todomvc] implementation once the minimum set of features are implemented.


Currently only some parts of the runtime are developed:
- json wrapper to set properties in a data object and automatically trigger notifications to observer objects
- text nodes
- data binding on properties
- element nodes (e.g. div, span, section, h1...)
- {if} statements
- {insert} statements
- {foreach} statements
- array data-bindings (i.e. automatic refresh of foreach nodes when the foreach array is changed)


To run and update the samples in a live environment, first run *npm install* and then:
- run *grunt* to launch a local web-server that can compile templates on the fly (cf. hsp/grunt folder)
- open *http://localhost:8000* in your favorite browser and choose an example from the sample list
- or open *http://localhost:8000/todomvc* to play with the todomvc sample..

## Development

### Preparing your environment

- install Grunt cli globally: `npm install -g grunt-cli`
- install local npm modules: `npm install`

### Running Tests

For jshint validation:
- run `grunt checkStyle`

To run all the tests (compiler and runtime):
- `grunt test`

For the compiler test only:
- run `grunt mocha` (you can also work in the TDD mode by running `grunt watch:mocha`)

For the browser-based runtime tests only:
- run `grunt karma:unit` to test on local browsers (you can also work in the TDD mode by running `grunt karma:tdd`)
- run `grunt karma:sauce` to test on SauceLabs browsers

To do the health check on the project (before commit, for example) run `grunt test`. This will run checkstyle verifications
and all the tests (compiler and runtime).

For the browser runtime tests:
- run *grunt* - this will launch a local webserver and a watch task on your files
- and access *http://localhost:8000/test/rt* to run the tests in your favorite browsers

[key_features_blog]: http://ariatemplates.com/blog/2012/11/key-features-for-client-side-templates/
[todomvc]: http://addyosmani.github.com/todomvc/
[angular]:http://angularjs.org/
[grunt]: http://gruntjs.com/
[mocha]: http://visionmedia.github.io/mocha/
