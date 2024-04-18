module.exports = function (BaseClass) {
  function TinselBinary() {
    if (!(this instanceof BaseClass)) {
      return new BaseClass(...arguments);
    }
  }

  return TinselBinary;
};
