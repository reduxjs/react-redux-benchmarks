"use strict";

exports.__esModule = true;
exports.assert = assert;

function assert(condition, msg = 'Assertion failed!') {
  if (!condition) {
    console.error(msg);
    throw new Error(msg);
  }
}