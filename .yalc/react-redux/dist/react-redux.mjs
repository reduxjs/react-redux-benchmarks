// src/utils/react.ts
import * as React from "react";

// src/utils/react-is.ts
var IS_REACT_19 = /* @__PURE__ */ React.version.startsWith("19");
var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for(
  IS_REACT_19 ? "react.transitional.element" : "react.element"
);
var REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal");
var REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment");
var REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode");
var REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler");
var REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer");
var REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context");
var REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref");
var REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense");
var REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for(
  "react.suspense_list"
);
var REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo");
var REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy");
var REACT_OFFSCREEN_TYPE = /* @__PURE__ */ Symbol.for("react.offscreen");
var REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for(
  "react.client.reference"
);
var ForwardRef = REACT_FORWARD_REF_TYPE;
var Memo = REACT_MEMO_TYPE;
function isValidElementType(type) {
  return typeof type === "string" || typeof type === "function" || type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || type === REACT_OFFSCREEN_TYPE || typeof type === "object" && type !== null && (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_CONSUMER_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || type.$$typeof === REACT_CLIENT_REFERENCE || type.getModuleId !== void 0) ? true : false;
}
function typeOf(object) {
  if (typeof object === "object" && object !== null) {
    const { $$typeof } = object;
    switch ($$typeof) {
      case REACT_ELEMENT_TYPE:
        switch (object = object.type, object) {
          case REACT_FRAGMENT_TYPE:
          case REACT_PROFILER_TYPE:
          case REACT_STRICT_MODE_TYPE:
          case REACT_SUSPENSE_TYPE:
          case REACT_SUSPENSE_LIST_TYPE:
            return object;
          default:
            switch (object = object && object.$$typeof, object) {
              case REACT_CONTEXT_TYPE:
              case REACT_FORWARD_REF_TYPE:
              case REACT_LAZY_TYPE:
              case REACT_MEMO_TYPE:
                return object;
              case REACT_CONSUMER_TYPE:
                return object;
              default:
                return $$typeof;
            }
        }
      case REACT_PORTAL_TYPE:
        return $$typeof;
    }
  }
}
function isContextConsumer(object) {
  return IS_REACT_19 ? typeOf(object) === REACT_CONSUMER_TYPE : typeOf(object) === REACT_CONTEXT_TYPE;
}
function isMemo(object) {
  return typeOf(object) === REACT_MEMO_TYPE;
}

// src/utils/warning.ts
function warning(message) {
  if (typeof console !== "undefined" && typeof console.error === "function") {
    console.error(message);
  }
  try {
    throw new Error(message);
  } catch (e) {
  }
}

// src/connect/verifySubselectors.ts
function verify(selector, methodName) {
  if (!selector) {
    throw new Error(`Unexpected value for ${methodName} in connect.`);
  } else if (methodName === "mapStateToProps" || methodName === "mapDispatchToProps") {
    if (!Object.prototype.hasOwnProperty.call(selector, "dependsOnOwnProps")) {
      warning(
        `The selector for ${methodName} of connect did not specify a value for dependsOnOwnProps.`
      );
    }
  }
}
function verifySubselectors(mapStateToProps, mapDispatchToProps, mergeProps) {
  verify(mapStateToProps, "mapStateToProps");
  verify(mapDispatchToProps, "mapDispatchToProps");
  verify(mergeProps, "mergeProps");
}

// src/connect/selectorFactory.ts
function pureFinalPropsSelectorFactory(mapStateToProps, mapDispatchToProps, mergeProps, dispatch, {
  areStatesEqual,
  areOwnPropsEqual,
  areStatePropsEqual
}) {
  let hasRunAtLeastOnce = false;
  let state;
  let ownProps;
  let stateProps;
  let dispatchProps;
  let mergedProps;
  function handleFirstCall(firstState, firstOwnProps) {
    state = firstState;
    ownProps = firstOwnProps;
    stateProps = mapStateToProps(state, ownProps);
    dispatchProps = mapDispatchToProps(dispatch, ownProps);
    mergedProps = mergeProps(stateProps, dispatchProps, ownProps);
    hasRunAtLeastOnce = true;
    return mergedProps;
  }
  function handleNewPropsAndNewState() {
    stateProps = mapStateToProps(state, ownProps);
    if (mapDispatchToProps.dependsOnOwnProps)
      dispatchProps = mapDispatchToProps(dispatch, ownProps);
    mergedProps = mergeProps(stateProps, dispatchProps, ownProps);
    return mergedProps;
  }
  function handleNewProps() {
    if (mapStateToProps.dependsOnOwnProps)
      stateProps = mapStateToProps(state, ownProps);
    if (mapDispatchToProps.dependsOnOwnProps)
      dispatchProps = mapDispatchToProps(dispatch, ownProps);
    mergedProps = mergeProps(stateProps, dispatchProps, ownProps);
    return mergedProps;
  }
  function handleNewState() {
    const nextStateProps = mapStateToProps(state, ownProps);
    const statePropsChanged = !areStatePropsEqual(nextStateProps, stateProps);
    stateProps = nextStateProps;
    if (statePropsChanged)
      mergedProps = mergeProps(stateProps, dispatchProps, ownProps);
    return mergedProps;
  }
  function handleSubsequentCalls(nextState, nextOwnProps) {
    const propsChanged = !areOwnPropsEqual(nextOwnProps, ownProps);
    const stateChanged = !areStatesEqual(
      nextState,
      state,
      nextOwnProps,
      ownProps
    );
    state = nextState;
    ownProps = nextOwnProps;
    if (propsChanged && stateChanged) return handleNewPropsAndNewState();
    if (propsChanged) return handleNewProps();
    if (stateChanged) return handleNewState();
    return mergedProps;
  }
  return function pureFinalPropsSelector(nextState, nextOwnProps) {
    return hasRunAtLeastOnce ? handleSubsequentCalls(nextState, nextOwnProps) : handleFirstCall(nextState, nextOwnProps);
  };
}
function finalPropsSelectorFactory(dispatch, {
  initMapStateToProps,
  initMapDispatchToProps,
  initMergeProps,
  ...options
}) {
  const mapStateToProps = initMapStateToProps(dispatch, options);
  const mapDispatchToProps = initMapDispatchToProps(dispatch, options);
  const mergeProps = initMergeProps(dispatch, options);
  if (process.env.NODE_ENV !== "production") {
    verifySubselectors(mapStateToProps, mapDispatchToProps, mergeProps);
  }
  return pureFinalPropsSelectorFactory(mapStateToProps, mapDispatchToProps, mergeProps, dispatch, options);
}

// src/utils/bindActionCreators.ts
function bindActionCreators(actionCreators, dispatch) {
  const boundActionCreators = {};
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key];
    if (typeof actionCreator === "function") {
      boundActionCreators[key] = (...args) => dispatch(actionCreator(...args));
    }
  }
  return boundActionCreators;
}

// src/utils/isPlainObject.ts
function isPlainObject(obj) {
  if (typeof obj !== "object" || obj === null) return false;
  const proto = Object.getPrototypeOf(obj);
  if (proto === null) return true;
  let baseProto = proto;
  while (Object.getPrototypeOf(baseProto) !== null) {
    baseProto = Object.getPrototypeOf(baseProto);
  }
  return proto === baseProto;
}

