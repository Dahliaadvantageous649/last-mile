# Last Mile 360 — Production Readiness Report

| Field | Value |
|-------|-------|
| **Project** | last-mile |
| **Date** | 2026-03-16T05:43:52.318Z |
| **Score** | 0 / 100 |
| **Grade** | F |

## Stack Detection

| Component | Detected |
|-----------|----------|
| Language | TypeScript |
| Framework | — |
| Database | — |
| Deploy Target | Cloudflare |
| Package Manager | npm |
| Files Scanned | 116 |

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 24 |
| 🟠 High | 38 |
| 🟡 Medium | 7 |
| 🔵 Low | 3 |
| ⚪ Info | 3 |
| **Total** | **75** |

## Category Scores

| Category | Score | Weight | Findings |
|----------|-------|--------|----------|
| security | 0/100 | 35% | 55 |
| database | 0/100 | 20% | 10 |
| infrastructure | 84/100 | 20% | 3 |
| observability | 90/100 | 15% | 3 |
| quality | 88/100 | 10% | 4 |

## 🔴 Critical Findings (24)

### `sast/eval-usage` — eval() executes arbitrary code and is a critical security risk.

- **File:** `packages/core/src/fix/engine.ts:24`
- **CWE:** CWE-95
- **Fix:** Refactor to avoid eval(). Use JSON.parse() for data, or Function constructor with extreme caution.

### `sast/eval-usage` — eval() executes arbitrary code and is a critical security risk.

- **File:** `packages/workers/agents/security/src/sast.ts:78`
- **CWE:** CWE-95
- **Fix:** Refactor to avoid eval(). Use JSON.parse() for data, or Function constructor with extreme caution.

### `sast/eval-usage` — eval() executes arbitrary code and is a critical security risk.

- **File:** `packages/workers/agents/security/src/sast.ts:79`
- **CWE:** CWE-95
- **Fix:** Refactor to avoid eval(). Use JSON.parse() for data, or Function constructor with extreme caution.

### `sast/eval-usage` — eval() executes arbitrary code and is a critical security risk.

- **File:** `packages/workers/agents/security/src/sast.ts:86`
- **CWE:** CWE-95
- **Fix:** Refactor to avoid eval(). Use JSON.parse() for data, or Function constructor with extreme caution.

### `sast/eval-usage` — eval() executes arbitrary code and is a critical security risk.

- **File:** `rules/test-fixtures/vibe-patterns/eval-usage.fail.js:2`
- **CWE:** CWE-95
- **Fix:** Refactor to avoid eval(). Use JSON.parse() for data, or Function constructor with extreme caution.

### `sast/eval-usage` — eval() executes arbitrary code and is a critical security risk.

- **File:** `rules/test-fixtures/vibe-patterns/eval-usage.fail.js:5`
- **CWE:** CWE-95
- **Fix:** Refactor to avoid eval(). Use JSON.parse() for data, or Function constructor with extreme caution.

### `sast/eval-usage` — eval() executes arbitrary code and is a critical security risk.

- **File:** `rules/test-fixtures/vibe-patterns/eval-usage.fail.js:21`
- **CWE:** CWE-95
- **Fix:** Refactor to avoid eval(). Use JSON.parse() for data, or Function constructor with extreme caution.

### `SEC-SECRET-003` — Generic Secret Assignment detected in source code

- **File:** `rules/test-fixtures/vibe-patterns/hardcoded-secrets.fail.js:6`
- **CWE:** CWE-798
- **Fix:** Move this value to an environment variable and add the file to .gitignore

### `SEC-SECRET-003` — Generic Secret Assignment detected in source code

- **File:** `rules/test-fixtures/vibe-patterns/hardcoded-secrets.fail.js:12`
- **CWE:** CWE-798
- **Fix:** Move this value to an environment variable and add the file to .gitignore

### `SEC-SECRET-003` — Generic Secret Assignment detected in source code

- **File:** `rules/test-fixtures/vibe-patterns/hardcoded-secrets.fail.js:16`
- **CWE:** CWE-798
- **Fix:** Move this value to an environment variable and add the file to .gitignore

