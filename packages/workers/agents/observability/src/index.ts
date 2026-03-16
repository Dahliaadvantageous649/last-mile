import type { Codebase } from '../../../../core/src/types/codebase.js';
import type { Finding } from '../../../../core/src/types/finding.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const AGENT = 'observability';
const CATEGORY = 'observability' as const;

function readSafe(absPath: string): string | null {
  try {
    return fs.readFileSync(absPath, 'utf-8');
  } catch {
    return null;
  }
}

function isTestFile(file: string): boolean {
  const lower = file.toLowerCase();
  return (
    lower.includes('__tests__') ||
    lower.includes('.test.') ||
    lower.includes('.spec.') ||
    lower.includes('/test/') ||
    lower.includes('/tests/') ||
    lower.includes('__mocks__')
  );
}

function getDeps(rootPath: string): Set<string> {
  const pkgPath = path.join(rootPath, 'package.json');
  const content = readSafe(pkgPath);
  if (!content) return new Set();
  try {
    const pkg = JSON.parse(content);
    return new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ]);
  } catch {
    return new Set();
  }
}

export class ObservabilityAgent {
  readonly name = 'observability';
  readonly category = CATEGORY;

  async scan(codebase: Codebase): Promise<Finding[]> {
    const findings: Finding[] = [];
    let findingIdx = 0;
    const uid = () => `OBS-${String(++findingIdx).padStart(3, '0')}`;
    const root = codebase.rootPath;

    const deps = getDeps(root);

    const jsExts = new Set(['.ts', '.tsx', '.js', '.jsx']);
    const sourceFiles = codebase.files.filter(f =>
      jsExts.has(path.extname(f).toLowerCase()) && !isTestFile(f),
    );

    // --- 1. console.log in production ---
    let totalConsoleLogs = 0;
    const consoleHits: { file: string; count: number }[] = [];

    for (const srcFile of sourceFiles) {
      const content = readSafe(path.join(root, srcFile));
      if (!content) continue;
      const matches = content.match(/console\.(log|warn|error|debug|info)\s*\(/g);
      if (matches && matches.length > 0) {
        totalConsoleLogs += matches.length;
        consoleHits.push({ file: srcFile, count: matches.length });
      }
    }

    if (totalConsoleLogs > 0) {
      consoleHits.sort((a, b) => b.count - a.count);
      const top5 = consoleHits.slice(0, 5);
      const summary = top5.map(h => `${h.file} (${h.count})`).join(', ');
      findings.push({
        id: uid(), ruleId: 'OBS-CONSOLE-LOG', severity: 'low', category: CATEGORY,
        file: '.', line: 0,
        message: `${totalConsoleLogs} console.log/warn/error calls found in ${consoleHits.length} source files. Top: ${summary}`,
        fix: 'Replace console.* with a structured logger (pino, winston) and configure log levels per environment.',
        agent: AGENT,
      });
    }

    // --- 2. No error tracking ---
    const errorTrackingLibs = ['@sentry/node', '@sentry/nextjs', '@sentry/react', '@sentry/browser', 'sentry', '@bugsnag/js', 'bugsnag', 'logrocket', '@highlight-run/node', 'highlight.run'];
    const hasErrorTracking = errorTrackingLibs.some(lib => deps.has(lib));
    let hasErrorTrackingCode = false;
    if (!hasErrorTracking) {
      for (const srcFile of sourceFiles) {
        const content = readSafe(path.join(root, srcFile));
        if (!content) continue;
        if (content.includes('Sentry.init') || content.includes('Bugsnag.start') || content.includes('LogRocket.init')) {
          hasErrorTrackingCode = true;
          break;
        }
      }
    }
    if (!hasErrorTracking && !hasErrorTrackingCode) {
      findings.push({
        id: uid(), ruleId: 'OBS-NO-ERROR-TRACKING', severity: 'high', category: CATEGORY,
        file: '.', line: 0,
        message: 'No error tracking SDK detected (Sentry, Bugsnag, LogRocket). Production errors will go unnoticed.',
        fix: 'Add Sentry or equivalent: `npm i @sentry/node` and initialize at app startup.',
        agent: AGENT,
      });
    }

    // --- 3. No structured logging ---
    const loggingLibs = ['pino', 'winston', 'bunyan', 'log4js', 'tslog', 'roarr'];
    const hasStructuredLogging = loggingLibs.some(lib => deps.has(lib));
    if (!hasStructuredLogging) {
      findings.push({
        id: uid(), ruleId: 'OBS-NO-STRUCTURED-LOG', severity: 'medium', category: CATEGORY,
        file: '.', line: 0,
        message: 'No structured logging library detected (pino, winston, bunyan). Logs will be unstructured and hard to search.',
        fix: 'Add a structured logger: `npm i pino` and replace console.log calls.',
        agent: AGENT,
      });
    }

    // --- 4. No health endpoint ---
    let hasHealthEndpoint = false;
    for (const srcFile of sourceFiles) {
      const content = readSafe(path.join(root, srcFile));
      if (!content) continue;
      if (/['"\/]health['"]/.test(content) || /['"\/]ready['"]/.test(content) || /\/health/.test(content)) {
        hasHealthEndpoint = true;
        break;
      }
    }
    if (!hasHealthEndpoint) {
      findings.push({
        id: uid(), ruleId: 'OBS-NO-HEALTH', severity: 'medium', category: CATEGORY,
        file: '.', line: 0,
        message: 'No /health or /ready endpoint found. Monitoring systems cannot verify service availability.',
        fix: 'Add a GET /health endpoint returning { status: "ok" } with dependency checks.',
        agent: AGENT,
      });
    }

    // --- 5. No monitoring ---
    const monitoringLibs = [
      'dd-trace', 'datadog-metrics', 'newrelic', 'prom-client',
      '@opentelemetry/sdk-node', '@opentelemetry/api', 'opentelemetry',
      '@google-cloud/monitoring', 'applicationinsights', 'elastic-apm-node',
    ];
    const hasMonitoring = monitoringLibs.some(lib => deps.has(lib));
    if (!hasMonitoring) {
      findings.push({
        id: uid(), ruleId: 'OBS-NO-MONITORING', severity: 'medium', category: CATEGORY,
        file: '.', line: 0,
        message: 'No APM/monitoring library detected (Datadog, New Relic, Prometheus, OpenTelemetry). Performance issues will be invisible.',
        fix: 'Add OpenTelemetry or a monitoring agent: `npm i @opentelemetry/sdk-node`.',
        agent: AGENT,
      });
    }

    // --- 6. No alerting ---
    const alertingKeywords = ['pagerduty', 'opsgenie', 'slack-webhook', 'alertmanager', 'alert', 'webhook.*alert'];
    let hasAlerting = false;
    const ciFiles = codebase.files.filter(f =>
      f.includes('.github/') || f.includes('.gitlab') || f.endsWith('.yml') || f.endsWith('.yaml'),
    );
    for (const cf of [...ciFiles, ...sourceFiles]) {
      const content = readSafe(path.join(root, cf));
      if (!content) continue;
      const lower = content.toLowerCase();
      if (alertingKeywords.some(kw => lower.includes(kw)) || lower.includes('pagerduty') || lower.includes('opsgenie')) {
        hasAlerting = true;
        break;
      }
    }
    if (!hasAlerting) {
      findings.push({
        id: uid(), ruleId: 'OBS-NO-ALERTING', severity: 'low', category: CATEGORY,
        file: '.', line: 0,
        message: 'No alerting integration detected (PagerDuty, OpsGenie, Slack webhooks). Outages may go undetected.',
        fix: 'Configure alerting via PagerDuty, OpsGenie, or Slack incoming webhooks for critical metrics.',
        agent: AGENT,
      });
    }

    // --- 7. Unhandled promise rejections ---
    let hasUnhandledRejectionHandler = false;
    for (const srcFile of sourceFiles) {
      const content = readSafe(path.join(root, srcFile));
      if (!content) continue;
      if (content.includes("process.on('unhandledRejection'") || content.includes('process.on("unhandledRejection"') || content.includes('unhandledRejection')) {
        hasUnhandledRejectionHandler = true;
        break;
      }
    }
    if (!hasUnhandledRejectionHandler) {
      findings.push({
        id: uid(), ruleId: 'OBS-UNHANDLED-REJECTION', severity: 'medium', category: CATEGORY,
        cwe: 'CWE-755', file: '.', line: 0,
        message: 'No process.on("unhandledRejection") handler found. Unhandled promise rejections crash Node.js 15+ silently.',
        fix: 'Add `process.on("unhandledRejection", (err) => { logger.error(err); })` at app entry.',
        agent: AGENT,
      });
    }

    // --- 8. No request logging ---
    const requestLogLibs = ['morgan', 'pino-http', 'express-pino-logger', 'express-winston', 'koa-logger'];
    const hasRequestLogging = requestLogLibs.some(lib => deps.has(lib));
    let hasRequestLoggingCode = false;
    if (!hasRequestLogging) {
      for (const srcFile of sourceFiles) {
        const content = readSafe(path.join(root, srcFile));
        if (!content) continue;
        if (content.includes('requestLogger') || content.includes('httpLogger') || content.includes('accessLog')) {
          hasRequestLoggingCode = true;
          break;
        }
      }
    }
    if (!hasRequestLogging && !hasRequestLoggingCode) {
      findings.push({
        id: uid(), ruleId: 'OBS-NO-REQUEST-LOG', severity: 'low', category: CATEGORY,
        file: '.', line: 0,
        message: 'No request logging middleware detected (morgan, pino-http). API requests are not being logged.',
        fix: 'Add request logging: `npm i pino-http` and use as middleware.',
        agent: AGENT,
      });
    }

    return findings;
  }
}
