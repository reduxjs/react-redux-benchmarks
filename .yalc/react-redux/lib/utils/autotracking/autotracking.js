"use strict";

exports.__esModule = true;
exports.getValue = getValue;
exports.setValue = setValue;
exports.createCell = createCell;
exports.createCache = createCache;
exports.TrackingCache = exports.Cell = exports.$REVISION = void 0;

var _utils = require("./utils");

// Original autotracking implementation source:
// - https://gist.github.com/pzuraq/79bf862e0f8cd9521b79c4b6eccdc4f9
// Additional references:
// - https://www.pzuraq.com/blog/how-autotracking-works
// - https://v5.chriskrycho.com/journal/autotracking-elegant-dx-via-cutting-edge-cs/
// The global revision clock. Every time state changes, the clock increments.
let $REVISION = 0; // The current dependency tracker. Whenever we compute a cache, we create a Set
// to track any dependencies that are used while computing. If no cache is
// computing, then the tracker is null.

exports.$REVISION = $REVISION;
let CURRENT_TRACKER = null;

// Storage represents a root value in the system - the actual state of our app.
class Cell {
  constructor(initialValue, isEqual = tripleEq, name) {
    this.revision = $REVISION;
    this._value = void 0;
    this._lastValue = void 0;
    this._isEqual = tripleEq;
    this._name = void 0;
    this._value = this._lastValue = initialValue;
    this._isEqual = isEqual;
    this._name = name;
  } // Whenever a storage value is read, it'll add itself to the current tracker if
  // one exists, entangling its state with that cache.


  get value() {
    var _CURRENT_TRACKER;

    (_CURRENT_TRACKER = CURRENT_TRACKER) == null ? void 0 : _CURRENT_TRACKER.add(this);
    return this._value;
  } // Whenever a storage value is updated, we bump the global revision clock,
  // assign the revision for this storage to the new value, _and_ we schedule a
  // rerender. This is important, and it's what makes autotracking  _pull_
  // based. We don't actively tell the caches which depend on the storage that
  // anything has happened. Instead, we recompute the caches when needed.


  set value(newValue) {
    if (this.value === newValue) return;
    this._value = newValue;
    this.revision = exports.$REVISION = $REVISION = +$REVISION + 1;
  }

}

exports.Cell = Cell;

function tripleEq(a, b) {
  return a === b;
} // Caches represent derived state in the system. They are ultimately functions
// that are memoized based on what state they use to produce their output,
// meaning they will only rerun IFF a storage value that could affect the output
// has changed. Otherwise, they'll return the cached value.


class TrackingCache {
  constructor(fn) {
    this._cachedValue = void 0;
    this._cachedRevision = -1;
    this._deps = [];
    this.hits = 0;
    this._needsRecalculation = false;
    this.fn = void 0;

    this.getValue = () => {
      //console.log('TrackedCache getValue')
      return this.value;
    };

    this.fn = fn;
  }

  clear() {
    this._cachedValue = undefined;
    this._cachedRevision = -1;
    this._deps = [];
    this.hits = 0;
    this._needsRecalculation = false;
  }

  needsRecalculation() {
    if (!this._needsRecalculation) {
      this._needsRecalculation = this.revision > this._cachedRevision;
    } // console.log(
    //   'Needs recalculation: ',
    //   this._needsRecalculation,
    //   this._cachedRevision,
    //   this._cachedValue
    // )


    return this._needsRecalculation;
  }
  /*
  getWithArgs = (...args: any[]) => {
    // console.log(
    //   `TrackingCache value: revision = ${this.revision}, cachedRevision = ${this._cachedRevision}, value = ${this._cachedValue}`
    // )
    // When getting the value for a Cache, first we check all the dependencies of
    // the cache to see what their current revision is. If the current revision is
    // greater than the cached revision, then something has changed.
    //if (this.revision > this._cachedRevision) {
    if (this.needsRecalculation()) {
      const { fn } = this
        // We create a new dependency tracker for this cache. As the cache runs
      // its function, any Storage or Cache instances which are used while
      // computing will be added to this tracker. In the end, it will be the
      // full list of dependencies that this Cache depends on.
      const currentTracker = new Set<Cell<any>>()
      const prevTracker = CURRENT_TRACKER
        CURRENT_TRACKER = currentTracker
        // try {
      this._cachedValue = fn.apply(null, args)
      // } finally {
      CURRENT_TRACKER = prevTracker
      this.hits++
      this._deps = Array.from(currentTracker)
        // Set the cached revision. This is the current clock count of all the
      // dependencies. If any dependency changes, this number will be less
      // than the new revision.
      this._cachedRevision = this.revision
      // }
    }
      // If there is a current tracker, it means another Cache is computing and
    // using this one, so we add this one to the tracker.
    CURRENT_TRACKER?.add(this)
      // Always return the cached value.
    return this._cachedValue
  }
  */


  get value() {
    var _CURRENT_TRACKER2;

    // console.log(
    //   `TrackingCache value: revision = ${this.revision}, cachedRevision = ${this._cachedRevision}, value = ${this._cachedValue}`
    // )
    // When getting the value for a Cache, first we check all the dependencies of
    // the cache to see what their current revision is. If the current revision is
    // greater than the cached revision, then something has changed.
    if (this.needsRecalculation()) {
      const {
        fn
      } = this; // We create a new dependency tracker for this cache. As the cache runs
      // its function, any Storage or Cache instances which are used while
      // computing will be added to this tracker. In the end, it will be the
      // full list of dependencies that this Cache depends on.

      const currentTracker = new Set();
      const prevTracker = CURRENT_TRACKER;
      CURRENT_TRACKER = currentTracker; // try {

      this._cachedValue = fn(); // } finally {

      CURRENT_TRACKER = prevTracker;
      this.hits++;
      this._deps = Array.from(currentTracker); // Set the cached revision. This is the current clock count of all the
      // dependencies. If any dependency changes, this number will be less
      // than the new revision.

      this._cachedRevision = this.revision;
      this._needsRecalculation = false; // console.log('Value: ', this._cachedValue, 'deps: ', this._deps)
      // }
    } // If there is a current tracker, it means another Cache is computing and
    // using this one, so we add this one to the tracker.


    (_CURRENT_TRACKER2 = CURRENT_TRACKER) == null ? void 0 : _CURRENT_TRACKER2.add(this); // Always return the cached value.

    return this._cachedValue;
  }

  get revision() {
    // console.log('Calculating revision: ', {
    //   value: this._cachedValue,
    //   deps: this._deps.map((d) => d._name),
    // })
    // The current revision is the max of all the dependencies' revisions.
    return Math.max(...this._deps.map(d => d.revision), 0);
  }

}

exports.TrackingCache = TrackingCache;

function getValue(cell) {
  if (!(cell instanceof Cell)) {
    console.warn('Not a valid cell! ', cell);
  }

  return cell.value;
}

function setValue(storage, value) {
  (0, _utils.assert)(storage instanceof Cell, 'setValue must be passed a tracked store created with `createStorage`.');
  storage.value = storage._lastValue = value;
}

function createCell(initialValue, isEqual = tripleEq, name) {
  return new Cell(initialValue, isEqual, name);
}

function createCache(fn) {
  (0, _utils.assert)(typeof fn === 'function', 'the first parameter to `createCache` must be a function');
  return new TrackingCache(fn);
}