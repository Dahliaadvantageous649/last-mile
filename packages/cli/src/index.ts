import * as fs from 'node:fs';
import * as path from 'node:path';

import { detectLanguage } from '../../core/src/detection/language.js';
import { detectFramework } from '../../core/src/detection/framework.js';
import { detectDatabase } from '../../core/src/detection/database.js';
import { detectDeployTarget } from '../../core/src/detection/deployment.js';
import {
  calculateScore,
  getGrade,
  getGradeColor,
  getGradeLabel,
  calculateCategoryScores,
  buildSummary,
} from '../../core/src/scoring/rubric.js';
import type { Codebase } from '../../core/src/types/codebase.js';
import type { Report } from '../../core/src/types/report.js';
import type { Finding } from '../../core/src/types/finding.js';

import { SecurityAgent } from '../../workers/agents/security/src/index.js';
import { DatabaseAgent } from '../../workers/agents/database/src/index.js';
import { InfrastructureAgent } from '../../workers/agents/infrastructure/src/index.js';
import { ObservabilityAgent } from '../../workers/agents/observability/src/index.js';
import { QualityAgent } from '../../workers/agents/quality/src/index.js';
import { loadConfig, shouldIgnoreFile, isRuleDisabled, getRuleSeverity, isSecretAllowed } from '../../core/src/config.js';
import { suggestFixes } from '../../core/src/fix/engine.js';
import { generatePatches } from '../../core/src/fix/patcher.js';
import type { Config } from '../../core/src/config.js';

import { renderScoreGauge } from './display/score-gauge.js';
import { renderFindingsTable } from './display/findings-table.js';
import { Progress } from './display/progress.js';
import { generateMarkdownReport } from './report/markdown.js';
import { generateJsonReport } from './report/json.js';

const VERSION = '0.1.0';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  purple: '\x1b[35m',
  blue: '\x1b[34m',
};

// ── Flag parsing ──

interface CliFlags {
  json: boolean;
  verbose: boolean;
  noColor: boolean;
  markdown: boolean;
}

function parseArgs(): { command: string | null; target: string | null; flags: CliFlags } {
  const args = process.argv.slice(2);
  const flags: CliFlags = {
    json: false,
    verbose: false,
    noColor: false,
    markdown: false,
  };

  const positional: string[] = [];

  for (const arg of args) {
    if (arg === '--json') flags.json = true;
    else if (arg === '--verbose' || arg === '-v') flags.verbose = true;
    else if (arg === '--no-color') flags.noColor = true;
    else if (arg === '--markdown' || arg === '--md') flags.markdown = true;
    else if (!arg.startsWith('-')) positional.push(arg);
  }

  if (process.env.NO_COLOR) flags.noColor = true;

  return {
    command: positional[0] ?? null,
    target: positional[1] ?? null,
    flags,
  };
}

// ── File walking ──

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', '.turbo',
  'coverage', '__pycache__', '.venv', 'vendor', '.cache',
  '.vercel', '.netlify', '.output', 'out',
]);

const SOURCE_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java',
  '.json', '.yml', '.yaml', '.toml',
  '.env', '.cfg', '.ini', '.conf',
  '.md', '.sh',
]);

function walkDir(dir: string, rootPath: string, maxFiles = 2000): string[] {
  const files: string[] = [];

  function walk(current: string) {
    if (files.length >= maxFiles) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) return;

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
          walk(path.join(current, entry.name));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const base = path.basename(entry.name);
        if (SOURCE_EXTS.has(ext) || base.startsWith('.env')) {
          files.push(path.relative(rootPath, path.join(current, entry.name)));
        }
      }
    }
  }

  walk(dir);
  return files;
}

// ── Stack detection ──

