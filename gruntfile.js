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
  grunt.initConfig({
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: [
          'public/test/compiler/*.js',
          'public/test/compiler/jsvalidator/*.js'
        ]
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
    copy: {
      fs_module: {
        files: [{
          src: 'hsp/compiler/hspblocks.pegjs',
          dest: 'build/tmp/fs.js'
        }],
        options: {
          processContent: function (content, srcpath) {
            return "exports.readFileSync=function(){return " + JSON.stringify(content) + "}";
          }
        }
      }
    },
    browserify: {
      runtime: {
        files: {
          'build/hashspace.js': ['hsp/rt.js']
        },
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
        files: {
          'build/hashspace.compiler.js': ['hsp/compiler/compiler.js']
        },
        options: {
          aliasMappings: [
            {
              cwd: "hsp/compiler",
              src: ['compiler.js'],
              dest: 'hsp'
            }
          ],
          shim: {
            fs: {
              path: 'build/tmp/fs.js',
              exports: null
            }
          }
        }
      }
    },
    uglify: {
      hsp: {
        files: {
          'build/hashspace.min.js': ['build/hashspace.js'],
          'build/hashspace.compiler.min.js': ['build/hashspace.compiler.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-verifylowercase');
  grunt.loadNpmTasks('grunt-leading-indent');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadTasks('hsp/grunt');

  grunt.registerTask('test', ['checkStyle','mochaTest']);
  grunt.registerTask('package', ['copy', 'browserify', 'uglify']);
  grunt.registerTask('default', ['hspserver','watch']);
};