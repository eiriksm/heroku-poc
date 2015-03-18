'use strict';
var logger = require('./logger');
function downloadFromS3(app) {
  return function(callback) {
    logger('Starting download from s3');
    var file = app.get('file');
    var client = app.get('client');
    var params = {
      localFile: file,
      s3Params: {
        Bucket: 'herokueiriktest',
        Key: file
      }
    };
    var downloader = client.downloadFile(params);
    downloader.on('error', function(err) {
      logger('Had an error in downlading from s3. Error is ', err);
      callback();
    });
    downloader.on('progress', function() {
      logger('progress');
    });
    downloader.on('end', function() {
      logger('done downloading');
      callback();
    });
  };
}

module.exports = downloadFromS3;