### `SEC-SECRET-003` — Generic Secret Assignment detected in source code

- **File:** `rules/test-fixtures/vibe-patterns/hardcoded-secrets.fail.js:21`
- **CWE:** CWE-798
- **Fix:** Move this value to an environment variable and add the file to .gitignore

### `SEC-SECRET-005` — GitHub Token detected in source code

- **File:** `rules/test-fixtures/vibe-patterns/hardcoded-secrets.fail.js:21`
- **CWE:** CWE-798
- **Fix:** Move this value to an environment variable and add the file to .gitignore

### `SEC-SECRET-001` — AWS Access Key detected in source code

- **File:** `rules/test-fixtures/vibe-patterns/hardcoded-secrets.fail.js:24`
- **CWE:** CWE-798
- **Fix:** Move this value to an environment variable and add the file to .gitignore

### `SEC-SECRET-003` — Generic Secret Assignment detected in source code

- **File:** `rules/test-fixtures/vibe-patterns/hardcoded-secrets.fail.js:24`
- **CWE:** CWE-798
- **Fix:** Move this value to an environment variable and add the file to .gitignore

### `SEC-SECRET-003` — Generic Secret Assignment detected in source code

- **File:** `rules/test-fixtures/vibe-patterns/hardcoded-secrets.fail.js:27`
- **CWE:** CWE-798
- **Fix:** Move this value to an environment variable and add the file to .gitignore

### `sast/sql-injection-concat` — Possible SQL injection via string concatenation. Use parameterized queries instead.

- **File:** `rules/test-fixtures/vibe-patterns/raw-sql-no-params.fail.js:2`
- **CWE:** CWE-89
- **Fix:** Use parameterized queries (e.g., db.query("SELECT * FROM users WHERE id = $1", [id])).

### `sast/sql-injection-concat` — Possible SQL injection via string concatenation. Use parameterized queries instead.

- **File:** `rules/test-fixtures/vibe-patterns/raw-sql-no-params.fail.js:8`
- **CWE:** CWE-89
- **Fix:** Use parameterized queries (e.g., db.query("SELECT * FROM users WHERE id = $1", [id])).

### `sast/sql-injection-concat` — Possible SQL injection via string concatenation. Use parameterized queries instead.

- **File:** `rules/test-fixtures/vibe-patterns/raw-sql-no-params.fail.js:11`
- **CWE:** CWE-89
- **Fix:** Use parameterized queries (e.g., db.query("SELECT * FROM users WHERE id = $1", [id])).

### `sast/sql-injection-concat` — Possible SQL injection via string concatenation. Use parameterized queries instead.

- **File:** `rules/test-fixtures/vibe-patterns/raw-sql-no-params.fail.js:14`
- **CWE:** CWE-89
- **Fix:** Use parameterized queries (e.g., db.query("SELECT * FROM users WHERE id = $1", [id])).

### `sast/sql-injection-concat` — Possible SQL injection via string concatenation. Use parameterized queries instead.

- **File:** `rules/test-fixtures/vibe-patterns/raw-sql-no-params.fail.js:17`
- **CWE:** CWE-89
- **Fix:** Use parameterized queries (e.g., db.query("SELECT * FROM users WHERE id = $1", [id])).

### `sast/sql-injection-concat` — Possible SQL injection via string concatenation. Use parameterized queries instead.

- **File:** `rules/test-fixtures/vibe-patterns/raw-sql-no-params.fail.js:20`
- **CWE:** CWE-89
- **Fix:** Use parameterized queries (e.g., db.query("SELECT * FROM users WHERE id = $1", [id])).

### `DB-RLS-DISABLED` — Row Level Security is explicitly disabled via .rls(false).

- **File:** `packages/workers/agents/database/src/index.ts:205`
- **CWE:** CWE-284
- **Fix:** Remove .rls(false) and enable RLS with proper policies.

### `DB-RLS-DISABLED` — Row Level Security is explicitly disabled via .rls(false).

- **File:** `packages/workers/agents/database/src/index.ts:209`
- **CWE:** CWE-284
- **Fix:** Remove .rls(false) and enable RLS with proper policies.

