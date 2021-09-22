/* eslint-disable import/first */
// @ts-check
import { build } from 'esbuild'
import path from 'path'
import fs from 'fs-extra'
import ts from 'typescript'
import rimraf from 'rimraf'
import alias from 'esbuild-plugin-alias'
import glob from 'glob'

const pkg = require(path.join(process.cwd(), 'package.json'))

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const readFolderNames = (searchDir) => {
  return glob.sync('*/', { cwd: searchDir }).map((s) => s.replace('/', ''))
}

// Just build them all!
const allScenarios = readFolderNames(path.resolve('src/scenarios'))

const availableVersions = Object.keys(pkg.dependencies)
  .filter((key) => key.startsWith('react-redux-'))
  .map((s) => s.replace('react-redux-', ''))

const outputDir = path.join(__dirname, '../dist')

interface BuildOptions {
  scenarioName: string
  reactReduxVersion: string
}

async function bundle(options: BuildOptions) {
  const { scenarioName = 'counter', reactReduxVersion = '7.2.5' } =
    options ?? {}

  const outputFolder = path.join('dist', reactReduxVersion, scenarioName)
  fs.ensureDirSync(outputFolder)
  const outputFilePath = path.join(outputFolder, 'index.js')

  const entryPoint = path.join('src/scenarios', scenarioName, 'index.tsx')

  const result = await build({
    entryPoints: [entryPoint],
    outfile: outputFilePath,
    write: true,
    target: 'es2017',
    sourcemap: 'inline',
    bundle: true,
    minify: true,
    keepNames: true,
    // Needed to prevent auto-replacing of process.env.NODE_ENV in all builds
    platform: 'neutral',
    // Needed to return to normal lookup behavior when platform: 'neutral'
    mainFields: ['browser', 'module', 'main'],
    conditions: ['browser'],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.NAME': JSON.stringify(scenarioName),
      'process.env.RR_VERSION': JSON.stringify(reactReduxVersion),
      'process.env.CONCURRENT_RENDERING': JSON.stringify(false),
    },
    plugins: [
      alias({
        'react-dom': require.resolve('react-dom/profiling'),
        'react-redux': require.resolve(`react-redux-${reactReduxVersion}`),
      }),
    ],
  })

  // Copy over the HTML host page
  fs.copyFileSync(
    'src/common/index.html',
    path.join(outputFolder, 'index.html')
  )
}

interface MainArgs {
  scenarios: string[]
  versions: string[]
}

async function main({ scenarios, versions }: MainArgs) {
  rimraf.sync(outputDir)
  // Dist folder will be removed by rimraf beforehand so TSC can generate typedefs
  fs.ensureDirSync(outputDir)

  console.log('Preparing to build scenarios: ', scenarios)

  for (let version of versions) {
    console.log(`Building projects for version: ${version}...`)

    // Run builds in parallel
    const bundlePromises = scenarios.map((scenarioName) =>
      bundle({
        scenarioName,
        reactReduxVersion: version,
      })
    )
    await Promise.all(bundlePromises)
  }
}

console.log('Available versions: ', availableVersions)
console.log('Available scenarios: ', allScenarios)

main({
  scenarios: allScenarios,
  versions: availableVersions,
})
