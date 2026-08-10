# react-redux-benchmarks

Performance benchmark harness for React-Redux. Renders real scenarios in headless Chrome, drives them for a fixed wall-clock window, and collects CDP timings, React profiler data, and optional in-library instrumentation.

Every run measures three builds side by side:

| version key | what it is |
|---|---|
| `8.1.1` | react-redux 8, from npm |
| `9.2.0` | react-redux 9 stock, from npm |
| `9.2.0-signals-selectors` | your local build, aliased under this name |

The third one is the local build under test. It gets that name via a package alias, regardless of what your working tree actually is.

Requires [Bun](https://bun.sh) for `bench.ts` and pnpm for the benchmark app itself.

## The one command you usually want

```bash
bun bench.ts run --rr-dir ../markerikson-react-redux --label my-change -l 30
```

That does the whole cycle — 7 stages, all automatic:

1. Check out `--sha` if given, otherwise use the working tree as-is
2. Copy `--exports` over `src/exports.ts` if given
3. `yarn build` in the react-redux repo
4. `yalc publish`
5. Remove and re-add both the `react-redux` dependency and the `9.2.0-signals-selectors` alias, then `pnpm install`
6. `pnpm build --instrument`
7. `pnpm start --json --instrument --profile -l <length>`

Results land in `bench-results/<label>.json`. Without `--label` the label is generated from git: `<shortsha>[-dirty]-<branch>`.

### Benchmarking the signal selectors

The signal implementation ships as `SignalProvider` / `useSignalSelector`, but the benchmark scenarios import plain `Provider` / `useSelector`. `bench-exports.ts` in this repo is a copy of react-redux's `src/exports.ts` with those names aliased to the signal versions:

```bash
bun bench.ts run --rr-dir ../markerikson-react-redux --exports bench-exports.ts --label signals-run -l 30
```

The harness copies that file over `src/exports.ts`, builds, and restores the original in a `finally` — so a stock checkout stays stock, and the override never has to be committed.

**Keep `bench-exports.ts` in sync.** It is a full copy, not a patch. When react-redux's real `src/exports.ts` gains or drops a public export, this file needs the same change or the build will fail or silently miss an export. The four intentional divergences are marked with `DIFFERENCE N` comments.

### Timing and background execution

A full 30-second run is **16 scenarios × 3 versions ≈ 35 minutes**, plus build and page-load time. `-l 10` (the default) is about 12 minutes.

`bench.ts` buffers the runner's stdout instead of streaming it. The log sits at `[7/7] Running benchmarks` printing nothing until the whole run finishes. **That silence is not a hang.**

Because of the runtime, run it detached:

```bash
(nohup bun bench.ts run --rr-dir ../markerikson-react-redux --label my-change -l 30 > bench-run.log 2>&1 &)
# then poll
tasklist //FI "IMAGENAME eq bun.exe"     # Git Bash on Windows
pgrep -f bench.ts                         # Linux / WSL
```

## Reading results

Two different questions, two different commands. Mixing them up produces nonsense.

```bash
# Stock vs signals WITHIN one run — this is the primary comparison
bun bench.ts report bench-results/my-change.json

# The signals build ACROSS two runs — for before/after of your own change
bun bench.ts compare bench-results/before.json bench-results/after.json

bun bench.ts list    # saved runs with git metadata
```

`compare` across runs with different `-l` values is meaningless. Totals scale with the window.

### Establish the noise floor before believing any delta

The stock `9.2.0` build is byte-identical between any two runs, so its cross-run delta is pure machine noise. Measure it, and treat it as the bar every other delta has to clear.

On this hardware that floor is large: **median |Δ| 2.9%, p90 |Δ| 20.9%, max +166%** on script duration over 16 scenarios. That swallows nearly every per-scenario timing number `compare` prints. A single run pair cannot resolve a 5% change.

Practical consequences:

- Prefer **per-event averages over totals**. `reconcileTime / reconcileCount` averages over 1000–2400 events per scenario and is far steadier than either number alone.
- **Normalize counts by `dispatch.count`** before reading anything into them. A scenario showing "27% fewer reconciles" usually just completed fewer dispatches in the fixed window — reconciles-per-dispatch is 1.00 in practically every scenario.
- Repeat a run before reporting a scenario-level result. Two runs agreeing in direction and rough magnitude is the minimum evidence.

### Instrumented dispatch timings are inflated

The instrumentation window around `reconcileState` encloses the alien-signals batch flush. Do not quote `Blocked` or `Dispatch avg` from an instrumented run as absolute numbers — read them only as stock-vs-signals ratios within the same run.

### `Blocked` — total time inside `dispatch()`

`Blocked` is the sum of every `dispatch()` call's duration over the run, measured by `dispatchTimingMiddleware` (`src/common/dispatch-timing.ts`) around `next(action)`. It is the time the main thread spent unable to paint or handle input because a dispatch was in progress — the quantity [INP](https://web.dev/articles/inp) penalizes.

**It measures where work runs, not how much there is.** react-redux notifies every subscriber synchronously inside `dispatch`, so on `master` this number tracks the real cost. But any change that moves the notification pass out of the synchronous window — deferring it to a macrotask, time-slicing it — makes `Blocked` collapse toward zero *without removing a single unit of work*.

A drop from `8704 ms` to `4 ms` is therefore not a 2000× speedup, and reporting it as one will not survive review. Always read `Blocked` alongside `Script` and `Task` from the CDP table, which do account for total work:

| what changed | `Blocked` | `Script` / `Task` |
|---|---|---|
| work genuinely eliminated | down | down |
| work relocated off the dispatch path | **down hard** | flat (or slightly up) |
| work added | up | up |

Both are worth optimizing — responsiveness and throughput are different goals — but they are different claims and the table should make that visible.

### What's in the JSON

```
meta: { label, timestamp, git: {sha, shortSha, branch, dirty, message},
        benchmarkArgs: {length, scenarios} }
results: { <scenario>: { <version>: {
  cdp:        { scriptDuration, taskDuration, layoutDuration, styleDuration }
  react:      { mountTime, avgUpdateTime, p50UpdateTime, p95UpdateTime,
                totalRenderTime, renderCount }
  dispatch:   { count, nestedCount, totalTime, avgTime }
  wallTime
  moduleBreakdown: { react-dom, react, react-redux, redux/toolkit, app,
                     other, idle, gc, browser }
  instrumentation: { reducerTime, reducerCount, notifyTime, callbackCount,
                     selectorTime, selectorCount, equalityCheckTime,
                     equalityCheckCount, reconcileTime, reconcileCount,
                     signalSelectorTime, signalSelectorCount }
} } }
```

There is no registry-size metric. Memory behavior of the signal path is not visible in bench data — only in the react-redux unit tests.

## Run options

| Flag | Description |
|------|-------------|
| `--rr-dir <path>` | Path to the react-redux repo (required) |
| `--label <name>` | Label for this run. Defaults to `<shortsha>[-dirty]-<branch>` |
| `--sha <commit>` | Check out this commit before building. Restores your branch afterwards |
| `--exports <file>` | Copy this file over `src/exports.ts` before building, restoring the original afterwards. Works with or without `--sha` |
| `-l, --length <sec>` | Seconds per scenario (default: 10) |
| `-s, --scenarios <list>` | Comma-separated scenario names |

`report` also takes `--base <version>` (default `9.2.0`) and `--target <version>` (default `9.2.0-signals-selectors`).

### Bisecting

`--sha` and `--exports` combine. This is what the flags were originally built for:

```bash
bun bench.ts run --rr-dir ../markerikson-react-redux \
  --sha 471666e --exports bisect-results/exports-471666e.ts
```

An old commit may need a different exports file than today's, which is why the override is a separate argument. Git state and `src/exports.ts` are both restored in a `finally`, including on failure.

## Manual usage

Only needed when debugging the harness itself. `bench.ts run` does all of this.

```bash
pnpm build                  # standard build
pnpm build --instrument     # with dispatch-cycle instrumentation

pnpm start                  # all scenarios, 30s each
pnpm start -l 5             # 5s per scenario
pnpm start -s deeptree forms
pnpm start -v 8.1.1         # one version only
pnpm start --json
pnpm start --profile        # V8 CPU profiling with module attribution
pnpm start --instrument     # requires an instrumented build
pnpm start --save-profiles  # write .cpuprofile files to ./profiles/
```

### Installing a local react-redux build by hand

```bash
# In the react-redux repo:
yarn build && yalc publish

# In this repo:
yalc remove react-redux && yalc add react-redux && pnpm install
```

**Do not use `yalc push` plus `pnpm install --force`.** pnpm reports "Already up to date" and leaves the aliased copy under `node_modules/.pnpm` stale, so you benchmark an old bundle and get plausible-looking wrong numbers. `bench.ts` does a full remove-then-add for exactly this reason.

## Adding a benchmark

Scenarios live in `src/scenarios/`. Create a directory there; `scripts/build.ts` auto-discovers it, and no registration step is needed.

Each scenario renders a React component:

```js
import { renderApp } from '../../common'

renderApp(<App />, store)
```

Where `App` is your benchmark component and `store` is your Redux store.

### Gaps worth filling

Current scenarios all run for a fixed short window, which makes them blind to costs that accumulate over a session. Two things are not measured today:

- **Long-session behavior.** Anything that ratchets up as state and component churn accumulate stays invisible at 30 seconds.
- **Large teardowns under deep paths.** No scenario unmounts a big list nested several levels down, which is where per-unmount work in the signal path would show.
