'use strict';

module.exports = function(app) {
  var lockKey = app.get('lockKey');
  var redis = app.get('redis');
  app.use(function (req, res, next) {
    if (req.url === '/deploy') {
      next();
      return;
    }
    redis.get(lockKey, function(e, v) {
      if (e) {
        throw e;
      }
      if (v) {
        res.status(503).end('Sorry!');
      }
      else {
        next();
      }
    });
  });
};
