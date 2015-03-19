'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
var port = process.env.PORT || 3000;
app.set('port', port);
app.set('db', null);
app.set('server', null);
var async = require('async');
var fs = require('fs');
var s3 = require('s3');
var client = s3.createClient({
  maxAsyncS3: 3,
  s3RetryCount: 3,
  s3RetryDelay: 1000,
  multipartUploadThreshold: 20971520,
  multipartUploadSize: 15728640,
  s3Options: {
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET
  }
});
app.set('client', client);

var file = 'data.tar.gz';
app.set('file', file);
app.set('lockFile', './lock');
var logger = require('./src/logger');
var startServer = require('./src/startServer')(app);
var restartServer = require('./src/restartServer')(app);
var downloadFromS3 = require('./src/downloadFromS3')(app);
var extractFile = require('./src/extractFile')(app);
var compressDir = require('./src/compressDir')(app);
var deleteFile = require('./src/deleteFile')(app);
var sendToS3 = require('./src/sendToS3')(app);

app.get('/', function(request, response) {
  response.send('Hello World!');
});

app.get('/shutdown', function(req, res) {
  res.send('hello world');
  var lockFile = app.get('lockFile');
  fs.writeFile(lockFile, 'true');
  process.nextTick(function() {
    throw new Error('Shutdown requested');
  });
});

app.get('/data', function(req, res) {
  var data = [];
  var _callback = function(e, v) {
    res.json(v);
  };
  var db = app.get('db');
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
  var db = app.get('db');
  db.put(data.key, data.value, function(e) {
    if (e) {
      logger('Error happened', e);
      res.status(500).end();
      return;
    }
    res.status(201).end();
  });
});

async.series([startServer, downloadFromS3, extractFile, deleteFile, restartServer], function(err) {
  if (err) {
    logger('Had en error in starting up. This is it: ', err);
  }
  logger('Server running');
});

function initBackup() {
  logger('Starting backup routine');
  async.series([compressDir, sendToS3, deleteFile], function(err) {
    if (err) {
      logger('Error: ', err);
    }
    logger('Backup finished. Exiting.');
    logger('');
    process.exit();
  });
}

process.on('uncaughtException', function(e) {
  console.log(e);
  console.log(e.stack);
  logger('Caught uncaughtException');
  process.nextTick(initBackup);
});

process.on('SIGTERM', function() {
  logger('Caught SIGTERM.');
  process.nextTick(initBackup);
});

process.on('SIGINT', function() {
  logger('Caught SIGINT.');
  process.nextTick(initBackup);
});
