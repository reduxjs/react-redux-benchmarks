import { parse, Lang } from '@ast-grep/napi'

/**
 * Instruments SignalProvider's store subscription callback to time reconcile + flush.
 *
 * Target pattern in .yalc/react-redux/dist/react-redux.mjs:
 *   const storeUnsubscribe = store.subscribe(() => {
 *     const newState = store.getState();
 *     setStore(reconcile(newState, keyFn));
 *     flush();
 *   });
 *
 * We wrap the two lines (setStore + flush) with timing.
 */
export function transformSignalProvider(code: string): string | null {
  const root = parse(Lang.JavaScript, code).root()

  // Find: setStore(reconcile(newState, keyFn))
  const reconcileCall = root.find({
    rule: {
      pattern: 'setStore(reconcile($_, $_))',
    },
  })

  if (!reconcileCall) {
    console.warn('[instrumentation] Could not find setStore(reconcile(...)) in signal provider')
    return null
  }

  // Find: flush() — the one immediately after setStore
  // We want the flush() call that's in the same callback as setStore(reconcile(...))
  const flushCalls = root.findAll({
    rule: {
      pattern: 'flush()',
    },
  })

  // Find the flush() that's nearest after the reconcile call
  const reconcileEnd = reconcileCall.range().end.index
  let targetFlush = null
  for (const fc of flushCalls) {
    if (fc.range().start.index > reconcileEnd) {
      targetFlush = fc
      break
    }
  }

  if (!targetFlush) {
    console.warn('[instrumentation] Could not find flush() after setStore(reconcile(...))')
    return null
  }

  // Get the expression_statement for setStore (we want to insert before it)
  const setStoreStmt = reconcileCall.parent()
  if (!setStoreStmt) {
    console.warn('[instrumentation] Could not find setStore parent statement')
    return null
  }

  // Get the expression_statement for flush() (we want to insert after it)
  const flushStmt = targetFlush.parent()
  if (!flushStmt) {
    console.warn('[instrumentation] Could not find flush parent statement')
    return null
  }

  const beforeStart = setStoreStmt.range().start.index
  let afterEnd = flushStmt.range().end.index
  // Include trailing semicolon
  if (code[afterEnd] === ';') afterEnd++

  // Insert timing around the setStore + flush block
  const before = 'const __tr0 = performance.now(); '
  const after = ' const __tr1 = performance.now(); globalThis.__benchInst.reconcileTime += __tr1 - __tr0; globalThis.__benchInst.reconcileCount++;'

  let result = code
  // Insert after first (higher offset)
  result = result.slice(0, afterEnd) + after + result.slice(afterEnd)
  // Insert before (lower offset, still valid)
  result = result.slice(0, beforeStart) + before + result.slice(beforeStart)

  return result
}

/**
 * Instruments useSignalSelector's createMemo callback to time signal selector execution.
 *
 * Target pattern in .yalc/react-redux/dist/react-redux.mjs:
 *   const memo = createMemo(
 *     () => {
 *       track();
 *       const result = selectorRef.current(solidStore);
 *       deepRead(result);
 *       return snapshot(result);
 *     },
 *     ...
 *   );
 *
 * We wrap the body of the arrow function passed to createMemo.
 */
