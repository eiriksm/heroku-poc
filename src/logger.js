'use strict';
function logger() {
  console.log.apply(console, arguments);
}

module.exports = logger;
