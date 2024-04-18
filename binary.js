const { toTinsel } = require('./utils.js');

module.exports = function (baseClass) {
  class TinselBinary extends baseClass {
    get __emulated() {
      return true;
    }
  }

  const TinselBinaryProxy = new Proxy(
    Reflect.construct.bind(null, TinselBinary),
    {
      get(target, propertyKey) {
        // access static
        return Reflect.get(TinselBinary, propertyKey);
      },
      set(target, propertyKey, value) {
        // access static
        return Reflect.set(TinselBinary, propertyKey, value);
      },
      apply(target, thisArgument, argumentsList) {
        // make the constructor work
        return target({
          ...argumentsList,
          length: argumentsList.length
        });
      }
    }
  );

  Object.defineProperty(
    baseClass.prototype,
    toTinsel,
    {
      enumerable: false,
      value: function () {
        return Object.setPrototypeOf(this, TinselBinaryProxy.prototype);
      }
    }
  );

  return TinselBinaryProxy;
};