export function transformSignalSelector(code: string): string | null {
  const root = parse(Lang.JavaScript, code).root()

  // Find: selectorRef.current(solidStore)
  // This is the unique pattern inside the createMemo callback
  const selectorCall = root.find({
    rule: {
      pattern: 'selectorRef.current(solidStore)',
    },
  })

  if (!selectorCall) {
    console.warn('[instrumentation] Could not find selectorRef.current(solidStore) in signal selector')
    return null
  }

  // Navigate up to find the arrow function body that contains this call.
  // We want to instrument: track() through return snapshot(result)
  //
  // Find track() call that's in the same block
  const trackCalls = root.findAll({
    rule: {
      pattern: 'track()',
    },
  })

  // Find the track() call nearest before selectorRef.current(solidStore)
  const selectorStart = selectorCall.range().start.index
  let targetTrack = null
  for (const tc of trackCalls) {
    if (tc.range().start.index < selectorStart) {
      targetTrack = tc
    }
  }

  if (!targetTrack) {
    console.warn('[instrumentation] Could not find track() before selectorRef.current(solidStore)')
    return null
  }

  // Find `return snapshot(result)` after the selector call
  const snapshotReturns = root.findAll({
    rule: {
      pattern: 'return snapshot($_)',
    },
  })

  let targetReturn = null
  for (const sr of snapshotReturns) {
    if (sr.range().start.index > selectorStart) {
      targetReturn = sr
      break
    }
  }

  if (!targetReturn) {
    console.warn('[instrumentation] Could not find return snapshot(result) after selector call')
    return null
  }

  // Get the track() statement start
  const trackStmt = targetTrack.parent()
  if (!trackStmt) {
    console.warn('[instrumentation] Could not find track() parent statement')
    return null
  }

  // Get the return statement end
  let returnEnd = targetReturn.range().end.index
  if (code[returnEnd] === ';') returnEnd++

  const trackStart = trackStmt.range().start.index

  // Insert timing: before track() and after return snapshot(result)
  // Since `return` is involved, we need to capture the return value
  // Strategy: wrap in a block that times and then returns
  //
  // Original:
  //   track();
  //   const result = selectorRef.current(solidStore);
  //   deepRead(result);
  //   return snapshot(result);
  //
  // Instrumented:
  //   const __tss0 = performance.now();
  //   track();
  //   const result = selectorRef.current(solidStore);
  //   deepRead(result);
  //   const __tssR = snapshot(result);
  //   globalThis.__benchInst.signalSelectorTime += performance.now() - __tss0;
  //   globalThis.__benchInst.signalSelectorCount++;
  //   return __tssR;
  //
  // But this requires rewriting the return statement. Let's do a simpler approach:
  // Just time from track() to after return, wrapping the whole block minus the return.

  // Actually, simplest approach: insert timing start before track(),
  // and timing end after the `return snapshot(result);` — but that won't execute
  // because `return` exits. So we need to transform the return.

  // Let's use a different strategy: wrap the entire memo callback body.
  // Find the return statement and replace it.

  // Find `snapshot(result)` in the return
  const snapshotCall = targetReturn.find({
    rule: {
      pattern: 'snapshot($_)',
    },
  })

  if (!snapshotCall) {
    console.warn('[instrumentation] Could not find snapshot() in return statement')
    return null
  }

  // Strategy: 
  // 1. Insert `const __tss0 = performance.now();` before track()
  // 2. Replace `return snapshot(result);` with
  //    `const __tssR = snapshot(result); globalThis.__benchInst.signalSelectorTime += performance.now() - __tss0; globalThis.__benchInst.signalSelectorCount++; return __tssR;`

  const returnStart = targetReturn.range().start.index

  interface Splice {
    offset: number
    deleteCount: number
    insert: string
  }
  const splices: Splice[] = []

  // Insert timing start before track()
  splices.push({
    offset: trackStart,
    deleteCount: 0,
    insert: 'const __tss0 = performance.now(); ',
  })

  // Replace the entire return statement
  const returnText = code.slice(returnStart, returnEnd)
  // Extract the snapshot call text from the return
  const snapshotText = code.slice(snapshotCall.range().start.index, snapshotCall.range().end.index)

  splices.push({
    offset: returnStart,
    deleteCount: returnEnd - returnStart,
    insert: `const __tssR = ${snapshotText}; globalThis.__benchInst.signalSelectorTime += performance.now() - __tss0; globalThis.__benchInst.signalSelectorCount++; return __tssR;`,
  })

  // Apply in reverse offset order
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
