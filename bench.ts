#!/usr/bin/env bun
/**
 * Benchmark automation for react-redux signal selectors.
 *
 * Commands:
 *   run      Build react-redux, publish via yalc, build+run benchmarks, save JSON results
 *   compare  Compare 2+ result files side-by-side
 *   list     List saved result files with metadata
 *
 * Usage:
 *   bun bench.ts run --rr-dir ../markerikson-react-redux [--label name] [--sha commit --exports file] [-l 10]
 *   bun bench.ts compare results/baseline.json results/experiment.json
 *   bun bench.ts list
 */

import { $ } from "bun";
import fs from "fs";
import path from "path";

// ── Types ──

interface GitMeta {
  sha: string;
  shortSha: string;
  branch: string;
  dirty: boolean;
  message: string;
}

interface ResultMeta {
  label: string;
  timestamp: string;
  git: GitMeta;
  checkedOut?: string;
  exportsOverride?: string;
  benchmarkArgs: {
    length: number;
    scenarios: string[];
  };
}

interface InstrumentationStats {
  reducerTime: number;
  reducerCount: number;
  notifyTime: number;
  callbackCount: number;
  selectorTime: number;
  selectorCount: number;
  equalityCheckTime: number;
  equalityCheckCount: number;
  reconcileTime: number;
  reconcileCount: number;
  signalSelectorTime: number;
  signalSelectorCount: number;
}

interface ModuleBreakdown {
  "react-dom": number;
  react: number;
  "react-redux": number;
  "redux/toolkit": number;
  app: number;
  other: number;
  idle: number;
  gc: number;
  browser: number;
}

interface BenchmarkStats {
  cdp: {
    scriptDuration: number;
    taskDuration: number;
    layoutDuration: number;
    styleDuration: number;
  };
  react: {
    mountTime: number | null;
    avgUpdateTime: number | null;
    p50UpdateTime: number | null;
    p95UpdateTime: number | null;
    totalRenderTime: number;
    renderCount: number;
  };
  dispatch: {
    count: number;
    totalTime: number;
    avgTime: number;
  };
  wallTime: number;
  moduleBreakdown?: ModuleBreakdown;
  instrumentation?: InstrumentationStats;
}

interface ResultFile {
  meta: ResultMeta;
  results: Record<string, Record<string, BenchmarkStats>>;
}

// ── Constants ──

const BENCH_DIR = path.resolve(import.meta.dir);
const RESULTS_DIR = path.join(BENCH_DIR, "bench-results");
const SIGNALS_VERSION = "9.2.0-signals-selectors";

// ── Helpers ──

function ensureResultsDir() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

async function getGitMeta(dir: string): Promise<GitMeta> {
  const run = async (cmd: string) => {
    const result = await $`bash -c ${cmd}`.cwd(dir).text();
    return result.trim();
  };

  const sha = await run("git rev-parse HEAD");
  const shortSha = sha.slice(0, 7);
  const branch = await run("git rev-parse --abbrev-ref HEAD");
  const dirtyOutput = await run("git status --porcelain");
  const dirty = dirtyOutput.length > 0;
  const message = await run("git log -1 --pretty=%s");

  return { sha, shortSha, branch, dirty, message };
}