// src/utils/verifyPlainObject.ts
function verifyPlainObject(value, displayName, methodName) {
  if (!isPlainObject(value)) {
    warning(
      `${methodName}() in ${displayName} must return a plain object. Instead received ${value}.`
    );
  }
}

// src/connect/wrapMapToProps.ts
function wrapMapToPropsConstant(getConstant) {
  return function initConstantSelector(dispatch) {
    const constant = getConstant(dispatch);
    function constantSelector() {
      return constant;
    }
    constantSelector.dependsOnOwnProps = false;
    return constantSelector;
  };
}
function getDependsOnOwnProps(mapToProps) {
  return mapToProps.dependsOnOwnProps ? Boolean(mapToProps.dependsOnOwnProps) : mapToProps.length !== 1;
}
function wrapMapToPropsFunc(mapToProps, methodName) {
  return function initProxySelector(dispatch, { displayName }) {
    const proxy = function mapToPropsProxy(stateOrDispatch, ownProps) {
      return proxy.dependsOnOwnProps ? proxy.mapToProps(stateOrDispatch, ownProps) : proxy.mapToProps(stateOrDispatch, void 0);
    };
    proxy.dependsOnOwnProps = true;
    proxy.mapToProps = function detectFactoryAndVerify(stateOrDispatch, ownProps) {
      proxy.mapToProps = mapToProps;
      proxy.dependsOnOwnProps = getDependsOnOwnProps(mapToProps);
      let props = proxy(stateOrDispatch, ownProps);
      if (typeof props === "function") {
        proxy.mapToProps = props;
        proxy.dependsOnOwnProps = getDependsOnOwnProps(props);
        props = proxy(stateOrDispatch, ownProps);
      }
      if (process.env.NODE_ENV !== "production")
        verifyPlainObject(props, displayName, methodName);
      return props;
    };
    return proxy;
  };
}

// src/connect/invalidArgFactory.ts
function createInvalidArgFactory(arg, name) {
  return (dispatch, options) => {
    throw new Error(
      `Invalid value of type ${typeof arg} for ${name} argument when connecting component ${options.wrappedComponentName}.`
    );
  };
}

// src/connect/mapDispatchToProps.ts
function mapDispatchToPropsFactory(mapDispatchToProps) {
  return mapDispatchToProps && typeof mapDispatchToProps === "object" ? wrapMapToPropsConstant(
    (dispatch) => (
      // @ts-ignore
      bindActionCreators(mapDispatchToProps, dispatch)
    )
  ) : !mapDispatchToProps ? wrapMapToPropsConstant((dispatch) => ({
    dispatch
  })) : typeof mapDispatchToProps === "function" ? (
    // @ts-ignore
    wrapMapToPropsFunc(mapDispatchToProps, "mapDispatchToProps")
  ) : createInvalidArgFactory(mapDispatchToProps, "mapDispatchToProps");
}

// src/connect/mapStateToProps.ts
function mapStateToPropsFactory(mapStateToProps) {
  return !mapStateToProps ? wrapMapToPropsConstant(() => ({})) : typeof mapStateToProps === "function" ? (
    // @ts-ignore
    wrapMapToPropsFunc(mapStateToProps, "mapStateToProps")
  ) : createInvalidArgFactory(mapStateToProps, "mapStateToProps");
}

// src/connect/mergeProps.ts
function defaultMergeProps(stateProps, dispatchProps, ownProps) {
  return { ...ownProps, ...stateProps, ...dispatchProps };
}
function wrapMergePropsFunc(mergeProps) {
  return function initMergePropsProxy(dispatch, { displayName, areMergedPropsEqual }) {
    let hasRunOnce = false;
    let mergedProps;
    return function mergePropsProxy(stateProps, dispatchProps, ownProps) {
      const nextMergedProps = mergeProps(stateProps, dispatchProps, ownProps);
      if (hasRunOnce) {
        if (!areMergedPropsEqual(nextMergedProps, mergedProps))
          mergedProps = nextMergedProps;
      } else {
        hasRunOnce = true;
        mergedProps = nextMergedProps;
        if (process.env.NODE_ENV !== "production")
          verifyPlainObject(mergedProps, displayName, "mergeProps");
      }
      return mergedProps;
    };
  };
}
function mergePropsFactory(mergeProps) {
  return !mergeProps ? () => defaultMergeProps : typeof mergeProps === "function" ? wrapMergePropsFunc(mergeProps) : createInvalidArgFactory(mergeProps, "mergeProps");
}

// src/utils/batch.ts
function defaultNoopBatch(callback) {
  callback();
}

