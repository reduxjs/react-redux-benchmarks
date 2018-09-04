# react-redux-benchmarks
Performance benchmark harness for React-Redux

# Running benchmarks
```bash
npm run initialize
npm start
```

After benchmarks have been initialized, you can run with simply:

```bash
npm start
```

## Running specific versions

To specify a single version:

```bash
REDUX=5.0.7 npm start
```

To specify running against multiple versions:

```bash
REDUX=5.0.7:4.4.9 npm start
```

To run a specific benchmark:

```bash
BENCHMARKS=stockticker npm start
```

or specific benchmarks:

```bash
BENCHMARKS=stockticker:another npm start
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
            "fps-emit": "FpsEmit",
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
    <script type="text/javascript" src="react-redux.min.js"></script>
    <script type="text/javascript" src="fps-emit.min.js"></script>
```