function autoLabel(git: GitMeta): string {
  const branchSlug = git.branch.replace(/\//g, "-").slice(0, 30);
  return `${git.shortSha}${git.dirty ? "-dirty" : ""}-${branchSlug}`;
}

function fmt(n: number | undefined | null, decimals = 1): string {
  if (n == null) return "-";
  return n.toFixed(decimals);
}

function ratio(newVal: number, baseVal: number): string {
  if (baseVal === 0) return newVal === 0 ? "=" : "+∞";
  const r = newVal / baseVal;
  if (r > 1.1) return `${r.toFixed(1)}x ↑`;
  if (r < 0.9) return `${r.toFixed(2)}x ↓`;
  return "~";
}

function padR(s: string, w: number): string {
  return s.length >= w ? s : s + " ".repeat(w - s.length);
}

function padL(s: string, w: number): string {
  return s.length >= w ? s : " ".repeat(w - s.length) + s;
}

// ── Commands ──

async function runBenchmarks(args: string[]) {
  // Parse args
  let rrDir = "";
  let label = "";
  let sha = "";
  let exportsFile = "";
  let length = 10;
  let scenarios: string[] = [];

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--rr-dir":
        rrDir = args[++i];
        break;
      case "--label":
        label = args[++i];
        break;
      case "--sha":
        sha = args[++i];
        break;
      case "--exports":
        exportsFile = args[++i];
        break;
      case "-l":
      case "--length":
        length = parseInt(args[++i], 10);
        break;
      case "-s":
      case "--scenarios":
        scenarios = args[++i].split(",");
        break;
    }
  }

  if (!rrDir) {
    console.error("Error: --rr-dir <path-to-react-redux> is required");
    process.exit(1);
  }

  rrDir = path.resolve(rrDir);
  if (!fs.existsSync(path.join(rrDir, "package.json"))) {
    console.error(`Error: ${rrDir} doesn't look like a project root (no package.json)`);
    process.exit(1);
  }

  ensureResultsDir();

  // If --sha, checkout and apply exports override
  let originalExports: string | null = null;
  let originalHead: string | null = null;

  if (sha) {
    console.log(`[1/7] Checking out ${sha}...`);
    // Save current state
    originalHead = (await $`bash -c "git rev-parse --abbrev-ref HEAD || git rev-parse HEAD"`.cwd(rrDir).text()).trim();
    originalExports = fs.readFileSync(path.join(rrDir, "src/exports.ts"), "utf-8");

    await $`git checkout -- src/exports.ts`.cwd(rrDir);
    await $`git checkout ${sha}`.cwd(rrDir);

    if (exportsFile) {
      const exportsPath = path.resolve(exportsFile);
      if (!fs.existsSync(exportsPath)) {
        console.error(`Error: exports file not found: ${exportsPath}`);
        process.exit(1);
      }
      console.log(`[2/7] Applying exports override: ${exportsFile}`);
      fs.copyFileSync(exportsPath, path.join(rrDir, "src/exports.ts"));
    }
  } else {
    console.log("[1/7] Using current working tree...");
    console.log("[2/7] No exports override needed");
  }

  // Collect git metadata AFTER checkout
  const git = await getGitMeta(rrDir);
  if (!label) label = autoLabel(git);
  const outFile = path.join(RESULTS_DIR, `${label}.json`);

  console.log(`     Label: ${label}`);
  console.log(`     Commit: ${git.shortSha} ${git.message}`);
  console.log(`     Branch: ${git.branch}${git.dirty ? " (dirty)" : ""}`);

  try {
    // Build react-redux
    console.log("[3/7] Building react-redux...");
    await $`yarn build`.cwd(rrDir);

    // Yalc publish
    console.log("[4/7] Publishing via yalc...");
    await $`yalc publish`.cwd(rrDir);

    // Install in benchmarks
    console.log("[5/7] Installing in benchmarks...");
    try { await $`pnpm remove react-redux`.cwd(BENCH_DIR).quiet(); } catch { /* ok if not installed */ }
    await $`yalc add react-redux`.cwd(BENCH_DIR);
    await $`pnpm install`.cwd(BENCH_DIR);

    // Build benchmarks
    console.log("[6/7] Building benchmarks (instrumented)...");
    await $`pnpm build --instrument`.cwd(BENCH_DIR);

    // Run benchmarks
    const scenarioArgs = scenarios.length > 0 ? ["-s", ...scenarios] : [];
    console.log(`[7/7] Running benchmarks (${length}s per scenario)...`);

    const result = await $`pnpm start --json --instrument --profile -l ${length} ${scenarioArgs}`.cwd(BENCH_DIR).text();

    // Parse JSON from stdout (pnpm may prefix output)
    const jsonStart = result.indexOf("{");
    if (jsonStart === -1) {
      console.error("Error: no JSON output from benchmark runner");
      console.error(result.slice(0, 500));
      process.exit(1);
    }
    const benchResults = JSON.parse(result.slice(jsonStart));

    // Build result file
    const resultFile: ResultFile = {
      meta: {
        label,
        timestamp: new Date().toISOString(),
        git,
        ...(sha ? { checkedOut: sha } : {}),
        ...(exportsFile ? { exportsOverride: exportsFile } : {}),
        benchmarkArgs: {
          length,
          scenarios: scenarios.length > 0
            ? scenarios
            : Object.keys(benchResults),
        },
      },
      results: benchResults,
    };

    fs.writeFileSync(outFile, JSON.stringify(resultFile, null, 2));
    console.log(`\nResults saved to: ${outFile}`);
  } finally {
    // Restore original state if we checked out a sha
    if (sha && originalHead) {
      console.log(`\nRestoring original state (${originalHead})...`);
      await $`git checkout -- src/exports.ts`.cwd(rrDir).quiet().nothrow();
      await $`git checkout ${originalHead}`.cwd(rrDir).quiet().nothrow();
      if (originalExports) {
        fs.writeFileSync(path.join(rrDir, "src/exports.ts"), originalExports);
      }
    }
  }
}

