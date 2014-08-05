var YAML = require('js-yaml');
var express = require('express');
var path = require("path");
var fs = require('fs');

var app = express();
var yamlheadsep = /(\s*?\-+\s*\n)/g;


module.exports = function(grunt) {
  grunt.file.defaultEncoding = 'utf8';

  var VERSION = grunt.config('pkg').version;

  var GH_PAGES_PATH = './hashspace-gh-pages/';
  var GH_PAGES_GLOB = [
    GH_PAGES_PATH + '**/*' ,
    '!' + GH_PAGES_PATH + 'README.md',
    '!' + GH_PAGES_PATH + 'CNAME',
    '!' + GH_PAGES_PATH + 'dist/**/*'];

  var DOCS_PATH = "./docs/";

  var DOCS_MD_GLOB = [ '**/*.md', '!samples/**/*.md' ],
      DOCS_MD_SAMPlES = [ 'samples/**/*.md' ],
      DOCS_STATICS_GLOB = [
        'css/**',
        'images/*',
        'libs/**',
        'todomvc/**'
      ],
      DOCS_LESS_GLOB = [ '_css/*.less' ],
      DOCS_PLAYGROUND_GLOB = [
        'playground/**/*.js',
        'playground/**/*.css',
        'playground/**/*.hsp'
      ],
      DOCS_SAMPLES_GLOB = [ 'samples/**/*' ],

      DOCS_TODOMVC_INDEX          = 'todomvc/index.html',
      DOCS_TODOMVC_HSP_GLOB       = ['todomvc/**/*.hsp'],
      DOCS_TODOMVC_TRANSPILE_GLOB = ['todomvc/*.js'];


  var pathifyFromDocs = function(path) { return DOCS_PATH + path; };

  var WATCH_LESS_GLOB       = DOCS_LESS_GLOB.map(pathifyFromDocs),
      WATCH_MARKDOWN_GLOB   = DOCS_MD_GLOB.map(pathifyFromDocs),
      WATCH_SAMPLES_GLOB    = DOCS_SAMPLES_GLOB.map(pathifyFromDocs),
      WATCH_PLAYGROUND_GLOB = DOCS_PLAYGROUND_GLOB.map(pathifyFromDocs);


  /* ------------------
   *  Less compilation
   * ------------------
   */
  grunt.config.set('less', {
    "docs": {
      options: {
        compress: true
      },
      files: [
        {
          expand: true,
          cwd: DOCS_PATH,
          src: DOCS_LESS_GLOB,
          flatten: true,
          dest: GH_PAGES_PATH + '/css',
          ext: '.css'
        }
      ]
    }
  });


  /* ----------------
   *  Uglify Playground + Samples + TODOMVC
   * ----------------
   */
  var uglifyConfig = grunt.config("uglify");
  uglifyConfig["todomvc"] = {
    files: [
      {
        expand: true,
        src: [GH_PAGES_PATH + 'todomvc/**/*.hsp.js', GH_PAGES_PATH + 'todomvc/*.js']
      }
    ]
  };

  uglifyConfig["playground"] = {
    files: [
      {
        expand: true,
        src: [ GH_PAGES_PATH + 'playground/*-all.js' ]
      }
    ]
  };

  grunt.config("uglify", uglifyConfig);

  /* ----------------------
   *  Markadown Generation
   * ----------------------
   */
  function extractYamlHeader(src, context) {
    var splits = src.split(yamlheadsep), yamlheader, markdown = src;
    // we might have a yaml markdown header
    if (splits.length > 1) {
      grunt.verbose.writeln("");
      grunt.verbose.write("Yaml header detected...");
      try {
        yamlheader = YAML.load(splits[0]);
        grunt.verbose.ok();
      } catch(e) {
        grunt.log.error("Yaml header is probably not valid", e);
        return;
      }

      grunt.verbose.writeln("Exposing header variables to context...");
      Object.keys(yamlheader).forEach(function(key) {
        context[key] = yamlheader[key];
        grunt.verbose.ok("'" + key + "'", '->', yamlheader[key]);
      });

      markdown = splits.splice(2).join("\n"); // The actual markdown to be process
    }
    return markdown;
  }

  function processMappings(markdown, context) {
    var mappings;
    if (context.mappings) {
      grunt.verbose.write("Strings replacement to be done...");
      mappings = context.mappings;
      Object.keys(context.mappings).forEach(function(key) {
        markdown = markdown.replace('<p>[' + key + ']</p>', mappings[key]);
        grunt.verbose.ok("'" + key + "'", '->', mappings[key]);
      });
    }
    return markdown;
  }

  grunt.config.set('markdown', {
    "docs": {
      files: [
        {
          expand: true,
          cwd: DOCS_PATH,
          src: DOCS_MD_GLOB,
          dest: GH_PAGES_PATH,
          ext: '.html'
        }
      ],
      options: {
        template: DOCS_PATH + '_layouts/default.html',
        templateContext: function() {
          return {
            title: "Web fuel for the long run",
            cssclass: "",
            footerscripts: "",
            headerscripts: "",
            version: VERSION
          };
        },
        preCompile: function(src, context) {
          return extractYamlHeader(src, context);
        },
        postCompile: function(markdown, context) {
          return processMappings(markdown, context);
        },
        markdownOptions: {
          gfm: true,
          highlight: "manual"
        }
      }
    },
    "samples": {
      files: [
        {
          expand: true,
          cwd: DOCS_PATH,
          src: DOCS_MD_SAMPlES,
          dest: GH_PAGES_PATH,
          ext: '.html'
        }
      ],
      options: {
        template: DOCS_PATH + '_layouts/sample_desc.html',
        postCompile: function(markdown, context) {
          return markdown.replace("<p>[#output]</p>", "[#output]");
        },
        markdownOptions: {
          gfm: true
        }
      }
    }
  });

  /* ------------------------
   *  TODOMVC precompilation
   * ------------------------
   */
  grunt.registerTask("docs:todo-compile", "Precompile all related files for TODOMVC example", function() {
    var renderer  = require("../../hsp/compiler/renderer"),
        tranpiler = require("../../hsp/transpiler");

    // Precompiling hsp files
    grunt.file.expand({ cwd: DOCS_PATH }, DOCS_TODOMVC_HSP_GLOB).forEach(function(file) {
      grunt.file.copy(pathifyFromDocs(file),
        GH_PAGES_PATH + file + ".js",
        {
          process: function(content) {
            var compiled = renderer.renderString(content, "inline.js");
            if (compiled.serverErrors && compiled.serverErrors.length) {
              grunt.fail.fatal("Hashspace compilation " + compiled.serverErrors[0].description);
              return false;
            }
            return compiled.code;
          }
        });
    });

    //Transpiling javascript files
    grunt.file.expand({ cwd: DOCS_PATH }, DOCS_TODOMVC_TRANSPILE_GLOB).forEach(function(file) {
      grunt.file.copy(pathifyFromDocs(file),
        GH_PAGES_PATH + file,
        {
          process: function(content) {
            var tranpiled = tranpiler.processString(content, "inline.js");
            return tranpiled.code;
          }
        });
    });
  });

  function compileHashspace(req, res, suffix) {
      fs.readFile(suffix + req.url, "utf8", function (err, content) {
          if (err) {
              res.send(500, err.message);
          }
          else {
              var renderer  = require("../../hsp/compiler/renderer");
              var r = renderer.renderString(content, req.url.substring(req.url.lastIndexOf("/") + 1));
              if (r.serverErrors && r.serverErrors.length) {
                  res.send(500, r.serverErrors[0].description);
              } else {
                  res.send(200, r.code);
              }
          }
      });
  }

  /* ---------------------------
   *  Playground Express Server
   * ---------------------------
   */
  grunt.registerTask("docs:playground-server", "Launch local version of documentation including playground", function() {
    grunt.config.requires('hspserver.port');
    grunt.config.requires('hspserver.base');

    var port            = grunt.config('hspserver.port'),
        hspRoot         = grunt.config('hspserver.base')+"/hsp",
        emptyJsResponse = function(req, res) { res.set('Content-Type', 'application/x-javascript'); return res.send(""); },
        compilerPath    = '/dist/' + VERSION + '/hashspace-noder-compiler.min.js',
        runtimePath     = '/dist/' + VERSION + '/hashspace-noder.min.js',
        gesturesPath    = '/dist/' + VERSION + '/hashspace-noder-gestures.min.js';

    grunt.log.subhead('Local website setup');
    grunt.log.writeln('Starting local documentation web server...');
    // Log requests
    if (grunt.option('verbose')) {
        app.use(express.logger());
    }

    // Serve static files from the generated hashspace gh-pages folder
    app.use(express.static(GH_PAGES_PATH));
    grunt.verbose.ok("/ ->", GH_PAGES_PATH);

    // Serve also static files from the configured folder where hsp is located
    app.use('/hsp' , express.static(hspRoot));
    grunt.verbose.ok("/hsp ->", hspRoot);

    // Proxying acorn-js
    app.get("/acorn/acorn.js", function(req, res) { res.sendfile(require.resolve('acorn/acorn')); });

    // Empty polyfills for client hsp runtime and compiler to force noder-js to read them from
    app.get(compilerPath, emptyJsResponse);
    grunt.verbose.ok(compilerPath, 'polyfilled to be empty');
    app.get(runtimePath, emptyJsResponse);
    grunt.verbose.ok(runtimePath, 'polyfilled to be empty');
    app.get(gesturesPath, emptyJsResponse);
    grunt.verbose.ok(gesturesPath, 'polyfilled to be empty');

    // Proxying /test and /node_modules folders
    app.use('/test', function(req, res, next) {
        if (path.extname(req.url) === ".hsp") {
            compileHashspace(req, res, "test");
        }
        else {
            next();
        }
    });
    app.use('/test', express.static('./test'));
    app.use('/docs', function(req, res, next) {
        if (path.extname(req.url) === ".hsp") {
            compileHashspace(req, res, "docs");
        }
        else {
            next();
        }
    });
    app.use('/docs', express.static('./docs'));
    app.use('/node_modules', express.static('./node_modules'));

    app.listen(port);
    grunt.log.ok("started and listening on", 'http://localhost:' + port + '/');

    // Give back the handle to Grunt 4ever :D
    this.async();
  });


  /* ----------------------------------------------
   *  Building all needed files for the playground
   * ----------------------------------------------
   */

  // updating atpackager config to package the playground
  var atpackagerConfig = grunt.config('atpackager');
  atpackagerConfig["docs-playground"] = {
    options: {
      sourceDirectories : [
        GH_PAGES_PATH
      ],
      outputDirectory : GH_PAGES_PATH + 'playground/',
      visitors: [],
      defaultBuilder : {
        type : "NoderPackage",
        cfg : {
          outputFileWrapper : "(function(define){$CONTENT$;})(noder.define);"
        }
      },
      packages : [{
        name : "playground-samples-all.js",
        files : [ 'samples/**/*.js']
      }, {
        name : "playground-all.js",
        files : [ 'playground/**/*.js']
      }]
    }
  };
  grunt.config('atpackager', atpackagerConfig);

  grunt.registerTask("docs:samples-list-build", "Build a json file containing the samples list", function() {
    // Merging those markdown content into `samples/samples.js`
    var samplesList = require('../../docs/samples/samples'), samplesListString;

    grunt.file.expand({ cwd: DOCS_PATH, filter: "isDirectory" }, ['samples/*']).forEach(function(sample) {
      var name = sample.split("/").pop(),
          item = (samplesList.filter(function(s) { return s.folder === name; }) || [])[0],
          hsp, html, desc, hsptext;

      if (item) {
        hsp = sample + "/" + item.files[0].src;
        html = sample + "/description.html";
        desc = grunt.file.read(GH_PAGES_PATH + html);
        hsptext = grunt.file.read(DOCS_PATH + hsp);

        item.description = desc;
        item.files[0].text = hsptext;
        item.sample = "require('/"+hsp+".js')";
      }
    });

    samplesListString = JSON.stringify(samplesList, null, 2);
    samplesListString = samplesListString.replace(/"(require\('.*'\))"/gi, "$1");
    grunt.file.write(GH_PAGES_PATH + "samples/samples.js", "module.exports = " + samplesListString + ";");
  });

  grunt.registerTask("docs:playground-build", "Build a static playground version", function() {
    var renderer  = require("../../hsp/compiler/renderer"),
        tranpiler = require("../../hsp/transpiler");

    grunt.log.subhead("Building playground and samples files");

    // We copy the Playground files
    grunt.verbose.or.write("Copying playground files...");
    grunt.file.expand({ cwd: DOCS_PATH, filter: "isFile" }, DOCS_PLAYGROUND_GLOB).forEach(function(file) {
      grunt.file.copy(DOCS_PATH + file, GH_PAGES_PATH + file);
    });
    grunt.verbose.or.ok();


    // We copy the Samples files
    grunt.verbose.or.write("Copying samples file...");
    grunt.file.expand({ cwd: DOCS_PATH, filter: "isFile" }, DOCS_SAMPLES_GLOB).forEach(function(file) {
      grunt.file.copy(DOCS_PATH + file, GH_PAGES_PATH + file);
    });
    grunt.verbose.or.ok();

    grunt.verbose.or.write("Compiling playground & samples hsp files...");
    grunt.file.expand({ cwd: DOCS_PATH }, ['playground/**/*.hsp', 'samples/**/*.hsp']).forEach(function(file) {
      grunt.file.copy(pathifyFromDocs(file),
        GH_PAGES_PATH + file + ".js",
        {
          process: function(content) {
            var compiled = renderer.renderString(content, "inline.js");
            if (compiled.serverErrors && compiled.serverErrors.length) {
              grunt.fail.fatal("Hashspace compilation " + compiled.serverErrors[0].description);
              return false;
            }
            return compiled.code;
          }
        });
    });
    grunt.file.expand({ cwd: DOCS_PATH }, ['playground/**/*.js']).forEach(function(file) {
      grunt.file.copy(pathifyFromDocs(file),
        GH_PAGES_PATH + file,
        {
          process: function(content) {
            var tranpiled = tranpiler.processString(content, "inline.js");
            return tranpiled.code;
          }
        });
    });
    grunt.verbose.or.ok();

    grunt.task.run(["markdown:samples", "docs:samples-list-build", "atpackager:docs-playground", "uglify:playground"]);

  });


  /* ---------------------
   *  Preparing the build
   * ---------------------
   */
  grunt.registerTask("docs:setup", "Verify that everything is fine before we start", function() {
    if (!grunt.file.exists(GH_PAGES_PATH)) {
      grunt.verbose.or.write(GH_PAGES_PATH + " does not exist, let's create it...");
      grunt.file.mkdir(GH_PAGES_PATH);
      grunt.verbose.or.ok();
      /*grunt.log.error('Make sure you have the hashspace gh-pages branch checked ' +
                    'out at ./hashspace-gh-pages.');
      return false;*/
    }
    grunt.verbose.or.write('Emptying', '"' + GH_PAGES_PATH + '"' , 'folder...');
    grunt.file.expand({ filter: "isFile" }, GH_PAGES_GLOB).forEach(function(file) {
      grunt.file.delete(file, { force: true });
    });
    grunt.verbose.or.ok();
  });


  /* ----------------------
   *  Copying static files
   * ----------------------
   */
  grunt.registerTask("docs:copy-statics", "Copy static files", function() {
    // Moving previously built uglify.js to /libs
    grunt.file.copy("tmp/uglify-js.js", GH_PAGES_PATH + 'libs/uglify-js.js');
    grunt.file.delete('tmp', { force: true });

    grunt.file.copy("./node_modules/noder-js/dist/browser/noder.min.js", GH_PAGES_PATH + 'libs/noder.min.js');
    grunt.file.copy("./node_modules/noder-js/dist/browser/noder.dev.min.js", GH_PAGES_PATH + 'libs/noder.dev.min.js');

    grunt.verbose.or.write("Copying images, css, javascript libs...");
    grunt.file.expand({ cwd: DOCS_PATH, filter: "isFile" }, DOCS_STATICS_GLOB).forEach(function(file) {
      grunt.file.copy(DOCS_PATH + file, GH_PAGES_PATH + file);
    });
    grunt.verbose.or.ok();
  });


  grunt.registerTask("docs:dynamic-version", "Bump new version everywhere needed", function() {
    // TodoMVC index.html
    grunt.file.copy(pathifyFromDocs(DOCS_TODOMVC_INDEX),
      GH_PAGES_PATH + '/' + DOCS_TODOMVC_INDEX,
      {
        process: function(content, filepath) {
          return content.replace(/<%=version%>/g, VERSION);
        }
      });
  });


  /* -------------------
   *  Watching stuff...
   * -------------------
   */
  grunt.registerTask("docs:watch", "Watching any file where local website should be rebuild", function() {
    var watchConfig = grunt.config("watch");

    grunt.log.subhead("Expanding original watch config...");
    watchConfig.docs_markdown = {
      files: WATCH_MARKDOWN_GLOB,
      tasks: ["markdown:docs"]
    };
    grunt.log.writeln("Watching markdown files...");

    watchConfig.docs_less = {
      files: WATCH_LESS_GLOB,
      tasks: ["less:docs"]
    };
    grunt.log.writeln("Watching less files...");

    watchConfig.docs_playground = {
      files: WATCH_SAMPLES_GLOB.concat(WATCH_PLAYGROUND_GLOB),
      tasks: ["docs:playground-build"]
    };
    grunt.log.writeln("Watching '" + DOCS_PATH + "playground/' files...");
    grunt.log.writeln("Watching '" + DOCS_PATH + "samples/' files...");

    grunt.config("watch", watchConfig);

    grunt.task.run(["watch"]);
  });



  /* -------------------------
   *  Public tasks definition
   * -------------------------
   */
  grunt.registerTask("docs:todo-package", [
    "docs:todo-compile",
    "uglify:todomvc"
  ]);

  grunt.registerTask("docs:prepare", [
    "docs:setup",
    "atpackager:uglify",
    "docs:copy-statics",
    "docs:dynamic-version",
    "less:docs",
    "markdown:docs",
    "docs:todo-package"
  ]);

  grunt.registerTask("docs:playground", [
    "package",
    "docs:prepare",
    "docs:playground-build",
    "docs:playground-server"
  ]);

  grunt.registerTask("docs:release", ["docs:prepare", "docs:playground-build"]);
};
