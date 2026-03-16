import type { Finding, Severity } from '../../../core/src/types/finding.js';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
};

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

const SEVERITY_ICON: Record<Severity, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
  info: '⚪',
};

function severityColor(severity: Severity, noColor: boolean): string {
  if (noColor) return '';
  switch (severity) {
    case 'critical': return ANSI.red;
    case 'high': return '\x1b[38;5;208m'; // orange
    case 'medium': return ANSI.yellow;
    case 'low': return ANSI.blue;
    case 'info': return ANSI.gray;
  }
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

function padRight(str: string, len: number): string {
  if (str.length >= len) return str;
  return str + ' '.repeat(len - str.length);
}

export function renderFindingsTable(findings: Finding[], noColor = false, verbose = false): string {
  if (findings.length === 0) {
    const check = noColor ? '✓' : `\x1b[32m✓\x1b[0m`;
    return `\n  ${check} No findings — clean scan!\n`;
  }

  const r = noColor ? '' : ANSI.reset;
  const b = noColor ? '' : ANSI.bold;
  const d = noColor ? '' : ANSI.dim;

  const grouped = new Map<Severity, Finding[]>();
  for (const sev of SEVERITY_ORDER) {
    const items = findings.filter((f) => f.severity === sev);
    if (items.length > 0) grouped.set(sev, items);
  }

  const counts = SEVERITY_ORDER
    .map((s) => {
      const n = findings.filter((f) => f.severity === s).length;
      if (n === 0) return null;
      const c = severityColor(s, noColor);
      return `${c}${n} ${s}${r}`;
    })
    .filter(Boolean);

  const lines: string[] = [
    '',
    `  ${b}FINDINGS${r}  ${d}(${findings.length} total: ${counts.join(', ')})${r}`,
    '',
  ];

  const maxToShow = verbose ? Infinity : 5;

  for (const [severity, items] of grouped) {
    const c = severityColor(severity, noColor);
    const icon = SEVERITY_ICON[severity];

    lines.push(`  ${icon} ${c}${b}${severity.toUpperCase()}${r} ${d}(${items.length})${r}`);
    lines.push('');

    const shown = items.slice(0, maxToShow);
    for (const f of shown) {
      const loc = `${d}${f.file}:${f.line}${r}`;
      const rule = `${d}[${f.ruleId}]${r}`;
      const msg = truncate(f.message, 70);
      lines.push(`     ${c}│${r} ${loc}`);
      lines.push(`     ${c}│${r}   ${msg} ${rule}`);
      if (verbose && f.fix) {
        lines.push(`     ${c}│${r}   ${d}Fix: ${f.fix}${r}`);
      }
      if (verbose && f.cwe) {
        lines.push(`     ${c}│${r}   ${d}${f.cwe}${r}`);
      }
      lines.push('');
    }

    if (items.length > maxToShow) {
      lines.push(`     ${d}... and ${items.length - maxToShow} more (use --verbose to see all)${r}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}
