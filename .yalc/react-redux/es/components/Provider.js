import React, { useMemo } from 'react';
import { ReactReduxContext } from './Context';
import { createSubscription } from '../utils/Subscription';
import { useIsomorphicLayoutEffect } from '../utils/useIsomorphicLayoutEffect';
import { createNode } from '../utils/autotracking/proxy';

function Provider({
  store,
  context,
  children,
  serverState,
  stabilityCheck = 'once',
  noopCheck = 'once'
}) {
  const contextValue = useMemo(() => {
    const trackingNode = createNode(store.getState()); //console.log('Created tracking node: ', trackingNode)

    const subscription = createSubscription(store, undefined, trackingNode);
    return {
      store: store,
      subscription,
      getServerState: serverState ? () => serverState : undefined,
      stabilityCheck,
      noopCheck,
      trackingNode
    };
  }, [store, serverState, stabilityCheck, noopCheck]);
  const previousState = useMemo(() => store.getState(), [store]);
  useIsomorphicLayoutEffect(() => {
    const {
      subscription
    } = contextValue;
    subscription.onStateChange = subscription.notifyNestedSubs;
    subscription.trySubscribe();

    if (previousState !== store.getState()) {
      subscription.notifyNestedSubs();
    }

    return () => {
      subscription.tryUnsubscribe();
      subscription.onStateChange = undefined;
    };
  }, [contextValue, previousState]);
  const Context = context || ReactReduxContext; // @ts-ignore 'AnyAction' is assignable to the constraint of type 'A', but 'A' could be instantiated with a different subtype

  return /*#__PURE__*/React.createElement(Context.Provider, {
    value: contextValue
  }, children);
}

export default Provider;