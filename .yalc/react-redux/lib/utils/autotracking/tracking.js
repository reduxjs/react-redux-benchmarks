"use strict";

exports.__esModule = true;
exports.createTag = createTag;
exports.dirtyTag = dirtyTag;
Object.defineProperty(exports, "consumeTag", {
  enumerable: true,
  get: function () {
    return _autotracking.getValue;
  }
});
exports.dirtyCollection = exports.consumeCollection = void 0;

var _autotracking = require("./autotracking");

const neverEq = (a, b) => false;

function createTag(name) {
  return (0, _autotracking.createCell)(null, neverEq, name);
}

function dirtyTag(tag, value) {
  (0, _autotracking.setValue)(tag, value);
}

const consumeCollection = node => {
  let tag = node.collectionTag;

  if (tag === null) {
    var _node$collectionTag;

    tag = node.collectionTag = createTag(((_node$collectionTag = node.collectionTag) == null ? void 0 : _node$collectionTag._name) || 'Unknown');
  }

  (0, _autotracking.getValue)(tag);
};

exports.consumeCollection = consumeCollection;

const dirtyCollection = node => {
  const tag = node.collectionTag;

  if (tag !== null) {
    dirtyTag(tag, null);
  }
};

exports.dirtyCollection = dirtyCollection;