/* eslint-disable import/first */
// @ts-check
import { build } from 'esbuild'
import path from 'path'
import fs from 'fs-extra'
import ts from 'typescript'
import rimraf from 'rimraf'
import alias from 'esbuild-plugin-alias'
import glob from 'glob'
import yargs from 'yargs'
import semver from 'semver'

const pkg = require(path.join(process.cwd(), 'package.json'))

const args = yargs(process.argv.slice(2)).options('concurrent', {
  alias: 'c',
  describe: "Use React 18's `createRoot` rendering",
  type: 'boolean',
  default: true,
})

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
  concurrent: boolean
}

async function bundle(options: BuildOptions) {
  const {
    scenarioName = 'counter',
    reactReduxVersion = '7.2.5',
    concurrent = false,
  } = options ?? {}

  if (scenarioName.includes('hooks')) {
    if (semver.lt(reactReduxVersion, '7.1.0')) {
      console.log(
        `Skipping build for scenario ${scenarioName}, version ${reactReduxVersion}`
      )
      // Hooks didn't exist until React-Redux 7.1, skip this build
      return
    }
  }

  const outputFolder = path.join('dist', reactReduxVersion, scenarioName)
  fs.ensureDirSync(outputFolder)
  const outputFilePath = path.join(outputFolder, 'index.js')

  const entryPoint = path.join('src/scenarios', scenarioName, 'index.tsx')

  let reactReduxPackageVersion = `react-redux-${reactReduxVersion}`

  const depVersion = pkg.dependencies[reactReduxPackageVersion]

  let resolvedReactReduxPath: string

  if (depVersion?.startsWith('file:')) {
    resolvedReactReduxPath = path.join(
      path.resolve(depVersion.replace('file:', '')),
      'es/index.js'
    )
  } else {
    resolvedReactReduxPath = require.resolve(reactReduxPackageVersion)
  }

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
      'process.env.CONCURRENT_RENDERING': JSON.stringify(concurrent),
    },
    plugins: [
      alias({
        'react-dom': require.resolve('react-dom/profiling'),
        'react-redux': resolvedReactReduxPath,
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
  concurrent: boolean
}

async function main({ scenarios, versions, concurrent }: MainArgs) {
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
        concurrent,
      })
    )
    await Promise.all(bundlePromises)
  }
}

console.log('Available versions: ', availableVersions)
console.log('Available scenarios: ', allScenarios)

// @ts-ignore
const { concurrent } = args.argv

main({
  scenarios: allScenarios,
  versions: availableVersions,
  concurrent,
})
