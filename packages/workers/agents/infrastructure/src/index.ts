import type { Codebase } from '../../../../core/src/types/codebase.js';
import type { Finding } from '../../../../core/src/types/finding.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const AGENT = 'infrastructure';
const CATEGORY = 'infrastructure' as const;

const SOURCE_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.rb', '.go', '.java', '.rs',
  '.yml', '.yaml', '.toml', '.json', '.cfg', '.ini', '.conf', '.sh',
]);

function readSafe(absPath: string): string | null {
  try {
    return fs.readFileSync(absPath, 'utf-8');
  } catch {
    return null;
  }
}

function existsSync(absPath: string): boolean {
  try {
    fs.accessSync(absPath);
    return true;
  } catch {
    return false;
  }
}

export class InfrastructureAgent {
  readonly name = 'infrastructure';
  readonly category = CATEGORY;

  async scan(codebase: Codebase): Promise<Finding[]> {
    const findings: Finding[] = [];
    let findingIdx = 0;
    const uid = () => `INFRA-${String(++findingIdx).padStart(3, '0')}`;
    const root = codebase.rootPath;

    const sourceFiles = codebase.files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return SOURCE_EXTS.has(ext);
    });

    // --- 1. No Dockerfile ---
    const hasDockerfile = codebase.files.some(f =>
      path.basename(f).toLowerCase().startsWith('dockerfile'),
    );
    if (!hasDockerfile) {
      findings.push({
        id: uid(), ruleId: 'INFRA-NO-DOCKERFILE', severity: 'medium', category: CATEGORY,
        cwe: 'CWE-16', file: '.', line: 0,
        message: 'No Dockerfile found. Containerization ensures reproducible builds and deployments.',
        fix: 'Add a Dockerfile to the project root with a multi-stage build.',
        agent: AGENT,
      });
    }

    // --- 2. No CI/CD ---
    const ciIndicators = [
      '.github/workflows', '.gitlab-ci.yml', 'Jenkinsfile',
      '.circleci', '.travis.yml', 'azure-pipelines.yml', 'bitbucket-pipelines.yml',
    ];
    const hasCI = codebase.files.some(f =>
      ciIndicators.some(ci => f.includes(ci)),
    );
    if (!hasCI) {
      findings.push({
        id: uid(), ruleId: 'INFRA-NO-CICD', severity: 'high', category: CATEGORY,
        cwe: 'CWE-16', file: '.', line: 0,
        message: 'No CI/CD configuration detected. Automated testing and deployment pipelines are essential for reliability.',
        fix: 'Add a CI/CD workflow (e.g. .github/workflows/ci.yml) with build, test, and deploy steps.',
        agent: AGENT,
      });
    }

    // --- 3. No .gitignore ---
    const hasGitignore = codebase.files.some(f => path.basename(f) === '.gitignore');
    if (!hasGitignore) {
      findings.push({
        id: uid(), ruleId: 'INFRA-NO-GITIGNORE', severity: 'medium', category: CATEGORY,
        file: '.', line: 0,
        message: 'No .gitignore file found. Sensitive files and build artifacts may be committed.',
        fix: 'Add a .gitignore file appropriate for your stack (see gitignore.io).',
        agent: AGENT,
      });
    }

    // --- 4. node_modules committed ---
    const nodeModulesCommitted = codebase.files.some(f => f.startsWith('node_modules/') || f.includes('/node_modules/'));
    if (nodeModulesCommitted) {
      findings.push({
        id: uid(), ruleId: 'INFRA-NODE-MODULES', severity: 'high', category: CATEGORY,
        file: 'node_modules/', line: 0,
        message: 'node_modules/ appears to be committed. This bloats the repo and causes merge conflicts.',
        fix: 'Add `node_modules/` to .gitignore and remove from git with `git rm -r --cached node_modules`.',
        agent: AGENT,
      });
    }

    // --- 5. .env committed ---
    const gitignorePath = path.join(root, '.gitignore');
    const gitignoreContent = readSafe(gitignorePath) ?? '';
    const envIgnored = gitignoreContent.split('\n').some(l => l.trim() === '.env' || l.trim() === '.env*' || l.trim() === '*.env');
    const envFiles = codebase.files.filter(f => {
      const base = path.basename(f);
      return base === '.env' || (base.startsWith('.env.') && !base.includes('example') && !base.includes('sample') && !base.includes('template'));
    });
    if (envFiles.length > 0 && !envIgnored) {
      for (const envFile of envFiles) {
        findings.push({
          id: uid(), ruleId: 'INFRA-ENV-COMMITTED', severity: 'critical', category: CATEGORY,
          cwe: 'CWE-798', file: envFile, line: 0,
          message: `.env file "${envFile}" exists and is not in .gitignore. Secrets will leak into version control.`,
          fix: 'Add `.env*` to .gitignore immediately. Rotate any committed secrets.',
          agent: AGENT,
        });
      }
    }

    // --- 6. No health endpoint ---
    const routeExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.rb', '.go']);
    const routeFiles = codebase.files.filter(f => routeExts.has(path.extname(f).toLowerCase()));
    let hasHealthEndpoint = false;
    for (const rFile of routeFiles) {
      const content = readSafe(path.join(root, rFile));
      if (!content) continue;
      if (/['"\/]health['"]/.test(content) || /['"\/]ready['"]/.test(content) || /\/health/.test(content) || /\/ready/.test(content)) {
        hasHealthEndpoint = true;
        break;
      }
    }
    if (!hasHealthEndpoint) {
      findings.push({
        id: uid(), ruleId: 'INFRA-NO-HEALTH', severity: 'medium', category: CATEGORY,
        file: '.', line: 0,
        message: 'No /health or /ready endpoint found. Load balancers and orchestrators need health checks.',
        fix: 'Add a GET /health endpoint that returns 200 when the service is ready.',
        agent: AGENT,
      });
    }

    // --- 7. Missing HTTPS redirect ---
    const configExts = new Set(['.ts', '.js', '.json', '.yml', '.yaml', '.toml', '.conf', '.cfg', '.env']);
    const configFiles = codebase.files.filter(f => configExts.has(path.extname(f).toLowerCase()));
    for (const cFile of configFiles) {
      const content = readSafe(path.join(root, cFile));
      if (!content) continue;
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0|::1)[\w.-]+/.test(line)) {
          if (line.trimStart().startsWith('//') || line.trimStart().startsWith('#')) continue;
          findings.push({
            id: uid(), ruleId: 'INFRA-HTTP-URL', severity: 'medium', category: CATEGORY,
            file: cFile, line: i + 1,
            message: 'Plain HTTP URL found in configuration. Use HTTPS to prevent man-in-the-middle attacks.',
            fix: 'Change http:// to https:// for all non-local URLs.',
            agent: AGENT,
          });
          break;
        }
      }
    }

    // --- 8. No security headers ---
    const allSource = codebase.files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
    });
    let hasSecurityHeaders = false;
    for (const sFile of allSource) {
      const content = readSafe(path.join(root, sFile));
      if (!content) continue;
      if (
        content.includes('helmet') ||
        content.includes('X-Frame-Options') ||
        content.includes('Content-Security-Policy') ||
        content.includes('X-Content-Type-Options') ||
        content.includes('securityHeaders')
      ) {
        hasSecurityHeaders = true;
        break;
      }
    }
    const pkgJson = readSafe(path.join(root, 'package.json'));
    if (pkgJson && pkgJson.includes('"helmet"')) hasSecurityHeaders = true;

    if (!hasSecurityHeaders) {
      findings.push({
        id: uid(), ruleId: 'INFRA-NO-SECURITY-HEADERS', severity: 'medium', category: CATEGORY,
        cwe: 'CWE-693', file: '.', line: 0,
        message: 'No security headers configured. Missing X-Frame-Options, CSP, and X-Content-Type-Options exposes the app to attacks.',
        fix: 'Add the `helmet` middleware or manually set security headers in your server/edge config.',
        agent: AGENT,
      });
    }

    // --- 9. Exposed ports (0.0.0.0) ---
    const composeFiles = codebase.files.filter(f => {
      const base = path.basename(f).toLowerCase();
      return base.startsWith('docker-compose') || base === 'compose.yml' || base === 'compose.yaml';
    });
    for (const cf of composeFiles) {
      const content = readSafe(path.join(root, cf));
      if (!content) continue;
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (/0\.0\.0\.0:\d+/.test(lines[i])) {
          findings.push({
            id: uid(), ruleId: 'INFRA-EXPOSED-PORT', severity: 'medium', category: CATEGORY,
            file: cf, line: i + 1,
            message: 'Port bound to 0.0.0.0 in docker-compose. This exposes the service to all network interfaces.',
            fix: 'Bind to 127.0.0.1 instead (e.g. "127.0.0.1:5432:5432") or use Docker network isolation.',
            agent: AGENT,
          });
        }
      }
    }

    // --- 10. Missing rate limiting ---
    let hasRateLimiter = false;
    const rateLimitKeywords = [
      'rate-limit', 'rateLimit', 'rateLimiter', 'express-rate-limit',
      'slowDown', 'throttle', '@nestjs/throttler', 'fastify-rate-limit',
    ];
    for (const sFile of allSource) {
      const content = readSafe(path.join(root, sFile));
      if (!content) continue;
      if (rateLimitKeywords.some(kw => content.includes(kw))) {
        hasRateLimiter = true;
        break;
      }
    }
    if (pkgJson) {
      if (rateLimitKeywords.some(kw => pkgJson.includes(kw))) hasRateLimiter = true;
    }
    if (!hasRateLimiter) {
      findings.push({
        id: uid(), ruleId: 'INFRA-NO-RATE-LIMIT', severity: 'high', category: CATEGORY,
        cwe: 'CWE-770', file: '.', line: 0,
        message: 'No rate limiting detected. The application is vulnerable to brute-force and denial-of-service attacks.',
        fix: 'Add rate limiting middleware (e.g. express-rate-limit, @nestjs/throttler).',
        agent: AGENT,
      });
    }

    // --- 11. No error pages ---
    const hasErrorPage = codebase.files.some(f => {
      const base = path.basename(f).toLowerCase();
      const lower = f.toLowerCase();
      return base === '404.html' || base === '500.html' ||
        lower.includes('pages/404') || lower.includes('pages/500') ||
        lower.includes('app/not-found') || lower.includes('error-page') ||
        lower.includes('pages/_error') || lower.includes('app/error');
    });
    let hasErrorHandler = false;
    for (const sFile of allSource) {
      const content = readSafe(path.join(root, sFile));
      if (!content) continue;
      if (
        /app\.use\(\s*\(err/.test(content) ||
        content.includes('ErrorBoundary') ||
        content.includes('errorHandler') ||
        content.includes('@Catch(')
      ) {
        hasErrorHandler = true;
        break;
      }
    }
    if (!hasErrorPage && !hasErrorHandler) {
      findings.push({
        id: uid(), ruleId: 'INFRA-NO-ERROR-PAGES', severity: 'low', category: CATEGORY,
        file: '.', line: 0,
        message: 'No custom error pages or error handler found. Users will see raw error output.',
        fix: 'Add custom 404/500 pages or a global error handling middleware.',
        agent: AGENT,
      });
    }

    return findings;
  }
}