async function compareResults(files: string[]) {
  if (files.length < 2) {
    console.error("Error: need at least 2 result files to compare");
    process.exit(1);
  }

  const results: ResultFile[] = files.map((f) => {
    const p = path.resolve(f);
    if (!fs.existsSync(p)) {
      console.error(`Error: file not found: ${p}`);
      process.exit(1);
    }
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  });

  // Print metadata header
  console.log("=== Comparison ===\n");
  for (let i = 0; i < results.length; i++) {
    const m = results[i].meta;
    const tag = i === 0 ? "[A] base" : `[${String.fromCharCode(65 + i)}]     `;
    console.log(`  ${tag}: ${m.label}`);
    console.log(`         ${m.git.shortSha} ${m.git.message.slice(0, 60)}${m.git.dirty ? " [dirty]" : ""}`);
  }
  console.log("");

  // Collect all scenarios across all files
  const allScenarios = new Set<string>();
  for (const r of results) {
    for (const s of Object.keys(r.results)) allScenarios.add(s);
  }

  // Extract signals-selectors stats for each file+scenario
  interface Row {
    script: number | null;
    sigSel: number | null;
    sigNum: number | null;
    reconcile: number | null;
    recNum: number | null;
    rrTime: number | null;
  }

  function extract(r: ResultFile, scenario: string): Row | null {
    const scenarioData = r.results[scenario];
    if (!scenarioData) return null;
    const stats = scenarioData[SIGNALS_VERSION];
    if (!stats) return null;
    return {
      script: stats.cdp.scriptDuration,
      sigSel: stats.instrumentation?.signalSelectorTime ?? null,
      sigNum: stats.instrumentation?.signalSelectorCount ?? null,
      reconcile: stats.instrumentation?.reconcileTime ?? null,
      recNum: stats.instrumentation?.reconcileCount ?? null,
      rrTime: stats.moduleBreakdown?.["react-redux"] ?? null,
    };
  }

  // Metric definitions: [label, extractor, decimals, wider?]
  type MetricDef = [string, (r: Row) => number | null, number];
  const metrics: MetricDef[] = [
    ["Script",    (r) => r.script,    0],
    ["SigSel",    (r) => r.sigSel,    1],
    ["Sig#",      (r) => r.sigNum,    0],
    ["Reconcile", (r) => r.reconcile, 1],
    ["Rec#",      (r) => r.recNum,    0],
    ["r-r Prof",  (r) => r.rrTime,    0],
  ];

  const W = 11; // column width for values (fits "Reconcile" + 2 pad)
  const DW = 10; // column width for delta
  const SW = 30; // scenario name width
  const GAP = 1; // space between metric groups

  // For each comparison pair (baseline vs N), print a table
  for (let ci = 1; ci < results.length; ci++) {
    const tagA = "A";
    const tagB = String.fromCharCode(65 + ci);

    if (results.length > 2) {
      console.log(`--- [${tagA}] vs [${tagB}] ---\n`);
    }

    // Header
    let hdr = padR("Scenario", SW);
    for (const [label] of metrics) {
      hdr += " ".repeat(GAP);
      hdr += padL(label, W);
      hdr += padL(label, W);
      hdr += padL("Δ", DW);
    }
    console.log(hdr);

    // Sub-header with A/B tags
    let sub = padR("", SW);
    for (const [label] of metrics) {
      sub += " ".repeat(GAP);
      sub += padL(tagA, W);
      sub += padL(tagB, W);
      sub += padL("", DW);
    }
    console.log(sub);
    console.log("-".repeat(hdr.length));

    for (const scenario of [...allScenarios].sort()) {
      const rowA = extract(results[0], scenario);
      const rowB = extract(results[ci], scenario);

      let line = padR(scenario, SW);

      for (const [, extractor, decimals] of metrics) {
        const a = rowA ? extractor(rowA) : null;
        const b = rowB ? extractor(rowB) : null;
        line += " ".repeat(GAP);
        line += padL(fmt(a, decimals), W);
        line += padL(fmt(b, decimals), W);
        line += padL(
          a != null && b != null ? ratio(b, a) : "-",
          DW
        );
      }

      console.log(line);
    }

    console.log("");
  }
}

