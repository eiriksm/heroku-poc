'use strict';
var logger = require('./logger');
var levelup = require('levelup');

function restartServer(app) {
  var startServer = require('./startServer')(app);
  return function(callback) {
    var server = app.get('server');
    var db = app.get('db');
    logger('Restarting server');


    db = levelup('./data');
    app.set('db', db);
    server.close(function() {
      logger('Stopped server');
      startServer(callback);
    });
  };
}

module.exports = restartServer;
