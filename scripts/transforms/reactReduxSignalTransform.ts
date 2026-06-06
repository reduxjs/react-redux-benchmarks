import { Lang, parse } from "@ast-grep/napi";

interface Splice {
  offset: number;
  deleteCount: number;
  insert: string;
}

function applySplices(code: string, splices: Splice[]): string {
  // Sort descending by offset so earlier splices don't shift later offsets
  const sorted = [...splices].sort((a, b) => b.offset - a.offset);
  let result = code;
  for (const { offset, deleteCount, insert } of sorted) {
    result =
      result.slice(0, offset) + insert + result.slice(offset + deleteCount);
  }
  return result;
}

/**
 * Instrument the reconcileState() call in SignalProvider's onStateChange.
 *
 * Target pattern in the bundle:
 * ```js
 * reconcileState(prev, next, registry, engine);
 * ```
 *
 * Wraps with reconcileTime/reconcileCount timing.
 */
export function transformSignalProvider(code: string): string {
  const root = parse(Lang.JavaScript, code).root();

  // Find the reconcileState call expression statement
  const reconcileCall = root.find({
    rule: {
      pattern: "reconcileState(prev, next, registry, engine)",
    },
  });

  if (!reconcileCall) {
    console.warn(
      "[instrument] Could not find reconcileState(prev, next, registry, engine) call"
    );
    return code;
  }

  // Navigate to the expression_statement parent so we wrap the full statement
  // including its semicolon, not just the call expression.
  const reconcileStmt = reconcileCall.parent();
  if (!reconcileStmt) {
    console.warn("[instrument] Could not find parent statement of reconcileState call");
    return code;
  }

  const range = reconcileStmt.range();
  const startOffset = range.start.index;
  let endOffset = range.end.index;
  // Include trailing semicolon if present (expression_statement may not include it)
  if (code[endOffset] === ";") endOffset++;

  const splices: Splice[] = [
    {
      offset: startOffset,
      deleteCount: 0,
      insert: `const __tr0 = performance.now(); `,
    },
    {
      offset: endOffset,
      deleteCount: 0,
      insert: ` const __tr1 = performance.now(); globalThis.__benchInst.reconcileTime += __tr1 - __tr0; globalThis.__benchInst.reconcileCount++;`,
    },
  ];

  console.log("[instrument] Wrapped reconcileState() with reconcileTime timing");

  return applySplices(code, splices);
}

/**
 * Instrument the selector computed callback in useSignalSelector.
 *
 * Target pattern in the bundle:
 * ```js
 * const selectorComputed = engine.computed(() => {
 *   const state = store.getState();
 *   const proxy = createTrackingProxy(state, [], registry);
 *   return selectorRef.current(proxy);
 * });
 * ```
 *
 * Wraps the entire computed callback body with signalSelectorTime timing.
 * Strategy: insert timer start before `const state = ...` and replace
 * `return selectorRef.current(proxy)` with temp var + timing + return.
 */
export function transformSignalSelector(code: string): string {
  const root = parse(Lang.JavaScript, code).root();

  // Find `const state = store.getState()` inside the computed callback.
  // This is the first statement in the callback body.
  const stateDecl = root.find({
    rule: {
      pattern: "const state = store.getState()",
      inside: {
        pattern: "engine.computed($FN)",
        stopBy: "end",
      },
    },
  });

  if (!stateDecl) {
    console.warn(
      "[instrument] Could not find `const state = store.getState()` inside engine.computed()"
    );
    return code;
  }

  // Find the `return selectorRef.current(proxy)` inside the same computed
  const returnStmt = root.find({
    rule: {
      pattern: "return selectorRef.current(proxy)",
      inside: {
        pattern: "engine.computed($FN)",
        stopBy: "end",
      },
    },
  });

  if (!returnStmt) {
    console.warn(
      "[instrument] Could not find `return selectorRef.current(proxy)` inside engine.computed()"
    );
    return code;
  }

  const stateRange = stateDecl.range();
  const returnRange = returnStmt.range();

  const splices: Splice[] = [
    // Insert timer start before `const state = store.getState()`
    {
      offset: stateRange.start.index,
      deleteCount: 0,
      insert: `const __tss0 = performance.now(); `,
    },
    // Replace `return selectorRef.current(proxy)` with temp var + timing + return
    {
      offset: returnRange.start.index,
      deleteCount: returnRange.end.index - returnRange.start.index,
      insert: `const __tssR = selectorRef.current(proxy); globalThis.__benchInst.signalSelectorTime += performance.now() - __tss0; globalThis.__benchInst.signalSelectorCount++; return __tssR;`,
    },
  ];

  console.log(
    "[instrument] Wrapped engine.computed() selector callback with signalSelectorTime timing"
  );

  return applySplices(code, splices);
}