'use strict';

var logger = require('./logger');

function startServer(app) {
  return function(callback) {
    var server = app.listen(app.get('port'), function () {
      var host = server.address().address;
      var port = server.address().port;

      logger('Example app listening at http://%s:%s', host, port);
      callback();
    });
    app.set('server', server);
  };
}

module.exports = startServer;