### `DB-RLS-DISABLED` — Row Level Security is explicitly disabled via .rls(false).

- **File:** `packages/workers/agents/database/src/index.ts:210`
- **CWE:** CWE-284
- **Fix:** Remove .rls(false) and enable RLS with proper policies.

## 🟠 High Findings (38)

### `sast/xss-document-write` — document.write() can lead to XSS and blocks page rendering.

- **File:** `packages/workers/agents/security/src/sast.ts:67`
- **CWE:** CWE-79
- **Fix:** Use DOM manipulation methods (createElement, appendChild) instead.

### `sast/new-function` — new Function() is equivalent to eval() and executes arbitrary code.

- **File:** `packages/workers/agents/security/src/sast.ts:86`
- **CWE:** CWE-95
- **Fix:** Refactor to avoid dynamic code execution.

### `sast/weak-crypto-md5` — MD5 is cryptographically broken. Do not use for passwords or security-sensitive hashing.

- **File:** `packages/workers/agents/security/src/sast.ts:130`
- **CWE:** CWE-328
- **Fix:** Use SHA-256, SHA-3, or bcrypt/scrypt/argon2 for passwords.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/framework-specific/express/no-helmet.fail.js:8`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/framework-specific/express/no-helmet.pass.js:10`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `sast/cors-wildcard` — CORS wildcard (*) allows any origin to make requests. This may expose sensitive data.

- **File:** `rules/test-fixtures/vibe-patterns/cors-wildcard.fail.js:4`
- **CWE:** CWE-942
- **Fix:** Restrict Access-Control-Allow-Origin to specific trusted origins.

### `sast/cors-wildcard` — CORS wildcard (*) allows any origin to make requests. This may expose sensitive data.

- **File:** `rules/test-fixtures/vibe-patterns/cors-wildcard.fail.js:7`
- **CWE:** CWE-942
- **Fix:** Restrict Access-Control-Allow-Origin to specific trusted origins.

### `sast/cors-wildcard` — CORS wildcard (*) allows any origin to make requests. This may expose sensitive data.

- **File:** `rules/test-fixtures/vibe-patterns/cors-wildcard.fail.js:11`
- **CWE:** CWE-942
- **Fix:** Restrict Access-Control-Allow-Origin to specific trusted origins.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/vibe-patterns/cors-wildcard.fail.js:16`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `sast/cors-wildcard` — CORS wildcard (*) allows any origin to make requests. This may expose sensitive data.

- **File:** `rules/test-fixtures/vibe-patterns/cors-wildcard.fail.js:17`
- **CWE:** CWE-942
- **Fix:** Restrict Access-Control-Allow-Origin to specific trusted origins.

### `sast/cors-wildcard` — CORS wildcard (*) allows any origin to make requests. This may expose sensitive data.

- **File:** `rules/test-fixtures/vibe-patterns/cors-wildcard.fail.js:23`
- **CWE:** CWE-942
- **Fix:** Restrict Access-Control-Allow-Origin to specific trusted origins.

### `sast/new-function` — new Function() is equivalent to eval() and executes arbitrary code.

- **File:** `rules/test-fixtures/vibe-patterns/eval-usage.fail.js:8`
- **CWE:** CWE-95
- **Fix:** Refactor to avoid dynamic code execution.

### `sast/new-function` — new Function() is equivalent to eval() and executes arbitrary code.

- **File:** `rules/test-fixtures/vibe-patterns/eval-usage.fail.js:11`
- **CWE:** CWE-95
- **Fix:** Refactor to avoid dynamic code execution.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/vibe-patterns/eval-usage.fail.js:20`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `SEC-SECRET-002` — Generic API Key Assignment detected in source code

