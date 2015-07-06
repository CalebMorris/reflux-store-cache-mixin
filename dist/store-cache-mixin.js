"use strict";

var Map = require("immutable").Map;

var _cache = require("./cache");

var getTimestamp = _cache.getTimestamp;
var hasExpired = _cache.hasExpired;

// Key not possible from plain JS
var TIMESTAMPKEY = { _timestamp: "_timestamp" };
var DATAKEY = { _data: "_data" };

var StoreCacheMixin = {

  init: function init() {
    this.cache = new Map();
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

    var newData = new Map().set(DATAKEY, data).set(TIMESTAMPKEY, getTimestamp());

    var oldData = null;

    if (this.cache.has(dataKey) && this.cache.get(dataKey).has(instanceKey)) {
      oldData = this.cache.get(dataKey).get(instanceKey).get(DATAKEY);
    }

    if (!this.cache.has(dataKey)) {
      this.cache = this.cache.set(dataKey, new Map());
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

    var oldData = null;

    if (this.cache.has(dataKey) && this.cache.get(dataKey).has(instanceKey)) {
      oldData = this.cache.get(dataKey).get(instanceKey).get(DATAKEY);
    }

    if (!this.cache.has(dataKey)) {
      this.cache = this.cache.set(dataKey, new Map());
    }

    this.cache = this.cache.set(dataKey, this.cache.get(dataKey).set(instanceKey, null));

    return oldData;
  } };

module.exports = StoreCacheMixin;