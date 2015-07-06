"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _ = _interopRequire(require("lodash"));

var Immutable = _interopRequire(require("immutable"));

var _util = require("./util");

var getTimestamp = _util.getTimestamp;
var hasExpired = _util.hasExpired;

// Key not possible from plain JS
var TIMESTAMPKEY = "__timestamp";
var DATAKEY = "__data";

var StoreCacheMixin = {

  init: function init() {
    this.cache = new Immutable.Map();
  },

  /*
    @param {Moment} duration - moment.duration of how long until expired
  */
  setExpirationDuration: function setExpirationDuration(duration) {
    this._ttl = duration;
  },

  /*
    Fetches data from cache and handles expiration and consolidation
    @param {*} dataKey - Which data to fetch from
    @param {*} instanceKey - Which instance for that data to fetch
    @option {Moment} duration - moment duration for specific key
  */
  fetchData: function fetchData(dataKey, instanceKey, duration) {
    if (!dataKey || !instanceKey) {
      throw new Error("Invalid usage: function(dataKey, instanceKey)");
    }

    dataKey = Immutable.fromJS(dataKey);
    instanceKey = Immutable.fromJS(instanceKey);

    if (this.cache.has(dataKey) && this.cache.get(dataKey).has(instanceKey) && !hasExpired(this.cache.get(dataKey).get(instanceKey).get(TIMESTAMPKEY), duration || this._ttl)) {
      return this.cache.get(dataKey).get(instanceKey).get(DATAKEY);
    }

    return null;
  },

  /*
    Stores data in cache with timestamp
    @param {*} dataKey - Which data to fetch from
    @param {*} instanceKey - Which instance for that data to fetch
    @returns {Map|Null} - Any overwritten data
  */
  storeData: function storeData(dataKey, instanceKey, data) {
    if (!dataKey || !instanceKey) {
      throw new Error("Invalid usage: function(dataKey, instanceKey, data)");
    }

    dataKey = Immutable.fromJS(dataKey);
    instanceKey = Immutable.fromJS(instanceKey);

    var newData = new Immutable.Map().set(DATAKEY, data).set(TIMESTAMPKEY, getTimestamp());

    var oldData = null;

    if (this.cache.has(dataKey) && this.cache.get(dataKey).has(instanceKey)) {
      oldData = this.cache.get(dataKey).get(instanceKey).get(DATAKEY);
    }

    if (!this.cache.has(dataKey)) {
      this.cache = this.cache.set(dataKey, new Immutable.Map());
    }

    this.cache = this.cache.set(dataKey, this.cache.get(dataKey).set(instanceKey, newData));

    return oldData;
  },

  /*
    Clears data from cache and handles expiration and consolidation
    @param {*} dataKey - Which data to fetch from
    @param {*} instanceKey - Which instance for that data to fetch
    @returns {Map|Null} - Any overwritten data
  */
  clearData: function clearData(dataKey, instanceKey) {
    if (!dataKey || !instanceKey) {
      throw new Error("Invalid usage: function(dataKey, instanceKey, data)");
    }

    dataKey = Immutable.fromJS(dataKey);
    instanceKey = Immutable.fromJS(instanceKey);

    var oldData = null;

    if (this.cache.has(dataKey) && this.cache.get(dataKey).has(instanceKey)) {
      oldData = this.cache.get(dataKey).get(instanceKey).get(DATAKEY);
    }

    if (!this.cache.has(dataKey)) {
      this.cache = this.cache.set(dataKey, new Immutable.Map());
    }

    this.cache = this.cache.set(dataKey, this.cache.get(dataKey).set(instanceKey, null));

    return oldData;
  },

  /**
   * Simplified usage
   * @param  {*} dataKey - Which data to fetch from
   * @param  {*} instanceKey - Which instance for that data to fetch
   * @param  {Func<Obj?,Func<Objc>>} handler - Loader and saver callback
   */
  loadData: function loadData(dataKey, instanceKey, handler) {

    if (!_.isFunction(handler)) {
      throw new Error("Invalid handler: must be a function");
    }

    var data = this.fetchData(dataKey, instanceKey);

    if (!data) {
      return handler(null, this.storeData.bind(this, dataKey, instanceKey));
    }

    return handler(data, _.noop);
  } };

module.exports = StoreCacheMixin;