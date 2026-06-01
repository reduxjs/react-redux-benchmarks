import { build, type Plugin } from 'vite'
import path from 'path'
import fs from 'fs-extra'
import glob from 'glob'
import { instrumentationPlugin } from './plugins/instrumentationPlugin'

const pkg = require(path.join(process.cwd(), 'package.json'))

const enableInstrumentation = process.argv.includes('--instrument')

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
  const reactReduxPkgDir = path.dirname(
    require.resolve(`${reactReduxPackageVersion}/package.json`)
  )
  const reactReduxPkg = require(
    `${reactReduxPackageVersion}/package.json`
  )
  // Prefer ESM entry from exports, fall back to CJS
  const reactReduxEntry = reactReduxPkg.exports?.['.']?.import
    ? path.join(reactReduxPkgDir, reactReduxPkg.exports['.'].import)
    : require.resolve(reactReduxPackageVersion)
  const reactDomProfilingPath = require.resolve('react-dom/profiling')

  // Use resolveId hooks instead of resolve.alias to ensure exact matching.
  // resolve.alias does prefix matching which breaks with pnpm symlinks
  // (e.g. node_modules/react-redux → yalc version overrides the alias).
  const reactDomProfilingPlugin: Plugin = {
    name: 'react-dom-profiling',
    enforce: 'pre',
    resolveId(source) {
      if (source === 'react-dom/client') {
        return reactDomProfilingPath
      }
    },
  }

  const reactReduxResolvePlugin: Plugin = {
    name: 'react-redux-version-resolve',
    enforce: 'pre',
    resolveId(source) {
      if (source === 'react-redux') {
        return reactReduxEntry
      }
    },
  }

  // Fix @babel/runtime CJS interop for react-redux 8.1.1.
  // @babel/runtime's package.json exports map `./helpers/*` with an `import`
  // condition pointing to `./helpers/esm/*`. Vite resolves with ESM conditions,
  // so CJS `require("@babel/runtime/helpers/interopRequireDefault")` gets the
  // ESM version. Vite then wraps it in __toCommonJS which returns a module
  // object instead of the function itself, crashing the CJS consumer.
  // Force CJS resolution for these helpers.
  const babelRuntimeCjsFixPlugin: Plugin = {
    name: 'babel-runtime-cjs-fix',
    enforce: 'pre',
    resolveId(source) {
      if (source.startsWith('@babel/runtime/helpers/') && !source.includes('/esm/')) {
        // Resolve to the CJS file directly, bypassing the exports map
        const helperName = source.replace('@babel/runtime/helpers/', '')
        try {
          const cjsPath = require.resolve(`@babel/runtime/helpers/${helperName}`)
          return cjsPath
        } catch {
          return undefined
        }
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
    plugins: [
      reactDomProfilingPlugin,
      reactReduxResolvePlugin,
      babelRuntimeCjsFixPlugin,
      ...(enableInstrumentation ? [instrumentationPlugin()] : []),
    ],
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
