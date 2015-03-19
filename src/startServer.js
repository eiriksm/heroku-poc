'use strict';
var fs = require('fs');
var logger = require('./logger');
var levelup = require('levelup');

function startServer(app) {
  return function(callback) {
    var db = app.get('db');
    logger('Starting db');

    db = levelup('./data');
    app.set('db', db);
    var server = app.listen(app.get('port'), function () {
      var host = server.address().address;
      var port = server.address().port;

      logger('App listening at http://%s:%s', host, port);
      callback();
    });
    app.set('server', server);
  };
}

module.exports = startServer;
