'use strict';
var fs = require('fs');
var Targz = require('tar.gz');
var logger = require('./logger');

function extractFile(app) {
  var file = app.get('file');
  return function(callback) {
    fs.exists(file, function(exists) {
      if (exists) {
        logger('Extracting ' + file);
        new Targz().extract(file, '.', callback);
      }
      else {
        logger('No file with the name ' + file + ' found. Moving on.');
        callback();
      }
    });
  };
}

module.exports = extractFile;
