'use strict';
var fs = require('fs');
var logger = require('./logger');

function startServer(app) {
  return function(callback) {
    var lockFile = app.get('lockFile');
    fs.readFile(lockFile, 'utf8', function(e, d) {
      if (!e && d) {
        logger('Lock found. Refusing to start server.');
        return;
      }
      var server = app.listen(app.get('port'), function () {
        var host = server.address().address;
        var port = server.address().port;

        logger('App listening at http://%s:%s', host, port);
        callback();
      });
      app.set('server', server);
    });
  };
}

module.exports = startServer;
