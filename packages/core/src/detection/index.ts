import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Codebase } from '../types';
import { detectFramework } from './framework';
import { detectDatabase } from './database';
import { detectLanguage } from './language';
import { detectDeployTarget } from './deployment';

const DEFAULT_IGNORE = new Set([
  'node_modules',
  '.git',
  '.next',
  '.nuxt',
  '.svelte-kit',
  'dist',
  'build',
  'out',
  '.vercel',
  '.turbo',
  '__pycache__',
  '.venv',
  'venv',
  'target',
  'vendor',
  'coverage',
  '.cache',
]);

function loadGitignorePatterns(rootPath: string): string[] {
  const gitignorePath = path.join(rootPath, '.gitignore');
  if (!fs.existsSync(gitignorePath)) return [];
  try {
    return fs
      .readFileSync(gitignorePath, 'utf-8')
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line && !line.startsWith('#'))
      .map((line: string) => (line.endsWith('/') ? line.slice(0, -1) : line));
  } catch {
    return [];
  }
}

function shouldIgnore(name: string, gitignorePatterns: string[]): boolean {
  if (DEFAULT_IGNORE.has(name)) return true;
  if (name.startsWith('.') && name !== '.env' && name !== '.env.local' && name !== '.env.example') return true;
  return gitignorePatterns.some((pattern) => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
      return regex.test(name);
    }
    return name === pattern;
  });
}

function walkDir(dir: string, rootPath: string, gitignorePatterns: string[], maxDepth: number = 10): string[] {
  if (maxDepth <= 0) return [];
  const files: string[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    if (shouldIgnore(entry.name, gitignorePatterns)) continue;

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(rootPath, fullPath);

    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath, rootPath, gitignorePatterns, maxDepth - 1));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

function detectPackageManager(rootPath: string): string | null {
  if (fs.existsSync(path.join(rootPath, 'bun.lockb')) || fs.existsSync(path.join(rootPath, 'bun.lock'))) return 'bun';
  if (fs.existsSync(path.join(rootPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(rootPath, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(rootPath, 'package-lock.json'))) return 'npm';
  if (fs.existsSync(path.join(rootPath, 'Pipfile.lock')) || fs.existsSync(path.join(rootPath, 'Pipfile'))) return 'pipenv';
  if (fs.existsSync(path.join(rootPath, 'poetry.lock'))) return 'poetry';
  if (fs.existsSync(path.join(rootPath, 'Cargo.lock'))) return 'cargo';
  if (fs.existsSync(path.join(rootPath, 'go.sum'))) return 'go';
  if (fs.existsSync(path.join(rootPath, 'Gemfile.lock'))) return 'bundler';
  return null;
}

export function detect(rootPath: string): Codebase {
  const resolved = path.resolve(rootPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Path does not exist: ${resolved}`);
  }

  const gitignorePatterns = loadGitignorePatterns(resolved);
  const files = walkDir(resolved, resolved, gitignorePatterns);

  return {
    rootPath: resolved,
    framework: detectFramework(resolved),
    language: detectLanguage(resolved),
    database: detectDatabase(resolved),
    deployTarget: detectDeployTarget(resolved),
    packageManager: detectPackageManager(resolved),
    files,
  };
}
