const URL = require('url').URL;
const { toTinsel, omit } = require('./utils.js');

function reencode(s) {
  return encodeURIComponent(decodeURIComponent(s));
}

function parseUri(uri) {
  let parsed;
  try {
    parsed = new URL(uri);
  } catch (e) {
    // MongoDB driver tolerates URIs that the WHATWG parser will not,
    // deal with the common cases
    // eslint-disable-next-line no-useless-escape
    const matches = uri.match(/mongodb:\/\/(([^:]+):([^@]+)@)?([^\/]+)(\/([^?]+))?(\?(.*))?$/);
    const newUri = 'mongodb://' + (matches[1] ? (reencode(matches[2]) + ':' + reencode(matches[3]) + '@') : '') + reencode(matches[4]) + (matches[5] ? ('/' + matches[6]) : '') + (matches[7] ? ('?' + matches[8]) : '');
    parsed = new URL(newUri);
  }
  return parsed;
};

module.exports = function (baseClass) {
  class TinselMongoClient extends baseClass {
    get __emulated() {
      return true;
    }

    static connect(uri, options, callback) {
      if ((!callback) && ((typeof options) === 'function')) {
        callback = options;
        options = {};
      }
      if (!options) {
        options = {};
      }
      if (options.useUnifiedTopology) {
        // Per warnings these three options have no meaning with the
        // unified topology. Swallow them so that apostrophe 2.x doesn't
        // need to directly understand a mongodb 3.x driver option
        options = omit(options, [ 'autoReconnect', 'reconnectTries', 'reconnectInterval' ]);
      }
      if ((typeof callback) === 'function') {
        return super.connect(uri, options, function(err, client) {
          if (err) {
            return callback(err);
          }
          const parsed = parseUri(uri);
          try {
            return callback(null, client.db(parsed.pathname.substr(1)));
          } catch (e) {
            return callback(e);
          }
        });
      }
      return super.connect(uri, options).then(function(client) {
        const parsed = parseUri(uri);
        return client.db(parsed.pathname.substr(1));
      });
    }

    db(dbName, options) {
      return super.db(dbName, options)[toTinsel]();
    }
  }

  return TinselMongoClient;
};

// Convert (err, client) back to (err, db) in both callback driven
// and promisified flavors

// TODO: also wrap legacy db.open? We never used it. See:
// See https://github.com/mongodb/node-mongodb-native/blob/3.0/CHANGES_3.0.0.md