// src/utils/Subscription.ts
function createListenerCollection() {
  let first = null;
  let last = null;
  return {
    clear() {
      first = null;
      last = null;
    },
    notify() {
      defaultNoopBatch(() => {
        let listener = first;
        while (listener) {
          listener.callback();
          listener = listener.next;
        }
      });
    },
    get() {
      const listeners = [];
      let listener = first;
      while (listener) {
        listeners.push(listener);
        listener = listener.next;
      }
      return listeners;
    },
    subscribe(callback) {
      let isSubscribed = true;
      const listener = last = {
        callback,
        next: null,
        prev: last
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
var nullListeners = {
  notify() {
  },
  get: () => []
};
function createSubscription(store, parentSub) {
  let unsubscribe;
  let listeners = nullListeners;
  let subscriptionsAmount = 0;
  let selfSubscribed = false;
  function addNestedSub(listener) {
    trySubscribe();
    const cleanupListener = listeners.subscribe(listener);
    let removed = false;
    return () => {
      if (!removed) {
        removed = true;
        cleanupListener();
        tryUnsubscribe();
      }
    };
  }
  function notifyNestedSubs() {
    listeners.notify();
  }
  function handleChangeWrapper() {
    if (subscription.onStateChange) {
      subscription.onStateChange();
    }
  }
  function isSubscribed() {
    return selfSubscribed;
  }
  function trySubscribe() {
    subscriptionsAmount++;
    if (!unsubscribe) {
      unsubscribe = parentSub ? parentSub.addNestedSub(handleChangeWrapper) : store.subscribe(handleChangeWrapper);
      listeners = createListenerCollection();
    }
  }
  function tryUnsubscribe() {
    subscriptionsAmount--;
    if (unsubscribe && subscriptionsAmount === 0) {
      unsubscribe();
      unsubscribe = void 0;
      listeners.clear();
      listeners = nullListeners;
    }
  }
  function trySubscribeSelf() {
    if (!selfSubscribed) {
      selfSubscribed = true;
      trySubscribe();
    }
  }
  function tryUnsubscribeSelf() {
    if (selfSubscribed) {
      selfSubscribed = false;
      tryUnsubscribe();
    }
  }
  const subscription = {
    addNestedSub,
    notifyNestedSubs,
    handleChangeWrapper,
    isSubscribed,
    trySubscribe: trySubscribeSelf,
    tryUnsubscribe: tryUnsubscribeSelf,
    getListeners: () => listeners
  };
  return subscription;
}

// src/utils/useIsomorphicLayoutEffect.ts
var canUseDOM = () => !!(typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined");
var isDOM = /* @__PURE__ */ canUseDOM();
var isRunningInReactNative = () => typeof navigator !== "undefined" && navigator.product === "ReactNative";
var isReactNative = /* @__PURE__ */ isRunningInReactNative();
var getUseIsomorphicLayoutEffect = () => isDOM || isReactNative ? React.useLayoutEffect : React.useEffect;
var useIsomorphicLayoutEffect = /* @__PURE__ */ getUseIsomorphicLayoutEffect();

// src/utils/shallowEqual.ts
function is(x, y) {
  if (x === y) {
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}
function shallowEqual(objA, objB) {
  if (is(objA, objB)) return true;
  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
    return false;
  }
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }
  return true;
}

// src/utils/hoistStatics.ts
var REACT_STATICS = {
  childContextTypes: true,
  contextType: true,
  contextTypes: true,
  defaultProps: true,
  displayName: true,
  getDefaultProps: true,
  getDerivedStateFromError: true,
  getDerivedStateFromProps: true,
  mixins: true,
  propTypes: true,
  type: true
};
var KNOWN_STATICS = {
  name: true,
  length: true,
  prototype: true,
  caller: true,
  callee: true,
  arguments: true,
  arity: true
};
var FORWARD_REF_STATICS = {
  $$typeof: true,
  render: true,
  defaultProps: true,
  displayName: true,
  propTypes: true
};
var MEMO_STATICS = {
  $$typeof: true,
  compare: true,
  defaultProps: true,
  displayName: true,
  propTypes: true,
  type: true
};
var TYPE_STATICS = {
  [ForwardRef]: FORWARD_REF_STATICS,
  [Memo]: MEMO_STATICS
};
function getStatics(component) {
  if (isMemo(component)) {
    return MEMO_STATICS;
  }
  return TYPE_STATICS[component["$$typeof"]] || REACT_STATICS;
}
var defineProperty = Object.defineProperty;
var getOwnPropertyNames = Object.getOwnPropertyNames;
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
var getPrototypeOf = Object.getPrototypeOf;
var objectPrototype = Object.prototype;
function hoistNonReactStatics(targetComponent, sourceComponent) {
  if (typeof sourceComponent !== "string") {
    if (objectPrototype) {
      const inheritedComponent = getPrototypeOf(sourceComponent);
      if (inheritedComponent && inheritedComponent !== objectPrototype) {
        hoistNonReactStatics(targetComponent, inheritedComponent);
      }
    }
    let keys = getOwnPropertyNames(sourceComponent);
    if (getOwnPropertySymbols) {
      keys = keys.concat(getOwnPropertySymbols(sourceComponent));
    }
    const targetStatics = getStatics(targetComponent);
    const sourceStatics = getStatics(sourceComponent);
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      if (!KNOWN_STATICS[key] && !(sourceStatics && sourceStatics[key]) && !(targetStatics && targetStatics[key])) {
        const descriptor = getOwnPropertyDescriptor(sourceComponent, key);
        try {
          defineProperty(targetComponent, key, descriptor);
        } catch (e) {
        }
      }
    }
  }
  return targetComponent;
}

// src/components/Context.ts
var ContextKey = /* @__PURE__ */ Symbol.for(`react-redux-context`);
var gT = typeof globalThis !== "undefined" ? globalThis : (
  /* fall back to a per-module scope (pre-8.1 behaviour) if `globalThis` is not available */
  {}
);
function getContext() {
  if (!React.createContext) return {};
  const contextMap = gT[ContextKey] ??= /* @__PURE__ */ new Map();
  let realContext = contextMap.get(React.createContext);
  if (!realContext) {
    realContext = React.createContext(
      null
    );
    if (process.env.NODE_ENV !== "production") {
      realContext.displayName = "ReactRedux";
    }
    contextMap.set(React.createContext, realContext);
  }
  return realContext;
}
var ReactReduxContext = /* @__PURE__ */ getContext();

// src/components/connect.tsx
var NO_SUBSCRIPTION_ARRAY = [null, null];
var stringifyComponent = (Comp) => {
  try {
    return JSON.stringify(Comp);
  } catch (err) {
    return String(Comp);
  }
};
function useIsomorphicLayoutEffectWithArgs(effectFunc, effectArgs, dependencies) {
  useIsomorphicLayoutEffect(() => effectFunc(...effectArgs), dependencies);
}
function captureWrapperProps(lastWrapperProps, lastChildProps, renderIsScheduled, wrapperProps, childPropsFromStoreUpdate, notifyNestedSubs) {
  lastWrapperProps.current = wrapperProps;
  renderIsScheduled.current = false;
  if (childPropsFromStoreUpdate.current) {
    childPropsFromStoreUpdate.current = null;
    notifyNestedSubs();
  }
}
function subscribeUpdates(shouldHandleStateChanges, store, subscription, childPropsSelector, lastWrapperProps, lastChildProps, renderIsScheduled, isMounted, childPropsFromStoreUpdate, notifyNestedSubs, additionalSubscribeListener) {
  if (!shouldHandleStateChanges) return () => {
  };
  let didUnsubscribe = false;
  let lastThrownError = null;
  const checkForUpdates = () => {
    if (didUnsubscribe || !isMounted.current) {
      return;
    }
    const latestStoreState = store.getState();
    let newChildProps, error;
    try {
      newChildProps = childPropsSelector(
        latestStoreState,
        lastWrapperProps.current
      );
    } catch (e) {
      error = e;
      lastThrownError = e;
    }
    if (!error) {
      lastThrownError = null;
    }
    if (newChildProps === lastChildProps.current) {
      if (!renderIsScheduled.current) {
        notifyNestedSubs();
      }
    } else {
      lastChildProps.current = newChildProps;
      childPropsFromStoreUpdate.current = newChildProps;
      renderIsScheduled.current = true;
      additionalSubscribeListener();
    }
  };
  subscription.onStateChange = checkForUpdates;
  subscription.trySubscribe();
  checkForUpdates();
  const unsubscribeWrapper = () => {
    didUnsubscribe = true;
    subscription.tryUnsubscribe();
    subscription.onStateChange = null;
    if (lastThrownError) {
      throw lastThrownError;
    }
  };
  return unsubscribeWrapper;
}
function strictEqual(a, b) {
  return a === b;
}
var hasWarnedAboutDeprecatedPureOption = false;
function _connect(mapStateToProps, mapDispatchToProps, mergeProps, {
  // The `pure` option has been removed, so TS doesn't like us destructuring this to check its existence.
  // @ts-ignore
  pure,
  areStatesEqual = strictEqual,
  areOwnPropsEqual = shallowEqual,
  areStatePropsEqual = shallowEqual,
  areMergedPropsEqual = shallowEqual,
  // use React's forwardRef to expose a ref of the wrapped component
  forwardRef = false,
  // the context consumer to use
  context = ReactReduxContext
} = {}) {
  if (process.env.NODE_ENV !== "production") {
    if (pure !== void 0 && !hasWarnedAboutDeprecatedPureOption) {
      hasWarnedAboutDeprecatedPureOption = true;
      warning(
        'The `pure` option has been removed. `connect` is now always a "pure/memoized" component'
      );
    }
  }
  const Context = context;
  const initMapStateToProps = mapStateToPropsFactory(mapStateToProps);
  const initMapDispatchToProps = mapDispatchToPropsFactory(mapDispatchToProps);
  const initMergeProps = mergePropsFactory(mergeProps);
  const shouldHandleStateChanges = Boolean(mapStateToProps);
  const wrapWithConnect = (WrappedComponent) => {
    if (process.env.NODE_ENV !== "production") {
      const isValid = /* @__PURE__ */ isValidElementType(WrappedComponent);
      if (!isValid)
        throw new Error(
          `You must pass a component to the function returned by connect. Instead received ${stringifyComponent(
            WrappedComponent
          )}`
        );
    }
    const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name || "Component";
    const displayName = `Connect(${wrappedComponentName})`;
    const selectorFactoryOptions = {
      shouldHandleStateChanges,
      displayName,
      wrappedComponentName,
      WrappedComponent,
      // @ts-ignore
      initMapStateToProps,
      initMapDispatchToProps,
      initMergeProps,
      areStatesEqual,
      areStatePropsEqual,
      areOwnPropsEqual,
      areMergedPropsEqual
    };
    function ConnectFunction(props) {
      const [propsContext, reactReduxForwardedRef, wrapperProps] = React.useMemo(() => {
        const { reactReduxForwardedRef: reactReduxForwardedRef2, ...wrapperProps2 } = props;
        return [props.context, reactReduxForwardedRef2, wrapperProps2];
      }, [props]);
      const ContextToUse = React.useMemo(() => {
        let ResultContext = Context;
        if (propsContext?.Consumer) {
          if (process.env.NODE_ENV !== "production") {
            const isValid = /* @__PURE__ */ isContextConsumer(
              // @ts-ignore
              /* @__PURE__ */ React.createElement(propsContext.Consumer, null)
            );
            if (!isValid) {
              throw new Error(
                "You must pass a valid React context consumer as `props.context`"
              );
            }
            ResultContext = propsContext;
          }
        }
        return ResultContext;
      }, [propsContext, Context]);
      const contextValue = React.useContext(ContextToUse);
      const didStoreComeFromProps = Boolean(props.store) && Boolean(props.store.getState) && Boolean(props.store.dispatch);
      const didStoreComeFromContext = Boolean(contextValue) && Boolean(contextValue.store);
      if (process.env.NODE_ENV !== "production" && !didStoreComeFromProps && !didStoreComeFromContext) {
        throw new Error(
          `Could not find "store" in the context of "${displayName}". Either wrap the root component in a <Provider>, or pass a custom React context provider to <Provider> and the corresponding React context consumer to ${displayName} in connect options.`
        );
      }
      const store = didStoreComeFromProps ? props.store : contextValue.store;
      const getServerState = didStoreComeFromContext ? contextValue.getServerState : store.getState;
      const childPropsSelector = React.useMemo(() => {
        return finalPropsSelectorFactory(store.dispatch, selectorFactoryOptions);
      }, [store]);
      const [subscription, notifyNestedSubs] = React.useMemo(() => {
        if (!shouldHandleStateChanges) return NO_SUBSCRIPTION_ARRAY;
        const subscription2 = createSubscription(
          store,
          didStoreComeFromProps ? void 0 : contextValue.subscription
        );
        const notifyNestedSubs2 = subscription2.notifyNestedSubs.bind(subscription2);
        return [subscription2, notifyNestedSubs2];
      }, [store, didStoreComeFromProps, contextValue]);
      const overriddenContextValue = React.useMemo(() => {
        if (didStoreComeFromProps) {
          return contextValue;
        }
        return {
          ...contextValue,
          subscription
        };
      }, [didStoreComeFromProps, contextValue, subscription]);
      const lastChildProps = React.useRef(void 0);
      const lastWrapperProps = React.useRef(wrapperProps);
      const childPropsFromStoreUpdate = React.useRef(void 0);
      const renderIsScheduled = React.useRef(false);
      const isMounted = React.useRef(false);
      const latestSubscriptionCallbackError = React.useRef(
        void 0
      );
      useIsomorphicLayoutEffect(() => {
        isMounted.current = true;
        return () => {
          isMounted.current = false;
        };
      }, []);
      const actualChildPropsSelector = React.useMemo(() => {
        const selector = () => {
          if (childPropsFromStoreUpdate.current && wrapperProps === lastWrapperProps.current) {
            return childPropsFromStoreUpdate.current;
          }
          return childPropsSelector(store.getState(), wrapperProps);
        };
        return selector;
      }, [store, wrapperProps]);
      const subscribeForReact = React.useMemo(() => {
        const subscribe = (reactListener) => {
          if (!subscription) {
            return () => {
            };
          }
          return subscribeUpdates(
            shouldHandleStateChanges,
            store,
            subscription,
            // @ts-ignore
            childPropsSelector,
            lastWrapperProps,
            lastChildProps,
            renderIsScheduled,
            isMounted,
            childPropsFromStoreUpdate,
            notifyNestedSubs,
            reactListener
          );
        };
        return subscribe;
      }, [subscription]);
      useIsomorphicLayoutEffectWithArgs(captureWrapperProps, [
        lastWrapperProps,
        lastChildProps,
        renderIsScheduled,
        wrapperProps,
        childPropsFromStoreUpdate,
        notifyNestedSubs
      ]);
      let actualChildProps;
      try {
        actualChildProps = React.useSyncExternalStore(
          // TODO We're passing through a big wrapper that does a bunch of extra side effects besides subscribing
          subscribeForReact,
          // TODO This is incredibly hacky. We've already processed the store update and calculated new child props,
          // TODO and we're just passing that through so it triggers a re-render for us rather than relying on `uSES`.
          actualChildPropsSelector,
          getServerState ? () => childPropsSelector(getServerState(), wrapperProps) : actualChildPropsSelector
        );
      } catch (err) {
        if (latestSubscriptionCallbackError.current) {
          ;
          err.message += `
The error may be correlated with this previous error:
${latestSubscriptionCallbackError.current.stack}

`;
        }
        throw err;
      }
      useIsomorphicLayoutEffect(() => {
        latestSubscriptionCallbackError.current = void 0;
        childPropsFromStoreUpdate.current = void 0;
        lastChildProps.current = actualChildProps;
      });
      const renderedWrappedComponent = React.useMemo(() => {
        return (
          // @ts-ignore
          /* @__PURE__ */ React.createElement(
            WrappedComponent,
            {
              ...actualChildProps,
              ref: reactReduxForwardedRef
            }
          )
        );
      }, [reactReduxForwardedRef, WrappedComponent, actualChildProps]);
      const renderedChild = React.useMemo(() => {
        if (shouldHandleStateChanges) {
          return /* @__PURE__ */ React.createElement(ContextToUse.Provider, { value: overriddenContextValue }, renderedWrappedComponent);
        }
        return renderedWrappedComponent;
      }, [ContextToUse, renderedWrappedComponent, overriddenContextValue]);
      return renderedChild;
    }
    const _Connect = React.memo(ConnectFunction);
    const Connect = _Connect;
    Connect.WrappedComponent = WrappedComponent;
    Connect.displayName = ConnectFunction.displayName = displayName;
    if (forwardRef) {
      const _forwarded = React.forwardRef(
        function forwardConnectRef(props, ref) {
          return /* @__PURE__ */ React.createElement(Connect, { ...props, reactReduxForwardedRef: ref });
        }
      );
      const forwarded = _forwarded;
      forwarded.displayName = displayName;
      forwarded.WrappedComponent = WrappedComponent;
      return /* @__PURE__ */ hoistNonReactStatics(forwarded, WrappedComponent);
    }
    return /* @__PURE__ */ hoistNonReactStatics(Connect, WrappedComponent);
  };
  return wrapWithConnect;
}
var connect = _connect;
var legacy_connect = _connect;

// src/signals/pathSignalRegistry.ts
function isObjectOrArray(v) {
  return v !== null && typeof v === "object";
}
function incrementPrefixes(prefixCounts, pathKey) {
  prefixCounts.set(pathKey, (prefixCounts.get(pathKey) || 0) + 1);
  let idx = pathKey.lastIndexOf(".");
  while (idx !== -1) {
    const prefix = pathKey.substring(0, idx);
    prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
    idx = prefix.lastIndexOf(".");
  }
}
function decrementPrefixes(prefixCounts, pathKey) {
  let count = prefixCounts.get(pathKey);
  if (count !== void 0) {
    if (count <= 1) prefixCounts.delete(pathKey);
    else prefixCounts.set(pathKey, count - 1);
  }
  let idx = pathKey.lastIndexOf(".");
  while (idx !== -1) {
    const prefix = pathKey.substring(0, idx);
    count = prefixCounts.get(prefix);
    if (count !== void 0) {
      if (count <= 1) prefixCounts.delete(prefix);
      else prefixCounts.set(prefix, count - 1);
    }
    idx = prefix.lastIndexOf(".");
  }
}
function createPathSignalRegistry(engine) {
  const signals = /* @__PURE__ */ new Map();
  const prefixCounts = /* @__PURE__ */ new Map();
  const prefixOnlyPaths = /* @__PURE__ */ new Set();
  const childIndex = /* @__PURE__ */ new Map();
  const proxyWeakMap = /* @__PURE__ */ new WeakMap();
  const arrayMetas = /* @__PURE__ */ new Map();
  function addToChildIndex(pathKey) {
    const idx = pathKey.lastIndexOf(".");
    if (idx === -1) return;
    const parent = pathKey.substring(0, idx);
    let children = childIndex.get(parent);
    if (!children) {
      children = /* @__PURE__ */ new Set();
      childIndex.set(parent, children);
    }
    children.add(pathKey);
  }
  return {
    getOrCreate(pathKey, currentValue) {
      let sig = signals.get(pathKey);
      if (!sig) {
        const initialValue = isObjectOrArray(currentValue) ? 0 : currentValue;
        sig = engine.signal(initialValue);
        signals.set(pathKey, sig);
        addToChildIndex(pathKey);
        if (prefixOnlyPaths.has(pathKey)) {
          prefixOnlyPaths.delete(pathKey);
        } else {
          incrementPrefixes(prefixCounts, pathKey);
        }
      }
      return sig;
    },
    ensurePrefix(pathKey) {
      if (signals.has(pathKey) || prefixOnlyPaths.has(pathKey)) return;
      prefixOnlyPaths.add(pathKey);
      addToChildIndex(pathKey);
      incrementPrefixes(prefixCounts, pathKey);
    },
    update(pathKey, newValue) {
      const sig = signals.get(pathKey);
      if (!sig) return;
      if (isObjectOrArray(newValue)) {
        const current = sig.get();
        sig.set(typeof current === "number" ? current + 1 : 0);
      } else {
        sig.set(newValue);
      }
    },
    prune(pathKey) {
      const stack = [pathKey];
      while (stack.length > 0) {
        const key = stack.pop();
        const children = childIndex.get(key);
        if (children) {
          for (const child of children) {
            stack.push(child);
          }
          childIndex.delete(key);
        }
        if (signals.has(key)) {
          signals.delete(key);
          decrementPrefixes(prefixCounts, key);
        } else if (prefixOnlyPaths.has(key)) {
          prefixOnlyPaths.delete(key);
          decrementPrefixes(prefixCounts, key);
        }
      }
      const dotIdx = pathKey.lastIndexOf(".");
      if (dotIdx !== -1) {
        const parent = pathKey.substring(0, dotIdx);
        const parentChildren = childIndex.get(parent);
        if (parentChildren) {
          parentChildren.delete(pathKey);
          if (parentChildren.size === 0) {
            childIndex.delete(parent);
          }
        }
      }
    },
    size() {
      return signals.size;
    },
    has(pathKey) {
      return signals.has(pathKey);
    },
    hasPrefix(prefix) {
      return (prefixCounts.get(prefix) || 0) > 0;
    },
    proxyCache: proxyWeakMap,
    getArrayMeta(arrayPath) {
      return arrayMetas.get(arrayPath);
    },
    setArrayMeta(arrayPath, meta) {
      arrayMetas.set(arrayPath, meta);
    }
  };
}

// src/signals/arrayKeys.ts
var KEY_CANDIDATES = ["id", "key", "_id", "__id"];
function findKeyField(obj) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return void 0;
  for (let i = 0; i < KEY_CANDIDATES.length; i++) {
    const candidate = KEY_CANDIDATES[i];
    if (candidate in obj) {
      const value = obj[candidate];
      if (typeof value === "string" || typeof value === "number") {
        return candidate;
      }
    }
  }
  return void 0;
}
function buildIdentityPath(arrayPath, keyField, keyValue) {
  return arrayPath ? `${arrayPath}.{${keyField}:${keyValue}}` : `{${keyField}:${keyValue}}`;
}
function getKeyValue(element, keyField) {
  if (element === null || typeof element !== "object" || Array.isArray(element)) {
    return void 0;
  }
  const value = element[keyField];
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }
  return void 0;
}

// src/signals/diff.ts
function isPlainObject2(v) {
  if (v === null || typeof v !== "object") return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}
function diffObject(prev, next, parentPath, registry) {
  const nextKeys = Object.keys(next);
  const prevKeys = Object.keys(prev);
  let keysChanged = prevKeys.length !== nextKeys.length;
  if (parentPath) {
    registry.update(parentPath, next);
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    if (!keysChanged && !(key in prev)) {
      keysChanged = true;
    }
    if (prev[key] === next[key]) continue;
    const childPath = parentPath ? parentPath + "." + key : key;
    if (registry.hasPrefix(childPath)) {
      diffAndUpdateSignals(prev[key], next[key], childPath, registry);
    }
  }
  if (keysChanged) {
    const keysPath = parentPath ? parentPath + ".@@keys" : "@@keys";
    registry.update(keysPath, nextKeys);
    for (let i = 0; i < prevKeys.length; i++) {
      if (!(prevKeys[i] in next)) {
        const childPath = parentPath ? parentPath + "." + prevKeys[i] : prevKeys[i];
        registry.prune(childPath);
      }
    }
  }
}
function diffArray(prev, next, parentPath, registry) {
  if (parentPath) {
    registry.update(parentPath, next);
  }
  if (prev.length !== next.length) {
    const keysPath = parentPath ? parentPath + ".@@keys" : "@@keys";
    registry.update(keysPath, next.length);
    const lengthPath = parentPath ? parentPath + ".length" : "length";
    registry.update(lengthPath, next.length);
  }
  let meta = registry.getArrayMeta(parentPath);
  if (meta) {
    if (meta.entityMap.size === 0 && prev.length > 0) {
      for (let i = 0; i < prev.length; i++) {
        const kv = getKeyValue(prev[i], meta.keyField);
        if (kv !== void 0) meta.entityMap.set(kv, prev[i]);
      }
    }
  } else if (next.length > 0) {
    const keyField = findKeyField(next[0]);
    if (keyField) {
      const entityMap = /* @__PURE__ */ new Map();
      for (let i = 0; i < prev.length; i++) {
        const kv = getKeyValue(prev[i], keyField);
        if (kv !== void 0) entityMap.set(kv, prev[i]);
      }
      meta = { keyField, entityMap };
      registry.setArrayMeta(parentPath, meta);
    }
  }
  if (meta) {
    diffArrayByKey(prev, next, parentPath, registry, meta);
  } else {
    diffArrayByIndex(prev, next, parentPath, registry);
  }
}
function diffAndUpdateSignals(prev, next, parentPath, registry) {
  if (prev === next) return;
  if (isPlainObject2(prev) && isPlainObject2(next)) {
    diffObject(prev, next, parentPath, registry);
    return;
  }
  if (Array.isArray(prev) && Array.isArray(next)) {
    diffArray(prev, next, parentPath, registry);
    return;
  }
  if (parentPath) {
    registry.update(parentPath, next);
  }
  if (prev !== null && typeof prev === "object" && (next === null || typeof next !== "object")) {
    registry.prune(parentPath);
  }
}
function diffArrayByKey(prev, next, parentPath, registry, meta) {
  const { keyField, entityMap: prevEntityMap } = meta;
  if (prev.length === next.length) {
    let usedFastPath = true;
    for (let i = 0; i < next.length; i++) {
      if (prev[i] === next[i]) continue;
      const prevKv = getKeyValue(prev[i], keyField);
      const nextKv = getKeyValue(next[i], keyField);
      if (prevKv === void 0 || nextKv === void 0 || prevKv !== nextKv) {
        usedFastPath = false;
        break;
      }
      const identityPath = buildIdentityPath(parentPath, keyField, nextKv);
      if (registry.hasPrefix(identityPath)) {
        diffAndUpdateSignals(prev[i], next[i], identityPath, registry);
      }
      prevEntityMap.set(nextKv, next[i]);
    }
    if (usedFastPath) {
      return;
    }
    for (let i = 0; i < prev.length; i++) {
      const kv = getKeyValue(prev[i], keyField);
      if (kv !== void 0) prevEntityMap.set(kv, prev[i]);
    }
  }
  const minLen = Math.min(prev.length, next.length);
  let startIdx = 0;
  while (startIdx < minLen && prev[startIdx] === next[startIdx]) {
    startIdx++;
  }
  if (startIdx === minLen && next.length >= prev.length) {
    for (let i = startIdx; i < next.length; i++) {
      const nextItem = next[i];
      const kv = getKeyValue(nextItem, keyField);
      if (kv !== void 0) {
        prevEntityMap.set(kv, nextItem);
        const identityPath = buildIdentityPath(parentPath, keyField, kv);
        if (registry.hasPrefix(identityPath)) {
          diffAndUpdateSignals(void 0, nextItem, identityPath, registry);
        }
      }
    }
    return;
  }
  if (startIdx === minLen && prev.length > next.length) {
    for (let i = startIdx; i < prev.length; i++) {
      const prevItem = prev[i];
      const kv = getKeyValue(prevItem, keyField);
      if (kv !== void 0) {
        prevEntityMap.delete(kv);
        const identityPath = buildIdentityPath(parentPath, keyField, kv);
        registry.prune(identityPath);
      }
    }
    return;
  }
  const mayHaveRemovals = next.length < prev.length;
  const nextEntityMap = /* @__PURE__ */ new Map();
  for (let i = 0; i < startIdx; i++) {
    const kv = getKeyValue(next[i], keyField);
    if (kv !== void 0) nextEntityMap.set(kv, next[i]);
  }
  const seenPrevKeys = mayHaveRemovals ? /* @__PURE__ */ new Set() : null;
  if (seenPrevKeys) {
    for (let i = 0; i < startIdx; i++) {
      const kv = getKeyValue(prev[i], keyField);
      if (kv !== void 0) seenPrevKeys.add(kv);
    }
  }
  for (let i = startIdx; i < next.length; i++) {
    const nextItem = next[i];
    const kv = getKeyValue(nextItem, keyField);
    if (kv === void 0) {
      const childPath = parentPath ? parentPath + "." + i : String(i);
      if (registry.hasPrefix(childPath)) {
        const prevItem2 = i < prev.length ? prev[i] : void 0;
        if (prevItem2 !== nextItem) {
          diffAndUpdateSignals(prevItem2, nextItem, childPath, registry);
        }
      }
      continue;
    }
    nextEntityMap.set(kv, nextItem);
    const prevItem = prevEntityMap.get(kv);
    if (prevItem === nextItem) {
      if (seenPrevKeys) seenPrevKeys.add(kv);
      continue;
    }
    if (seenPrevKeys) seenPrevKeys.add(kv);
    const identityPath = buildIdentityPath(parentPath, keyField, kv);
    if (prevItem !== void 0) {
      if (registry.hasPrefix(identityPath)) {
        diffAndUpdateSignals(prevItem, nextItem, identityPath, registry);
      }
    } else {
      if (registry.hasPrefix(identityPath)) {
        diffAndUpdateSignals(void 0, nextItem, identityPath, registry);
      }
    }
  }
  if (seenPrevKeys) {
    for (const [kv] of prevEntityMap) {
      if (!seenPrevKeys.has(kv)) {
        const identityPath = buildIdentityPath(parentPath, keyField, kv);
        registry.prune(identityPath);
      }
    }
  }
  meta.entityMap = nextEntityMap;
}
function diffArrayByIndex(prev, next, parentPath, registry) {
  const minLen = Math.min(prev.length, next.length);
  for (let i = 0; i < minLen; i++) {
    if (prev[i] !== next[i]) {
      const childPath = parentPath ? parentPath + "." + i : String(i);
      if (registry.hasPrefix(childPath)) {
        diffAndUpdateSignals(prev[i], next[i], childPath, registry);
      }
    }
  }
  for (let i = minLen; i < next.length; i++) {
    const childPath = parentPath ? parentPath + "." + i : String(i);
    if (registry.hasPrefix(childPath)) {
      diffAndUpdateSignals(void 0, next[i], childPath, registry);
    }
  }
  for (let i = next.length; i < prev.length; i++) {
    const childPath = parentPath ? parentPath + "." + i : String(i);
    registry.prune(childPath);
  }
}
function reconcileState(prev, next, registry, engine) {
  engine.batch(() => {
    diffAndUpdateSignals(prev, next, "", registry);
  });
}

// src/signals/engine.ts
import {
  signal as alienSignal,
  computed as alienComputed,
  effect as alienEffect,
  effectScope as alienEffectScope,
  startBatch,
  endBatch
} from "alien-signals";
var alienEngine = {
  signal(value) {
    const s = alienSignal(value);
    return {
      get: () => s(),
      set: (v) => s(v)
    };
  },
  computed(fn) {
    const c = alienComputed(fn);
    return { get: () => c() };
  },
  effect(fn) {
    alienEffect(fn);
  },
  batch(fn) {
    startBatch();
    try {
      fn();
    } finally {
      endBatch();
    }
  },
  createScope() {
    let dispose;
    return {
      run(fn) {
        let result;
        dispose = alienEffectScope(() => {
          result = fn();
        });
        return result;
      },
      stop() {
        dispose?.();
        dispose = void 0;
      }
    };
  }
};

// src/signals/SignalProvider.tsx
function SignalProvider(providerProps) {
  const {
    children,
    context,
    serverState,
    store,
    engine = alienEngine
  } = providerProps;
  const registryRef = React.useRef(createPathSignalRegistry(engine));
  const registry = registryRef.current;
  const prevStateRef = React.useRef(store.getState());
  const contextValue = React.useMemo(() => {
    const subscription = createSubscription(store);
    const baseContextValue = {
      store,
      subscription,
      getServerState: serverState ? () => serverState : void 0,
      registry,
      engine
    };
    if (process.env.NODE_ENV === "production") {
      return baseContextValue;
    } else {
      const { identityFunctionCheck = "once", stabilityCheck = "once" } = providerProps;
      return Object.assign(baseContextValue, {
        stabilityCheck,
        identityFunctionCheck
      });
    }
  }, [store, serverState, registry, engine]);
  const previousState = React.useMemo(() => store.getState(), [store]);
  useIsomorphicLayoutEffect(() => {
    const { subscription } = contextValue;
    subscription.onStateChange = () => {
      const prev = prevStateRef.current;
      const next = store.getState();
      prevStateRef.current = next;
      reconcileState(prev, next, registry, engine);
      subscription.notifyNestedSubs();
    };
    subscription.trySubscribe();
    if (previousState !== store.getState()) {
      subscription.notifyNestedSubs();
    }
    return () => {
      subscription.tryUnsubscribe();
      subscription.onStateChange = void 0;
    };
  }, [contextValue, previousState]);
  const Context = context || ReactReduxContext;
  return /* @__PURE__ */ React.createElement(Context.Provider, { value: contextValue }, children);
}

// src/signals/context.ts
function useSignalContext() {
  const contextValue = React.useContext(
    ReactReduxContext
  );
  if (!contextValue) {
    throw new Error(
      "useSignalSelector must be used within a <SignalProvider>"
    );
  }
  if (!("registry" in contextValue) || !("engine" in contextValue)) {
    throw new Error(
      "useSignalSelector must be used within a <SignalProvider>, not a regular <Provider>"
    );
  }
  return contextValue;
}

// src/signals/arrayMethodOverrides.ts
var FIND_METHODS = /* @__PURE__ */ new Set(["find", "findLast"]);
var OVERRIDDEN_METHODS = /* @__PURE__ */ new Set([
  // Subset — return proxied results
  "find",
  "findLast",
  "filter",
  "slice",
  // Primitive-returning
  "findIndex",
  "findLastIndex",
  "some",
  "every",
  "indexOf",
  "lastIndexOf",
  "includes",
  "join",
  "toString",
  "toLocaleString",
  // Transform — return raw values
  "concat",
  "flat"
]);
function isOverriddenArrayMethod(prop) {
  return OVERRIDDEN_METHODS.has(prop);
}
function normalizeSliceIndex(index, length) {
  if (index < 0) {
    return Math.max(length + index, 0);
  }
  return Math.min(index, length);
}
function createArrayMethodInterceptor(target, proxy, method) {
  return function intercepted(...args) {
    const m = method;
    if (m === "filter") {
      const predicate = args[0];
      const result = [];
      for (let i = 0; i < target.length; i++) {
        if (predicate(target[i], i, target)) {
          result.push(proxy[i]);
        }
      }
      return result;
    }
    if (FIND_METHODS.has(m)) {
      const predicate = args[0];
      const isForward = m === "find";
      const step = isForward ? 1 : -1;
      const start = isForward ? 0 : target.length - 1;
      for (let i = start; i >= 0 && i < target.length; i += step) {
        if (predicate(target[i], i, target)) {
          return proxy[i];
        }
      }
      return void 0;
    }
    if (m === "slice") {
      const rawStart = args[0] ?? 0;
      const rawEnd = args[1] ?? target.length;
      const start = normalizeSliceIndex(rawStart, target.length);
      const end = normalizeSliceIndex(rawEnd, target.length);
      const result = [];
      for (let i = start; i < end; i++) {
        result.push(proxy[i]);
      }
      return result;
    }
    return target[m](...args);
  };
}

// src/signals/trackingProxy.ts
function isObjectOrArray2(v) {
  return v !== null && typeof v === "object";
}
var proxyPathMap = /* @__PURE__ */ new WeakMap();
function getProxyPath(value) {
  if (value !== null && typeof value === "object") {
    return proxyPathMap.get(value);
  }
  return void 0;
}
function createTrackingProxy(target, parentPath, registry, cache) {
  const cached = cache.get(target);
  if (cached) return cached;
  const shell = Array.isArray(target) ? [] : Object.create(Object.getPrototypeOf(target));
  const proxy = new Proxy(shell, {
    get(_obj, prop, _receiver) {
      if (typeof prop === "symbol") return Reflect.get(target, prop);
      const value = target[prop];
      if (typeof value === "function") {
        if (Array.isArray(target) && isOverriddenArrayMethod(prop)) {
          return createArrayMethodInterceptor(target, proxy, prop);
        }
        return value;
      }
      let pathKey = parentPath ? parentPath + "." + prop : prop;
      if (isObjectOrArray2(value)) {
        if (Array.isArray(target) && !Array.isArray(value) && !isNaN(Number(prop))) {
          let meta = registry.getArrayMeta(parentPath);
          if (!meta) {
            const keyField = findKeyField(value);
            if (keyField) {
              meta = { keyField, entityMap: /* @__PURE__ */ new Map() };
              registry.setArrayMeta(parentPath, meta);
            }
          }
          if (meta) {
            const kv = getKeyValue(value, meta.keyField);
            if (kv !== void 0) {
              pathKey = buildIdentityPath(parentPath, meta.keyField, kv);
            }
          }
        }
        registry.ensurePrefix(pathKey);
        const childProxy = createTrackingProxy(
          value,
          pathKey,
          registry,
          cache
        );
        return childProxy;
      }
      registry.getOrCreate(pathKey, value).get();
      return value;
    },
    // Track when selectors iterate keys (Object.keys, for...in, .map, .filter, etc.)
    ownKeys(_obj) {
      const keysPath = parentPath ? parentPath + ".@@keys" : "@@keys";
      registry.getOrCreate(keysPath, Reflect.ownKeys(target)).get();
      return Reflect.ownKeys(target);
    },
    // Track has() checks for conditional property access (e.g., 'key' in obj)
    has(_obj, prop) {
      if (typeof prop === "symbol") return Reflect.has(target, prop);
      const pathKey = parentPath ? parentPath + "." + prop : prop;
      registry.getOrCreate(pathKey, target[prop]).get();
      return Reflect.has(target, prop);
    },
    // Delegate to real target for property descriptors
    getOwnPropertyDescriptor(_obj, prop) {
      const desc = Object.getOwnPropertyDescriptor(target, prop);
      if (desc) {
        return { ...desc, configurable: true };
      }
      return desc;
    },
    // Report the real target's prototype
    getPrototypeOf(_obj) {
      return Object.getPrototypeOf(target);
    },
    // Report the real target's extensibility
    isExtensible(_obj) {
      return Object.isExtensible(target);
    },
    // Prevent mutation
    set() {
      return false;
    },
    deleteProperty() {
      return false;
    }
  });
  cache.set(target, proxy);
  proxyPathMap.set(proxy, parentPath);
  return proxy;
}

// src/signals/useSignalSelector.ts
var { useRef, useMemo, useEffect, useSyncExternalStore } = React;
function useSignalSelector(selector, equalityFn = Object.is) {
  const { store, registry, engine } = useSignalContext();
  const selectorRef = useRef(selector);
  const equalityFnRef = useRef(equalityFn);
  useIsomorphicLayoutEffect(() => {
    selectorRef.current = selector;
    equalityFnRef.current = equalityFn;
  });
  const bridge = useMemo(() => {
    let currentResult;
    let version = 0;
    let notifyReact = null;
    let effectDispose = null;
    const selectorComputed = engine.computed(() => {
      const state = store.getState();
      const proxy = createTrackingProxy(state, "", registry, registry.proxyCache);
      const result = selectorRef.current(proxy);
      const proxyPath = getProxyPath(result);
      if (proxyPath !== void 0) {
        registry.getOrCreate(proxyPath, result).get();
      }
      return result;
    });
    currentResult = selectorComputed.get();
    return {
      subscribe(onStoreChange) {
        notifyReact = onStoreChange;
        const scope = engine.createScope();
        effectDispose = scope.run(() => {
          let isFirst = true;
          return engine.effect(() => {
            const newValue = selectorComputed.get();
            if (isFirst) {
              isFirst = false;
              return;
            }
            if (!equalityFnRef.current(currentResult, newValue)) {
              currentResult = newValue;
              version++;
              notifyReact?.();
            }
          });
        });
        return () => {
          notifyReact = null;
          effectDispose?.();
          effectDispose = null;
        };
      },
      getSnapshot() {
        return currentResult;
      }
    };
  }, [store, registry, engine]);
  useEffect(() => {
    return () => {
    };
  }, [bridge]);
  return useSyncExternalStore(bridge.subscribe, bridge.getSnapshot);
}

// src/hooks/useReduxContext.ts
function createReduxContextHook(context = ReactReduxContext) {
  return function useReduxContext2() {
    const contextValue = React.useContext(context);
    if (process.env.NODE_ENV !== "production" && !contextValue) {
      throw new Error(
        "could not find react-redux context value; please ensure the component is wrapped in a <Provider>"
      );
    }
    return contextValue;
  };
}
var useReduxContext = /* @__PURE__ */ createReduxContextHook();

// src/hooks/useStore.ts
function createStoreHook(context = ReactReduxContext) {
  const useReduxContext2 = context === ReactReduxContext ? useReduxContext : (
    // @ts-ignore
    createReduxContextHook(context)
  );
  const useStore2 = () => {
    const { store } = useReduxContext2();
    return store;
  };
  Object.assign(useStore2, {
    withTypes: () => useStore2
  });
  return useStore2;
}
var useStore = /* @__PURE__ */ createStoreHook();

// src/hooks/useDispatch.ts
function createDispatchHook(context = ReactReduxContext) {
  const useStore2 = context === ReactReduxContext ? useStore : createStoreHook(context);
  const useDispatch2 = () => {
    const store = useStore2();
    return store.dispatch;
  };
  Object.assign(useDispatch2, {
    withTypes: () => useDispatch2
  });
  return useDispatch2;
}
var useDispatch = /* @__PURE__ */ createDispatchHook();

// src/hooks/useSelector.ts
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector.js";
var refEquality = (a, b) => a === b;
function createSelectorHook(context = ReactReduxContext) {
  const useReduxContext2 = context === ReactReduxContext ? useReduxContext : createReduxContextHook(context);
  const useSelector2 = (selector, equalityFnOrOptions = {}) => {
    const { equalityFn = refEquality } = typeof equalityFnOrOptions === "function" ? { equalityFn: equalityFnOrOptions } : equalityFnOrOptions;
    if (process.env.NODE_ENV !== "production") {
      if (!selector) {
        throw new Error(`You must pass a selector to useSelector`);
      }
      if (typeof selector !== "function") {
        throw new Error(`You must pass a function as a selector to useSelector`);
      }
      if (typeof equalityFn !== "function") {
        throw new Error(
          `You must pass a function as an equality function to useSelector`
        );
      }
    }
    const reduxContext = useReduxContext2();
    const { store, subscription, getServerState } = reduxContext;
    const firstRun = React.useRef(true);
    const wrappedSelector = React.useCallback(
      {
        [selector.name](state) {
          const selected = selector(state);
          if (process.env.NODE_ENV !== "production") {
            const { devModeChecks = {} } = typeof equalityFnOrOptions === "function" ? {} : equalityFnOrOptions;
            const { identityFunctionCheck, stabilityCheck } = reduxContext;
            const {
              identityFunctionCheck: finalIdentityFunctionCheck,
              stabilityCheck: finalStabilityCheck
            } = {
              stabilityCheck,
              identityFunctionCheck,
              ...devModeChecks
            };
            if (finalStabilityCheck === "always" || finalStabilityCheck === "once" && firstRun.current) {
              const toCompare = selector(state);
              if (!equalityFn(selected, toCompare)) {
                let stack = void 0;
                try {
                  throw new Error();
                } catch (e) {
                  ;
                  ({ stack } = e);
                }
                console.warn(
                  "Selector " + (selector.name || "unknown") + " returned a different result when called with the same parameters. This can lead to unnecessary rerenders.\nSelectors that return a new reference (such as an object or an array) should be memoized: https://redux.js.org/usage/deriving-data-selectors#optimizing-selectors-with-memoization",
                  {
                    state,
                    selected,
                    selected2: toCompare,
                    stack
                  }
                );
              }
            }
            if (finalIdentityFunctionCheck === "always" || finalIdentityFunctionCheck === "once" && firstRun.current) {
              if (selected === state) {
                let stack = void 0;
                try {
                  throw new Error();
                } catch (e) {
                  ;
                  ({ stack } = e);
                }
                console.warn(
                  "Selector " + (selector.name || "unknown") + " returned the root state when called. This can lead to unnecessary rerenders.\nSelectors that return the entire state are almost certainly a mistake, as they will cause a rerender whenever *anything* in state changes.",
                  { stack }
                );
              }
            }
            if (firstRun.current) firstRun.current = false;
          }
          return selected;
        }
      }[selector.name],
      [selector]
    );
    const selectedState = useSyncExternalStoreWithSelector(
      subscription.addNestedSub,
      store.getState,
      getServerState || store.getState,
      wrappedSelector,
      equalityFn
    );
    React.useDebugValue(selectedState);
    return selectedState;
  };
  Object.assign(useSelector2, {
    withTypes: () => useSelector2
  });
  return useSelector2;
}

// src/exports.ts
var useSelector = useSignalSelector;
var Provider = SignalProvider;
var batch = defaultNoopBatch;
export {
  Provider,
  ReactReduxContext,
  batch,
  connect,
  createDispatchHook,
  createSelectorHook,
  createStoreHook,
  legacy_connect,
  shallowEqual,
  useDispatch,
  useSelector,
  useStore
};
//# sourceMappingURL=react-redux.mjs.map