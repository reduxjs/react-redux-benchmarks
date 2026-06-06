/**
 * Build scenarios as standalone Node scripts for pprof-it profiling.
 *
 * Usage:
 *   pnpm build:node                    # build all scenarios × all versions
 *   pnpm build:node -- entity-list     # build one scenario × all versions
 *
 * Output: dist-node/{version}/{scenario}/app.mjs
 *
 * Run with:
 *   node dist-node/9.2.0/entity-list/app.mjs
 *   pprof-it node dist-node/9.2.0/entity-list/app.mjs
 */
import { build, type Plugin } from 'vite'
import path from 'path'
import fs from 'fs-extra'
import glob from 'glob'
import { builtinModules } from 'module'

const pkg = require(path.join(process.cwd(), 'package.json'))

const readFolderNames = (searchDir: string) => {
  return glob.sync('*/', { cwd: searchDir }).map((s) => s.replace('/', ''))
}

const allScenarios = readFolderNames(path.resolve('src/scenarios'))

// Allow filtering to specific scenarios via CLI args
const cliScenarios = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const selectedScenarios =
  cliScenarios.length > 0
    ? cliScenarios.filter((s) => allScenarios.includes(s))
    : allScenarios

const availableVersions = Object.keys(pkg.dependencies)
  .filter((key) => key.startsWith('react-redux-'))
  .map((s) => s.replace('react-redux-', ''))

const outputDir = path.join(__dirname, '../dist-node')

// Node builtins to externalize
const nodeExternals = [
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
  'happy-dom',
  '@happy-dom/global-registrator',
]

interface BuildOptions {
  scenarioName: string
  reactReduxVersion: string
}

async function bundle(options: BuildOptions) {
  const { scenarioName, reactReduxVersion } = options

  const outputFolder = path.join('dist-node', reactReduxVersion, scenarioName)
  const entryPoint = path.join('src/scenarios', scenarioName, 'index.tsx')

  const reactReduxPackageVersion = `react-redux-${reactReduxVersion}`
  const reactReduxPkgDir = path.dirname(
    require.resolve(`${reactReduxPackageVersion}/package.json`),
  )
  const reactReduxPkg = require(`${reactReduxPackageVersion}/package.json`)
  const reactReduxEntry = reactReduxPkg.exports?.['.']?.import
    ? path.join(reactReduxPkgDir, reactReduxPkg.exports['.'].import)
    : require.resolve(reactReduxPackageVersion)

  // Redirect scenario imports of '../../common' to the Node entry
  const nodeEntryRedirectPlugin: Plugin = {
    name: 'node-entry-redirect',
    enforce: 'pre',
    resolveId(source, importer) {
      if (
        (source === '../../common' ||
          source === '../../common/index' ||
          source === '../../common/index.tsx') &&
        importer &&
        importer.replace(/\\/g, '/').includes('/scenarios/')
      ) {
        return path.resolve('src/common/index-node.tsx')
      }
    },
  }

  // Same version-pinning plugin as browser build
  const reactReduxResolvePlugin: Plugin = {
    name: 'react-redux-version-resolve',
    enforce: 'pre',
    resolveId(source) {
      if (source === 'react-redux') {
        return reactReduxEntry
      }
    },
  }

  // Same CJS fix for react-redux 8.1.1
  const babelRuntimeCjsFixPlugin: Plugin = {
    name: 'babel-runtime-cjs-fix',
    enforce: 'pre',
    resolveId(source) {
      if (
        source.startsWith('@babel/runtime/helpers/') &&
        !source.includes('/esm/')
      ) {
        const helperName = source.replace('@babel/runtime/helpers/', '')
        try {
          return require.resolve(`@babel/runtime/helpers/${helperName}`)
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
      nodeEntryRedirectPlugin,
      reactReduxResolvePlugin,
      babelRuntimeCjsFixPlugin,
    ],
    build: {
      outDir: outputFolder,
      emptyOutDir: true,
      sourcemap: true,
      minify: false,
      // Use rollupOptions.input (not ssr mode) so everything gets bundled
      // and the reactReduxResolvePlugin catches transitive imports from RTK etc.
      // SSR mode externalizes node_modules by default, which would cause RTK
      // to resolve react-redux at runtime from node_modules (wrong version).
      rollupOptions: {
        input: entryPoint,
        external: nodeExternals,
        output: {
          format: 'esm',
          entryFileNames: 'app.mjs',
          chunkFileNames: '[name].mjs',
        },
      },
    },
  })
}

async function main() {
  fs.removeSync(outputDir)
  fs.ensureDirSync(outputDir)

  console.log('Building for Node profiling...')
  console.log('  Versions:', availableVersions)
  console.log('  Scenarios:', selectedScenarios)
  console.log('')

  for (const version of availableVersions) {
    console.log(`Building ${version}...`)

    const bundlePromises = selectedScenarios.map((scenarioName) =>
      bundle({ scenarioName, reactReduxVersion: version }),
    )
    await Promise.all(bundlePromises)
  }

  console.log(`\nDone. Output in ${outputDir}/`)
}

main()
