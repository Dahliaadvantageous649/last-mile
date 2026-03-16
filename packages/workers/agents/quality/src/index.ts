import type { Codebase } from '../../../../core/src/types/codebase.js';
import type { Finding } from '../../../../core/src/types/finding.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const AGENT = 'quality';
const CATEGORY = 'quality' as const;

function readSafe(absPath: string): string | null {
  try {
    return fs.readFileSync(absPath, 'utf-8');
  } catch {
    return null;
  }
}

function getDeps(rootPath: string): { deps: Set<string>; raw: Record<string, unknown> | null } {
  const pkgPath = path.join(rootPath, 'package.json');
  const content = readSafe(pkgPath);
  if (!content) return { deps: new Set(), raw: null };
  try {
    const pkg = JSON.parse(content);
    return {
      deps: new Set([
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.devDependencies ?? {}),
      ]),
      raw: pkg,
    };
  } catch {
    return { deps: new Set(), raw: null };
  }
}

function isTestFile(file: string): boolean {
  const lower = file.toLowerCase();
  return (
    lower.includes('__tests__') ||
    lower.includes('.test.') ||
    lower.includes('.spec.') ||
    lower.includes('/test/') ||
    lower.includes('/tests/')
  );
}

const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.rb', '.go', '.java', '.rs']);
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo', 'coverage', '__pycache__', '.venv', 'vendor']);

function isSourceFile(file: string): boolean {
  const ext = path.extname(file).toLowerCase();
  const parts = file.split('/');
  if (parts.some(p => SKIP_DIRS.has(p))) return false;
  return SOURCE_EXTS.has(ext);
}

export class QualityAgent {
  readonly name = 'quality';
  readonly category = CATEGORY;

