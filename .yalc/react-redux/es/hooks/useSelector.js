import { useCallback, useDebugValue, useMemo, useRef } from 'react';
import { createReduxContextHook, useReduxContext as useDefaultReduxContext } from './useReduxContext';
import { ReactReduxContext } from '../components/Context';
import { notInitialized } from '../utils/useSyncExternalStore';
import { useIsomorphicLayoutEffect } from '../utils/useIsomorphicLayoutEffect';
import { createCache } from '../utils/autotracking/autotracking';
let useSyncExternalStoreWithSelector = notInitialized;
export const initializeUseSelector = fn => {
  useSyncExternalStoreWithSelector = fn;
};

const refEquality = (a, b) => a === b;
/**
 * Hook factory, which creates a `useSelector` hook bound to a given context.
 *
 * @param {React.Context} [context=ReactReduxContext] Context passed to your `<Provider>`.
 * @returns {Function} A `useSelector` hook bound to the specified context.
 */


export function createSelectorHook(context = ReactReduxContext) {
  const useReduxContext = context === ReactReduxContext ? useDefaultReduxContext : createReduxContextHook(context);
  return function useSelector(selector, equalityFnOrOptions = {}) {
    const {
      equalityFn = refEquality,
      stabilityCheck = undefined,
      noopCheck = undefined
    } = typeof equalityFnOrOptions === 'function' ? {
      equalityFn: equalityFnOrOptions
    } : equalityFnOrOptions;

    if (process.env.NODE_ENV !== 'production') {
      if (!selector) {
        throw new Error(`You must pass a selector to useSelector`);
      }

      if (typeof selector !== 'function') {
        throw new Error(`You must pass a function as a selector to useSelector`);
      }

      if (typeof equalityFn !== 'function') {
        throw new Error(`You must pass a function as an equality function to useSelector`);
      }
    }

    const {
      store,
      subscription,
      getServerState,
      stabilityCheck: globalStabilityCheck,
      noopCheck: globalNoopCheck,
      trackingNode
    } = useReduxContext();
    const firstRun = useRef(true);
    const wrappedSelector = useCallback({
      [selector.name](state) {
        const selected = selector(state);

        if (process.env.NODE_ENV !== 'production') {
          const finalStabilityCheck = typeof stabilityCheck === 'undefined' ? globalStabilityCheck : stabilityCheck;

          if (finalStabilityCheck === 'always' || finalStabilityCheck === 'once' && firstRun.current) {
            const toCompare = selector(state);

            if (!equalityFn(selected, toCompare)) {
              console.warn('Selector ' + (selector.name || 'unknown') + ' returned a different result when called with the same parameters. This can lead to unnecessary rerenders.' + '\nSelectors that return a new reference (such as an object or an array) should be memoized: https://redux.js.org/usage/deriving-data-selectors#optimizing-selectors-with-memoization', {
                state,
                selected,
                selected2: toCompare
              });
            }
          }

          const finalNoopCheck = typeof noopCheck === 'undefined' ? globalNoopCheck : noopCheck;

          if (finalNoopCheck === 'always' || finalNoopCheck === 'once' && firstRun.current) {
            // @ts-ignore
            if (selected === state) {
              console.warn('Selector ' + (selector.name || 'unknown') + ' returned the root state when called. This can lead to unnecessary rerenders.' + '\nSelectors that return the entire state are almost certainly a mistake, as they will cause a rerender whenever *anything* in state changes.');
            }
          }

          if (firstRun.current) firstRun.current = false;
        }

        return selected;
      }

    }[selector.name], [selector, globalStabilityCheck, stabilityCheck]);
    const latestWrappedSelectorRef = useRef(wrappedSelector); // console.log(
    //   'Writing latest selector. Same reference? ',
    //   wrappedSelector === latestWrappedSelectorRef.current
    // )

    latestWrappedSelectorRef.current = wrappedSelector;
    const cache = useMemo(() => {
      //console.log('Recreating cache')
      const cache = createCache(() => {
        // console.log('Wrapper cache called: ', store.getState())
        //return latestWrappedSelectorRef.current(trackingNode.proxy as TState)
        return wrappedSelector(trackingNode.proxy);
      });
      return cache;
    }, [trackingNode, wrappedSelector]);
    const cacheWrapper = useRef({
      cache
    });
    useIsomorphicLayoutEffect(() => {
      cacheWrapper.current.cache = cache;
    });
    const subscribeToStore = useMemo(() => {
      const subscribeToStore = onStoreChange => {
        const wrappedOnStoreChange = () => {
          // console.log('wrappedOnStoreChange')
          return onStoreChange();
        }; // console.log('Subscribing to store with tracking')


        return subscription.addNestedSub(wrappedOnStoreChange, {
          trigger: 'tracked',
          cache: cacheWrapper.current
        });
      };

      return subscribeToStore;
    }, [subscription]);
    const selectedState = useSyncExternalStoreWithSelector( //subscription.addNestedSub,
    subscribeToStore, store.getState, //() => trackingNode.proxy as TState,
    getServerState || store.getState, cache.getValue, equalityFn);
    useDebugValue(selectedState);
    return selectedState;
  };
}
/**
 * A hook to access the redux store's state. This hook takes a selector function
 * as an argument. The selector is called with the store state.
 *
 * This hook takes an optional equality comparison function as the second parameter
 * that allows you to customize the way the selected state is compared to determine
 * whether the component needs to be re-rendered.
 *
 * @param {Function} selector the selector function
 * @param {Function=} equalityFn the function that will be used to determine equality
 *
 * @returns {any} the selected state
 *
 * @example
 *
 * import React from 'react'
 * import { useSelector } from 'react-redux'
 *
 * export const CounterComponent = () => {
 *   const counter = useSelector(state => state.counter)
 *   return <div>{counter}</div>
 * }
 */

export const useSelector = /*#__PURE__*/createSelectorHook();