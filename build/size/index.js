var mindthebulk = require('mind-the-bulk');
var humanize = require('humanize');
var Table = require('cli-table');

var args = process.argv.slice(2);

if (!args.length) {
    throw new Error('You need to provide file paths to measure');
}

var sizes = mindthebulk(args);

//pretty-print results
var table = new Table({
    head: ['', 'initial', 'min', 'min+gzip'],
    colWidths: [40, 15, 15, 15],
    colAligns: ['left', 'right', 'right', 'right']
});

sizes.forEach(function (size) {
    table.push([
        size.file,
        humanize.filesize(size.raw),
        humanize.filesize(size.min),
        humanize.filesize(size.gzip)
    ]);
});

console.log(table.toString());