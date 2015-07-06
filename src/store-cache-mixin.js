import { Map } from 'immutable';

import { getTimestamp, hasExpired } from './cache';

// Key not possible from plain JS
const TIMESTAMPKEY = { _timestamp : '_timestamp' };
const DATAKEY = { _data : '_data' };

const StoreCacheMixin = {

  init() {
    this.cache = new Map();
  },

  /*
    @param {Moment} duration - moment.duration of how long until expired
  */
  setExpirationDuration(duration) {
    this._ttl = duration;
  },

  /*
    Fetches data from cache and handles expiration and consolidation
    @param {*} dataKey - Which data to fetch from
    @param {*} instanceKey - Which instance for that data to fetch
    @option {Moment} duration - moment duration for specific key
  */
  fetchData(dataKey, instanceKey, duration) {
    if (! dataKey || ! instanceKey) {
      throw new Error('Invalid usage: function(dataKey, instanceKey)');
    }

    if (
      this.cache.has(dataKey) &&
      this.cache.get(dataKey).has(instanceKey) &&
      ! hasExpired(
        this.cache.get(dataKey).get(instanceKey).get(TIMESTAMPKEY), duration || this._ttl
      )
    ) {
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
  storeData(dataKey, instanceKey, data) {
    if (! dataKey || ! instanceKey) {
      throw new Error('Invalid usage: function(dataKey, instanceKey, data)');
    }

    const newData = new Map()
      .set(DATAKEY, data)
      .set(TIMESTAMPKEY, getTimestamp());

    let oldData = null;

    if (
      this.cache.has(dataKey) &&
      this.cache.get(dataKey).has(instanceKey)
    ) {
      oldData = this.cache
        .get(dataKey)
        .get(instanceKey)
        .get(DATAKEY);
    }

    if (! this.cache.has(dataKey)) {
      this.cache = this.cache.set(dataKey, new Map());
    }

    this.cache = this.cache
      .set(
        dataKey,
        this.cache.get(dataKey).set(instanceKey, newData)
      );

    return oldData;
  },

  /*
    Clears data from cache and handles expiration and consolidation
    @param {*} dataKey - Which data to fetch from
    @param {*} instanceKey - Which instance for that data to fetch
    @returns {Map|Null} - Any overwritten data
  */
  clearData(dataKey, instanceKey) {
    if (! dataKey || ! instanceKey) {
      throw new Error('Invalid usage: function(dataKey, instanceKey, data)');
    }

    let oldData = null;

    if (
      this.cache.has(dataKey) &&
      this.cache.get(dataKey).has(instanceKey)
    ) {
      oldData = this.cache
        .get(dataKey)
        .get(instanceKey)
        .get(DATAKEY);
    }

    if (! this.cache.has(dataKey)) {
      this.cache = this.cache.set(dataKey, new Map());
    }

    this.cache = this.cache
      .set(
        dataKey,
        this.cache.get(dataKey).set(instanceKey, null)
      );

    return oldData;
  },

};

export default StoreCacheMixin;
