/* eslint-disable import/first */
// @ts-check
import { build } from 'esbuild'
import path from 'path'
import fs from 'fs-extra'
import ts from 'typescript'
import rimraf from 'rimraf'

import yargs from 'yargs/yargs'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const { argv } = yargs(process.argv)
  .option('local', {
    alias: 'l',
    type: 'boolean',
    description: 'Run API Extractor in local mode',
  })
  .option('skipExtraction', {
    alias: 's',
    type: 'boolean',
    description: 'Skip running API extractor',
  })

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
    // format: format === 'umd' ? 'esm' : format,
    // Needed to prevent auto-replacing of process.env.NODE_ENV in all builds
    platform: 'neutral',
    // Needed to return to normal lookup behavior when platform: 'neutral'
    mainFields: ['browser', 'module', 'main'],
    conditions: ['browser'],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production')
    },
    // define: env
    //   ? {
    //       'process.env.NODE_ENV': JSON.stringify(env),
    //     }
    //   : {},
    plugins: [],
  })

  // for (const chunk of result.outputFiles) {
  //   const esVersion =
  //     target in esVersionMappings
  //       ? esVersionMappings[target]
  //       : ts.ScriptTarget.ES5

  //   const origin = chunk.text
  //   const sourcemap = extractInlineSourcemap(origin)
  //   const result = ts.transpileModule(removeInlineSourceMap(origin), {
  //     compilerOptions: {
  //       sourceMap: true,
  //       module:
  //         format !== 'cjs' ? ts.ModuleKind.ES2015 : ts.ModuleKind.CommonJS,
  //       target: esVersion,
  //     },
  //   })

  //   const mergedSourcemap = merge(sourcemap, result.sourceMapText)
  //   let code = result.outputText
  //   let mapping: RawSourceMap = mergedSourcemap

  //   if (minify) {
  //     const transformResult = await terser.minify(
  //       appendInlineSourceMap(code, mapping),
  //       {
  //         sourceMap: { content: 'inline', asObject: true } as any,
  //         output: {
  //           comments: false,
  //         },
  //         compress: {
  //           keep_infinity: true,
  //           pure_getters: true,
  //           passes: 10,
  //         },
  //         ecma: 5,
  //         toplevel: true,
  //       }
  //     )
  //     code = transformResult.code
  //     mapping = transformResult.map as RawSourceMap
  //   }

  //   const relativePath = path.relative(process.cwd(), chunk.path)
  //   console.log(`Build artifact: ${relativePath}, settings: `, {
  //     target,
  //     output: ts.ScriptTarget[esVersion],
  //   })
  //   await fs.writeFile(chunk.path, code)
  //   await fs.writeJSON(chunk.path + '.map', mapping)
  // }
}

/**
 * since esbuild doesn't support umd, we use rollup to convert esm to umd
 */

// async function buildUMD(outputPath: string, prefix: string) {
//   // All RTK UMD files share the same global variable name, regardless
//   const globalName = 'RTK'

//   for (let umdExtension of ['umd', 'umd.min']) {
//     const input = path.join(outputPath, `${prefix}.${umdExtension}.js`)
//     const instance = await rollup.rollup({
//       input: [input],
//       onwarn(warning, warn) {
//         if (warning.code === 'THIS_IS_UNDEFINED') return
//         warn(warning) // this requires Rollup 0.46
//       },
//     })
//     await instance.write({
//       format: 'umd',
//       name: globalName,
//       file: input,
//       sourcemap: true,
//       globals: {
//         // These packages have specific global names from their UMD bundles
//         react: 'React',
//         'react-redux': 'ReactRedux',
//       },
//     })
//   }
// }

// // Generates an index file to handle importing CJS dev/prod
// async function writeEntry(folder: string, prefix: string) {
//   await fs.writeFile(
//     path.join('dist', folder, 'index.js'),
//     `'use strict'
// if (process.env.NODE_ENV === 'production') {
//   module.exports = require('./${prefix}.cjs.production.min.js')
// } else {
//   module.exports = require('./${prefix}.cjs.development.js')
// }`
//   )
// }

/*
interface BuildArgs {
  skipExtraction?: boolean
  local: boolean
}

async function main({ skipExtraction = false, local = false }: BuildArgs) {
  // Dist folder will be removed by rimraf beforehand so TSC can generate typedefs
  await fs.ensureDir(outputDir)

  for (let entryPoint of entryPoints) {
    const { folder, prefix } = entryPoint
    const outputPath = path.join('dist', folder)
    fs.ensureDirSync(outputPath)

    // Run builds in parallel
    const bundlePromises = buildTargets.map((options) =>
      bundle({
        ...options,
        ...entryPoint,
      })
    )
    await Promise.all(bundlePromises)
    await writeEntry(folder, prefix)
  }

  // Run UMD builds after everything else so we don't have to sleep after each set
  for (let entryPoint of entryPoints) {
    const { folder } = entryPoint
    const outputPath = path.join('dist', folder)
    await buildUMD(outputPath, entryPoint.prefix)
  }

  // We need one additional package.json file in dist to support
  // versioned types for TS <4.1
  fs.copyFileSync(
    'src/query/react/versionedTypes/package.dist.json',
    'dist/query/react/versionedTypes/package.json'
  )

  if (!skipExtraction) {
    for (let entryPoint of entryPoints) {
      try {
        // Load and parse the api-extractor.json file
        const extractorConfig: ExtractorConfig = ExtractorConfig.loadFileAndPrepare(
          entryPoint.extractionConfig
        )

        console.log('Extracting API types for entry point: ', entryPoint.prefix)
        // Invoke API Extractor
        const extractorResult: ExtractorResult = Extractor.invoke(
          extractorConfig,
          {
            // Equivalent to the "--local" command-line parameter
            localBuild: local,

            // Equivalent to the "--verbose" command-line parameter
            showVerboseMessages: false,
          }
        )

        if (extractorResult.succeeded) {
          console.log(`API Extractor completed successfully`)
        } else {
          console.error(
            `API Extractor completed with ${extractorResult.errorCount} errors` +
              ` and ${extractorResult.warningCount} warnings`
          )
        }
      } catch (e) {
        console.error('API extractor crashed: ', e)
      }
    }
  }
}

const { skipExtraction, local } = argv
main({ skipExtraction, local })
*/

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

const scenarios = ['counter']
const versions = ['7.2.5']

main({
  scenarios,
  versions,
})
