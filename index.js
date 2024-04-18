const mongodb = require('@apostrophecms/emulate-mongo-3-driver');
const binary = require('./binary.js');
const collection = require('./collection.js');
const cursor = require('./cursor.js');
const db = require('./db.js');
const mongoClient = require('./mongo-client.js');

const emulateClasses = new Map([
  [ 'Binary', binary ],
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
