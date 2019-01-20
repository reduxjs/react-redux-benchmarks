# react-redux-benchmarks
Performance benchmark harness for React-Redux

This repo expects that you are using Yarn for package management.

# Running benchmarks
```bash
yarn initialize
yarn start
```

After benchmarks have been initialized, you can run with simply:

```bash
yarn start
```

## Running specific versions

To specify a single version:

```bash
REDUX=5.0.7 yarn start
```

To specify running against multiple versions:

```bash
REDUX=5.0.7:4.4.9 yarn start
```

To run a specific benchmark:

```bash
BENCHMARKS=stockticker yarn start
```

or specific benchmarks:

```bash
BENCHMARKS=stockticker:another yarn start
```

## Setting run length

By default, benchmarks run for 30 seconds. To change this, use

```bash
SECONDS=10 yarn start
```


# Adding a benchmark

Benchmarks live in the `sources/` directory. Each benchmark must insert this
code into `index.js`:

```js
import 'fps-emit'
```

In addition, a `config-overrides.js` must be created with these contents:

```js
module.exports = function override(config, env) {
    //do stuff with the webpack config...
    console.log(`Environment: ${env}`)

    if(env === "production") {
        config.externals = {
            "react" : "React",
            "redux" : "Redux",
            "react-redux" : "ReactRedux",
        }
    }


    return config;
}
```

and the scripts section of `package.json` should be changed to:

```json
  "scripts": {
    "start": "react-app-rewired  start",
    "build": "react-app-rewired  build",
    "test": "react-app-rewired  --env=jsdom",
    ...
  }
```

Also, `index.html` must be modified to include these lines:

```html
    <script type="text/javascript" src="redux.min.js"></script>
    <script type="text/javascript" src="react.production.min.js"></script>
    <script type="text/javascript" src="react-dom.production.min.js"></script>
    <script type="text/javascript" src="react-redux.min.js"></script>
```


If you need to make changes to the `fps-emit` package, bump the version number in its `package.json`,
then update each benchmark to use the newest version using `yarn upgrade-interactive` and selecting `fps-emit`
for an update.  Then rebuild all the benchmarks using `yarn initialize`