- **File:** `rules/test-fixtures/vibe-patterns/hardcoded-secrets.fail.js:3`
- **CWE:** CWE-798
- **Fix:** Move this value to an environment variable and add the file to .gitignore

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/vibe-patterns/jwt-decode-not-verify.fail.js:10`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/vibe-patterns/jwt-decode-not-verify.pass.js:7`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/vibe-patterns/no-input-validation.fail.js:2`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/vibe-patterns/no-input-validation.fail.js:9`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/vibe-patterns/no-input-validation.fail.js:15`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/vibe-patterns/no-input-validation.fail.js:22`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/vibe-patterns/no-input-validation.pass.js:2`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/vibe-patterns/no-input-validation.pass.js:9`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/vibe-patterns/no-input-validation.pass.js:17`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/vibe-patterns/no-rate-limiting.fail.js:6`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/vibe-patterns/no-rate-limiting.fail.js:11`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/vibe-patterns/no-rate-limiting.fail.js:17`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/vibe-patterns/no-rate-limiting.fail.js:23`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `sast/no-auth-middleware` — Route handler appears to access request body/params without authentication middleware.

- **File:** `rules/test-fixtures/vibe-patterns/no-rate-limiting.pass.js:24`
- **CWE:** CWE-862
- **Fix:** Add authentication middleware before route handlers that process user input.

### `DB-SQL-INJECTION` — Raw SQL with string concatenation/interpolation detected. This is vulnerable to SQL injection.

- **File:** `rules/test-fixtures/vibe-patterns/raw-sql-no-params.fail.js:2`
- **CWE:** CWE-89
- **Fix:** Use parameterized queries (e.g. `$1` placeholders or ORM query builder).

### `DB-SQL-INJECTION` — Raw SQL with string concatenation/interpolation detected. This is vulnerable to SQL injection.

- **File:** `rules/test-fixtures/vibe-patterns/raw-sql-no-params.fail.js:5`
- **CWE:** CWE-89
- **Fix:** Use parameterized queries (e.g. `$1` placeholders or ORM query builder).

### `DB-SQL-INJECTION` — Raw SQL with string concatenation/interpolation detected. This is vulnerable to SQL injection.

- **File:** `rules/test-fixtures/vibe-patterns/raw-sql-no-params.fail.js:8`
- **CWE:** CWE-89
- **Fix:** Use parameterized queries (e.g. `$1` placeholders or ORM query builder).

### `DB-SQL-INJECTION` — Raw SQL with string concatenation/interpolation detected. This is vulnerable to SQL injection.

- **File:** `rules/test-fixtures/vibe-patterns/raw-sql-no-params.fail.js:11`
- **CWE:** CWE-89
- **Fix:** Use parameterized queries (e.g. `$1` placeholders or ORM query builder).

### `DB-SQL-INJECTION` — Raw SQL with string concatenation/interpolation detected. This is vulnerable to SQL injection.

- **File:** `rules/test-fixtures/vibe-patterns/raw-sql-no-params.fail.js:14`
- **CWE:** CWE-89
- **Fix:** Use parameterized queries (e.g. `$1` placeholders or ORM query builder).

### `DB-SQL-INJECTION` — Raw SQL with string concatenation/interpolation detected. This is vulnerable to SQL injection.

- **File:** `rules/test-fixtures/vibe-patterns/raw-sql-no-params.fail.js:17`
- **CWE:** CWE-89
- **Fix:** Use parameterized queries (e.g. `$1` placeholders or ORM query builder).

### `DB-SQL-INJECTION` — Raw SQL with string concatenation/interpolation detected. This is vulnerable to SQL injection.

- **File:** `rules/test-fixtures/vibe-patterns/raw-sql-no-params.fail.js:20`
- **CWE:** CWE-89
- **Fix:** Use parameterized queries (e.g. `$1` placeholders or ORM query builder).

### `INFRA-NO-CICD` — No CI/CD configuration detected. Automated testing and deployment pipelines are essential for reliability.

- **File:** `.:0`
- **CWE:** CWE-16
- **Fix:** Add a CI/CD workflow (e.g. .github/workflows/ci.yml) with build, test, and deploy steps.

### `QUAL-NO-TESTS` — No test files found (*.test.*, *.spec.*, __tests__/, test/). Code changes cannot be verified automatically.

- **File:** `.:0`
- **Fix:** Add tests using a framework like Vitest or Jest: `npm i -D vitest`.

## 🟡 Medium Findings (7)

### `sast/weak-crypto-sha1` — SHA-1 is deprecated for security use. Use SHA-256 or stronger.

- **File:** `packages/workers/agents/security/src/sast.ts:138`
- **CWE:** CWE-328
- **Fix:** Use SHA-256 or SHA-3 for hashing.

### `sast/fetch-no-catch` — fetch() call without visible error handling. Network requests should handle failures.

- **File:** `rules/test-fixtures/vibe-patterns/no-error-handling.fail.js:5`
- **CWE:** CWE-755
- **Fix:** Wrap in try/catch or add a .catch() handler.

### `INFRA-NO-DOCKERFILE` — No Dockerfile found. Containerization ensures reproducible builds and deployments.

- **File:** `.:0`
- **CWE:** CWE-16
- **Fix:** Add a Dockerfile to the project root with a multi-stage build.

### `INFRA-NO-GITIGNORE` — No .gitignore file found. Sensitive files and build artifacts may be committed.

- **File:** `.:0`
- **Fix:** Add a .gitignore file appropriate for your stack (see gitignore.io).

### `OBS-NO-STRUCTURED-LOG` — No structured logging library detected (pino, winston, bunyan). Logs will be unstructured and hard to search.

- **File:** `.:0`
- **Fix:** Add a structured logger: `npm i pino` and replace console.log calls.

### `OBS-NO-MONITORING` — No APM/monitoring library detected (Datadog, New Relic, Prometheus, OpenTelemetry). Performance issues will be invisible.

- **File:** `.:0`
- **Fix:** Add OpenTelemetry or a monitoring agent: `npm i @opentelemetry/sdk-node`.

### `QUAL-DEEP-NESTING` — Deep nesting (>5 levels) found in 7 file(s). Top: packages/workers/agents/database/src/index.ts (54 occurrences), packages/workers/agents/security/src/dependencies.ts (28 occurrences), packages/workers/agents/security/src/sast.ts (20 occurrences), packages/workers/agents/infrastructure/src/index.ts (10 occurrences), packages/workers/agents/security/src/secrets.ts (10 occurrences)

- **File:** `packages/workers/agents/database/src/index.ts:394`
- **Fix:** Reduce nesting with early returns, guard clauses, or extract helper functions.

## 🔵 Low Findings (3)

### `sast/hardcoded-ip` — Hardcoded IP address found. Use configuration or environment variables.

- **File:** `packages/core/src/fix/patcher.ts:55`
- **CWE:** CWE-1188
- **Fix:** Move IP addresses to configuration files or environment variables.

### `sast/console-log-production` — console.log() in production code may leak sensitive information.

- **File:** `packages/workers/agents/security/src/sast.ts:158`
- **CWE:** CWE-532
- **Fix:** Use a structured logger (winston, pino) or remove console.log statements.

### `OBS-CONSOLE-LOG` — 72 console.log/warn/error calls found in 5 source files. Top: packages/cli/src/index.ts (62), rules/test-fixtures/vibe-patterns/console-log-in-production.fail.js (6), rules/test-fixtures/vibe-patterns/no-error-handling.pass.js (2), packages/workers/agents/security/src/sast.ts (1), rules/test-fixtures/vibe-patterns/eval-usage.fail.js (1)

- **File:** `.:0`
- **Fix:** Replace console.* with a structured logger (pino, winston) and configure log levels per environment.

## ⚪ Info Findings (3)

### `SEC-DEP-003` — No .npmrc file found — consider setting engine-strict and save-exact

- **File:** `package.json:1`
- **Fix:** Create .npmrc with engine-strict=true and save-exact=true

### `QUAL-TODO-COMMENTS` — 5 TODO/FIXME/HACK comments in 1 files. Top: packages/workers/agents/quality/src/index.ts (5)

- **File:** `.:0`
- **Fix:** Triage TODO comments: convert to issues, fix, or remove stale ones.

### `QUAL-NO-EDITORCONFIG` — No .editorconfig file found. Different editors may use inconsistent formatting (tabs vs spaces, line endings).

- **File:** `.:0`
- **Fix:** Add an .editorconfig file to enforce consistent formatting across editors.

---

*Generated by [Last Mile 360](https://github.com/itallstartedwithaidea/last-mile) v0.0.1*
