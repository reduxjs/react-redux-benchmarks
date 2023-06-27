# react-redux-benchmarks

Performance benchmark harness for React-Redux

This repo expects that you are using Yarn for package management.

# Running benchmarks

```bash
yarn build
yarn start
```

After benchmarks have been built, you can run with simply:

```bash
yarn start
```

You'll need to rebuild the benchmarks after every code change.

## Running specific versions of react-redux

To specify a single version:

```bash
yarn start --versions 8.1.1
yarn start -v 8.1.1
```

To specify running against multiple versions:

```bash
yarn start -v 8.1.1 7.2.5
```

## To run a specific benchmark:

```bash
yarn start --scenarios deeptree
yarn start -s deeptree
```

or specific benchmarks:

```bash
yarn start -s deeptree forms
```

## Setting run length

By default, benchmarks run for 30 seconds. To change this, use

```bash
yarn start --length 5
yarn start -l 5
```

# Adding a benchmark

Benchmarks live in the `src/scenarios` directory. Each benchmark must render a React component like this:

```js
import { renderApp } from '../../common'

renderApp(<App />, store)
```

Where `App` is your benchmark component, and `store` is your redux store.

If you need to make changes to the `fps-emit` package, bump the version number in its `package.json`,
then update each benchmark to use the newest version using `yarn upgrade-interactive` and selecting `fps-emit`
for an update. Then rebuild all the benchmarks using `yarn build`