  async scan(codebase: Codebase): Promise<Finding[]> {
    const findings: Finding[] = [];
    let findingIdx = 0;
    const uid = () => `QUAL-${String(++findingIdx).padStart(3, '0')}`;
    const root = codebase.rootPath;

    const { deps, raw: pkgJson } = getDeps(root);
    const sourceFiles = codebase.files.filter(f => isSourceFile(f) && !isTestFile(f));

    // --- 1. No tests ---
    const hasTestFiles = codebase.files.some(f => isTestFile(f));
    const hasTestDir = codebase.files.some(f => {
      const lower = f.toLowerCase();
      return lower.startsWith('test/') || lower.startsWith('tests/') || lower.includes('/__tests__/');
    });
    if (!hasTestFiles && !hasTestDir) {
      findings.push({
        id: uid(), ruleId: 'QUAL-NO-TESTS', severity: 'high', category: CATEGORY,
        file: '.', line: 0,
        message: 'No test files found (*.test.*, *.spec.*, __tests__/, test/). Code changes cannot be verified automatically.',
        fix: 'Add tests using a framework like Vitest or Jest: `npm i -D vitest`.',
        agent: AGENT,
      });
    }

    // --- 2. No test framework ---
    const testFrameworks = ['jest', 'vitest', 'mocha', 'ava', 'tap', 'jasmine', 'pytest', '@testing-library/react', 'cypress', 'playwright'];
    const hasTestFramework = testFrameworks.some(fw => deps.has(fw));
    if (!hasTestFramework) {
      findings.push({
        id: uid(), ruleId: 'QUAL-NO-TEST-FW', severity: 'high', category: CATEGORY,
        file: '.', line: 0,
        message: 'No test framework in dependencies (jest, vitest, mocha, pytest). Tests cannot run without a runner.',
        fix: 'Install a test framework: `npm i -D vitest` and add a test script to package.json.',
        agent: AGENT,
      });
    }

    // --- 3. No linter ---
    const linterIndicators = ['eslint', '@eslint/js', 'biome', '@biomejs/biome', 'prettier', 'tslint', 'oxlint'];
    const hasLinter = linterIndicators.some(l => deps.has(l));
    const hasLintConfig = codebase.files.some(f => {
      const base = path.basename(f).toLowerCase();
      return base.includes('eslint') || base.includes('.prettierrc') || base === 'biome.json' || base === 'biome.jsonc';
    });
    if (!hasLinter && !hasLintConfig) {
      findings.push({
        id: uid(), ruleId: 'QUAL-NO-LINTER', severity: 'medium', category: CATEGORY,
        file: '.', line: 0,
        message: 'No linter or formatter configured (ESLint, Biome, Prettier). Code style inconsistencies will accumulate.',
        fix: 'Add ESLint or Biome: `npm i -D eslint` and create a config file.',
        agent: AGENT,
      });
    }

    // --- 4. No TypeScript ---
    const hasTsConfig = codebase.files.some(f => path.basename(f) === 'tsconfig.json');
    const hasJsFiles = codebase.files.some(f => f.endsWith('.js') || f.endsWith('.jsx'));
    const hasTsFiles = codebase.files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    if (!hasTsConfig && hasJsFiles && !hasTsFiles) {
      findings.push({
        id: uid(), ruleId: 'QUAL-NO-TYPESCRIPT', severity: 'low', category: CATEGORY,
        file: '.', line: 0,
        message: 'JavaScript project without TypeScript. Type safety prevents a large class of runtime bugs.',
        fix: 'Add TypeScript: `npm i -D typescript` and create tsconfig.json. Rename .js files to .ts incrementally.',
        agent: AGENT,
      });
    }

    // --- 5. Large files (>500 lines) ---
    const largeFiles: { file: string; lines: number }[] = [];
    for (const srcFile of sourceFiles) {
      const content = readSafe(path.join(root, srcFile));
      if (!content) continue;
      const lineCount = content.split('\n').length;
      if (lineCount > 500) {
        largeFiles.push({ file: srcFile, lines: lineCount });
      }
    }
    if (largeFiles.length > 0) {
      largeFiles.sort((a, b) => b.lines - a.lines);
      const top5 = largeFiles.slice(0, 5);
      const summary = top5.map(f => `${f.file} (${f.lines} lines)`).join(', ');
      findings.push({
        id: uid(), ruleId: 'QUAL-LARGE-FILES', severity: 'low', category: CATEGORY,
        file: top5[0].file, line: 0,
        message: `${largeFiles.length} file(s) exceed 500 lines. Large files are hard to maintain. Top: ${summary}`,
        fix: 'Break large files into smaller, focused modules with single responsibilities.',
        agent: AGENT,
      });
    }

    // --- 6. Deep nesting ---
    const deeplyNested: { file: string; line: number; depth: number }[] = [];
    for (const srcFile of sourceFiles) {
      const content = readSafe(path.join(root, srcFile));
      if (!content) continue;
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().length === 0) continue;
        const leadingSpaces = line.match(/^(\s*)/)?.[1] ?? '';
        const tabCount = (leadingSpaces.match(/\t/g) || []).length;
        const spaceCount = (leadingSpaces.match(/ /g) || []).length;
        const indentLevel = tabCount + Math.floor(spaceCount / 2);
        if (indentLevel > 5) {
          deeplyNested.push({ file: srcFile, line: i + 1, depth: indentLevel });
        }
      }
    }
    if (deeplyNested.length > 0) {
      const byFile = new Map<string, number>();
      for (const dn of deeplyNested) {
        byFile.set(dn.file, (byFile.get(dn.file) ?? 0) + 1);
      }
      const sortedFiles = [...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      const summary = sortedFiles.map(([f, c]) => `${f} (${c} occurrences)`).join(', ');
      findings.push({
        id: uid(), ruleId: 'QUAL-DEEP-NESTING', severity: 'medium', category: CATEGORY,
        file: sortedFiles[0][0], line: deeplyNested[0].line,
        message: `Deep nesting (>5 levels) found in ${byFile.size} file(s). Top: ${summary}`,
        fix: 'Reduce nesting with early returns, guard clauses, or extract helper functions.',
        agent: AGENT,
      });
    }

    // --- 7. TODO/FIXME/HACK comments ---
    let totalTodos = 0;
    const todoHits: { file: string; count: number }[] = [];
    const todoPattern = /\b(TODO|FIXME|HACK|XXX)\b/;
    for (const srcFile of sourceFiles) {
      const content = readSafe(path.join(root, srcFile));
      if (!content) continue;
      const matches = content.split('\n').filter(l => todoPattern.test(l));
      if (matches.length > 0) {
        totalTodos += matches.length;
        todoHits.push({ file: srcFile, count: matches.length });
      }
    }
    if (totalTodos > 0) {
      todoHits.sort((a, b) => b.count - a.count);
      const top5 = todoHits.slice(0, 5);
      const summary = top5.map(h => `${h.file} (${h.count})`).join(', ');
      findings.push({
        id: uid(), ruleId: 'QUAL-TODO-COMMENTS', severity: 'info', category: CATEGORY,
        file: '.', line: 0,
        message: `${totalTodos} TODO/FIXME/HACK comments in ${todoHits.length} files. Top: ${summary}`,
        fix: 'Triage TODO comments: convert to issues, fix, or remove stale ones.',
        agent: AGENT,
      });
    }

    // --- 8. No README ---
    const hasReadme = codebase.files.some(f => {
      const base = path.basename(f).toLowerCase();
      return base === 'readme.md' || base === 'readme.txt' || base === 'readme';
    });
    if (!hasReadme) {
      findings.push({
        id: uid(), ruleId: 'QUAL-NO-README', severity: 'medium', category: CATEGORY,
        file: '.', line: 0,
        message: 'No README.md found. New contributors have no onboarding documentation.',
        fix: 'Add a README.md with project overview, setup instructions, and contribution guidelines.',
        agent: AGENT,
      });
    }

    // --- 9. Unused dependencies ---
    if (pkgJson) {
      const allDeps = Object.keys((pkgJson as Record<string, unknown>)['dependencies'] as Record<string, unknown> ?? {});
      const unusedDeps: string[] = [];

      for (const dep of allDeps) {
        if (dep.startsWith('@types/')) continue;
        const depName = dep.startsWith('@') ? dep : dep;
        let found = false;
        for (const srcFile of [...sourceFiles, ...codebase.files.filter(f => isTestFile(f))]) {
          const content = readSafe(path.join(root, srcFile));
          if (!content) continue;
          if (content.includes(`'${depName}'`) || content.includes(`"${depName}"`) || content.includes(`from '${depName}/`) || content.includes(`from "${depName}/`) || content.includes(`require('${depName}`) || content.includes(`require("${depName}`)) {
            found = true;
            break;
          }
        }
        if (!found) unusedDeps.push(dep);
      }

      if (unusedDeps.length > 0) {
        const summary = unusedDeps.slice(0, 10).join(', ');
        const extra = unusedDeps.length > 10 ? ` and ${unusedDeps.length - 10} more` : '';
        findings.push({
          id: uid(), ruleId: 'QUAL-UNUSED-DEPS', severity: 'low', category: CATEGORY,
          file: 'package.json', line: 0,
          message: `${unusedDeps.length} potentially unused dependencies: ${summary}${extra}`,
          fix: 'Remove unused dependencies with `npm uninstall <pkg>` or verify they are used implicitly (e.g. plugins).',
          agent: AGENT,
        });
      }
    }

    // --- 10. No .editorconfig ---
    const hasEditorConfig = codebase.files.some(f => path.basename(f) === '.editorconfig');
    if (!hasEditorConfig) {
      findings.push({
        id: uid(), ruleId: 'QUAL-NO-EDITORCONFIG', severity: 'info', category: CATEGORY,
        file: '.', line: 0,
        message: 'No .editorconfig file found. Different editors may use inconsistent formatting (tabs vs spaces, line endings).',
        fix: 'Add an .editorconfig file to enforce consistent formatting across editors.',
        agent: AGENT,
      });
    }

    return findings;
  }
}
