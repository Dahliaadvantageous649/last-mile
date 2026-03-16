import type { Finding } from '../types/finding.js';
import type { Codebase } from '../types/codebase.js';

export interface Patch {
  file: string;
  action: 'create' | 'modify' | 'append';
  content: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Template generators
// ---------------------------------------------------------------------------

function ciYaml(codebase: Codebase): string {
  const installCmd = codebase.packageManager === 'yarn' ? 'yarn install --frozen-lockfile' : 'npm ci';
  const runPrefix = codebase.packageManager === 'yarn' ? 'yarn' : 'npm run';

  return `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: ${installCmd}
      - run: ${runPrefix} lint
      - run: ${runPrefix} test
      - run: ${runPrefix} build
`;
}

function dockerfile(codebase: Codebase): string {
  if (codebase.language === 'python') {
    return `FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`;
  }

  const framework = codebase.framework ?? '';
  const isNext = framework.toLowerCase().includes('next');

  if (isNext) {
    return `FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
`;
  }

  return `FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
`;
}

function healthEndpoint(codebase: Codebase): string {
  const framework = (codebase.framework ?? '').toLowerCase();

  if (framework.includes('express') || framework.includes('fastify') || framework.includes('koa')) {
    return `import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
`;
  }

  if (framework.includes('next')) {
    return `export async function GET() {
  return Response.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
`;
  }

  if (codebase.language === 'python') {
    return `import time
from datetime import datetime, timezone

_start = time.monotonic()

async def health():
    return {
        "status": "ok",
        "uptime": time.monotonic() - _start,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
`;
  }

  return `export function healthCheck() {
  return {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}
`;
}

function gitignoreEnvPatch(): string {
  return `\n# Environment files\n.env\n.env.local\n.env.*.local\n`;
}

// ---------------------------------------------------------------------------
// Patch generation per ruleId
// ---------------------------------------------------------------------------

type PatchGenerator = (finding: Finding, codebase: Codebase) => Patch | null;

const PATCH_MAP: Record<string, PatchGenerator> = {
  'infra/env-committed': (_f, _cb) => ({
    file: '.gitignore',
    action: 'append',
    content: gitignoreEnvPatch(),
    description: 'Add .env to .gitignore to prevent committing secrets.',
  }),

  'obs/no-health-endpoint': (_f, cb) => {
    const framework = (cb.framework ?? '').toLowerCase();
    let file = 'src/health.ts';
    if (framework.includes('next')) file = 'app/api/health/route.ts';
    if (cb.language === 'python') file = 'app/health.py';

    return {
      file,
      action: 'create',
      content: healthEndpoint(cb),
      description: 'Add a /health endpoint for uptime monitoring.',
    };
  },

  'infra/no-cicd': (_f, cb) => ({
    file: '.github/workflows/ci.yml',
    action: 'create',
    content: ciYaml(cb),
    description: 'Add GitHub Actions CI workflow with lint, test, and build steps.',
  }),

  'infra/no-dockerfile': (_f, cb) => ({
    file: 'Dockerfile',
    action: 'create',
    content: dockerfile(cb),
    description: 'Add a multi-stage Dockerfile for containerized deployment.',
  }),

  'sast/console-log-production': (f, _cb) => ({
    file: f.file,
    action: 'modify',
    content: `// Replace console.log on line ${f.line} with a structured logger:\n// import pino from 'pino';\n// const logger = pino();\n// logger.info(...);\n`,
    description: `Replace console.log with structured logging in ${f.file}:${f.line}.`,
  }),
};

export function generatePatches(findings: Finding[], codebase: Codebase): Patch[] {
  const patches: Patch[] = [];
  const seen = new Set<string>();

  for (const finding of findings) {
    const generator = PATCH_MAP[finding.ruleId];
    if (!generator) continue;

    const patch = generator(finding, codebase);
    if (!patch) continue;

    const key = `${patch.action}:${patch.file}`;
    if (seen.has(key)) continue;
    seen.add(key);

    patches.push(patch);
  }

  return patches;
}
