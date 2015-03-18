'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
var fs = require('fs');
var async = require('async');
var s3 = require('s3');
var levelup = require('levelup');
var db;

var targz = require('tar.gz');

var file = 'data.tar.gz';

var client = s3.createClient({
  maxAsyncS3: 3,     // this is the default
  s3RetryCount: 3,    // this is the default
  s3RetryDelay: 1000, // this is the default
  multipartUploadThreshold: 20971520, // this is the default (20 MB)
  multipartUploadSize: 15728640, // this is the default (15 MB)
  s3Options: {
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET
  }
});

app.get('/', function(request, response) {
  response.send('Hello World!');
});

app.get('/shutdown', function(req, res) {
  res.send('hello world');
  process.nextTick(function() {
    throw new Error('waterr');
  });
});

app.get('/data', function(req, res) {
  var data = [];
  var _callback = function(e, v) {
    res.json(v);
  };
  var s = db.createReadStream({
    gte: 'a',
    lte: 'z'
  });
  s.on('data', function(d) {
    data.push(d);
  });
  s.on('end', function() {
    _callback(null, data);
  });
  s.on('error', function(e) {
    _callback(e);
  });
});

app.post('/data', function(req, res) {
  var data = req.body;
  if (!data.key) {
    res.status(400).end();
    return;
  }
  db.put(data.key, data.value, function(e) {
    if (e) {
      logger('Error happened', e);
      res.status(500).end();
      return;
    }
    res.status(201).end();
  });
});

var port = process.env.PORT || 3000;
var server;

function startServer(callback) {
  server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;

    logger('Example app listening at http://%s:%s', host, port);
    callback();
  });
}

function restartServer(callback) {
  logger('Restarting server');

  db = levelup('./data');
  server.close(function() {
    logger('Stopped server');
    startServer(callback);
  })
}

function logger() {
  console.log.apply(console, arguments);
}

function downloadFromS3(callback) {
  logger('Starting download from s3');
  var params = {
    localFile: file,
    s3Params: {
      Bucket: 'herokueiriktest',
      Key: file
    }
  };
  var uploader = client.downloadFile(params);
  uploader.on('error', function(err) {
    callback();
  });
  uploader.on('progress', function() {
    logger('progress');
  });
  uploader.on('end', function() {
    logger('done downloading');
    callback();
  });
}

function extractFile(callback) {
  fs.exists(file, function(exists) {
    if (exists) {
      logger('Extracting ' + file);
      new targz().extract(file, '.', callback);
    }
    else {
      logger('No file with the name ' + file + ' found. Moving on.');
      callback();
    }
  });
}

async.series([startServer, downloadFromS3, extractFile, deleteFile, restartServer], function(err) {
  logger('Server running');
});

function compressDir(callback) {
  new targz().compress('data', file, callback);
}

function sendtoS3(callback) {
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
}

function deleteFile(callback) {
  logger('Deleting file', file);
  fs.unlink(file, function () {
    callback()
  });
}

function initBackup() {
  logger('Starting backup routine');
  async.series([compressDir, sendtoS3, deleteFile], function(err) {
    if (err) {
      logger('Error: ', err);
    }
    logger('Backup finished. Exiting.');
    process.exit();
  });
}

process.on('uncaughtException', function(e) {
  console.log(e);
  console.log(e.stack);
  logger('Caught uncaughtException');
  initBackup();
});

process.on('SIGTERM', function() {
  logger('Caught SIGTERM.');
  initBackup();
});
