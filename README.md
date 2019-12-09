# emulate-mongo-2-driver

## Purpose

You have legacy code that depends on the 2.x version of the MongoDB Node.js driver. You don't want to upgrade to the 3.x driver because of [backwards compability problems](https://github.com/mongodb/node-mongodb-native/blob/master/CHANGES_3.0.0.md), but you don't have a choice because of reported vulnerabilities such as those detected by `npm audit`.

`emulate-mongo-2-driver` aims to be a 100% compatible emulation of the 2.x version of the MongoDB Node.js driver, implemented as a wrapper for the 3.x driver.

It was created for long term support of [ApostropheCMS 2.x](https://apostrophecms.com). Of course, ApostropheCMS 3.x will use the MongoDB 3.x driver natively.

## Usage

```
npm install emulate-mongo-2-driver
```

```javascript
const mongo = require('emulate-mongo-2-driver');

// Use it here as if it were the 2.x driver
```

This module attempts complete compatibility with the [2.x features mentioned here](https://github.com/mongodb/node-mongodb-native/blob/master/CHANGES_3.0.0.md).
