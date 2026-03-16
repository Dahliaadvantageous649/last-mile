import type { Codebase } from '../../../../core/src/types/codebase.js';
import type { Finding } from '../../../../core/src/types/finding.js';
import type { Severity } from '../../../../core/src/types/finding.js';
import { scanSecrets } from './secrets.js';
import { scanDependencies } from './dependencies.js';
import { scanSast } from './sast.js';

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

function deduplicateFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter(f => {
    const key = `${f.file}:${f.line}:${f.ruleId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export class SecurityAgent {
  readonly name = 'security';
  readonly category = 'security' as const;

  async scan(codebase: Codebase): Promise<Finding[]> {
    const [secrets, deps, sast] = await Promise.all([
      scanSecrets(codebase),
      scanDependencies(codebase),
      scanSast(codebase),
    ]);

    const merged = [...secrets, ...deps, ...sast];
    const unique = deduplicateFindings(merged);

    unique.sort((a, b) => {
      const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return a.file.localeCompare(b.file) || a.line - b.line;
    });

    return unique;
  }
}

export { scanSecrets } from './secrets';
export { scanDependencies } from './dependencies';
export { scanSast } from './sast';
