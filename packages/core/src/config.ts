import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Severity } from './types/finding.js';

export interface Config {
  version: number;
  mergeThreshold: number;
  agents: {
    security: boolean;
    database: boolean;
    infrastructure: boolean;
    observability: boolean;
    quality: boolean;
  };
  policy: {
    disable: string[];
    override: Record<string, Severity>;
    ignore: string[];
  };
  allowSecrets: string[];
  framework: string | null;
  database: string | null;
}

const DEFAULT_CONFIG: Config = {
  version: 1,
  mergeThreshold: 70,
  agents: {
    security: true,
    database: true,
    infrastructure: true,
    observability: true,
    quality: true,
  },
  policy: {
    disable: [],
    override: {},
    ignore: [],
  },
  allowSecrets: [],
  framework: null,
  database: null,
};

// ---------------------------------------------------------------------------
// Minimal YAML parser — handles the config format we define (scalars, lists,
// simple maps one level deep, and quoted strings). No dependency needed.
// ---------------------------------------------------------------------------

function stripComment(line: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    if (ch === '"' && !inSingle) inDouble = !inDouble;
    if (ch === '#' && !inSingle && !inDouble) return line.slice(0, i);
  }
  return line;
}

function parseScalar(raw: string): string | number | boolean | null {
  const v = raw.trim();
  if (v === '' || v === 'null' || v === '~') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  // strip surrounding quotes
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function parseYaml(text: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = text.split('\n');

  let currentKey: string | null = null;
  let currentMap: Record<string, unknown> | null = null;
  let currentList: unknown[] | null = null;

  function flushCollection() {
    if (currentKey !== null) {
      if (currentMap !== null) {
        result[currentKey] = currentMap;
        currentMap = null;
      }
      if (currentList !== null) {
        result[currentKey] = currentList;
        currentList = null;
      }
    }
  }

  for (const rawLine of lines) {
    const line = stripComment(rawLine);
    const trimmed = line.trimEnd();

    if (trimmed === '' || trimmed.trim() === '') continue;

    const indent = line.length - line.trimStart().length;

    // Top-level key: value
    if (indent === 0 && trimmed.includes(':')) {
      flushCollection();
      const colonIdx = trimmed.indexOf(':');
      const key = trimmed.slice(0, colonIdx).trim();
      const val = trimmed.slice(colonIdx + 1).trim();

      if (val === '') {
        // block collection follows
        currentKey = key;
        currentMap = null;
        currentList = null;
      } else {
        currentKey = null;
        result[key] = parseScalar(val);
      }
      continue;
    }

    // Indented content belongs to currentKey
    if (currentKey !== null && indent >= 2) {
      const content = trimmed.trim();

      // List item: "- value"
      if (content.startsWith('- ')) {
        if (currentMap !== null) {
          flushCollection();
        }
        if (currentList === null) currentList = [];
        currentList.push(parseScalar(content.slice(2)));
        continue;
      }

      // Nested key: value
      if (content.includes(':')) {
        if (currentList !== null) {
          flushCollection();
        }
        if (currentMap === null) currentMap = {};
        const colonIdx = content.indexOf(':');
        const subKey = content.slice(0, colonIdx).trim();
        const subVal = content.slice(colonIdx + 1).trim();
        currentMap[subKey] = parseScalar(subVal);
        continue;
      }
    }
  }

  flushCollection();
  return result;
}

// ---------------------------------------------------------------------------
// Config loader
// ---------------------------------------------------------------------------

export function loadConfig(rootPath: string): Config {
  const configPath = join(rootPath, '.last-mile.yml');
  let raw: string;

  try {
    raw = readFileSync(configPath, 'utf-8');
  } catch {
    return { ...DEFAULT_CONFIG, agents: { ...DEFAULT_CONFIG.agents }, policy: { ...DEFAULT_CONFIG.policy, override: {}, disable: [], ignore: [] }, allowSecrets: [] };
  }

  const parsed = parseYaml(raw);

  const agents = { ...DEFAULT_CONFIG.agents };
  if (parsed.agents && typeof parsed.agents === 'object') {
    const a = parsed.agents as Record<string, unknown>;
    for (const k of Object.keys(agents) as (keyof Config['agents'])[]) {
      if (typeof a[k] === 'boolean') agents[k] = a[k] as boolean;
    }
  }

  const policy = { disable: [] as string[], override: {} as Record<string, Severity>, ignore: [] as string[] };
  if (parsed.policy && typeof parsed.policy === 'object') {
    const p = parsed.policy as Record<string, unknown>;
    if (Array.isArray(p.disable)) policy.disable = p.disable.map(String);
    if (p.override && typeof p.override === 'object') {
      for (const [k, v] of Object.entries(p.override as Record<string, unknown>)) {
        if (isValidSeverity(String(v))) {
          policy.override[k] = String(v) as Severity;
        }
      }
    }
    if (Array.isArray(p.ignore)) policy.ignore = p.ignore.map(String);
  }

  // The YAML parser will produce the policy sub-keys at the top level of the
  // "policy" map. But because our simple parser only goes one level deep inside
  // a block, we also need to handle the case where the policy block was parsed
  // as a flat map with sub-blocks (disable / override / ignore) being separate
  // top-level-ish keys.  The format has two-space indent *within* "policy:",
  // so the parser already captures these.  We handle both paths above and fall
  // through cleanly.

  const allowSecrets: string[] = Array.isArray(parsed['allow-secrets'])
    ? (parsed['allow-secrets'] as unknown[]).map(String)
    : [];

  return {
    version: typeof parsed.version === 'number' ? parsed.version : DEFAULT_CONFIG.version,
    mergeThreshold: typeof parsed['merge-threshold'] === 'number' ? parsed['merge-threshold'] : DEFAULT_CONFIG.mergeThreshold,
    agents,
    policy,
    allowSecrets,
    framework: parsed.framework != null ? String(parsed.framework) : null,
    database: parsed.database != null ? String(parsed.database) : null,
  };
}

function isValidSeverity(v: string): v is Severity {
  return ['critical', 'high', 'medium', 'low', 'info'].includes(v);
}

// ---------------------------------------------------------------------------
// Glob matching — supports *, **, and ? placeholders
// ---------------------------------------------------------------------------

function globToRegex(pattern: string): RegExp {
  let re = '';
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === '*') {
      if (pattern[i + 1] === '*') {
        // ** matches any path segments
        if (pattern[i + 2] === '/') {
          re += '(?:.+/)?';
          i += 3;
        } else {
          re += '.*';
          i += 2;
        }
      } else {
        // * matches anything except /
        re += '[^/]*';
        i++;
      }
    } else if (ch === '?') {
      re += '[^/]';
      i++;
    } else if (ch === '.') {
      re += '\\.';
      i++;
    } else {
      re += ch;
      i++;
    }
  }
  return new RegExp(`^${re}$`);
}

function matchGlob(pattern: string, filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  const regex = globToRegex(pattern);
  return regex.test(normalized);
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export function shouldIgnoreFile(config: Config, filePath: string): boolean {
  return config.policy.ignore.some((pattern) => matchGlob(pattern, filePath));
}

export function isRuleDisabled(config: Config, ruleId: string): boolean {
  return config.policy.disable.includes(ruleId);
}

export function getRuleSeverity(config: Config, ruleId: string, defaultSeverity: Severity): Severity {
  const ruleShort = ruleId.includes('/') ? ruleId.split('/').pop()! : ruleId;

  if (config.policy.override[ruleId]) return config.policy.override[ruleId];
  if (config.policy.override[ruleShort]) return config.policy.override[ruleShort];
  return defaultSeverity;
}

export function isSecretAllowed(config: Config, filePath: string): boolean {
  return config.allowSecrets.some((pattern) => matchGlob(pattern, filePath));
}
