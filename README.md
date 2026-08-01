# react-redux-benchmarks

Performance benchmark harness for React-Redux.

## Quick Start (bench.ts)

`bench.ts` automates the full build → publish → benchmark → compare cycle. Requires [Bun](https://bun.sh).

### Run benchmarks against a local react-redux build

```bash
# Build current working tree, run all scenarios (10s each), save results
bun bench.ts run --rr-dir ../markerikson-react-redux

# Shorter run with specific scenarios
bun bench.ts run --rr-dir ../markerikson-react-redux --label my-fix -l 5 -s entity-list,forms

# Run against a specific commit (auto-restores git state after)
bun bench.ts run --rr-dir ../markerikson-react-redux --sha 471666e --exports bisect-results/exports-471666e.ts
```

### Compare results

```bash
bun bench.ts compare bench-results/baseline.json bench-results/my-fix.json
```

Outputs a side-by-side table with Script time, SigSel time, Sig#, Reconcile time, and deltas (ratio with ↑/↓ indicators).

### List saved results

```bash
bun bench.ts list
```

### Run options

| Flag | Description |
|------|-------------|
| `--rr-dir <path>` | Path to react-redux repo (required) |
| `--label <name>` | Label for this run (auto-generated from git SHA + branch if omitted) |
| `--sha <commit>` | Checkout this commit before building |
| `--exports <file>` | Copy this file as `src/exports.ts` before building |
| `-l, --length <sec>` | Seconds per benchmark (default: 10) |
| `-s, --scenarios <list>` | Comma-separated scenario names |

Results are saved as JSON to `bench-results/<label>.json` with git metadata (SHA, branch, dirty state, commit message).

## Manual Usage

### Building

```bash
pnpm build              # standard build
pnpm build --instrument # with dispatch-cycle instrumentation
```

### Running

```bash
pnpm start                         # all scenarios, 30s each
pnpm start -l 5                    # 5s per scenario
pnpm start -s deeptree forms       # specific scenarios
pnpm start -v 8.1.1                # specific react-redux version
pnpm start --json                  # JSON output
pnpm start --profile               # V8 CPU profiling with module attribution
pnpm start --instrument             # collect instrumentation stats (requires instrumented build)
pnpm start --save-profiles          # save .cpuprofile files to ./profiles/
```

### Installing a local react-redux build

```bash
# In the react-redux repo:
yarn build && yalc publish

# In this repo:
yalc add react-redux && pnpm install
```

## Reading the results

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

## Adding a benchmark

Benchmarks live in `src/scenarios/`. Each benchmark must render a React component:

```js
import { renderApp } from '../../common'

renderApp(<App />, store)
```

Where `App` is your benchmark component and `store` is your Redux store.
