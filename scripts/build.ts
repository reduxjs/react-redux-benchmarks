import { build, type Plugin } from 'vite'
import path from 'path'
import fs from 'fs-extra'
import glob from 'glob'

const pkg = require(path.join(process.cwd(), 'package.json'))

const readFolderNames = (searchDir: string) => {
  return glob.sync('*/', { cwd: searchDir }).map((s) => s.replace('/', ''))
}

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
  const { scenarioName, reactReduxVersion } = options

  const outputFolder = path.join('dist', reactReduxVersion, scenarioName)
  const entryPoint = path.join('src/scenarios', scenarioName, 'index.tsx')

  const reactReduxPackageVersion = `react-redux-${reactReduxVersion}`
  const resolvedReactReduxPath = require.resolve(reactReduxPackageVersion)
  const reactDomProfilingPath = require.resolve('react-dom/profiling')

  // Redirect react-dom/client imports to react-dom/profiling for React Profiler support.
  // Must be a plugin because Vite's resolve.alias doesn't override package.json exports.
  const reactDomProfilingPlugin: Plugin = {
    name: 'react-dom-profiling',
    enforce: 'pre',
    resolveId(source) {
      if (source === 'react-dom/client') {
        return reactDomProfilingPath
      }
    },
  }

  await build({
    configFile: false,
    root: process.cwd(),
    logLevel: 'warn',
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.NAME': JSON.stringify(scenarioName),
      'process.env.RR_VERSION': JSON.stringify(reactReduxVersion),
    },
    resolve: {
      alias: {
        'react-redux': resolvedReactReduxPath,
      },
    },
    plugins: [reactDomProfilingPlugin],
    build: {
      outDir: outputFolder,
      emptyOutDir: true,
      sourcemap: 'inline',
      minify: false,
      lib: {
        entry: entryPoint,
        formats: ['iife'],
        name: 'benchmark',
        fileName: () => 'index.js',
      },

    },
  })

  // Copy over the HTML host page
  fs.copyFileSync(
    'src/common/index.html',
    path.join(outputFolder, 'index.html')
  )
}

async function main() {
  fs.removeSync(outputDir)
  fs.ensureDirSync(outputDir)

  console.log('Preparing to build scenarios: ', allScenarios)

  for (const version of availableVersions) {
    console.log(`Building projects for version: ${version}...`)

    const bundlePromises = allScenarios.map((scenarioName) =>
      bundle({ scenarioName, reactReduxVersion: version })
    )
    await Promise.all(bundlePromises)
  }
}

console.log('Available versions: ', availableVersions)
console.log('Available scenarios: ', allScenarios)

main()
