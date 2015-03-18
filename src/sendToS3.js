'use strict';

var logger = require('./logger');

function sendtoS3(app) {
  return function(callback) {
    var client = app.get('client');
    var file = app.get('file');
    var params = {
      localFile: file,
      s3Params: {
        Bucket: 'herokueiriktest',
        Key: file
      }
    };
    logger('Starting upload');
    var uploader = client.uploadFile(params);
    uploader.on('error', function(err) {
      logger('unable to upload:', err.stack);
      callback(err);
    });
    uploader.on('progress', function() {
      logger('progress');
    });
    uploader.on('end', function() {
      logger('done uploading');
      callback();
    });
  };
}

module.exports = sendtoS3;
