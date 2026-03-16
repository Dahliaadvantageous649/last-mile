import * as fs from 'node:fs';
import * as path from 'node:path';

function readJsonDeps(rootPath: string): Record<string, string> {
  const pkgPath = path.join(rootPath, 'package.json');
  if (!fs.existsSync(pkgPath)) return {};
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return { ...pkg.dependencies, ...pkg.devDependencies };
  } catch {
    return {};
  }
}

function hasEnvVar(rootPath: string, prefix: string): boolean {
  const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
  for (const envFile of envFiles) {
    const envPath = path.join(rootPath, envFile);
    if (!fs.existsSync(envPath)) continue;
    try {
      const content = fs.readFileSync(envPath, 'utf-8');
      if (content.includes(prefix)) return true;
    } catch {
      // skip unreadable files
    }
  }
  return false;
}

function readFile(rootPath: string, file: string): string {
  const filePath = path.join(rootPath, file);
  if (!fs.existsSync(filePath)) return '';
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

export function detectDatabase(rootPath: string): string | null {
  const deps = readJsonDeps(rootPath);

  if (deps['@supabase/supabase-js'] || hasEnvVar(rootPath, 'SUPABASE_')) {
    return 'Supabase';
  }

  if (fs.existsSync(path.join(rootPath, 'prisma', 'schema.prisma'))) {
    return 'Prisma';
  }

  if (Object.keys(deps).some((d) => d.startsWith('@firebase')) || deps['firebase']) {
    return 'Firebase';
  }

  if (deps['mongodb'] || deps['mongoose']) return 'MongoDB';
  if (deps['pg'] || deps['postgres'] || deps['@vercel/postgres']) return 'PostgreSQL';
  if (deps['mysql2'] || deps['mysql']) return 'MySQL';
  if (deps['better-sqlite3'] || deps['sqlite3']) return 'SQLite';

  const envContent = readFile(rootPath, '.env') + readFile(rootPath, '.env.local');
  const dbUrlMatch = envContent.match(/DATABASE_URL\s*=\s*["']?(\S+)/);
  if (dbUrlMatch) {
    const url = dbUrlMatch[1].toLowerCase();
    if (url.startsWith('postgres')) return 'PostgreSQL';
    if (url.startsWith('mysql')) return 'MySQL';
    if (url.startsWith('mongodb')) return 'MongoDB';
    if (url.includes('sqlite')) return 'SQLite';
  }

  return null;
}
