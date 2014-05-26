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
    pkg: pkg,
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          require: 'build/blanket'
        },
        src: [
          'test/compiler/**/*.js',
          'test/transpiler/*.js'
        ]
      },
      coverage: {
        options: {
          reporter: 'mocha-lcov-reporter',
          quiet: true,
          captureFile: 'test-results/lcov_mocha.info'
        }
      },
      coverageHtml: {
        options: {
          reporter: 'html-cov',
          quiet: true,
          captureFile: 'test-results/lcov_mocha.html'
        }
      }
    },
    karma: {
      options: {
        frameworks: ['mocha', 'expect', 'commonjs', 'sinon'],
        files: [
          'hsp/**/*.js',
          'test/**/*.spec.*',
          'node_modules/sinon/pkg/sinon-ie.js',
          'node_modules/jquery/dist/jquery.min.js',
          'node_modules/sinon/pkg/sinon-ie.js'
        ],
        exclude: [
          'hsp/compiler/**/*.js',
          'hsp/transpiler/**/*.js',
          'test/transpiler/**/*.spec.js',
          'test/compiler/**/*.spec.js'
        ],
        preprocessors: {
          'hsp/**/*.js': ['commonjs'],
          'test/lib/*.js': ['commonjs'],
          'test/**/*.spec.js': ['commonjs'],
          'test/**/*.spec.hsp': ['hsp', 'commonjs'],
          'node_modules/jquery/dist/jquery.min.js': ['commonjs']
        },
        commonjsPreprocessor: {
          modulesRoot: '.'
        },
        browsers: ['Firefox'],
        // global config for SauceLabs
        sauceLabs: {
          username: 'hashspace',
          accessKey: '9e47b05c-b1de-43ce-b9f0-dc64a3bc5f35',
          testName: '#space runtime tests'
        },
        // define SL browsers
        customLaunchers: {
          'SL_Chrome': {
            base: 'SauceLabs',
            browserName: 'chrome',
            platform: 'Linux',
            version: '33'
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
          'SL_Safari_7': {
            base: 'SauceLabs',
            browserName: 'safari',
            platform: 'OS X 10.9',
            version: '7'
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
          'SL_iOS_6': {
            base: 'SauceLabs',
            browserName: 'iphone',
            platform: 'OS X 10.8',
            version: '6.1'
          },
          'SL_iOS_7': {
            base: 'SauceLabs',
            browserName: 'iphone',
            platform: 'OS X 10.9',
            version: '7.1'
          },
          'SL_Android_4.0': {
            base: 'SauceLabs',
            browserName: 'ANDROID',
            platform: 'Linux',
            version: '4.0'
          },
          'SL_Android_4.1': {
            base: 'SauceLabs',
            browserName: 'ANDROID',
            platform: 'Linux',
            version: '4.1'
          },
          'SL_Android_4.2': {
            base: 'SauceLabs',
            browserName: 'ANDROID',
            platform: 'Linux',
            version: '4.2'
          },
          'SL_Android_4.3': {
            base: 'SauceLabs',
            browserName: 'ANDROID',
            platform: 'Linux',
            version: '4.3'
          }
        }
        //logLevel: 'LOG_INFO'
      },
      unit: {
        singleRun: true,
        preprocessors: {
          'hsp/**/*.js': ['commonjs', 'coverage']
        },
        reporters: ['progress', 'coverage'],
        coverageReporter: {
          type : 'lcov',
          dir : 'test-results/karma/'
        }
      },
      tdd: {
        singleRun: false,
        autoWatch: true
      },
      coverage: {
        singleRun: true,
        preprocessors: {
          'hsp/**/*.js': ['commonjs', 'coverage']
        },
        reporters: ['dots', 'coverage'],
        browsers: ['PhantomJS'],
        coverageReporter: {
          type : 'lcovonly',
          dir : 'test-results/karma/'
        }
      },
      ci1: {
        sauceLabs: {
          startConnect: false,
          tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
        },
        transports: ['xhr-polling'],
        singleRun: true,
        browserNoActivityTimeout: 20000,
        captureTimeout: 300000,
        browsers: ['SL_Chrome', 'SL_Android_4.0', 'SL_Android_4.1', 'SL_IE_8', 'SL_IE_9', 'SL_Safari_7'],
        reporters: ['dots', 'saucelabs']
      },
      ci2: {
        sauceLabs: {
          startConnect: false,
          tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
        },
        transports: ['xhr-polling'],
        singleRun: true,
        browserNoActivityTimeout: 20000,
        captureTimeout: 300000,
        browsers: ['SL_iOS_7', 'SL_Firefox', 'SL_Android_4.2', 'SL_Android_4.3', 'SL_IE_10', 'SL_IE_11', 'SL_Safari_6'],
        reporters: ['dots', 'saucelabs']
      },
      sauce: {
        singleRun: true,
        browserNoActivityTimeout: 20000,
        captureTimeout: 300000,
        browsers: ['SL_IE_8', 'SL_IE_9', 'SL_IE_10', 'SL_IE_11', 'SL_Safari_6', 'SL_Safari_7', 'SL_Firefox', 'SL_Chrome', 'SL_Android_4.0', 'SL_Android_4.1', 'SL_Android_4.2', 'SL_Android_4.3', 'SL_iOS_7'],
        reporters: ['dots', 'saucelabs']
      }
    },
    jscs: {
        src: ['hsp/**/*.js', 'docs/**/*.js', '!docs/**/*.js'],
        options: {
            config: '.jscs.json'
        }
    },
    hspserver: {
      port: 8000,
      base: __dirname + '/hsp'
    },
    watch: {
      mocha: {
        files: ['hsp/compiler/**', 'test/**'],
        tasks: ['mochaTest']
      }
    },
    browserify: {
      runtime: {
        files: [{dest: 'dist/hashspace-browserify.js', src: ['hsp/rt.js']}],
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
        files: [{dest: 'dist/hashspace-browserify-compiler.js', src: ['hsp/compiler/compiler.js']}],
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
          {dest: 'dist/hashspace-browserify.min.js', src: ['dist/hashspace-browserify.js']},
          {dest: 'dist/hashspace-browserify-compiler.min.js', src: ['dist/hashspace-browserify-compiler.js']},
          {dest: 'dist/hashspace-noder.min.js', src: ['dist/hashspace-noder.js']},
          {dest: 'dist/hashspace-noder-compiler.min.js', src: ['dist/hashspace-noder-compiler.js']}
        ]
      }
    },
    peg:{
        grammar: {
            src: "hsp/compiler/parser/hspblocks.pegjs",
            dest: "hsp/compiler/parser/hspblocks.peg.js",
            options:{
                cache:true,
                trackLineAndColumn : true
            }
        }
    },
    atpackager : {
            options : {
                sourceDirectories : ['.'],
                sourceFiles : ['hsp/**/*.js'],
                outputDirectory : 'dist/',
                visitors : [{
                            type : "ImportSourceFile",
                            cfg : {
                                sourceFile : "tmp/uglify-js.js",
                                targetLogicalPath : "uglify-js.js"
                            }
                        }, {
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
                        }]

            },
            uglify : {
                options : {
                    sourceDirectories : ["node_modules/uglify-js/lib"],
                    sourceFiles : [],
                    outputDirectory : 'tmp',
                    visitors : ["NoderExportVars"],
                    packages : [{
                        builder : "Concat",
                        name : 'uglify-js.js',
                        files : ["utils.js", "ast.js", "parse.js", "transform.js", "scope.js", "output.js",
                                "compress.js"]
                    }]
                }
            },
            runtime : {
                options : {
                    defaultBuilder : {
                        type : "NoderPackage",
                        cfg : {
                            outputFileWrapper : "(function(define){$CONTENT$;})(noder.define);"
                        }
                    },
                    packages : [{
                                name : "hashspace-noder.js",
                                files : ['hsp/*.js', 'hsp/rt/*.js', 'hsp/gestures/*.js']
                            }, {
                                name : "hashspace-noder-compiler.js",
                                files : ['hsp/compiler/compile.js','hsp/transpiler/transpile.js']
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

  grunt.registerTask('prepublish', ['package']);
  grunt.registerTask('package', ['peg', 'browserify', 'atpackager:uglify','atpackager:runtime','uglify']);
  grunt.registerTask('mocha', ['peg', 'inittests', 'mochaTest', 'finalizetests']);
  grunt.registerTask('test', ['checkStyle', 'jscs', 'mocha', 'karma:unit']);
  grunt.registerTask('ci', ['checkStyle', 'jscs', 'mocha', 'karma:ci1', 'karma:ci2', 'karma:coverage']);
  grunt.registerTask('release', ['docs:release']);
  grunt.registerTask('default', ['docs:playground']);
};
