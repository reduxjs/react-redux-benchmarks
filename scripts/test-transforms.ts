import fs from 'fs'
import path from 'path'
import { transformReduxDispatch } from './transforms/reduxTransform'
import { transformUseSyncExternalStoreWithSelector } from './transforms/usesTransform'
import { transformSignalProvider, transformSignalSelector } from './transforms/reactReduxSignalTransform'

function testRedux() {
  console.log('\n=== Testing Redux Transform ===')
  const code = fs.readFileSync(
    path.resolve('node_modules/.pnpm/redux@5.0.1/node_modules/redux/dist/redux.mjs'),
    'utf-8'
  )
  const result = transformReduxDispatch(code)
  if (!result) {
    console.log('FAILED: returned null')
    return
  }

  // Check reducer timing is present
  const hasReducerTiming = result.includes('globalThis.__benchInst.reducerTime')
  const hasReducerCount = result.includes('globalThis.__benchInst.reducerCount')
  const hasNotifyTiming = result.includes('globalThis.__benchInst.notifyTime')
  const hasCallbackCount = result.includes('globalThis.__benchInst.callbackCount')

  console.log(`  reducerTime: ${hasReducerTiming ? 'OK' : 'MISSING'}`)
  console.log(`  reducerCount: ${hasReducerCount ? 'OK' : 'MISSING'}`)
  console.log(`  notifyTime: ${hasNotifyTiming ? 'OK' : 'MISSING'}`)
  console.log(`  callbackCount: ${hasCallbackCount ? 'OK' : 'MISSING'}`)

  // Show the instrumented dispatch section
  const dispatchIdx = result.indexOf('function dispatch(action)')
  if (dispatchIdx !== -1) {
    const section = result.slice(dispatchIdx, dispatchIdx + 800)
    const returnIdx = section.indexOf('return action')
    if (returnIdx !== -1) {
      console.log('\n  Instrumented dispatch body:')
      console.log(section.slice(0, returnIdx + 20).split('\n').map(l => '    ' + l).join('\n'))
    }
  }

  console.log(`  RESULT: ${hasReducerTiming && hasNotifyTiming ? 'PASS' : 'FAIL'}`)
}

function testUses() {
  console.log('\n=== Testing uSES Transform ===')
  const code = fs.readFileSync(
    path.resolve('node_modules/.pnpm/use-sync-external-store@1.6.0_react@19.2.6/node_modules/use-sync-external-store/cjs/use-sync-external-store-with-selector.production.js'),
    'utf-8'
  )
  const result = transformUseSyncExternalStoreWithSelector(code)
  if (!result) {
    console.log('FAILED: returned null')
    return
  }

  const hasSelectorTiming = result.includes('globalThis.__benchInst.selectorTime')
  const hasSelectorCount = result.includes('globalThis.__benchInst.selectorCount')
  const hasEqualityTiming = result.includes('globalThis.__benchInst.equalityCheckTime')
  const hasEqualityCount = result.includes('globalThis.__benchInst.equalityCheckCount')

  console.log(`  selectorTime: ${hasSelectorTiming ? 'OK' : 'MISSING'}`)
  console.log(`  selectorCount: ${hasSelectorCount ? 'OK' : 'MISSING'}`)
  console.log(`  equalityCheckTime: ${hasEqualityTiming ? 'OK' : 'MISSING'}`)
  console.log(`  equalityCheckCount: ${hasEqualityCount ? 'OK' : 'MISSING'}`)

  // Show the memoizedSelector function
  const memoIdx = result.indexOf('function memoizedSelector')
  if (memoIdx !== -1) {
    const endIdx = result.indexOf('var hasMemo', memoIdx)
    if (endIdx !== -1) {
      console.log('\n  Instrumented memoizedSelector:')
      console.log(result.slice(memoIdx, endIdx).split('\n').map(l => '    ' + l).join('\n'))
    }
  }

  console.log(`  RESULT: ${hasSelectorTiming && hasEqualityTiming ? 'PASS' : 'FAIL'}`)
}

function testSignalProvider() {
  console.log('\n=== Testing Signal Provider Transform ===')
  const code = fs.readFileSync(
    path.resolve('.yalc/react-redux/dist/react-redux.mjs'),
    'utf-8'
  )
  const result = transformSignalProvider(code)
  if (!result) {
    console.log('FAILED: returned null')
    return
  }

  const hasReconcileTime = result.includes('globalThis.__benchInst.reconcileTime')
  const hasReconcileCount = result.includes('globalThis.__benchInst.reconcileCount')

  console.log(`  reconcileTime: ${hasReconcileTime ? 'OK' : 'MISSING'}`)
  console.log(`  reconcileCount: ${hasReconcileCount ? 'OK' : 'MISSING'}`)

  // Show the store.subscribe callback
  const subIdx = result.indexOf('store.subscribe(')
  if (subIdx !== -1) {
    const section = result.slice(subIdx, subIdx + 500)
    const endIdx = section.indexOf('});')
    if (endIdx !== -1) {
      console.log('\n  Instrumented store.subscribe:')
      console.log(section.slice(0, endIdx + 3).split('\n').map(l => '    ' + l).join('\n'))
    }
  }

  console.log(`  RESULT: ${hasReconcileTime && hasReconcileCount ? 'PASS' : 'FAIL'}`)
}

function testSignalSelector() {
  console.log('\n=== Testing Signal Selector Transform ===')
  const code = fs.readFileSync(
    path.resolve('.yalc/react-redux/dist/react-redux.mjs'),
    'utf-8'
  )
  const result = transformSignalSelector(code)
  if (!result) {
    console.log('FAILED: returned null')
    return
  }

  const hasSelectorTime = result.includes('globalThis.__benchInst.signalSelectorTime')
  const hasSelectorCount = result.includes('globalThis.__benchInst.signalSelectorCount')

  console.log(`  signalSelectorTime: ${hasSelectorTime ? 'OK' : 'MISSING'}`)
  console.log(`  signalSelectorCount: ${hasSelectorCount ? 'OK' : 'MISSING'}`)

  // Show the createMemo callback
  const memoIdx = result.indexOf('const memo = createMemo')
  if (memoIdx !== -1) {
    const section = result.slice(memoIdx, memoIdx + 600)
    console.log('\n  Instrumented createMemo:')
    console.log(section.split('\n').slice(0, 15).map(l => '    ' + l).join('\n'))
  }

  console.log(`  RESULT: ${hasSelectorTime && hasSelectorCount ? 'PASS' : 'FAIL'}`)
}

testRedux()
testUses()
testSignalProvider()
testSignalSelector()
