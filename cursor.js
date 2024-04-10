const { toTinsel } = require('./utils.js');

module.exports = function (baseClass) {
  class TinselCursor extends baseClass {
    get __emulated() {
      return true;
    }

    nextObject(callback) {
      return super.next(callback);
    }
  }

  Object.defineProperty(
    baseClass.prototype,
    toTinsel,
    {
      enumerable: false,
      value: function () {
        return Object.setPrototypeOf(this, TinselCursor.prototype);
      }
    }
  );

  return TinselCursor;
};
