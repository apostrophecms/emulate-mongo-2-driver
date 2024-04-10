const mongodb = require('@apostrophecms/emulate-mongo-3-driver');
const collection = require('./collection.js');
const cursor = require('./cursor.js');
const db = require('./db.js');
const mongoClient = require('./mongo-client.js');

const emulateClasses = new Map([
  [ 'FindCursor', cursor ],
  [ 'AggregationCursor', cursor ],
  [ 'Collection', collection ],
  [ 'Db', db ],
  [ 'MongoClient', mongoClient ]
]);

const entries = Object.entries(mongodb);
for (const [ mongodbExportName, mongodbExportValue ] of entries) {
  const emulateClass = emulateClasses.get(mongodbExportName);
  if (emulateClass != null) {
    const patchedClass = emulateClass(mongodbExportValue);
    Object.defineProperty(
      module.exports,
      mongodbExportName,
      {
        enumerable: true,
        get: function () {
          return patchedClass;
        }
      }
    );
  } else {
    Object.defineProperty(
      module.exports,
      mongodbExportName,
      {
        enumerable: true,
        get: function () {
          return mongodbExportValue;
        }
      }
    );
  }
}

// TODO: https://github.com/mongodb/node-mongodb-native/blob/master/CHANGES_3.0.0.md#bulkwriteresult--bulkwriteerror (we don't use it)
// https://github.com/mongodb/node-mongodb-native/blob/master/CHANGES_3.0.0.md#mapreduce-inlined-results (we don't use it)
// See others on that page

// function decorate(obj, mongodbExportName = '') {
//   class Tinsel extends obj {
//     _emulated = true
//   };
//
//   Object.defineProperty(
//     obj.prototype,
//     toEmulateLegacy,
//     {
//       enumerable: false,
//       value: function () {
//         return Object.setPrototypeOf(this, Tinsel.prototype);
//       }
//     }
//   );
//
//   if (mongodbExportName) {
//     const patchedClass = Tinsel;
//     Object.defineProperty(
//       module.exports,
//       mongodbExportName,
//       {
//         enumerable: true,
//         get: function () {
//           return patchedClass;
//         }
//       }
//     );
//   }
//
//   return Tinsel;
//
//   const tinsel = {
//     __emulated: true
//   };
//
//   const neverDecorate = [
//     'apply', 'call', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'arguments', 'caller', 'callee', 'super_', 'constructor', 'bind', 'pipesCount'
//   ];
//
//   // Other possible bad things to decorate, but I think I
//   // got all the functions:
//   //
//   // 'length',               'name',
//   // 'prototype',            'super_',
//   // 'connect',              'arguments',
//   // 'caller',               'constructor',
//   // 'apply',                'bind',
//   // 'call',                 'toString',
//   // '__defineGetter__',     '__defineSetter__',
//   // 'hasOwnProperty',       '__lookupGetter__',
//   // '__lookupSetter__',     'isPrototypeOf',
//   // 'propertyIsEnumerable', 'valueOf',
//   // '__proto__',            'toLocaleString'
//
//   const allProperties = getAllProperties(obj);
//
//   // tinsel.prototype = Object.create(obj);
//   // tinsel.prototype.constructor = obj;
//
//   for (const p of allProperties) {
//     if (neverDecorate.indexOf(p) !== -1) {
//       continue;
//     }
//     if ((typeof obj[p]) === 'function') {
//       tinsel[p] = function() {
//         const result = obj[p].apply(obj, arguments);
//         if (result === obj) {
//           // So that chained methods chain on the
//           // decorated object, not the original
//           return tinsel;
//         } else {
//           return result;
//         }
//       };
//     }
//   }
//
//   console.log({ tinsel });
//   return tinsel;
//
//   // https://stackoverflow.com/questions/8024149/is-it-possible-to-get-the-non-enumerable-inherited-property-names-of-an-object
//   function getAllProperties(obj) {
//     const allProps = [];
//     let curr = obj;
//     do {
//       const props = Object.getOwnPropertyNames(curr);
//       props.forEach(function(prop) {
//         if (allProps.indexOf(prop) === -1) {
//           allProps.push(prop);
//         }
//       });
//     } while ((curr = Object.getPrototypeOf(curr)));
//     return allProps;
//   }
// }
