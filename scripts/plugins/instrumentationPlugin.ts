import type { Plugin } from 'vite'
import { transformReduxDispatch } from '../transforms/reduxTransform'
import { transformUseSyncExternalStoreWithSelector } from '../transforms/usesTransform'
import { transformSignalProvider, transformSignalSelector } from '../transforms/reactReduxSignalTransform'
import { INST_INIT_CODE } from '../../src/common/instrumentation'

/**
 * Vite plugin that instruments library source code at build time.
 * Inserts performance.now() timing accumulators into Redux dispatch,
 * uSES memoizedSelector, and signal experiment hooks.
 *
 * Activated by --instrument flag. Module ID matching in the transform hook
 * identifies which library is being processed.
 */
export function instrumentationPlugin(): Plugin {
  let initInjected = false

  return {
    name: 'benchmark-instrumentation',
    enforce: 'pre',

    transform(code, id) {
      // Normalize path separators for matching
      const normalizedId = id.replace(/\\/g, '/')

      // Redux dispatch — redux.mjs (ESM)
      if (normalizedId.includes('/redux/dist/redux.mjs')) {
        let result = code
        // Inject accumulator init code at the top of the Redux module (first to load)
        if (!initInjected) {
          result = INST_INIT_CODE + '\n' + result
          initInjected = true
        }
        const transformed = transformReduxDispatch(result)
        if (transformed) {
          return { code: transformed, map: null }
        }
      }

      // uSES production CJS — use-sync-external-store-with-selector.production.js
      if (normalizedId.includes('use-sync-external-store-with-selector.production')) {
        let result = code
        if (!initInjected) {
          result = INST_INIT_CODE + '\n' + result
          initInjected = true
        }
        const transformed = transformUseSyncExternalStoreWithSelector(result)
        if (transformed) {
          return { code: transformed, map: null }
        }
      }

      // Signal experiment — the .yalc react-redux resolves through pnpm as
      // react-redux@file+.yalc+reac.../node_modules/react-redux/dist/react-redux.mjs
      // Match any react-redux.mjs that comes from a file: protocol link (the .yalc version)
      if (normalizedId.includes('/react-redux/dist/react-redux.mjs') && normalizedId.includes('file+.yalc')) {
        let result = code
        if (!initInjected) {
          result = INST_INIT_CODE + '\n' + result
          initInjected = true
        }
        const providerTransformed = transformSignalProvider(result)
        if (providerTransformed) {
          result = providerTransformed
        }
        const selectorTransformed = transformSignalSelector(result)
        if (selectorTransformed) {
          result = selectorTransformed
        }
        if (result !== code) {
          return { code: result, map: null }
        }
      }

      return null
    },
  }
}
