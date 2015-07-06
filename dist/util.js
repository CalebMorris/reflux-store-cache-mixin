"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var moment = _interopRequire(require("moment"));

var CacheTTL = moment.duration(5, "minutes");

function getTimestamp() {
  return moment.utc();
}

function hasExpired(timestamp) {
  var ttl = arguments[1] === undefined ? CacheTTL : arguments[1];

  return getTimestamp().subtract(ttl) > timestamp;
}

module.exports = {
  getTimestamp: getTimestamp,
  hasExpired: hasExpired };