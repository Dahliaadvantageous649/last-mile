import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Finding, Severity } from '../../../../core/src/types/finding.js';
import type { Codebase } from '../../../../core/src/types/codebase.js';

const AGENT_NAME = 'security';

const SCANNABLE_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.py', '.rb']);
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '__pycache__', '.venv', 'vendor', 'coverage']);

interface SastRule {
  ruleId: string;
  severity: Severity;
  cwe: string;
  message: string;
  fix: string;
  pattern: RegExp;
  /** Only apply to these extensions. Undefined = all scannable extensions. */
  extensions?: string[];
  /** Skip files matching these path segments */
  skipPathContains?: string[];
}

const SAST_RULES: SastRule[] = [
  // --- SQL Injection ---
  {
    ruleId: 'sast/sql-injection-concat',
    severity: 'critical',
    cwe: 'CWE-89',
    message: 'Possible SQL injection via string concatenation. Use parameterized queries instead.',
    fix: 'Use parameterized queries (e.g., db.query("SELECT * FROM users WHERE id = $1", [id])).',
    pattern: /(?:query|execute|exec|raw)\s*\(\s*(?:`[^`]*\$\{|['"][^'"]*['"]\s*\+|\+\s*['"]?\s*(?:req\.|request\.|params\.|body\.|query\.|args\.|input))/g,
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'],
  },
  {
    ruleId: 'sast/sql-injection-fstring',
    severity: 'critical',
    cwe: 'CWE-89',
    message: 'Possible SQL injection via f-string or format(). Use parameterized queries.',
    fix: 'Use parameterized queries with %s or ? placeholders.',
    pattern: /(?:execute|cursor\.execute|\.raw)\s*\(\s*f['"]|(?:execute|cursor\.execute)\s*\(\s*['"].*['"]\.format\s*\(/g,
    extensions: ['.py'],
  },

  // --- XSS ---
  {
    ruleId: 'sast/xss-dangerously-set-innerhtml',
    severity: 'high',
    cwe: 'CWE-79',
    message: 'dangerouslySetInnerHTML can lead to XSS if used with untrusted data.',
    fix: 'Sanitize HTML with DOMPurify or use a safe rendering approach.',
    pattern: /dangerouslySetInnerHTML\s*=\s*\{/g,
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  {
    ruleId: 'sast/xss-innerhtml',
    severity: 'high',
    cwe: 'CWE-79',
    message: 'Direct innerHTML assignment can lead to XSS.',
    fix: 'Use textContent instead, or sanitize with DOMPurify.',
    pattern: /\.innerHTML\s*=\s*(?!['"]<\/)/g,
  },
  {
    ruleId: 'sast/xss-document-write',
    severity: 'high',
    cwe: 'CWE-79',
    message: 'document.write() can lead to XSS and blocks page rendering.',
    fix: 'Use DOM manipulation methods (createElement, appendChild) instead.',
    pattern: /document\.write\s*\(/g,
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },

  // --- Code Injection ---
  {
    ruleId: 'sast/eval-usage',
    severity: 'critical',
    cwe: 'CWE-95',
    message: 'eval() executes arbitrary code and is a critical security risk.',
    fix: 'Refactor to avoid eval(). Use JSON.parse() for data, or Function constructor with extreme caution.',
    pattern: /\beval\s*\(/g,
  },
  {
    ruleId: 'sast/new-function',
    severity: 'high',
    cwe: 'CWE-95',
    message: 'new Function() is equivalent to eval() and executes arbitrary code.',
    fix: 'Refactor to avoid dynamic code execution.',
    pattern: /new\s+Function\s*\(/g,
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'],
  },

  // --- CORS ---
  {
    ruleId: 'sast/cors-wildcard',
    severity: 'high',
    cwe: 'CWE-942',
    message: 'CORS wildcard (*) allows any origin to make requests. This may expose sensitive data.',
    fix: 'Restrict Access-Control-Allow-Origin to specific trusted origins.',
    pattern: /(?:Access-Control-Allow-Origin['"]\s*[:,]\s*['"]?\*|cors\(\s*\{?\s*origin\s*:\s*(?:true|['"]?\*))/g,
  },

  // --- Missing Auth ---
  {
    ruleId: 'sast/no-auth-middleware',
    severity: 'high',
    cwe: 'CWE-862',
    message: 'Route handler appears to access request body/params without authentication middleware.',
    fix: 'Add authentication middleware before route handlers that process user input.',
    pattern: /\.(get|post|put|patch|delete)\s*\(\s*['"][^'"]+['"]\s*,\s*(?:async\s+)?\(\s*req/g,
    extensions: ['.js', '.ts', '.mjs', '.cjs'],
  },

  // --- HTTP vs HTTPS ---
  {
    ruleId: 'sast/insecure-http-url',
    severity: 'medium',
    cwe: 'CWE-319',
    message: 'HTTP URL found — data transmitted in cleartext. Use HTTPS.',
    fix: 'Replace http:// with https://.',
    pattern: /['"`]http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0|::1)[a-zA-Z0-9][^'"`\s]*/g,
  },

  // --- Weak Crypto ---
  {
    ruleId: 'sast/weak-crypto-md5',
    severity: 'high',
    cwe: 'CWE-328',
    message: 'MD5 is cryptographically broken. Do not use for passwords or security-sensitive hashing.',
    fix: 'Use SHA-256, SHA-3, or bcrypt/scrypt/argon2 for passwords.',
    pattern: /(?:createHash\s*\(\s*['"]md5['"]|hashlib\.md5|Digest::MD5|MD5\.hexdigest)/g,
  },
  {
    ruleId: 'sast/weak-crypto-sha1',
    severity: 'medium',
    cwe: 'CWE-328',
    message: 'SHA-1 is deprecated for security use. Use SHA-256 or stronger.',
    fix: 'Use SHA-256 or SHA-3 for hashing.',
    pattern: /(?:createHash\s*\(\s*['"]sha1['"]|hashlib\.sha1|Digest::SHA1)/g,
  },

  // --- No Input Validation ---
  {
    ruleId: 'sast/unvalidated-input',
    severity: 'medium',
    cwe: 'CWE-20',
    message: 'Request body/query accessed without apparent validation. Consider adding input validation.',
    fix: 'Validate input with zod, joi, yup, or express-validator before use.',
    pattern: /(?:req\.body\.[a-zA-Z]+|req\.query\.[a-zA-Z]+|req\.params\.[a-zA-Z]+)\s*(?:[;,)\]}]|$)/g,
    extensions: ['.js', '.ts', '.mjs', '.cjs'],
    skipPathContains: ['test', 'spec', '__tests__', '.test.', '.spec.'],
  },

  // --- Console.log in Production ---
  {
    ruleId: 'sast/console-log-production',
    severity: 'low',
    cwe: 'CWE-532',
    message: 'console.log() in production code may leak sensitive information.',
    fix: 'Use a structured logger (winston, pino) or remove console.log statements.',
    pattern: /\bconsole\.(log|debug|info)\s*\(/g,
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'],
    skipPathContains: ['test', 'spec', '__tests__', '.test.', '.spec.', 'scripts', 'cli'],
  },

  // --- Missing Error Handling ---
  {
    ruleId: 'sast/fetch-no-catch',
    severity: 'medium',
    cwe: 'CWE-755',
    message: 'fetch() call without visible error handling. Network requests should handle failures.',
    fix: 'Wrap in try/catch or add a .catch() handler.',
    pattern: /\bfetch\s*\([^)]+\)\s*\.then\s*\([^)]*\)\s*(?!\.catch|\.finally)/g,
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'],
  },
  {
    ruleId: 'sast/promise-no-catch',
    severity: 'low',
    cwe: 'CWE-755',
    message: 'Promise chain without .catch() handler. Unhandled rejections crash Node.js.',
    fix: 'Add .catch() to handle promise rejections, or use try/catch with async/await.',
    pattern: /\.then\s*\([^)]+\)\s*;/g,
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'],
    skipPathContains: ['test', 'spec', '__tests__'],
  },

  // --- Path Traversal ---
  {
    ruleId: 'sast/path-traversal',
    severity: 'high',
    cwe: 'CWE-22',
    message: 'User input passed to file system operation without path sanitization. Risk of path traversal.',
    fix: 'Validate and sanitize file paths. Use path.resolve() and verify the result is within an allowed directory.',
    pattern: /(?:readFile|readFileSync|writeFile|writeFileSync|createReadStream|createWriteStream|unlink|unlinkSync)\s*\(\s*(?:req\.|request\.|params\.|body\.|query\.|args\.)/g,
    extensions: ['.js', '.ts', '.mjs', '.cjs'],
  },

  // --- Hardcoded IP ---
  {
    ruleId: 'sast/hardcoded-ip',
    severity: 'low',
    cwe: 'CWE-1188',
    message: 'Hardcoded IP address found. Use configuration or environment variables.',
    fix: 'Move IP addresses to configuration files or environment variables.',
    pattern: /['"`]\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?['"`]/g,
    skipPathContains: ['test', 'spec', '__tests__', '.test.', '.spec.'],
  },

  // --- Unsafe Deserialization (Python) ---
  {
    ruleId: 'sast/unsafe-deserialization',
    severity: 'critical',
    cwe: 'CWE-502',
    message: 'Unsafe deserialization detected. pickle/yaml.load can execute arbitrary code.',
    fix: 'Use yaml.safe_load() instead of yaml.load(). Avoid pickle with untrusted data.',
    pattern: /(?:pickle\.loads?\s*\(|yaml\.load\s*\(\s*[^,)]+\s*\))/g,
    extensions: ['.py'],
  },

  // --- Exec/System calls (Python/Ruby) ---
  {
    ruleId: 'sast/os-command-injection',
    severity: 'critical',
    cwe: 'CWE-78',
    message: 'OS command execution with potentially unsanitized input. Risk of command injection.',
    fix: 'Use subprocess with shell=False and pass arguments as a list.',
    pattern: /(?:os\.system\s*\(|subprocess\.call\s*\([^,)]*shell\s*=\s*True|exec\s*\(\s*f['"]|system\s*\(\s*['"].*#\{)/g,
    extensions: ['.py', '.rb'],
  },
];

function shouldScanFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (!SCANNABLE_EXTENSIONS.has(ext)) return false;
  const parts = filePath.split(path.sep);
  return !parts.some(p => SKIP_DIRS.has(p));
}

function matchesSkipPath(filePath: string, skipPatterns?: string[]): boolean {
  if (!skipPatterns) return false;
  const lower = filePath.toLowerCase();
  return skipPatterns.some(pattern => lower.includes(pattern));
}

let findingCounter = 0;

export async function scanSast(codebase: Codebase): Promise<Finding[]> {
  const findings: Finding[] = [];
  findingCounter = 0;

  for (const relativePath of codebase.files) {
    if (!shouldScanFile(relativePath)) continue;

    const absolutePath = path.resolve(codebase.rootPath, relativePath);
    const ext = path.extname(relativePath).toLowerCase();

    let content: string;
    try {
      const stat = fs.statSync(absolutePath);
      if (stat.size > 2 * 1024 * 1024) continue;
      content = fs.readFileSync(absolutePath, 'utf-8');
    } catch {
      continue;
    }

    const lines = content.split('\n');

    for (const rule of SAST_RULES) {
      if (rule.extensions && !rule.extensions.includes(ext)) continue;
      if (matchesSkipPath(relativePath, rule.skipPathContains)) continue;

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        const trimmed = line.trim();

        // Skip comment lines
        if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('<!--')) {
          continue;
        }

        rule.pattern.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = rule.pattern.exec(line)) !== null) {
          // For no-auth-middleware rule: skip if the line looks like it already has middleware
          if (rule.ruleId === 'sast/no-auth-middleware') {
            const beforeRoute = line.substring(0, match.index);
            const afterPath = line.substring(match.index);
            // If there are multiple function args before the handler, likely has middleware
            if (/,\s*(?:auth|authenticate|protect|verify|isLoggedIn|requireAuth|ensureAuth|isAdmin|passport)/i.test(afterPath)) {
              continue;
            }
            if (/(?:auth|middleware|protect)/i.test(beforeRoute)) {
              continue;
            }
          }

          findings.push({
            id: `sast-${++findingCounter}`,
            ruleId: rule.ruleId,
            severity: rule.severity,
            category: 'security',
            cwe: rule.cwe,
            file: relativePath,
            line: lineIdx + 1,
            column: match.index + 1,
            message: rule.message,
            fix: rule.fix,
            agent: AGENT_NAME,
          });
        }
      }
    }
  }

  return findings;
}
