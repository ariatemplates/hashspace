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
          'public/test/jsvalidator/*.js'
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
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-verifylowercase');
  grunt.loadNpmTasks('grunt-leading-indent');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadTasks('hsp/grunt');

  grunt.registerTask('default', ['hspserver','watch']);
};