# Contributing to Last Mile 360

Thank you for your interest in contributing. This project is in active development (Phase 1).

## Current status

Last Mile 360 is in the **scaffolding phase**. The architecture is defined, the monorepo structure is in place, and we're building the core scanner (Phase 1). This is the best time to contribute — you can shape the foundation.

## How to contribute

### Reporting bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml) to file issues.

### Suggesting features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml).

### Reporting false positives

Once the scanner is live, use the [false positive template](.github/ISSUE_TEMPLATE/false_positive.yml) to report incorrect findings. This feedback directly improves our rule accuracy.

### Contributing Semgrep rules

Custom Semgrep rules are our competitive moat. To contribute a new rule:

1. Create the rule YAML in `rules/vibe-patterns/` or `rules/framework-specific/{framework}/`
2. Add a passing test fixture in `rules/test-fixtures/` (code that should NOT trigger the rule)
3. Add a failing test fixture (code that SHOULD trigger the rule)
4. Run `npm run test:rules` to validate
5. Open a PR with a clear description of what the rule catches and why

### Contributing code

1. Fork the repo
2. Create a feature branch from `main`
3. Install dependencies: `npm install`
4. Make your changes
5. Run tests: `npm test`
6. Run linting: `npm run lint`
7. Open a PR using the PR template

## Development setup

```bash
git clone https://github.com/itallstartedwithaidea/last-mile.git
cd last-mile
npm install
npm run dev
```

## Code standards

- **Language:** TypeScript (strict mode)
- **Runtime:** Cloudflare Workers
- **Formatting:** Prettier (config in `.prettierrc`)
- **Linting:** ESLint with `@typescript-eslint`
- **Tests:** Vitest
- **Commits:** Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)

## Architecture rules

1. **No self-hosted models.** All inference through Claude API, Workers AI, or OpenAI via AI Gateway.
2. **No Python in production.** Semgrep rules are YAML. All runtime code is TypeScript on Workers.
3. **No autonomous destructive operations.** Database migrations, code changes, and deployments require human approval.
4. **Every finding maps to a CWE.** No gut-feeling severity ratings.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
