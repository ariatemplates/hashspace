function createElement(str) {
  var holder = document.createElement("div");
  holder.innerHTML = str;
  return holder.firstChild;
}

module.exports = function plunkerExport(event, playground) {
  var form = createElement('<form style="display: none;" method="post" action="http://plnkr.co/edit/#/?p=preview" target="_blank"></form>');
  var addField = function(name, value) {
    var input = createElement('<input type="hidden" name="' + name + '">');
    input.setAttribute('value', value);
    form.appendChild(input);
  };


  addField('description', playground.data.sampleTitle + "\n" + window.location);
  addField('tags[]', "hashspace");
  addField('files[index.html]', [
    '<!doctype html>',
    '<html>',
    '  <head>',
    '    <link rel="stylesheet" type="text/css" href="http://hashspace.ariatemplates.com/css/samples.css" />',
    '    <script src="http://noder-js.ariatemplates.com/dist/v1.6.0/noder.dev.js" type="text/javascript">',
    '    {',
    '      packaging: {',
    '        preprocessors: [{',
    '          pattern: /\\.hsp$/,',
    '          module: "hsp/compiler/compile"',
    '        }, {',
    '          pattern: /\\.js$/,',
    '          module: "hsp/transpiler/transpile"',
    '        }]',
    '      }',
    '    }',
    '    </script>',
    '    <script src="http://hashspace.ariatemplates.com/dist/' + window.hashspace_version + '/hashspace-noder.js"></script>',
    '    <script src="http://hashspace.ariatemplates.com/dist/' + window.hashspace_version + '/hashspace-noder-compiler.js"></script>',
    '  </head>',
    '  <body>\n',
    '    <div id="sample"></div>',
    '',
    '    <script type="application/x-noder">',
    '      var sample = require("./sample.hsp"),',
    '          template = sample.template,',
    '          data = sample.data || [];',
    '',
    '      if (typeof data === "function") {',
    '        data = data.call(sample);',
    '      }',
    '      template.apply(sample, data).render("sample");',
    '    </script>',
    '  </body>',
    '</html>'
  ].join('\n'));
  addField('files[sample.hsp]', [
    playground.editor.getValue()
  ].join('\n'));

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
  event.preventDefault();
};
