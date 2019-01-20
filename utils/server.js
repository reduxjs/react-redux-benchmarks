/* eslint no-console: 0 */
'use strict';

const {
    performance
} = require('perf_hooks');

const express = require("express");
const tracealyzer = require('tracealyzer');

const { join } = require('path');

const timeout = ms => new Promise(res => setTimeout(res, ms))

module.exports = {
  runServer(port, sources) {

    const app = express();

    app.use(express.static(sources))

    return new Promise((resolve, reject) => { // eslint-disable-line
      app.use((err) => {
        reject(err)
      })
      const server = app.listen(port, () => {
        //console.log(`Server started on ${port}`)
        resolve(server)
      })
    })
  },
  async capturePageStats(browser, url, traceFilename, delay = 30000) {
    const page = await browser.newPage();
    await page.evaluate(() => performance.setResourceTimingBufferSize(1000000));

    let fpsValues, traceMetrics;

    const trace = !!traceFilename;

    //console.log(`Loading page for version ${version}...`)

    if (trace) {
      page.on('load', async () => {
        await timeout(1000)
        page.tracing.start({ path: traceFilename })
      })
    }
    await page.goto(url);

    const start = performance.now();

    if (trace) {
      await timeout(delay + 1000);
      await page.tracing.stop();
      traceMetrics = tracealyzer(traceFilename);
    } else {
      await timeout(delay);
    }

    const end = performance.now();

    const fpsStatsEntries = JSON.parse(
      await page.evaluate(() => JSON.stringify(window.getFpsStats()))
    ) || []

    fpsValues = fpsStatsEntries.map(entry => {
      const {FPS, isFinal} = entry.meta.details;
      return {FPS, timestamp : entry.timeStamp, isFinal};
    });

    await page.close();

    return {fpsValues, traceMetrics, start, end};
  }
}
