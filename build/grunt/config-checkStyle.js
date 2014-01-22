/*
 * Copyright 2012 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Style-checking grunt configuration.
 * @param {Object} grunt
 */
module.exports = function (grunt) {
    grunt.config.set('jshint', {
        options : require('./jshint.json'),
        build : {
            options : {
                "node" : true
            },
            src : ['index.js', 'Gruntfile.js', 'build/grunt/*.*']
        },
        source : {
            src : ['hsp/**/*.js', '!hsp/utils/jquery*.min.js']
        },
        public : {
            files : {
                src : [ 'public/**/*.js',
                        '!public/**/test/**/*.js',
                        '!public/lib/**/*.js',
                        '!public/playground/markdown.js',
                        '!public/expect.js'
                ]
            },
            options : {
                "unused" : false,
                "globals" : {
                    "ace": false,
                    "ActiveXObject": false,
                    "console": false,
                    "document": false,
                    "module": false,
                    "exports": false,
                    "noder": false,
                    "require": false,
                    "window": false,
                    "XMLHttpRequest" : false,
                    "setTimeout": false,
                    "setInterval": false,
                    "clearTimeout": false,
                    "clearInterval": false,
                    "test": false,
                    "Syn": false,
                    "Event": false
                }
            }
        },
        test : {
            src : ['public/**/test/**/*.js'],
            options : {
                "node" : true,
                "globals" : {
                    "__CODE__": false,
                    "document": false,
                    "require" : false,
                    "window": false,
                    "describe" : false,
                    "it" : false,
                    "before" : false,
                    "beforeEach" : false,
                    "after" : false,
                    "afterEach" : false,
                    "expect" : false
                }
            }
        }
    });

    grunt.config.set('verifylowercase.sourceFiles', {
        src : ['hsp/**', 'public/**']
    });

    grunt.config.set('leadingIndent.indentation', 'spaces');
    grunt.config.set('leadingIndent.jsFiles', {
        src : ['hsp/**/*.js', 'public/**/*.js']
    });

    grunt.registerTask('checkStyle', ['jshint', 'verifylowercase:sourceFiles', 'leadingIndent:jsFiles']);
};
