import { getBatch } from './batch';
import { updateNode } from './autotracking/proxy'; // encapsulates the subscription logic for connecting a component to the redux store, as
// well as nesting subscriptions of descendant components, so that we can ensure the
// ancestor components re-render before descendants

function createListenerCollection() {
  const batch = getBatch();
  let first = null;
  let last = null;
  return {
    clear() {
      first = null;
      last = null;
    },

    notify() {
      //console.log('Notifying subscribers')
      let numCalled = 0;
      let numSkipped = 0;
      batch(() => {
        let listener = first;

        while (listener) {
          //console.log('Listener: ', listener)
          if (listener.trigger == 'tracked') {
            if (listener.selectorCache.cache.needsRecalculation()) {
              //console.log('Calling subscriber due to recalc need')
              // console.log(
              //   'Calling subscriber due to recalc. Revision before: ',
              //   $REVISION
              // )
              numCalled++;
              listener.callback(); //console.log('Revision after: ', $REVISION)
            } else {
              numSkipped++; // console.log(
              //   'Skipping subscriber, no recalc: ',
              //   listener.selectorCache
              // )
            }
          } else {
            listener.callback();
          }

          listener = listener.next;
        }
      });
      const result = {
        numCalled,
        numSkipped
      };
      return result;
    },

    get() {
      let listeners = [];
      let listener = first;

      while (listener) {
        listeners.push(listener);
        listener = listener.next;
      }

      return listeners;
    },

    subscribe(callback, options = {
      trigger: 'always'
    }) {
      let isSubscribed = true; //console.log('Adding listener: ', options.trigger)

      let listener = last = {
        callback,
        next: null,
        prev: last,
        trigger: options.trigger,
        selectorCache: options.trigger === 'tracked' ? options.cache : undefined // subscriberCache:
        //   options.trigger === 'tracked'
        //     ? createCache(() => {
        //         console.log('Calling subscriberCache')
        //         listener.selectorCache!.get()
        //         callback()
        //       })
        //     : undefined,

      };

      if (listener.prev) {
        listener.prev.next = listener;
      } else {
        first = listener;
      }

      return function unsubscribe() {
        if (!isSubscribed || first === null) return;
        isSubscribed = false;

        if (listener.next) {
          listener.next.prev = listener.prev;
        } else {
          last = listener.prev;
        }

        if (listener.prev) {
          listener.prev.next = listener.next;
        } else {
          first = listener.next;
        }
      };
    }

  };
}

const nullListeners = {
  notify() {},

  get: () => []
};
export function createSubscription(store, parentSub, trackingNode) {
  let unsubscribe;
  let listeners = nullListeners;
  const updateNodeTimes = [];
  const notifyTimes = [];
  const resultCounts = [];

  function addNestedSub(listener, options = {
    trigger: 'always'
  }) {
    //console.log('addNestedSub: ', options)
    trySubscribe(options);
    return listeners.subscribe(listener, options);
  }

  function notifyNestedSubs() {
    if (store && trackingNode) {
      //console.log('Updating node in notifyNestedSubs')
      const _start = performance.now();

      updateNode(trackingNode, store.getState());

      const _end = performance.now();

      updateNodeTimes.push({
        start: _start,
        end: _end,
        duration: _end - _start
      });
    }

    const start = performance.now();
    const results = listeners.notify();
    const end = performance.now();
    notifyTimes.push({
      start,
      end,
      duration: end - start
    });
    resultCounts.push(results);
  }

  function handleChangeWrapper() {
    if (subscription.onStateChange) {
      subscription.onStateChange();
    }
  }

  function isSubscribed() {
    return Boolean(unsubscribe);
  }

  function trySubscribe(options = {
    trigger: 'always'
  }) {
    if (!unsubscribe) {
      //console.log('trySubscribe, parentSub: ', parentSub)
      unsubscribe = parentSub ? parentSub.addNestedSub(handleChangeWrapper, options) : store.subscribe(handleChangeWrapper);
      listeners = createListenerCollection();
    }
  }

  function tryUnsubscribe() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = undefined;
      listeners.clear();
      listeners = nullListeners;
    }
  }

  const subscription = {
    addNestedSub,
    notifyNestedSubs,
    handleChangeWrapper,
    isSubscribed,
    trySubscribe,
    tryUnsubscribe,
    getListeners: () => listeners
  };
  return subscription;
}