'use strict';
var Targz = require('tar.gz');
var logger = require('./logger');

function compressDir(app) {
  return function(callback) {
    logger('Starting compressDir');
    var file = app.get('file');
    new Targz().compress('data', file, callback);
  };
}

module.exports = compressDir;
