import moment from 'moment';

const CacheTTL = moment.duration(5, 'minutes');

function getTimestamp() {
  return moment.utc();
}

function hasExpired(timestamp, ttl = CacheTTL) {
  return getTimestamp().subtract(ttl) > timestamp;
}

export default {
  getTimestamp,
  hasExpired,
};
