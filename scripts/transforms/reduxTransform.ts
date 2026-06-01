import { parse, Lang } from '@ast-grep/napi'

/**
 * Instruments Redux's dispatch() function to time:
 * 1. Reducer execution: currentReducer(currentState, action)
 * 2. Listener notification: listeners.forEach(...)
 *
 * Target source pattern in redux.mjs:
 *   try {
 *     isDispatching = true;
 *     currentState = currentReducer(currentState, action);
 *   } finally {
 *     isDispatching = false;
 *   }
 *   const listeners = currentListeners = nextListeners;
 *   listeners.forEach((listener) => { listener(); });
 */
export function transformReduxDispatch(code: string): string | null {
  const root = parse(Lang.JavaScript, code).root()

  // Find: currentState = currentReducer(currentState, action)
  // This is an assignment where the RHS is a call to currentReducer
  const reducerAssignment = root.find({
    rule: {
      pattern: 'currentState = currentReducer(currentState, action)',
    },
  })

  if (!reducerAssignment) {
    console.warn('[instrumentation] Could not find currentReducer call in redux.mjs')
    return null
  }

  // Find: listeners.forEach(...)
  // The forEach call on the listeners Map
  const forEachCall = root.find({
    rule: {
      pattern: 'listeners.forEach($$$)',
      inside: {
        kind: 'expression_statement',
        stopBy: 'end',
      },
    },
  })

  if (!forEachCall) {
    console.warn('[instrumentation] Could not find listeners.forEach in redux.mjs')
    return null
  }

  // Get byte ranges for splicing
  // We need the expression_statement containing forEach, not just the call
  const forEachStatement = forEachCall.parent()
  if (!forEachStatement) {
    console.warn('[instrumentation] Could not find forEach parent statement')
    return null
  }

  // Build the instrumented code by splicing
  // We work backwards (higher offsets first) to keep earlier offsets valid

  interface Splice {
    offset: number
    insert: string
  }
  const splices: Splice[] = []

  // --- Reducer instrumentation ---
  // Wrap: currentState = currentReducer(currentState, action)
  // Into: { const __t0 = performance.now(); currentState = currentReducer(currentState, action); const __t1 = performance.now(); globalThis.__benchInst.reducerTime += __t1 - __t0; globalThis.__benchInst.reducerCount++; }
  const reducerStart = reducerAssignment.range().start.index
  const reducerEnd = reducerAssignment.range().end.index

  // Find the semicolon after the assignment (it's inside a try block)
  // The assignment is `currentState = currentReducer(currentState, action)`
  // In the source it's followed by a semicolon
  let reducerStmtEnd = reducerEnd
  if (code[reducerStmtEnd] === ';') reducerStmtEnd++

  splices.push({
    offset: reducerStart,
    insert: 'const __t0 = performance.now(); ',
  })
  splices.push({
    offset: reducerStmtEnd,
    insert: ' const __t1 = performance.now(); globalThis.__benchInst.reducerTime += __t1 - __t0; globalThis.__benchInst.reducerCount++;',
  })

  // --- Listener notification instrumentation ---
  // Wrap the entire forEach statement
  const forEachStart = forEachStatement.range().start.index
  const forEachEnd = forEachStatement.range().end.index

  splices.push({
    offset: forEachStart,
    insert: 'const __tn0 = performance.now(); ',
  })
  splices.push({
    offset: forEachEnd,
    insert: ' const __tn1 = performance.now(); globalThis.__benchInst.notifyTime += __tn1 - __tn0; globalThis.__benchInst.callbackCount += listeners.size;',
  })

  // Apply splices in reverse offset order
  splices.sort((a, b) => b.offset - a.offset)

  let result = code
  for (const splice of splices) {
    result = result.slice(0, splice.offset) + splice.insert + result.slice(splice.offset)
  }

  return result
}
