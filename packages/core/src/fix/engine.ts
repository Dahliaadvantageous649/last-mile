import type { Finding, Severity } from '../types/finding.js';

type FixResolver = (finding: Finding) => string;

function extractPackageName(message: string): string {
  const match = message.match(/['"`]([^'"`\s]+)['"`]/) ?? message.match(/(\S+@\S+)/) ?? message.match(/package[:\s]+(\S+)/i);
  return match?.[1] ?? 'the-package';
}

function extractTableName(message: string): string {
  const match = message.match(/table[:\s]+['"`]?(\w+)['"`]?/i) ?? message.match(/['"`](\w+)['"`]/);
  return match?.[1] ?? 'your_table';
}

function extractKeyName(message: string): string {
  const match = message.match(/['"`]([A-Z_][A-Z0-9_]*)['"`]/) ?? message.match(/key[:\s]+(\S+)/i);
  if (match) return match[1];
  const wordMatch = message.match(/(api[_-]?key|secret|token|password|credential)/i);
  return wordMatch ? wordMatch[1].toUpperCase().replace(/-/g, '_') : 'SECRET_KEY';
}

const EXACT_FIXES: Record<string, string | FixResolver> = {
  'sast/eval-usage':
    'Replace eval() with JSON.parse() for data parsing, or use a sandboxed interpreter.',
  'sast/sql-injection':
    "Use parameterized queries: `db.query('SELECT * FROM users WHERE id = $1', [id])`",
  'sast/xss-innerhtml':
    'Use textContent instead of innerHTML, or sanitize with DOMPurify.',
  'sast/cors-wildcard':
    "Specify allowed origins: `cors({ origin: ['https://yourdomain.com'] })`",
  'sast/weak-crypto-md5':
    'Replace MD5 with bcrypt for passwords or SHA-256 for general hashing.',
  'sast/no-auth-middleware':
    "Add authentication middleware: `app.use('/api', authMiddleware)`",
  'sast/fetch-no-catch':
    'Wrap in try/catch: `try { const res = await fetch(url); } catch (e) { handleError(e); }`',
  'sast/console-log-production':
    "Replace with structured logger: `import pino from 'pino'; const log = pino();`",
  'db/no-migrations':
    'Initialize migrations: `npx prisma migrate dev --name init` or `alembic init`',
  'db/rls-disabled': (f: Finding) => {
    const table = extractTableName(f.message);
    return `Enable RLS: \`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;\``;
  },
  'infra/no-cicd':
    'Add GitHub Actions: create `.github/workflows/ci.yml` with lint, test, build steps.',
  'infra/no-dockerfile':
    'Add a Dockerfile for containerized deployment.',
  'infra/env-committed':
    'Add `.env` to `.gitignore` and use `.env.example` for documentation.',
  'obs/no-error-tracking':
    'Install Sentry: `npm install @sentry/node` and initialize in your app entry point.',
  'obs/no-structured-logging':
    'Install pino: `npm install pino` and replace console.log calls.',
  'obs/no-health-endpoint':
    'Add a /health endpoint that returns 200 with uptime and dependency status.',
  'quality/no-tests':
    'Add vitest: `npm install -D vitest` and create test files alongside source.',
  'quality/no-linter':
    'Add ESLint: `npm install -D eslint @typescript-eslint/eslint-plugin`',
};

const PREFIX_FIXES: Record<string, FixResolver> = {
  'secrets/': (f: Finding) => {
    const key = extractKeyName(f.message);
    return `Move to environment variable: \`process.env.${key}\`. Add to .env and .gitignore.`;
  },
  'deps/': (f: Finding) => {
    const pkg = extractPackageName(f.message);
    return `Update ${pkg} to latest: \`npm install ${pkg}@latest\``;
  },
};

const CWE_GUIDANCE: Record<string, string> = {
  'CWE-79': 'Sanitize user input before rendering. Use a templating engine with auto-escaping.',
  'CWE-89': 'Use parameterized queries or an ORM to prevent SQL injection.',
  'CWE-798': 'Move hardcoded credentials to environment variables.',
  'CWE-327': 'Upgrade to a modern cryptographic algorithm (e.g. AES-256-GCM, bcrypt).',
  'CWE-502': 'Validate and sanitize data before deserialization. Prefer JSON over native serialization.',
  'CWE-918': 'Validate URLs against an allowlist to prevent SSRF.',
  'CWE-22': 'Use path.resolve() and validate that resolved paths stay within the intended directory.',
  'CWE-400': 'Add rate limiting and input size validation.',
};

function genericFix(finding: Finding): string {
  if (finding.cwe && CWE_GUIDANCE[finding.cwe]) {
    return CWE_GUIDANCE[finding.cwe];
  }

  const severityAdvice: Record<Severity, string> = {
    critical: 'This is a critical issue — fix immediately before deploying to production.',
    high: 'This is a high-severity issue that should be resolved before merging.',
    medium: 'Consider addressing this issue to improve production readiness.',
    low: 'This is a minor issue — fix when convenient.',
    info: 'Informational — no immediate action required, but consider as a best practice.',
  };

  return severityAdvice[finding.severity];
}

function resolveFix(finding: Finding): string {
  const exact = EXACT_FIXES[finding.ruleId];
  if (exact) {
    return typeof exact === 'function' ? exact(finding) : exact;
  }

  for (const [prefix, resolver] of Object.entries(PREFIX_FIXES)) {
    if (finding.ruleId.startsWith(prefix)) {
      return resolver(finding);
    }
  }

  return genericFix(finding);
}

export function suggestFixes(findings: Finding[]): Finding[] {
  return findings.map((f) => ({
    ...f,
    fix: f.fix ?? resolveFix(f),
  }));
}
