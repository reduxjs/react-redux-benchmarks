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
    throw new Error(
      "[instrument] transformSignalProvider FAILED: Could not find reconcileState(prev, next, registry, engine) call. " +
      "The react-redux bundle patterns may have changed. Update the ast-grep pattern in reactReduxSignalTransform.ts."
    );
  }

  // Navigate to the expression_statement parent so we wrap the full statement
  // including its semicolon, not just the call expression.
  const reconcileStmt = reconcileCall.parent();
  if (!reconcileStmt) {
    throw new Error(
      "[instrument] transformSignalProvider FAILED: reconcileState call has no parent statement node."
    );
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
 * Target pattern in the bundle (as of current yalc build):
 * ```js
 * const selectorComputed = engine.computed(() => {
 *   const state = store.getState();
 *   const proxy = createTrackingProxy(state, "", registry, registry.proxyCache);
 *   const result = selectorRef.current(proxy);
 *   const proxyPath = getProxyPath(result);
 *   if (proxyPath !== void 0) { ... }
 *   return result;
 * });
 * ```
 *
 * Strategy: insert timer before first statement, insert timing accumulation
 * before `return result` inside the computed callback.
 */
export function transformSignalSelector(code: string): string {
  const root = parse(Lang.JavaScript, code).root();

  // Find the first statement inside the computed callback body.
  // Try `const state = store.getState()` first (separate declaration),
  // fall back to finding `createTrackingProxy` if state is inlined.
  const insideComputed = {
    pattern: "engine.computed($FN)",
    stopBy: "end",
  };

  let firstStmt = root.find({
    rule: {
      pattern: "const state = store.getState()",
      inside: insideComputed,
    },
  });

  if (!firstStmt) {
    // state may be inlined into createTrackingProxy call
    firstStmt = root.find({
      rule: {
        pattern: "const proxy = createTrackingProxy($$$)",
        inside: insideComputed,
      },
    });
  }

  if (!firstStmt) {
    throw new Error(
      "[instrument] transformSignalSelector FAILED: Could not find first statement inside engine.computed() callback. " +
      "Expected `const state = store.getState()` or `const proxy = createTrackingProxy(...)`. " +
      "The react-redux bundle patterns may have changed. Update the ast-grep pattern in reactReduxSignalTransform.ts."
    );
  }

  // Find the final return inside the same computed.
  // Newer builds untrack the result at the boundary: `return untrackResult(result)`.
  // Older builds return it directly: `return result`.
  const untrackReturnStmt = root.find({
    rule: {
      pattern: "return untrackResult(result)",
      inside: insideComputed,
    },
  });
  const plainReturnStmt = untrackReturnStmt
    ? null
    : root.find({
        rule: {
          pattern: "return result",
          inside: insideComputed,
        },
      });

  if (!untrackReturnStmt && !plainReturnStmt) {
    throw new Error(
      "[instrument] transformSignalSelector FAILED: Could not find `return untrackResult(result)` or `return result` inside engine.computed(). " +
      "The react-redux bundle patterns may have changed. Update the ast-grep pattern in reactReduxSignalTransform.ts."
    );
  }

  const firstRange = firstStmt.range();

  const splices: Splice[] = [
    // Insert timer start before first statement
    {
      offset: firstRange.start.index,
      deleteCount: 0,
      insert: `const __tss0 = performance.now(); `,
    },
  ];

  const accum = `globalThis.__benchInst.signalSelectorTime += performance.now() - __tss0; globalThis.__benchInst.signalSelectorCount++;`;

  if (untrackReturnStmt) {
    // Hoist the untrack call so its cost lands inside the measured window.
    const range = untrackReturnStmt.range();
    splices.push({
      offset: range.start.index,
      deleteCount: range.end.index - range.start.index,
      insert: `const __untracked = untrackResult(result); ${accum} return __untracked`,
    });
  } else {
    const range = plainReturnStmt!.range();
    splices.push({
      offset: range.start.index,
      deleteCount: 0,
      insert: `${accum} `,
    });
  }

  console.log(
    "[instrument] Wrapped engine.computed() selector callback with signalSelectorTime timing"
  );

  return applySplices(code, splices);
}