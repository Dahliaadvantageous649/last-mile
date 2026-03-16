# Custom Semgrep Rules

The competitive moat. Framework-agnostic vibe-code anti-patterns plus framework-specific rules.

Every rule has a CWE mapping. Every rule has test fixtures (pass + fail).

## Structure

- `vibe-patterns/` — Universal anti-patterns (hardcoded secrets, no error handling, etc.)
- `framework-specific/` — Next.js, Express, FastAPI, Supabase rules
- `test-fixtures/` — Pass/fail test cases for every rule

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for rule contribution guidelines.
