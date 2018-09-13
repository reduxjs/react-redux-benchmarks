/* eslint no-console: 0 */
'use strict';

const { readdirSync, copyFile } = require('fs');
const rimraf = require('rimraf');
const { join } = require('path');
const spawn = require("cross-spawn");
const copy = require('recursive-copy')

console.log('clearing out old runs...')
rimraf.sync(join(__dirname, 'runs', '*'))

console.log(`installing global dependencies of all benchmarks...`)
let installTask = spawn.sync('npm', ['install'], {
  cwd: __dirname,
  stdio: 'inherit',
});
if (installTask.status > 0) {
  process.exit(installTask.status);
}

installTask = spawn.sync('npm', ['install'], {
  cwd: join(__dirname, 'fps-emit'),
  stdio: 'inherit',
})
if (installTask.status > 0) {
  process.exit(installTask.status);
}

installTask = spawn.sync('npm', ['run', 'build'], {
  cwd: join(__dirname, 'fps-emit'),
  stdio: 'inherit',
})
if (installTask.status > 0) {
  process.exit(installTask.status);
}

const sources = readdirSync(join(__dirname, 'sources'))
sources.forEach(benchmark => {
  const src = join(__dirname, 'sources', benchmark)
  let cwd
  cwd = src
  console.log(`installing dependencies of benchmark ${benchmark}...`)
  let installTask = spawn.sync('npm', ['install'], {
    cwd,
    stdio: 'inherit',
  });
  if (installTask.status > 0) {
    process.exit(installTask.status);
  }


  copyFile(join(__dirname, 'copy-to-public', 'react.production.min.js'), join(src, 'public', 'react.production.min.js'), e => {
    if (e) {
      console.log(e)
      process.exit(1);
    }
  })
  copyFile(join(__dirname, 'copy-to-public', 'redux.min.js'), join(src, 'public', 'redux.min.js'), e => {
    if (e) {
      console.log(e)
      process.exit(1);
    }
  })

  console.log(`building production version of benchmark ${benchmark}...`)
  installTask = spawn.sync('npm', ['run', 'build'], {
    cwd,
    stdio: 'inherit',
  });
  if (installTask.status > 0) {
    process.exit(installTask.status);
  }

  const dest = join(__dirname, 'runs', benchmark);
  copy(join(src, 'build'), dest);

})
