// Original source:
// - https://github.com/simonihmig/tracked-redux/blob/master/packages/tracked-redux/src/-private/proxy.ts
import { consumeCollection, dirtyCollection, consumeTag, dirtyTag, createTag } from './tracking';
export const REDUX_PROXY_LABEL = Symbol();
let nextId = 0;
const proto = Object.getPrototypeOf({});

class ObjectTreeNode {
  constructor(value) {
    this.value = value;
    this.proxy = new Proxy(this, objectProxyHandler);
    this.tag = createTag('object');
    this.tags = {};
    this.children = {};
    this.collectionTag = null;
    this.id = nextId++;
    this.value = value;
    this.tag.value = value;
  }

}

const objectProxyHandler = {
  get(node, key) {
    //console.log('Reading key: ', key, node.value)
    function calculateResult() {
      const {
        value
      } = node;
      const childValue = Reflect.get(value, key);

      if (typeof key === 'symbol') {
        return childValue;
      }

      if (key in proto) {
        return childValue;
      }

      if (typeof childValue === 'object' && childValue !== null) {
        let childNode = node.children[key];

        if (childNode === undefined) {
          childNode = node.children[key] = createNode(childValue);
        }

        if (childNode.tag) {
          consumeTag(childNode.tag);
        }

        return childNode.proxy;
      } else {
        let tag = node.tags[key];

        if (tag === undefined) {
          tag = node.tags[key] = createTag(key);
          tag.value = childValue;
        }

        consumeTag(tag);
        return childValue;
      }
    }

    const res = calculateResult();
    return res;
  },

  ownKeys(node) {
    consumeCollection(node);
    return Reflect.ownKeys(node.value);
  },

  getOwnPropertyDescriptor(node, prop) {
    return Reflect.getOwnPropertyDescriptor(node.value, prop);
  },

  has(node, prop) {
    return Reflect.has(node.value, prop);
  }

};

class ArrayTreeNode {
  constructor(value) {
    this.value = value;
    this.proxy = new Proxy([this], arrayProxyHandler);
    this.tag = createTag('array');
    this.tags = {};
    this.children = {};
    this.collectionTag = null;
    this.id = nextId++;
    this.value = value;
    this.tag.value = value;
  }

}

const arrayProxyHandler = {
  get([node], key) {
    if (key === 'length') {
      consumeCollection(node);
    }

    return objectProxyHandler.get(node, key);
  },

  ownKeys([node]) {
    return objectProxyHandler.ownKeys(node);
  },

  getOwnPropertyDescriptor([node], prop) {
    return objectProxyHandler.getOwnPropertyDescriptor(node, prop);
  },

  has([node], prop) {
    return objectProxyHandler.has(node, prop);
  }

};
export function createNode(value) {
  if (Array.isArray(value)) {
    return new ArrayTreeNode(value);
  }

  return new ObjectTreeNode(value);
}
const keysMap = new WeakMap();
export function updateNode(node, newValue) {
  const {
    value,
    tags,
    children
  } = node; //console.log('Inside updateNode', newValue)

  node.value = newValue;

  if (Array.isArray(value) && Array.isArray(newValue) && value.length !== newValue.length) {
    dirtyCollection(node);
  } else {
    if (value !== newValue) {
      let oldKeysSize = 0;
      let newKeysSize = 0;
      let anyKeysAdded = false;

      for (const _key in value) {
        oldKeysSize++;
      }

      for (const key in newValue) {
        newKeysSize++;

        if (!(key in value)) {
          anyKeysAdded = true;
          break;
        }
      }

      const isDifferent = anyKeysAdded || oldKeysSize !== newKeysSize;

      if (isDifferent) {
        dirtyCollection(node);
      }
    }
  }

  for (const key in tags) {
    //console.log('Checking tag: ', key)
    const childValue = value[key];
    const newChildValue = newValue[key];

    if (childValue !== newChildValue) {
      dirtyCollection(node);
      dirtyTag(tags[key], newChildValue);
    }

    if (typeof newChildValue === 'object' && newChildValue !== null) {
      delete tags[key];
    }
  }

  for (const key in children) {
    //console.log(`Checking node: key = ${key}, value = ${children[key]}`)
    const childNode = children[key];
    const newChildValue = newValue[key];
    const childValue = childNode.value;

    if (childValue === newChildValue) {
      continue;
    } else if (typeof newChildValue === 'object' && newChildValue !== null) {
      // console.log('Updating node key: ', key)
      updateNode(childNode, newChildValue);
    } else {
      deleteNode(childNode);
      delete children[key];
    }
  }
}

function deleteNode(node) {
  if (node.tag) {
    dirtyTag(node.tag, null);
  }

  dirtyCollection(node);

  for (const key in node.tags) {
    dirtyTag(node.tags[key], null);
  }

  for (const key in node.children) {
    deleteNode(node.children[key]);
  }
}