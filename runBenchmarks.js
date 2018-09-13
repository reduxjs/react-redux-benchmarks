/* eslint no-console: 0 */
'use strict';

const { join } = require('path');
const { readdirSync, copyFileSync } = require('fs')
const puppeteer = require("puppeteer");
const Table = require("cli-table2");


const serverUtils = require('./utils/server.js')

const sources = readdirSync(join(__dirname, 'sources'))

const VERSIONS_FOLDER = join(__dirname, 'react-redux-versions');

const versions = readdirSync(VERSIONS_FOLDER).map(version =>
  version.replace('react-redux-', '').replace('.min.js', ''))

const reduxVersions = process.env.REDUX ? process.env.REDUX.split(':') : versions
const benchmarksToRun = process.env.BENCHMARKS ? process.env.BENCHMARKS.split(':') : sources
const length = process.env.SECONDS ? process.env.SECONDS : 30



async function runBenchmarks() {
  for (let j = 0; j < benchmarksToRun.length; j++) {
    const benchmark = benchmarksToRun[j]

    const versionPerfEntries = {};

    const source = join(__dirname, 'runs', benchmark)
    console.log(`Running benchmark ${benchmark}`)


    for (let i = 0; i < reduxVersions.length; i++) {
      const version = reduxVersions[i]
      const toRun = join(source, version)
      console.log(`  react-redux version: ${version}`)
      const browser = await puppeteer.launch({
        //headless: false
      });

      const URL = "http://localhost:9999";
      try {
        const sourceFilePath = join(VERSIONS_FOLDER, `react-redux-${version}.min.js`);
        const destFilePath = join(source, "react-redux.min.js")
        copyFileSync(sourceFilePath, destFilePath);

        const server = await serverUtils.runServer(9999, source);

        console.log(`    Checking max FPS... (${length} seconds)`)
        const fpsRunResults = await serverUtils.capturePageStats(browser, URL, null, length * 1000);

        console.log(`    Running trace...    (${length} seconds)`);
        const traceFilename = join(__dirname, 'runs', `trace-${benchmark}-${version}.json`)
        const traceRunResults = await serverUtils.capturePageStats(browser, URL, traceFilename, length * 1000);

        const {fpsValues} = fpsRunResults;
        const {categories} = traceRunResults.traceMetrics.profiling;

        // skip first value = it's usually way lower due to page startup
        const fpsValuesWithoutFirst = fpsValues.slice(1);

        const average = fpsValuesWithoutFirst.reduce((sum, val) => sum + val, 0) / fpsValuesWithoutFirst.length || 0;

        const fps = {average, values : fpsValues}

        versionPerfEntries[version] = {fps, profile : {categories}};

        server.close();
      } catch (e) {
        console.error(e)
        process.exit(-1)
      } finally {
        await browser.close()
      }
    }

    console.log(`\nResults for benchmark ${benchmark}:`);

    const table = new Table({
      head: ['Version', 'Avg FPS', 'Scripting', 'Rendering', 'Painting', 'FPS Values']
    });

    Object.keys(versionPerfEntries).sort().forEach(version => {
      const versionResults = versionPerfEntries[version];

      const {fps, profile} = versionResults;

      table.push([
        version,
        fps.average.toFixed(2),
        profile.categories.scripting.toFixed(2),
        profile.categories.rendering.toFixed(2),
        profile.categories.painting.toFixed(2),
        fps.values.toString()
      ])
    });

    console.log(table.toString())
  }


  process.exit(0)
}

runBenchmarks()