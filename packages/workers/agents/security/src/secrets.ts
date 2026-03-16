import type { Finding } from '../../../../core/src/types/finding.js';
import type { Codebase } from '../../../../core/src/types/codebase.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface SecretPattern {
  id: string;
  name: string;
  pattern: RegExp;
  severity: 'critical' | 'high';
  cwe: string;
}

const PATTERNS: SecretPattern[] = [
  {
    id: 'SEC-SECRET-001',
    name: 'AWS Access Key',
    pattern: /(?:AKIA[0-9A-Z]{16})/,
    severity: 'critical',
    cwe: 'CWE-798',
  },
  {
    id: 'SEC-SECRET-002',
    name: 'Generic API Key Assignment',
    pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["'][a-zA-Z0-9_\-]{16,}["']/i,
    severity: 'high',
    cwe: 'CWE-798',
  },
  {
    id: 'SEC-SECRET-003',
    name: 'Generic Secret Assignment',
    pattern: /(?:secret|token|password|passwd|pwd)\s*[:=]\s*["'][^\s"']{8,}["']/i,
    severity: 'critical',
    cwe: 'CWE-798',
  },
  {
    id: 'SEC-SECRET-004',
    name: 'Private Key',
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
    severity: 'critical',
    cwe: 'CWE-321',
  },
  {
    id: 'SEC-SECRET-005',
    name: 'GitHub Token',
    pattern: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}/,
    severity: 'critical',
    cwe: 'CWE-798',
  },
  {
    id: 'SEC-SECRET-006',
    name: 'Slack Token',
    pattern: /xox[bpors]-[0-9]{10,}-[0-9a-zA-Z]{10,}/,
    severity: 'high',
    cwe: 'CWE-798',
  },
  {
    id: 'SEC-SECRET-007',
    name: 'Hardcoded JWT',
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
    severity: 'high',
    cwe: 'CWE-798',
  },
];

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo', 'coverage', '__pycache__', '.venv', 'vendor']);
const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.rb', '.go', '.java', '.rs', '.env', '.yml', '.yaml', '.toml', '.json', '.cfg', '.ini', '.conf']);

function shouldScan(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();
  if (base === 'package-lock.json' || base === 'yarn.lock' || base === 'pnpm-lock.yaml') return false;
  return SOURCE_EXTS.has(ext) || base.startsWith('.env');
}

export async function scanSecrets(codebase: Codebase): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const file of codebase.files) {
    if (!shouldScan(file)) continue;
    const absPath = path.join(codebase.rootPath, file);
    let content: string;
    try {
      content = fs.readFileSync(absPath, 'utf-8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//') && line.includes('example')) continue;
      if (line.trimStart().startsWith('#') && line.includes('example')) continue;

      for (const pat of PATTERNS) {
        if (pat.pattern.test(line)) {
          findings.push({
            id: `${pat.id}-${file}-${i + 1}`,
            ruleId: pat.id,
            severity: pat.severity,
            category: 'security',
            cwe: pat.cwe,
            file,
            line: i + 1,
            message: `${pat.name} detected in source code`,
            fix: `Move this value to an environment variable and add the file to .gitignore`,
            agent: 'security',
          });
        }
      }
    }
  }

  return findings;
}
