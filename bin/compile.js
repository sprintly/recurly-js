#!/usr/bin/env node

// This script joins js and jade files together and outputs to stdout.
// .js files are passed straight in with a little "compiled from" leader.
// .jade files are compiled into HTML and wrapped in a JS string literal
// assignment, like this: R.dom['jadefilename'] = 'compiledhtml';

var fs = require('fs')
  , jade = require('jade')
  , async = require('async');

var VERSION = '0';
var HEADER = process.argv[2];
var THEME = process.argv[3];

var argParts = process.argv.slice(4).map(function(file) {
  if(file.match(/.*\.jade$/))
    return jadePart(file);
  else
    return jsPart(file);
});

async.series([prepare].concat(headerPart).concat(argParts).concat(footerPart));

function prepare(done) {
  VERSION = fs.readFileSync('version').toString().trim();
  done();
}

function headerPart(done) {

  var header = fs.readFileSync('src/js/header_' + HEADER + '.js') + '';
  header = header.replace(/\{VERSION\}/,VERSION);
  header = header.replace(/\{THEME\}/,THEME);

  process.stdout.write(
    header
  + '\n(function($) {'
  + '\n"use strict";'
  );

  done();
}

function footerPart(done) {
  var str = ((HEADER == 'recurly') ? '\nwindow.Recurly = R;' : '') + '\n})(jQuery);';
  process.stdout.write(str);
  done();
}

function jsPart(jsfile) {
  return function(done) {
    fs.readFile(jsfile, function(err, data){
      data = ('' + data).replace(/\{VERSION\}/,VERSION);
      process.stdout.write(fileLeader(jsfile) + data);
      done();
    });
  };
}

function jadePart(jadefile) {
  return function(done) {
    var key = jadefile.match('.*/(.+)\\.jade$')[1];
    var jadestr = fs.readFileSync(jadefile);
    var arr = (HEADER == 'theme') ? 'Recurly' : 'R';

    jade.render(jadestr, {filename: jadefile}, function(err,html) {
      html = html.replace(/\n/g,'');
      var jsstr = fileLeader(jadefile);
      jsstr += arr + '.dom[\''+key+'\'] = \'' + html.replace(/\'/g,'\\\'') + '\';';
      process.stdout.write(jsstr);
      done();

    });

  };
}

function themeLeader(done) {
  var jsstr = '';
  jsstr += "\n\n//////////////////////////////////////////////////\n";
  jsstr += "// Theme " + THEME + "\n";
  jsstr += "//////////////////////////////////////////////////\n\n";

  return jsstr;
}

function fileLeader(file) {
  var jsstr = '';
  jsstr += "\n\n//////////////////////////////////////////////////\n";
  jsstr += "// Compiled from " + file + "\n";
  jsstr += "//////////////////////////////////////////////////\n\n";

  return jsstr;
}
