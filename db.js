const { toTinsel } = require('./utils.js');

module.exports = function (baseClass) {
  class TinselDb extends baseClass {
    get __emulated() {
      return true;
    }

    collection(name, options, callback) {
      // return super.collection(name, options, callback);
      if (arguments.length === 1) {
        return super.collection(name)[toTinsel]();
      }
      if (arguments.length === 2) {
        if ((typeof options) !== 'function') {
          return super.collection(name, options)[toTinsel]();
        } else {
          callback = options;
          return super.collection(name, {}, function(err, collection) {
            if (err) {
              return callback(err);
            }
            const tinselled = collection[toTinsel]();
            return callback(null, tinselled);
          });
        }
      }

      return super.collection(name, options, function(err, collection) {
        if (err) {
          return callback(err);
        }
        return callback(null, collection[toTinsel]());
      });
    };

    // Custom-wrap the "collection" method of db objects
    // const superCollection = db.collection;

    // Reintroduce the "db" method of db objects, for talking to a second
    // database via the same connection
    db(name) {
      return this.client.db(name);
    };

    // Reintroduce the "close" method of db objects, yes it closes
    // the entire client, did that before too
    close(force, callback) {
      return this.client.close(force, callback);
    };
  }

  Object.defineProperty(
    baseClass.prototype,
    toTinsel,
    {
      enumerable: false,
      value: function () {
        return Object.setPrototypeOf(this, TinselDb.prototype);
      }
    }
  );

  return TinselDb;
};
