#!/usr/bin/env node

// This script joins js and jade files together and outputs to stdout.
// .js files are passed straight in with a little "compiled from" leader.
// .jade files are compiled into HTML and wrapped in a JS string literal
// assignment, like this: R.dom['jadefilename'] = 'compiledhtml';

var fs = require('fs')
  , jade = require('jade')
  , async = require('async');

var VERSION = '0';
var WRAPPER = process.argv[2];
var THEME = process.argv[3];

var wrapper, header, footer;
var argParts = process.argv.slice(4).map(function(file) {
  if(file.match(/.*\.jade$/))
    return jadePart(file);
  else
    return jsPart(file);
});

async.series([prepare].concat(headerPart).concat(argParts).concat(footerPart));

function prepare(done) {
  VERSION = fs.readFileSync('version').toString().trim();

  wrapper = fs.readFileSync('src/js/wrapper_' + WRAPPER + '.js') + '';
  wrapper = wrapper.replace(/\{VERSION\}/,VERSION);
  wrapper = wrapper.replace(/\{THEME\}/,THEME);

  var idx = wrapper.indexOf('// {BODY}');
  header = wrapper.slice(0, idx - 1);
  footer = wrapper.slice(wrapper.indexOf('\n', idx));

  done();
}

function headerPart(done) {
  process.stdout.write(header);
  done();
}

function footerPart(done) {
  process.stdout.write(footer);
  done();
}

function jsPart(jsfile) {
  return function(done) {
    fs.readFile(jsfile, function(err, data){
      data = ('' + data).replace(/\{VERSION\}/,VERSION);
      process.stdout.write(fileLeader(jsfile) + data.trim());
      done();
    });
  };
}

function jadePart(jadefile) {
  return function(done) {
    var key = jadefile.match('.*/(.+)\\.jade$')[1];
    var jadestr = fs.readFileSync(jadefile);
    var arr = 'R';

    jade.render(jadestr, {filename: jadefile}, function(err,html) {
      html = html.replace(/\n/g,'');
      var jsstr = fileLeader(jadefile);
      jsstr += arr + '.dom[\''+key+'\'] = \'' + html.replace(/\'/g,'\\\'') + '\';';
      process.stdout.write(jsstr);
      done();
    });
  };
}

function fileLeader(file) {
  var jsstr = '';
  jsstr += "\n\n//////////////////////////////////////////////////\n";
  jsstr += "// Compiled from " + file + "\n";
  jsstr += "//////////////////////////////////////////////////\n\n";

  return jsstr;
}