function detectPackageManager(rootPath: string): string | null {
  if (fs.existsSync(path.join(rootPath, 'bun.lockb'))) return 'bun';
  if (fs.existsSync(path.join(rootPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(rootPath, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(rootPath, 'package-lock.json'))) return 'npm';
  if (fs.existsSync(path.join(rootPath, 'package.json'))) return 'npm';
  return null;
}

function detectCodebase(rootPath: string): Codebase {
  const absPath = path.resolve(rootPath);
  const files = walkDir(absPath, absPath);

  return {
    rootPath: absPath,
    framework: detectFramework(absPath),
    language: detectLanguage(absPath),
    database: detectDatabase(absPath),
    deployTarget: detectDeployTarget(absPath),
    packageManager: detectPackageManager(absPath),
    files,
  };
}

// ── Banner ──

function printBanner(noColor: boolean) {
  const r = noColor ? '' : ANSI.reset;
  const b = noColor ? '' : ANSI.bold;
  const c = noColor ? '' : ANSI.cyan;
  const d = noColor ? '' : ANSI.dim;

  console.log('');
  console.log(`  ${c}${b}Last Mile 360${r} ${d}v${VERSION}${r}`);
  console.log(`  ${d}Production readiness scanner${r}`);
  console.log('');
}

// ── Stack summary ──

function printStack(codebase: Codebase, noColor: boolean) {
  const r = noColor ? '' : ANSI.reset;
  const b = noColor ? '' : ANSI.bold;
  const d = noColor ? '' : ANSI.dim;
  const g = noColor ? '' : ANSI.green;

  console.log(`  ${b}STACK DETECTED${r}`);
  console.log('');
  console.log(`     Language:        ${g}${codebase.language}${r}`);
  console.log(`     Framework:       ${g}${codebase.framework ?? '—'}${r}`);
  console.log(`     Database:        ${g}${codebase.database ?? '—'}${r}`);
  console.log(`     Deploy Target:   ${g}${codebase.deployTarget ?? '—'}${r}`);
  console.log(`     Package Manager: ${g}${codebase.packageManager ?? '—'}${r}`);
  console.log(`     Files Scanned:   ${d}${codebase.files.length}${r}`);
  console.log('');
}

// ── Build report ──

function buildReport(projectName: string, codebase: Codebase, findings: Finding[]): Report {
  const score = calculateScore(findings);
  const grade = getGrade(score);
  return {
    projectName,
    scanDate: new Date().toISOString(),
    score,
    grade,
    gradeColor: getGradeColor(grade),
    codebase,
    findings,
    summary: buildSummary(findings),
    categoryScores: calculateCategoryScores(findings),
  };
}

// ── Help ──

function printHelp(noColor: boolean) {
  const r = noColor ? '' : ANSI.reset;
  const b = noColor ? '' : ANSI.bold;
  const d = noColor ? '' : ANSI.dim;
  const c = noColor ? '' : ANSI.cyan;

  printBanner(noColor);
  console.log(`  ${b}USAGE${r}`);
  console.log(`     last-mile scan <path>    Scan a project directory`);
  console.log(`     last-mile score <path>   Show score gauge only`);
  console.log(`     last-mile fix <path>     Show auto-fix patches`);
  console.log('');
  console.log(`  ${b}FLAGS${r}`);
  console.log(`     --json       Output report as JSON`);
  console.log(`     --markdown   Output report as Markdown`);
  console.log(`     --verbose    Show all findings with fixes`);
  console.log(`     --no-color   Disable ANSI color codes`);
  console.log('');
  console.log(`  ${b}CONFIG${r}`);
  console.log(`     Create ${c}.last-mile.yml${r} in your project root to:`);
  console.log(`     - Disable rules:     ${d}policy.disable: [console-log-in-production]${r}`);
  console.log(`     - Ignore files:      ${d}policy.ignore: ["**/test-fixtures/**"]${r}`);
  console.log(`     - Allow secrets:     ${d}allow-secrets: [".env", ".env.local"]${r}`);
  console.log(`     - Override severity: ${d}policy.override: { cors-wildcard: warning }${r}`);
  console.log('');
  console.log(`  ${b}EXAMPLES${r}`);
  console.log(`     ${d}$ npx tsx packages/cli/src/index.ts scan .${r}`);
  console.log(`     ${d}$ npx tsx packages/cli/src/index.ts scan ./my-app --json${r}`);
  console.log(`     ${d}$ npx tsx packages/cli/src/index.ts fix . --verbose${r}`);
  console.log('');
}

// ── Main ──

async function main() {
  const { command, target, flags } = parseArgs();

  if (!command) {
    printHelp(flags.noColor);
    process.exit(0);
  }

  if (command !== 'scan' && command !== 'score' && command !== 'fix') {
    console.error(`  Unknown command: ${command}`);
    console.error(`  Run without arguments for help.`);
    process.exit(1);
  }

  const targetPath = target ?? '.';
  const absPath = path.resolve(targetPath);

  if (!fs.existsSync(absPath)) {
    console.error(`  Path not found: ${absPath}`);
    process.exit(1);
  }

  // Step 1: Banner
  if (!flags.json) {
    printBanner(flags.noColor);
  }

  // Step 2: Detect stack
  const progress = new Progress(flags.noColor);
  if (!flags.json) progress.start('Detecting stack');

  const codebase = detectCodebase(absPath);
  const projectName = path.basename(absPath);

  if (!flags.json) {
    progress.stop();
    printStack(codebase, flags.noColor);
  }

  // Step 3: Load config
  const config = loadConfig(absPath);

  // Apply config-based file filtering
  codebase.files = codebase.files.filter(f => !shouldIgnoreFile(config, f));

  // Step 4: Run all agents
  const agents = [
    ...(config.agents.security ? [new SecurityAgent()] : []),
    ...(config.agents.database ? [new DatabaseAgent()] : []),
    ...(config.agents.infrastructure ? [new InfrastructureAgent()] : []),
    ...(config.agents.observability ? [new ObservabilityAgent()] : []),
    ...(config.agents.quality ? [new QualityAgent()] : []),
  ];

  let allFindings: Finding[] = [];

  for (const agent of agents) {
    if (!flags.json) progress.start(`Running ${agent.name}`);
    const agentFindings = await agent.scan(codebase);
    allFindings.push(...agentFindings);
  }

  if (!flags.json) progress.done();

  // Step 5: Apply config filters
  allFindings = allFindings
    .filter(f => !isRuleDisabled(config, f.ruleId))
    .filter(f => {
      if (f.ruleId.startsWith('secrets/') && isSecretAllowed(config, f.file)) return false;
      return true;
    })
    .map(f => ({
      ...f,
      severity: getRuleSeverity(config, f.ruleId, f.severity),
    }));

  // Step 6: Add fix suggestions
  allFindings = suggestFixes(allFindings);

  // Step 7: Build report
  const report = buildReport(projectName, codebase, allFindings);

  // Step 5: Output
  if (flags.json) {
    console.log(generateJsonReport(report));
    process.exit(0);
  }

  if (flags.markdown) {
    console.log(generateMarkdownReport(report));
    process.exit(0);
  }

  // Terminal output
  console.log(renderScoreGauge(report.score, report.grade, flags.noColor));

  if (command === 'scan') {
    console.log(renderFindingsTable(report.findings, flags.noColor, flags.verbose));

    // Category breakdown
    const r = flags.noColor ? '' : ANSI.reset;
    const b = flags.noColor ? '' : ANSI.bold;
    const d = flags.noColor ? '' : ANSI.dim;

    console.log(`  ${b}CATEGORY SCORES${r}`);
    console.log('');

    for (const [cat, data] of Object.entries(report.categoryScores)) {
      const barLen = 20;
      const filled = Math.round((data.score / 100) * barLen);
      const empty = barLen - filled;
      const color = data.score >= 85
        ? (flags.noColor ? '' : ANSI.green)
        : data.score >= 70
          ? (flags.noColor ? '' : ANSI.yellow)
          : (flags.noColor ? '' : ANSI.red);
      const bar = `${color}${'█'.repeat(filled)}${d}${'░'.repeat(empty)}${r}`;
      const label = (cat.charAt(0).toUpperCase() + cat.slice(1)).padEnd(16);
      console.log(`     ${label} ${bar} ${color}${data.score}${r}/100 ${d}(${data.findings} findings)${r}`);
    }
    console.log('');
  }

  // Fix command — show patches
  if (command === 'fix') {
    const patches = generatePatches(report.findings, codebase);
    const r = flags.noColor ? '' : ANSI.reset;
    const b = flags.noColor ? '' : ANSI.bold;
    const g = flags.noColor ? '' : ANSI.green;
    const d = flags.noColor ? '' : ANSI.dim;
    const c = flags.noColor ? '' : ANSI.cyan;

    if (patches.length === 0) {
      console.log(`  ${g}No auto-fixable issues found.${r}`);
    } else {
      console.log(`  ${b}AUTO-FIX PATCHES${r} ${d}(${patches.length} available)${r}`);
      console.log('');
      for (const patch of patches) {
        const action = patch.action === 'create' ? `${g}CREATE${r}` : patch.action === 'append' ? `${c}APPEND${r}` : `${ANSI.yellow}MODIFY${r}`;
        console.log(`  ${action} ${b}${patch.file}${r}`);
        console.log(`  ${d}${patch.description}${r}`);
        if (flags.verbose) {
          console.log(`  ${d}${'─'.repeat(60)}${r}`);
          const lines = patch.content.split('\n').slice(0, 20);
          for (const line of lines) {
            console.log(`  ${d}│${r} ${line}`);
          }
          if (patch.content.split('\n').length > 20) {
            console.log(`  ${d}│ ... (${patch.content.split('\n').length - 20} more lines)${r}`);
          }
          console.log(`  ${d}${'─'.repeat(60)}${r}`);
        }
        console.log('');
      }
      console.log(`  ${d}To apply: review each patch and apply manually, or use --verbose to see full content.${r}`);
    }
    console.log('');
  }

  // Markdown report file
  const reportDir = path.join(absPath, '.last-mile');
  try {
    fs.mkdirSync(reportDir, { recursive: true });
    const reportPath = path.join(reportDir, 'report.md');
    fs.writeFileSync(reportPath, generateMarkdownReport(report));
    const d = flags.noColor ? '' : ANSI.dim;
    const r = flags.noColor ? '' : ANSI.reset;
    console.log(`  ${d}Report saved to ${path.relative(absPath, reportPath)}${r}`);
    console.log('');
  } catch {
    // non-fatal if we can't write the report file
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
