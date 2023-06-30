import { createCell as createStorage, getValue as consumeTag, setValue } from './autotracking';

const neverEq = (a, b) => false;

export function createTag(name) {
  return createStorage(null, neverEq, name);
}
export { consumeTag };
export function dirtyTag(tag, value) {
  setValue(tag, value);
}
export const consumeCollection = node => {
  let tag = node.collectionTag;

  if (tag === null) {
    var _node$collectionTag;

    tag = node.collectionTag = createTag(((_node$collectionTag = node.collectionTag) == null ? void 0 : _node$collectionTag._name) || 'Unknown');
  }

  consumeTag(tag);
};
export const dirtyCollection = node => {
  const tag = node.collectionTag;

  if (tag !== null) {
    dirtyTag(tag, null);
  }
};