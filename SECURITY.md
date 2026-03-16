# Security Policy

Last Mile 360 is a security product. We take vulnerabilities in our own codebase seriously.

## Supported versions

| Version | Supported |
| ------- | --------- |
| main    | Yes       |

## Reporting a vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please report vulnerabilities via one of these channels:

1. **GitHub Security Advisories:** Use the [private vulnerability reporting](https://github.com/itallstartedwithaidea/last-mile/security/advisories/new) feature on this repository.
2. **Email:** security@itallstartedwithaidea.com

### What to include

- Description of the vulnerability
- Steps to reproduce
- Impact assessment (what could an attacker do?)
- Suggested fix (if you have one)

### Response timeline

| Action | Timeline |
| ------ | -------- |
| Acknowledgment | Within 48 hours |
| Triage and assessment | Within 5 business days |
| Fix for critical vulnerabilities | Within 7 days |
| Fix for high-severity vulnerabilities | Within 14 days |
| Public disclosure | After fix is deployed, coordinated with reporter |

### Bug bounty

We credit all valid reporters in our CHANGELOG and README. Bounty amounts for critical findings will be determined on a case-by-case basis as the project matures.

## Security design principles

- **Zero origin servers** — all compute runs on Cloudflare Workers (V8 isolates)
- **No self-hosted models** — all LLM inference through SOC2-compliant providers via AI Gateway
- **Client-side encryption** — code encrypted with AES-256-GCM before upload
- **Least privilege** — each Worker agent only accesses the services it needs
- **No eval** — CLI never evaluates user code; it packages and uploads for analysis
- **DLP on all LLM calls** — AI Gateway scans for leaked secrets in prompts
- **Immutable audit logging** — every admin action logged in D1
