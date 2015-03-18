'use strict';

var logger = require('./logger');
var fs = require('fs');

function deleteFile(app) {
  return function(callback) {
    var file = app.get('file');
    logger('Deleting file', file);
    fs.unlink(file, function () {
      callback();
    });
  };
}

module.exports = deleteFile;
