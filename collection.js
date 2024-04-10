const { toTinsel, omit } = require('./utils.js');

function hasNestedProperties(object, properties) {
  for (const key of Object.keys(object)) {
    if (properties.indexOf(key) !== -1) {
      return true;
    }
    if (object[key] && ((typeof object[key]) === 'object')) {
      if (hasNestedProperties(object[key], properties)) {
        return true;
      }
    }
  }
  return false;
}

module.exports = function (baseClass) {
  class TinselCollection extends baseClass {
    get __emulated() {
      return true;
    }

    // conversion APIs
    // aggregate(pipeline, options) {
    //   return super.aggregate(pipeline, options)[toLegacy]();
    // }
    aggregate(op1 /* , op2... */, callback) {
      const last = arguments.length && arguments[arguments.length - 1];
      // Bring back support for operations as a variable number of
      // parameters rather than as an array
      if (Array.isArray(op1)) {
        const options = arguments[1];
        if (options && ((typeof options) === 'object')) {
          if (options.cursor) {
            // Behaves 100% like 3.x, so pass straight through
            return super.aggregate(...Array.prototype.slice(arguments));
          }
        }
        // Normal: array of aggregate stages
        if ((typeof last) === 'function') {
          // 2.x driver took a callback or returned a promise for results directly,
          // 3.x driver always returns a cursor so convert back to results
          return super.aggregate(op1).toArray(last);
        } else {
          // Both 2.x and 3.x return a cursor in the absence of a callback,
          // despite documentation implying you must explicitly ask
          // for a cursor
          return super.aggregate(op1);
        }
      } else {
        // Positional arguments as aggregate stages (2.x supports, 3.x does not)
        if ((typeof last) === 'function') {
          // 2.x driver supported passing a callback rather than
          // returning a cursor, 3.x driver does not
          return super.aggregate(...Array.prototype.slice.call(arguments, 0, arguments.length - 1)).toArray(last);
        } else {
          // Both 2.x and 3.x return a cursor in the absence of a callback,
          // despite documentation implying you must explicitly ask
          // for a cursor
          return super.aggregate(...Array.prototype.slice.call(arguments));
        }
      }
    };

    // initializeUnorderedBulkOp(options) {
    //   return super.initializeUnorderedBulkOp(options)[toLegacy]();
    // }
    //
    // initializeOrderedBulkOp(options) {
    //   return super.initializeOrderedBulkOp(options)[toLegacy]();
    // }

    find(filter, projection) {
      const cursor = super.find(filter)[toTinsel]();
      if (projection) {
        return cursor.project(projection);
      }

      return cursor;
    }

    // listIndexes(options) {
    //   return super.listIndexes(options)[toLegacy]();
    // }
    //
    // watch(pipeline, options) {
    //   return super.watch(pipeline, options)[toLegacy]();
    // }

    // Before this module existed, Apostrophe patched this into
    // the mongodb collection prototype
    findWithProjection(filter, projection) {
      return this.find(filter, projection);
    }

    findOne(criteria, projection, callback) {
      if (projection && ((typeof projection) === 'object')) {
        if (callback) {
          return super.findOne(criteria, projection, callback);
        } else {
          return super.findOne(criteria, projection);
        }
      } else {
        callback = projection;
        if (callback) {
          return super.findOne(criteria, callback);
        } else {
          return super.findOne(criteria);
        }
      }
    };

    // ensureIndex is deprecated but createIndex has exactly the
    // same behavior

    ensureIndex(fieldOrSpec, options, callback) {
      return this.createIndex(fieldOrSpec, options, callback);
    };

    insert(docs, options, callback) {
      return super.insert(docs, options, callback);
    };

    remove(selector, options, callback) {
      return super.remove(selector, options, callback);
    };

    update(selector, doc, _options, callback) {
      const takesCallback = (typeof arguments[arguments.length - 1]) === 'function';
      const options = _options && ((typeof _options) === 'object') ? _options : {};
      let multi;
      let atomic;
      multi = options.multi;
      if (doc._id) {
        // Cannot match more than one, and would confuse our
        // don't-repeat-the-ids algorithm if we tried to use it
        multi = false;
      }
      let i;
      const keys = Object.keys(doc);
      let _ids;
      let nModified;
      for (i = 0; (i < keys.length); i++) {
        if (keys[i].substring(0, 1) === '$') {
          atomic = true;
          break;
        }
      }
      if (atomic) {
        // Undeprecated equivalents
        if (multi) {
          arguments[2] = omit(arguments[2], [ 'multi' ]);
          return this.updateMany(...Array.prototype.slice.call(arguments));
        } else {
          return this.updateOne(...Array.prototype.slice.call(arguments));
        }
      } else {

        if (multi) {

          arguments[2] = omit(arguments[2], [ 'multi' ]);

          // There is no replaceMany, so we have to do this repeatedly until
          // we run out of matching documents. We also have to get all of the
          // relevant _ids up front so we don't repeat them. It is a royal
          // pain in the tuckus.
          //
          // Fortunately it is rarely used.

          const collection = this;
          const promise = getIds(collection).then(function(docs) {
            _ids = docs.map(function(doc) {
              return doc._id;
            });
            nModified = 0;
            return attemptMulti(collection);
          }).then(function() {
            return completeMulti(null, {
              result: {
                nModified: nModified,
                ok: 1
              }
            });
          }).catch(completeMulti);

          if (takesCallback) {
            return null;
          } else {
            return promise;
          }

        } else {
          return this.replaceOne(...Array.prototype.slice.call(arguments));
        }
      }

      function getIds(collection) {
        return collection.find(selector).project({ _id: 1 }).toArray();
      }

      function attemptMulti(collection) {
        if (!_ids.length) {
          return null;
        }
        const _selector = Object.assign({}, selector, {
          _id: _ids.shift()
        });
        return collection.replaceOne(_selector, doc, options).then(function(status) {
          nModified += status.result.nModified;
          return attemptMulti(collection);
        }).catch(function(err) {
          return completeMulti(err);
        });
      }

      function completeMulti(err, response) {
        if (takesCallback) {
          return callback(err, response);
        } else {
          if (err) {
            throw err;
          } else {
            return response;
          }
        }
      }

    };

    count(query, options, callback) {
      if (arguments.length === 2) {
        if ((typeof options) === 'function') {
          callback = options;
          options = {};
        }
      } else if (arguments.length === 1) {
        if ((typeof query) === 'function') {
          callback = query;
          options = {};
          query = {};
        } else {
          options = {};
        }
      } else if (!arguments.length) {
        options = {};
        query = {};
      }
      if (hasNestedProperties(query, [ '$where', '$near', '$nearSphere' ])) {
        // Queries not supported by countDocuments must be turned into a
        // find() that actually fetches the ids (minimum projection)
        // and returns the number of documents
        const cursor = this.find(query);
        if (options.limit !== undefined) {
          cursor.limit(options.limit);
        }
        if (options.skip !== undefined) {
          cursor.skip(options.skip);
        }
        if (options.hint !== undefined) {
          cursor.hint(options.hint);
        }
        const p = cursor.project({ _id: 1 }).toArray().then(function(objects) {
          if (callback) {
            callback(null, objects.length);
            return null;
          } else {
            return objects.length;
          }
        }).catch(function(e) {
          if (callback) {
            callback(e);
            return null;
          } else {
            throw e;
          }
        });
        if (!callback) {
          return p;
        }
      } else {
        const p = this.countDocuments(query, options).then(function(count) {
          if (callback) {
            callback(null, count);
            return null;
          } else {
            return count;
          }
        }).catch(function(e) {
          if (callback) {
            callback(e);
            return null;
          } else {
            throw e;
          }
        });
        if (!callback) {
          return p;
        }
      }
    };
  }

  Object.defineProperty(
    baseClass.prototype,
    toTinsel,
    {
      enumerable: false,
      value: function () {
        return Object.setPrototypeOf(this, TinselCollection.prototype);
      }
    }
  );

  return TinselCollection;
};
