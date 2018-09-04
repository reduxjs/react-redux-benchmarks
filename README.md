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

Benchmarks live in the `sources/` directory. Each benchmark should copy the
`config-overrides.js` and `"scripts"` section of the `stockticker`
benchmark. In addition, this code must be inserted into `index.js`:

```js
import {PerformanceMetadataMarker} from "performance-mark-metadata";
import FpsEmitter from "fps-emitter";

const marker = new PerformanceMetadataMarker();
window.marker = marker;

const fps = new FpsEmitter();
fps.on("update", function(FPS) {
    // mark current FPS
    marker.mark("FPS", {
        details: { FPS }
    });
});

const getFpsStats = () => {
    const logData = performance.getEntriesByType("mark").map(entry => {
        const meta = marker.getEntryMetadata(entry);
        return {
            type: entry.name,
            timeStamp: entry.startTime,
            meta: meta
        };
    });

    return logData;
}

window.getFpsStats = getFpsStats;
```