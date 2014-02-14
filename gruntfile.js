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

module.exports = function (grunt) {

  var pkg = require('./package.json');

  grunt.initConfig({
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: [
          'public/test/compiler/*.js',
          'public/test/transpiler/*.js',
          'public/test/compiler/jsvalidator/*.js'
        ]
      }
    },
    karma: {
      options: {
        frameworks: ['mocha', 'expect', 'commonjs', 'sinon'],
        plugins: [
          // these plugins will be require()-d by Karma
          'karma-*',
          require('./build/karma-hsp-preprocessor')
        ],
        files: [
          'hsp/**/*.js',
          'public/test/**/*.spec.*',
          'node_modules/sinon/pkg/sinon-ie.js',
          'node_modules/jquery/dist/jquery.min.js',
          'node_modules/sinon/pkg/sinon-ie.js'
        ],
        exclude: [
          'hsp/compiler/**/*.js',
          'public/test/transpiler/**/*.spec.js',
          'public/test/compiler/**/*.spec.js'
        ],
        preprocessors: {
          'hsp/**/*.js': ['commonjs'],
          'public/test/lib/*.js': ['commonjs'],
          'public/test/**/*.spec.js': ['commonjs'],
          'public/test/**/*.spec.hsp': ['hsp', 'commonjs'],
          'node_modules/jquery/dist/jquery.min.js': ['commonjs']
        },
        commonjsPreprocessor: {
          modulesRoot: '.'
        },
        browsers: ['Firefox'],
        // global config for SauceLabs
        sauceLabs: {
          username: 'ariatemplates',
          accessKey: '620e638e-90d2-48e1-b66c-f9505dcb888b',
          testName: '#space runtime tests'
        },
        // define SL browsers
        customLaunchers: {
          'SL_Chrome': {
            base: 'SauceLabs',
            browserName: 'chrome',
            platform: 'Linux',
            version: '30'
          },
          'SL_Firefox': {
            base: 'SauceLabs',
            browserName: 'firefox',
            platform: 'Linux'
          },
          'SL_Safari_6': {
            base: 'SauceLabs',
            browserName: 'safari',
            platform: 'OS X 10.8',
            version: '6'
          },
          'SL_IE_8': {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 7',
            version: '8'
          },
          'SL_IE_9': {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 2008',
            version: '9'
          },
          'SL_IE_10': {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 2012',
            version: '10'
          },
          'SL_IE_11': {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 8.1',
            version: '11'
          },
          'IOS': {
            base: 'SauceLabs',
            browserName: 'iphone',
            platform: 'OS X 10.8',
            version: '6.1'
          },
          'ANDROID': {
            base: 'SauceLabs',
            browserName: 'ANDROID',
            platform: 'Linux',
            version: '4.0'
          }
        }
        //logLevel: 'LOG_INFO'
      },
      unit: {
        singleRun: true
      },
      tdd: {
        singleRun: false,
        autoWatch: true
      },
      ci: {
        sauceLabs: {
          startConnect: false,
          tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
        },
        transports: ['xhr-polling'],
        singleRun: true,
        browsers: ['SL_IE_8', 'SL_IE_9', 'SL_IE_10', 'SL_IE_11', 'SL_Firefox', 'SL_Chrome', 'ANDROID'],
        reporters: ['dots', 'saucelabs']
      },
      sauce: {
        singleRun: true,
        browsers: ['SL_IE_8', 'SL_IE_9', 'SL_IE_10', 'SL_IE_11', 'SL_Firefox', 'SL_Chrome', 'ANDROID'],
        reporters: ['dots', 'saucelabs']
      }
    },
    hspserver: {
      port: 8000,
      base: __dirname,
      templateExtension: "hsp"
    },
    watch: {
      files: ['*.*'],
      tasks: []
    },
    browserify: {
      runtime: {
        files: [{dest: 'dist/'+pkg.version+'/hashspace-browserify.js', src: ['hsp/rt.js']}],
        options: {
          aliasMappings: [
            {
              cwd: "hsp",
              src: ['*.js'],
              dest: 'hsp'
            },
            {
              cwd: "hsp/rt",
              src: ['*.js'],
              dest: 'hsp/rt'
            },
            {
              cwd: "hsp/gestures",
              src: ['*.js'],
              dest: 'hsp/gestures'
            }
          ]
        }
      },
      compiler: {
        files: [{dest: 'dist/'+pkg.version+'/hashspace-browserify-compiler.js', src: ['hsp/compiler/compiler.js']}],
        options: {
          aliasMappings: [
            {
              cwd: "hsp/compiler",
              src: ['compiler.js'],
              dest: 'hsp'
            }
          ]
        }
      }
    },
    uglify: {
      hsp: {
        files: [
          {dest: 'dist/'+pkg.version+'/hashspace-browserify.min.js', src: ['dist/'+pkg.version+'/hashspace-browserify.js']},
          {dest: 'dist/'+pkg.version+'/hashspace-browserify-compiler.min.js', src: ['dist/'+pkg.version+'/hashspace-browserify-compiler.js']},
          {dest: 'dist/'+pkg.version+'/hashspace-noder.min.js', src: ['dist/'+pkg.version+'/hashspace-noder.js']},
          {dest: 'dist/'+pkg.version+'/hashspace-noder-compiler.min.js', src: ['dist/'+pkg.version+'/hashspace-noder-compiler.js']}
        ]
      }
    },
    peg:{
        grammar: {
            src: "hsp/compiler/hspblocks.pegjs",
            dest: "hsp/compiler/hspblocks.peg.js",
            options:{
                trackLineAndColumn : true
            }
        }
    },
    atpackager : {
        runtime : {
            options : {
                sourceDirectories : ['.'],
                sourceFiles : ['hsp/**/*.js'],
                outputDirectory : 'dist/' + pkg.version,
                defaultBuilder : {
                    type : "NoderPackage",
                    cfg : {
                        outputFileWrapper : "(function(define){$CONTENT$;})(noder.define);"
                    }
                },
                visitors : [{
                            type : "ImportSourceFile",
                            cfg : {
                                sourceFile : require.resolve("acorn/acorn"),
                                targetLogicalPath : "acorn/acorn.js"
                            }
                        }, "NoderDependencies", {
                            type : "CheckDependencies",
                            cfg : {
                                noCircularDependencies : false
                            }
                        }],
                packages : [{
                            name : "hashspace-noder.js",
                            files : ['hsp/*.js', 'hsp/rt/*.js', 'hsp/gestures/*.js']
                        }, {
                            name : "hashspace-noder-compiler.js",
                            files : ['hsp/compiler/compiler.js']
                        }]
            }
        }
    }
  });

  // Automatically load all the grunt tasks
  require('load-grunt-tasks')(grunt);
  grunt.loadTasks('build/grunt');
  grunt.loadNpmTasks('atpackager');
  require('atpackager').loadNpmPlugin('noder-js');

  grunt.registerTask('prepublish', ['peg']);
  grunt.registerTask('package', ['prepublish', 'browserify', 'atpackager', 'uglify']);
  grunt.registerTask('mocha', ['peg', 'mochaTest']);
  grunt.registerTask('test', ['checkStyle', 'mocha', 'karma:unit']);
  grunt.registerTask('ci', ['checkStyle', 'mocha', 'karma:ci', 'package']);
  grunt.registerTask('default', ['hspserver','watch']);
};