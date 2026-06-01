import { parse, Lang } from '@ast-grep/napi'

/**
 * Instruments useSyncExternalStoreWithSelector's memoizedSelector function.
 *
 * Target: production CJS (semi-minified, but variable names preserved).
 * The memoizedSelector function has two paths:
 *
 * 1. First call (!hasMemo):
 *    - selector(nextSnapshot) → selectorTime
 *    - isEqual(currentSelection, nextSnapshot) → equalityCheckTime
 *
 * 2. Subsequent calls:
 *    - objectIs(memoizedSnapshot, nextSnapshot) → short circuit (no cost)
 *    - selector(nextSnapshot) → selectorTime
 *    - isEqual(currentSelection, nextSelection) → equalityCheckTime
 *
 * We wrap every selector() call and every isEqual() call.
 */
export function transformUseSyncExternalStoreWithSelector(code: string): string | null {
  const root = parse(Lang.JavaScript, code).root()

  // Strategy: find all `selector(nextSnapshot)` calls and `isEqual(...)` calls
  // within the memoizedSelector function body.
  //
  // Since this is CJS with a specific structure, we use pattern matching.
  // The function has these exact call patterns:
  //   selector(nextSnapshot)     — called twice (first-run and cache-miss paths)
  //   isEqual(currentSelection, nextSnapshot)  — first-run path
  //   isEqual(currentSelection, nextSelection) — cache-miss path

  // Find all selector(nextSnapshot) calls
  const selectorCalls = root.findAll({
    rule: {
      pattern: 'selector(nextSnapshot)',
    },
  })

  if (selectorCalls.length === 0) {
    console.warn('[instrumentation] Could not find selector(nextSnapshot) in uSES')
    return null
  }

  // Find all isEqual calls (two-argument calls to isEqual)
  const isEqualCalls = root.findAll({
    rule: {
      pattern: 'isEqual($_, $_)',
    },
  })

  // Build splice list
  interface Splice {
    offset: number
    deleteCount: number
    insert: string
  }
  const splices: Splice[] = []

  // Wrap each selector(nextSnapshot) call:
  //   selector(nextSnapshot)
  // becomes:
  //   (globalThis.__benchInst.selectorCount++, (() => { const __ts0 = performance.now(); const __tsR = selector(nextSnapshot); globalThis.__benchInst.selectorTime += performance.now() - __ts0; return __tsR; })())
  //
  // But this is complex as an expression replacement. Simpler: since these are
  // used in assignments like `nextSnapshot = selector(nextSnapshot)`, we can
  // wrap the call expression inline.
  //
  // Actually, the cleanest approach: replace `selector(nextSnapshot)` with a
  // timing wrapper IIFE.

  for (const call of selectorCalls) {
    const start = call.range().start.index
    const end = call.range().end.index
    const original = code.slice(start, end)

    splices.push({
      offset: start,
      deleteCount: end - start,
      insert: `(globalThis.__benchInst.selectorCount++, (() => { const __ts = performance.now(); const __tr = ${original}; globalThis.__benchInst.selectorTime += performance.now() - __ts; return __tr; })())`,
    })
  }

  for (const call of isEqualCalls) {
    const start = call.range().start.index
    const end = call.range().end.index
    const original = code.slice(start, end)

    splices.push({
      offset: start,
      deleteCount: end - start,
      insert: `(globalThis.__benchInst.equalityCheckCount++, (() => { const __te = performance.now(); const __tr = ${original}; globalThis.__benchInst.equalityCheckTime += performance.now() - __te; return __tr; })())`,
    })
  }

  if (splices.length === 0) {
    return null
  }

  // Apply splices in reverse offset order
  splices.sort((a, b) => b.offset - a.offset)

  let result = code
  for (const splice of splices) {
    result =
      result.slice(0, splice.offset) +
      splice.insert +
      result.slice(splice.offset + splice.deleteCount)
  }

  return result
}
