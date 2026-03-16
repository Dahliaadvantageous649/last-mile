import type { Finding } from '../../../../core/src/types/finding.js';
import type { Codebase } from '../../../../core/src/types/codebase.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface DepCheck {
  id: string;
  check: (rootPath: string) => Finding | null;
}

function readPkg(rootPath: string): { dependencies?: Record<string, string>; devDependencies?: Record<string, string> } | null {
  const pkgPath = path.join(rootPath, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  } catch {
    return null;
  }
}

const CHECKS: DepCheck[] = [
  {
    id: 'SEC-DEP-001',
    check(rootPath) {
      const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'];
      const hasLock = lockFiles.some((f) => fs.existsSync(path.join(rootPath, f)));
      if (!hasLock && fs.existsSync(path.join(rootPath, 'package.json'))) {
        return {
          id: 'SEC-DEP-001-lockfile',
          ruleId: 'SEC-DEP-001',
          severity: 'high',
          category: 'security',
          cwe: 'CWE-829',
          file: 'package.json',
          line: 1,
          message: 'No lock file found — dependency versions are not pinned',
          fix: 'Run `npm install` or `yarn install` to generate a lock file and commit it',
          agent: 'security',
        };
      }
      return null;
    },
  },
  {
    id: 'SEC-DEP-002',
    check(rootPath) {
      const pkg = readPkg(rootPath);
      if (!pkg) return null;
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const [name, version] of Object.entries(allDeps)) {
        if (typeof version === 'string' && version === '*') {
          return {
            id: `SEC-DEP-002-${name}`,
            ruleId: 'SEC-DEP-002',
            severity: 'medium',
            category: 'security',
            cwe: 'CWE-829',
            file: 'package.json',
            line: 1,
            message: `Dependency "${name}" uses wildcard version "*"`,
            fix: `Pin "${name}" to a specific version range`,
            agent: 'security',
          };
        }
      }
      return null;
    },
  },
  {
    id: 'SEC-DEP-003',
    check(rootPath) {
      if (!fs.existsSync(path.join(rootPath, '.npmrc'))) {
        if (fs.existsSync(path.join(rootPath, 'package.json'))) {
          return {
            id: 'SEC-DEP-003-npmrc',
            ruleId: 'SEC-DEP-003',
            severity: 'info',
            category: 'security',
            file: 'package.json',
            line: 1,
            message: 'No .npmrc file found — consider setting engine-strict and save-exact',
            fix: 'Create .npmrc with engine-strict=true and save-exact=true',
            agent: 'security',
          };
        }
      }
      return null;
    },
  },
  {
    id: 'SEC-DEP-004',
    check(rootPath) {
      const gitignorePath = path.join(rootPath, '.gitignore');
      if (!fs.existsSync(gitignorePath)) {
        return {
          id: 'SEC-DEP-004-gitignore',
          ruleId: 'SEC-DEP-004',
          severity: 'medium',
          category: 'security',
          file: '.',
          line: 1,
          message: 'No .gitignore file found — sensitive files may be committed',
          fix: 'Create a .gitignore file appropriate for your language/framework',
          agent: 'security',
        };
      }
      try {
        const content = fs.readFileSync(gitignorePath, 'utf-8');
        if (!content.includes('.env') && fs.existsSync(path.join(rootPath, 'package.json'))) {
          return {
            id: 'SEC-DEP-004-env',
            ruleId: 'SEC-DEP-004',
            severity: 'high',
            category: 'security',
            file: '.gitignore',
            line: 1,
            message: '.env files are not listed in .gitignore — secrets may be committed',
            fix: 'Add .env* to your .gitignore file',
            agent: 'security',
          };
        }
      } catch {
        // skip
      }
      return null;
    },
  },
];

export async function scanDependencies(codebase: Codebase): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const check of CHECKS) {
    const result = check.check(codebase.rootPath);
    if (result) findings.push(result);
  }
  return findings;
}
