import _ from 'lodash';
import Immutable from 'immutable';

import { getTimestamp, hasExpired } from './util';

// Key not possible from plain JS
const TIMESTAMPKEY = '__timestamp';
const DATAKEY = '__data';

const StoreCacheMixin = {

  init() {
    this.cache = new Immutable.Map();
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

    dataKey = Immutable.fromJS(dataKey);
    instanceKey = Immutable.fromJS(instanceKey);

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

    dataKey = Immutable.fromJS(dataKey);
    instanceKey = Immutable.fromJS(instanceKey);

    const newData = new Immutable.Map()
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
      this.cache = this.cache.set(dataKey, new Immutable.Map());
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

    dataKey = Immutable.fromJS(dataKey);
    instanceKey = Immutable.fromJS(instanceKey);

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
      this.cache = this.cache.set(dataKey, new Immutable.Map());
    }

    this.cache = this.cache
      .set(
        dataKey,
        this.cache.get(dataKey).set(instanceKey, null)
      );

    return oldData;
  },

  /**
   * Simplified usage
   * @param  {*} dataKey - Which data to fetch from
   * @param  {*} instanceKey - Which instance for that data to fetch
   * @param  {Func<Obj?,Func<Objc>>} handler - Loader and saver callback
   */
  loadData(dataKey, instanceKey, handler) {

    if (! _.isFunction(handler)) {
      throw new Error('Invalid handler: must be a function');
    }

    const data = this.fetchData(dataKey, instanceKey);


    if (! data) {
      return handler(null, this.storeData.bind(this, dataKey, instanceKey));
    }

    return handler(data, _.noop);

  },

};

export default StoreCacheMixin;
