// BENCHMARK OVERRIDE — copied over react-redux's src/exports.ts by
// `bun bench.ts run --exports bench-exports.ts`, and restored afterwards.
//
// It re-points the public `Provider` and `useSelector` names at
// `SignalProvider` / `useSignalSelector`, so the published build exercises
// the signal path everywhere the benchmark scenarios import react-redux —
// without any scenario changes, and without this aliasing living in the
// react-redux repo (where it broke the test suite and the type tests).
//
// Keep in sync with react-redux's own src/exports.ts when that file gains
// or drops exports. The only intentional differences are the four marked
// below.
import { connect, legacy_connect } from './components/connect'
export type {
  Connect,
  ConnectProps,
  ConnectedProps,
} from './components/connect'

import shallowEqual from './utils/shallowEqual'

// DIFFERENCE 1: stock imports Provider here; the alias below replaces it.
// import Provider from './components/Provider'
import { defaultNoopBatch } from './utils/batch'
import { SignalProvider, useSignalSelector, unwrap } from './signals'

export { ReactReduxContext } from './components/Context'
export type { ReactReduxContextValue } from './components/Context'

export type { ProviderProps } from './components/Provider'

export type {
  MapDispatchToProps,
  MapDispatchToPropsFactory,
  MapDispatchToPropsFunction,
  MapDispatchToPropsNonObject,
  MapDispatchToPropsParam,
  MapStateToProps,
  MapStateToPropsFactory,
  MapStateToPropsParam,
  MergeProps,
  Selector,
  SelectorFactory,
} from './connect/selectorFactory'

export { createDispatchHook, useDispatch } from './hooks/useDispatch'
export type { UseDispatch } from './hooks/useDispatch'

// DIFFERENCE 2: stock also exports useSelector here.
export { createSelectorHook /*, useSelector*/ } from './hooks/useSelector'
export type { UseSelector } from './hooks/useSelector'

export { createStoreHook, useStore } from './hooks/useStore'
export type { UseStore } from './hooks/useStore'

export type { Subscription } from './utils/Subscription'

export * from './types'

/**
 * @deprecated As of React 18, batching is enabled by default for ReactDOM and React Native.
 * This is now a no-op that immediately runs the callback.
 */
const batch = defaultNoopBatch

// DIFFERENCE 3 and 4: the aliases. Stock exports `Provider` from
// './components/Provider' and `useSelector` from './hooks/useSelector'.
export const Provider = SignalProvider
export const useSelector = useSignalSelector

export {
  // Provider,  <- DIFFERENCE 3: replaced by the alias above
  batch,
  connect,
  legacy_connect,
  shallowEqual,
  SignalProvider,
  unwrap,
  useSignalSelector,
}
