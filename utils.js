const toTinsel = Symbol.for('@@mdb.callbacks.toTinsel');

const omit = function (obj, keys) {
  const n = {};
  Object.keys(obj).forEach(function(key) {
    if (keys.indexOf(key) === -1) {
      n[key] = obj[key];
    }
  });

  return n;
}

module.exports = {
  toTinsel,
  omit
};
