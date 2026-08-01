// Line-level analysis of a saved .cpuprofile against the unminified dist bundles.
// Usage: npx tsx scripts/analyze-profile.ts profiles/<scenario>_<version>.cpuprofile [--module react-redux] [--top 30]
import fs from 'fs'
import path from 'path'

interface CallFrame {
  functionName: string
  url: string
  lineNumber: number
}
interface PositionTick {
  line: number
  ticks: number
}
interface ProfileNode {
  id: number
  callFrame: CallFrame
  hitCount?: number
  children?: number[]
  positionTicks?: PositionTick[]
}
interface Profile {
  nodes: ProfileNode[]
  samples: number[]
  timeDeltas: number[]
  startTime: number
  endTime: number
}

const args = process.argv.slice(2)
const profilePath = args[0]
if (!profilePath) {
  console.error('Usage: analyze-profile.ts <file.cpuprofile> [--module <substr>] [--top N]')
  process.exit(1)
}
const moduleFilter =
  args.includes('--module') ? args[args.indexOf('--module') + 1] : 'react-redux'
const topN = args.includes('--top') ? Number(args[args.indexOf('--top') + 1]) : 30

const profile: Profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'))

// Self time per node from samples + timeDeltas (µs)
const selfTime = new Map<number, number>()
for (let i = 0; i < profile.samples.length; i++) {
  const nodeId = profile.samples[i]
  const delta = profile.timeDeltas[i] ?? 0
  selfTime.set(nodeId, (selfTime.get(nodeId) ?? 0) + delta)
}

const nodesById = new Map(profile.nodes.map((n) => [n.id, n]))

// Aggregate by function
interface FnAgg {
  key: string
  functionName: string
  url: string
  selfUs: number
  hits: number
  lineTicks: Map<number, number>
}
const fnAggs = new Map<string, FnAgg>()
for (const node of profile.nodes) {
  const t = selfTime.get(node.id) ?? 0
  const hits = node.hitCount ?? 0
  if (t === 0 && hits === 0) continue
  const { functionName, url, lineNumber } = node.callFrame
  const key = `${url}:${functionName}:${lineNumber}`
  let agg = fnAggs.get(key)
  if (!agg) {
    agg = {
      key,
      functionName: functionName || '(anonymous)',
      url,
      selfUs: 0,
      hits: 0,
      lineTicks: new Map(),
    }
    fnAggs.set(key, agg)
  }
  agg.selfUs += t
  agg.hits += hits
  for (const pt of node.positionTicks ?? []) {
    agg.lineTicks.set(pt.line, (agg.lineTicks.get(pt.line) ?? 0) + pt.ticks)
  }
}

const totalUs = [...selfTime.values()].reduce((a, b) => a + b, 0)
console.log(
  `Profile: ${path.basename(profilePath)} — total sampled ${(totalUs / 1000).toFixed(0)}ms`,
)

// Module summary
const byModule = new Map<string, number>()
for (const agg of fnAggs.values()) {
  const mod = path.basename(agg.url || '(no url)')
  byModule.set(mod, (byModule.get(mod) ?? 0) + agg.selfUs)
}
console.log('\n== Self time by file ==')
for (const [mod, us] of [...byModule.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`${(us / 1000).toFixed(0).padStart(8)}ms  ${mod}`)
}

// Filtered function table
const filtered = [...fnAggs.values()].filter((a) => a.url.includes(moduleFilter))
filtered.sort((a, b) => b.selfUs - a.selfUs)
const filteredTotal = filtered.reduce((a, b) => a + b.selfUs, 0)
console.log(
  `\n== Top functions in '${moduleFilter}' (self time, total ${(filteredTotal / 1000).toFixed(0)}ms) ==`,
)
for (const agg of filtered.slice(0, topN)) {
  console.log(
    `${(agg.selfUs / 1000).toFixed(1).padStart(9)}ms  ${agg.functionName}  (${path.basename(agg.url)}:${agg.key.split(':').pop()})`,
  )
}

// Line-level detail: merge positionTicks across filtered functions, weight ticks by
// each function's µs-per-hit so lines are in comparable µs units.
interface LineAgg {
  line: number
  us: number
  fns: Set<string>
}
const lineAggs = new Map<number, LineAgg>()
for (const agg of filtered) {
  const totalTicks = [...agg.lineTicks.values()].reduce((a, b) => a + b, 0)
  if (totalTicks === 0) continue
  const usPerTick = agg.selfUs / totalTicks
  for (const [line, ticks] of agg.lineTicks) {
    let la = lineAggs.get(line)
    if (!la) {
      la = { line, us: 0, fns: new Set() }
      lineAggs.set(line, la)
    }
    la.us += ticks * usPerTick
    la.fns.add(agg.functionName || '(anonymous)')
  }
}

// Resolve source lines from the bundle file if we can find it.
// Profile URLs look like http://localhost:9999/<version>/<scenario>/react-redux.js
let sourceLines: string[] | null = null
const sampleUrl = filtered[0]?.url
if (sampleUrl) {
  const m = sampleUrl.match(/localhost:\d+\/(.+)$/)
  if (m) {
    const distPath = path.join(__dirname, '..', 'dist', m[1])
    if (fs.existsSync(distPath)) {
      sourceLines = fs.readFileSync(distPath, 'utf8').split('\n')
      console.log(`\n(source: ${path.relative(process.cwd(), distPath)})`)
    }
  }
}

console.log(`\n== Top lines in '${moduleFilter}' ==`)
const sortedLines = [...lineAggs.values()].sort((a, b) => b.us - a.us)
for (const la of sortedLines.slice(0, topN)) {
  // positionTicks lines are 1-based
  const src = sourceLines?.[la.line - 1]?.trim().slice(0, 110) ?? ''
  console.log(
    `${(la.us / 1000).toFixed(1).padStart(9)}ms  L${String(la.line).padStart(6)}  ${src}  [${[...la.fns].join(',')}]`,
  )
}