function reportResults(args: string[]) {
  let file = "";
  let base = "9.2.0";
  let target = SIGNALS_VERSION;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--base":
        base = args[++i];
        break;
      case "--target":
        target = args[++i];
        break;
      default:
        if (!file) file = args[i];
        break;
    }
  }

  if (!file) {
    console.error("Error: need a result file: bun bench.ts report bench-results/run.json");
    process.exit(1);
  }

  const p = path.resolve(file);
  if (!fs.existsSync(p)) {
    console.error(`Error: file not found: ${p}`);
    process.exit(1);
  }
  const data: ResultFile = JSON.parse(fs.readFileSync(p, "utf-8"));
  const m = data.meta;

  function pct(a: number, b: number): string {
    if (a === 0) return "n/a";
    const d = ((b - a) / a) * 100;
    return `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`;
  }

  // "391 → 315 (−19.4%)" style cell; "-" when either side is missing
  function cell(a: number | null | undefined, b: number | null | undefined, decimals: number): string {
    if (a == null || b == null) return "-";
    return `${fmt(a, decimals)} → ${fmt(b, decimals)} (${pct(a, b)})`;
  }

  const scenarios = Object.keys(data.results).sort();

  console.log(`### Benchmark results: \`${m.label}\``);
  console.log("");
  console.log(`- Commit: \`${m.git.shortSha}\`${m.git.dirty ? " (dirty)" : ""} on \`${m.git.branch}\` — ${m.git.message}`);
  console.log(`- Run: ${m.timestamp.slice(0, 19).replace("T", " ")} UTC, ${m.benchmarkArgs.length}s per scenario`);
  console.log(`- Comparing: \`${base}\` (base) → \`${target}\``);
  console.log("");
  console.log("| Scenario | Script (ms) | Dispatch avg (ms) | Avg update (ms) | Renders |");
  console.log("| --- | --- | --- | --- | --- |");

  for (const scenario of scenarios) {
    const baseStats = data.results[scenario]?.[base];
    const targetStats = data.results[scenario]?.[target];
    if (!baseStats && !targetStats) continue;

    const cols = [
      cell(baseStats?.cdp.scriptDuration, targetStats?.cdp.scriptDuration, 0),
      cell(baseStats?.dispatch.avgTime, targetStats?.dispatch.avgTime, 2),
      cell(baseStats?.react.avgUpdateTime, targetStats?.react.avgUpdateTime, 2),
      cell(baseStats?.react.renderCount, targetStats?.react.renderCount, 0),
    ];
    console.log(`| ${scenario} | ${cols.join(" | ")} |`);
  }

  console.log("");
  console.log("_Negative deltas = better (less time / fewer renders). Render counts can rise when the base build drops frames under load._");
}

function listResults() {
  ensureResultsDir();

  const files = fs
    .readdirSync(RESULTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  if (files.length === 0) {
    console.log("No results found in bench-results/");
    return;
  }

  console.log("Saved benchmark results:\n");
  const COL = { label: 40, sha: 10, branch: 30, date: 22, scenarios: 8 };

  console.log(
    padR("Label", COL.label) +
    padR("SHA", COL.sha) +
    padR("Branch", COL.branch) +
    padR("Date", COL.date) +
    padR("#Scen", COL.scenarios)
  );
  console.log("-".repeat(COL.label + COL.sha + COL.branch + COL.date + COL.scenarios));

  for (const f of files) {
    try {
      const data: ResultFile = JSON.parse(
        fs.readFileSync(path.join(RESULTS_DIR, f), "utf-8")
      );
      const m = data.meta;
      const nScenarios = Object.keys(data.results).length;
      const date = m.timestamp.slice(0, 19).replace("T", " ");
      console.log(
        padR(m.label, COL.label) +
        padR(m.git.shortSha + (m.git.dirty ? "*" : ""), COL.sha) +
        padR(m.git.branch.slice(0, 28), COL.branch) +
        padR(date, COL.date) +
        padR(String(nScenarios), COL.scenarios)
      );
    } catch {
      console.log(padR(f, COL.label) + "(invalid JSON)");
    }
  }
}

// ── CLI ──

const [command, ...rest] = process.argv.slice(2);

switch (command) {
  case "run":
    await runBenchmarks(rest);
    break;
  case "compare":
    await compareResults(rest);
    break;
  case "report":
    reportResults(rest);
    break;
  case "list":
    listResults();
    break;
  default:
    console.log(`
Usage: bun bench.ts <command> [options]

Commands:
  run      Build & run benchmarks, save results as JSON
  compare  Compare 2+ result files (signals build across runs)
  report   Markdown report for one run: stock vs signals per scenario
  list     List saved results

Run options:
  --rr-dir <path>     Path to react-redux repo (required)
  --label <name>      Label for this run (auto-generated from git if omitted)
  --sha <commit>      Checkout this commit before building
  --exports <file>    Copy this file as src/exports.ts before building
  -l, --length <sec>  Seconds per benchmark (default: 10)
  -s, --scenarios <s> Comma-separated scenario list

Compare:
  bun bench.ts compare bench-results/baseline.json bench-results/experiment.json

Report options:
  --base <version>    Baseline version key (default: 9.2.0)
  --target <version>  Comparison version key (default: ${SIGNALS_VERSION})

  bun bench.ts report bench-results/untrack-signals.json

Examples:
  bun bench.ts run --rr-dir ../markerikson-react-redux
  bun bench.ts run --rr-dir ../markerikson-react-redux --label my-fix -l 10
  bun bench.ts run --rr-dir ../markerikson-react-redux --sha 471666e --exports bisect-results/exports-471666e.ts
    `);
    process.exit(command ? 1 : 0);
}
