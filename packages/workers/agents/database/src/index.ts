import type { Codebase } from '../../../../core/src/types/codebase.js';
import type { Finding } from '../../../../core/src/types/finding.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const AGENT = 'database';
const CATEGORY = 'database' as const;

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', '.turbo',
  'coverage', '__pycache__', '.venv', 'vendor',
]);

const SOURCE_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.rb', '.go', '.java',
  '.rs', '.sql', '.prisma', '.env', '.yml', '.yaml', '.toml',
  '.json', '.cfg', '.ini', '.conf', '.sh',
]);

function shouldScan(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();
  if (base === 'package-lock.json' || base === 'yarn.lock' || base === 'pnpm-lock.yaml') return false;
  return SOURCE_EXTS.has(ext) || base.startsWith('.env');
}

function readSafe(absPath: string): string | null {
  try {
    return fs.readFileSync(absPath, 'utf-8');
  } catch {
    return null;
  }
}

function isServerFile(file: string): boolean {
  const lower = file.toLowerCase();
  return (
    lower.includes('server') ||
    lower.includes('api/') ||
    lower.includes('pages/api/') ||
    lower.includes('app/api/') ||
    lower.includes('routes/') ||
    lower.includes('lib/') ||
    lower.includes('utils/') ||
    lower.includes('backend/')
  );
}

function isClientFile(file: string): boolean {
  const lower = file.toLowerCase();
  return (
    lower.includes('components/') ||
    lower.includes('pages/') ||
    lower.includes('app/') ||
    lower.includes('hooks/') ||
    lower.includes('context/')
  ) && !lower.includes('api/') && !lower.includes('server');
}

export class DatabaseAgent {
  readonly name = 'database';
  readonly category = CATEGORY;

  async scan(codebase: Codebase): Promise<Finding[]> {
    const findings: Finding[] = [];
    let findingIdx = 0;
    const uid = () => `DB-${String(++findingIdx).padStart(3, '0')}`;

    const prismaFiles = codebase.files.filter(f => f.endsWith('.prisma'));
    const sqlFiles = codebase.files.filter(f => f.endsWith('.sql'));
    const sourceFiles = codebase.files.filter(f => shouldScan(f) && !f.endsWith('.sql') && !f.endsWith('.prisma'));

    // --- 1. No migration system ---
    const migrationIndicators = [
      'prisma/migrations',
      'alembic/',
      'db/migrate',
      'migrations/',
      'flyway/',
      'liquibase/',
    ];
    const hasMigrations = codebase.files.some(f =>
      migrationIndicators.some(ind => f.includes(ind)),
    );
    if (!hasMigrations && codebase.database) {
      findings.push({
        id: uid(), ruleId: 'DB-NO-MIGRATIONS', severity: 'high', category: CATEGORY,
        cwe: 'CWE-284', file: '.', line: 0,
        message: 'No database migration system detected. Use Prisma Migrate, Alembic, Flyway, or similar to version-control schema changes.',
        fix: 'Add a migration tool (e.g. `npx prisma migrate dev`) and commit migration files.',
        agent: AGENT,
      });
    }

    // --- 2. Prisma model without @id ---
    for (const pFile of prismaFiles) {
      const content = readSafe(path.join(codebase.rootPath, pFile));
      if (!content) continue;
      const modelRegex = /^model\s+(\w+)\s*\{/gm;
      let match: RegExpExecArray | null;
      while ((match = modelRegex.exec(content)) !== null) {
        const modelName = match[1];
        const modelStart = match.index;
        const braceDepth = content.indexOf('}', modelStart);
        if (braceDepth === -1) continue;
        const modelBody = content.slice(modelStart, braceDepth + 1);
        if (!modelBody.includes('@id') && !modelBody.includes('@@id')) {
          const lineNum = content.slice(0, modelStart).split('\n').length;
          findings.push({
            id: uid(), ruleId: 'DB-PRISMA-NO-ID', severity: 'medium', category: CATEGORY,
            file: pFile, line: lineNum,
            message: `Prisma model "${modelName}" has no @id or @@id field. Every model should have a primary key.`,
            fix: `Add an \`id\` field with \`@id\` to model ${modelName}.`,
            agent: AGENT,
          });
        }
      }
    }

    // --- 3. No backup configuration ---
    const backupPatterns = ['backup', 'pg_dump', 'mysqldump', 'mongodump', 'db:backup', 'db-backup'];
    const hasBackup = codebase.files.some(f => {
      const lower = f.toLowerCase();
      return backupPatterns.some(bp => lower.includes(bp));
    });
    if (!hasBackup && codebase.database) {
      findings.push({
        id: uid(), ruleId: 'DB-NO-BACKUP', severity: 'medium', category: CATEGORY,
        file: '.', line: 0,
        message: 'No database backup configuration detected. No backup scripts, pg_dump references, or backup CI jobs found.',
        fix: 'Add automated backup scripts (e.g. pg_dump cron job) and verify backups regularly.',
        agent: AGENT,
      });
    }

    // --- 4. Missing indexes on Prisma relation fields ---
    for (const pFile of prismaFiles) {
      const content = readSafe(path.join(codebase.rootPath, pFile));
      if (!content) continue;
      const lines = content.split('\n');
      const modelRegex = /^model\s+(\w+)\s*\{/;
      let currentModel: string | null = null;
      let braceCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const modelMatch = modelRegex.exec(line);
        if (modelMatch) {
          currentModel = modelMatch[1];
          braceCount = 1;
          continue;
        }
        if (currentModel) {
          braceCount += (line.match(/\{/g) || []).length;
          braceCount -= (line.match(/\}/g) || []).length;
          if (braceCount <= 0) { currentModel = null; continue; }

          const relationField = line.match(/^\s+(\w+)\s+(\w+)\s.*@relation/);
          if (relationField) {
            const fieldName = relationField[1];
            const idFieldPattern = new RegExp(`^\\s+\\w+Id\\s`, 'm');
            const foreignKeyLine = lines.find(l =>
              l.includes(`@relation`) === false &&
              (l.includes(`${fieldName}Id`) || l.includes(`${fieldName}_id`)),
            );
            if (foreignKeyLine && !foreignKeyLine.includes('@index') && !foreignKeyLine.includes('@@index')) {
              const hasModelIndex = content.includes(`@@index([${fieldName}Id]`) || content.includes(`@@index([${fieldName}_id]`);
              if (!hasModelIndex) {
                findings.push({
                  id: uid(), ruleId: 'DB-MISSING-INDEX', severity: 'low', category: CATEGORY,
                  file: pFile, line: i + 1,
                  message: `Relation field "${fieldName}" in model "${currentModel}" may lack an index on its foreign key, causing slow queries.`,
                  fix: `Add \`@@index([${fieldName}Id])\` to the ${currentModel} model.`,
                  agent: AGENT,
                });
              }
            }
          }
        }
      }
    }

    // --- 5. RLS disabled ---
    for (const sqlFile of sqlFiles) {
      const content = readSafe(path.join(codebase.rootPath, sqlFile));
      if (!content) continue;
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (/disable\s+row\s+level\s+security/i.test(lines[i])) {
          findings.push({
            id: uid(), ruleId: 'DB-RLS-DISABLED', severity: 'critical', category: CATEGORY,
            cwe: 'CWE-284', file: sqlFile, line: i + 1,
            message: 'Row Level Security is explicitly disabled. This removes tenant isolation and allows unrestricted data access.',
            fix: 'Enable RLS with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and add appropriate policies.',
            agent: AGENT,
          });
        }
      }
    }
    for (const srcFile of sourceFiles) {
      const content = readSafe(path.join(codebase.rootPath, srcFile));
      if (!content) continue;
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('.rls(false)')) {
          findings.push({
            id: uid(), ruleId: 'DB-RLS-DISABLED', severity: 'critical', category: CATEGORY,
            cwe: 'CWE-284', file: srcFile, line: i + 1,
            message: 'Row Level Security is explicitly disabled via .rls(false).',
            fix: 'Remove .rls(false) and enable RLS with proper policies.',
            agent: AGENT,
          });
        }
      }
    }

    // --- 6. Raw SQL without parameterization ---
    const sqlConcatPatterns = [
      /["'`]\s*\+\s*\w+.*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)/i,
      /(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER).*["'`]\s*\+\s*\w+/i,
      /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE)/i,
      /f["'](?:SELECT|INSERT|UPDATE|DELETE)/i,
      /\.query\(\s*["'`].*\$\{/,
      /\.execute\(\s*["'`].*\$\{/,
      /\.raw\(\s*["'`].*\$\{/,
    ];
    for (const srcFile of [...sourceFiles, ...sqlFiles]) {
      const content = readSafe(path.join(codebase.rootPath, srcFile));
      if (!content) continue;
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith('//') || line.trimStart().startsWith('#')) continue;
        for (const pat of sqlConcatPatterns) {
          if (pat.test(line)) {
            findings.push({
              id: uid(), ruleId: 'DB-SQL-INJECTION', severity: 'high', category: CATEGORY,
              cwe: 'CWE-89', file: srcFile, line: i + 1,
              message: 'Raw SQL with string concatenation/interpolation detected. This is vulnerable to SQL injection.',
              fix: 'Use parameterized queries (e.g. `$1` placeholders or ORM query builder).',
              agent: AGENT,
            });
            break;
          }
        }
      }
    }

    // --- 7. No DATABASE_URL validation ---
    let dbUrlUsed = false;
    let dbUrlValidated = false;
    for (const srcFile of sourceFiles) {
      const content = readSafe(path.join(codebase.rootPath, srcFile));
      if (!content) continue;
      if (content.includes('DATABASE_URL')) {
        dbUrlUsed = true;
        if (
          content.includes('z.string().url()') ||
          content.includes('new URL(') ||
          content.includes('validateDatabaseUrl') ||
          content.includes('assert(') ||
          content.includes('if (!process.env.DATABASE_URL')
        ) {
          dbUrlValidated = true;
        }
      }
    }
    if (dbUrlUsed && !dbUrlValidated) {
      findings.push({
        id: uid(), ruleId: 'DB-URL-NO-VALIDATION', severity: 'medium', category: CATEGORY,
        file: '.', line: 0,
        message: 'DATABASE_URL is used but never validated. A malformed URL could cause runtime crashes or connect to the wrong database.',
        fix: 'Validate DATABASE_URL at startup with a schema validator (e.g. Zod) or URL parser.',
        agent: AGENT,
      });
    }

    // --- 8. Supabase service key on client side ---
    const serviceKeyPatterns = [/supabase.*service.?role/i, /SUPABASE_SERVICE_ROLE_KEY/i, /service_role/];
    for (const srcFile of sourceFiles) {
      if (!isClientFile(srcFile)) continue;
      const content = readSafe(path.join(codebase.rootPath, srcFile));
      if (!content) continue;
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        for (const pat of serviceKeyPatterns) {
          if (pat.test(lines[i])) {
            findings.push({
              id: uid(), ruleId: 'DB-SERVICE-KEY-CLIENT', severity: 'critical', category: CATEGORY,
              cwe: 'CWE-798', file: srcFile, line: i + 1,
              message: 'Supabase service_role key referenced in client-side code. This key bypasses RLS and grants full database access.',
              fix: 'Move service_role key usage to server-side code only. Use the anon key on the client.',
              agent: AGENT,
            });
            break;
          }
        }
      }
    }

    // --- 9. DATABASE_URL hardcoded in source ---
    for (const srcFile of sourceFiles) {
      if (srcFile.endsWith('.env') || srcFile.endsWith('.env.example') || srcFile.endsWith('.env.local')) continue;
      const content = readSafe(path.join(codebase.rootPath, srcFile));
      if (!content) continue;
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith('//') || line.trimStart().startsWith('#')) continue;
        if (/(?:DATABASE_URL|DB_URL|MONGO_URI|POSTGRES_URL)\s*[:=]\s*["'](?:postgres|mysql|mongodb|redis)/i.test(line)) {
          findings.push({
            id: uid(), ruleId: 'DB-HARDCODED-URL', severity: 'high', category: CATEGORY,
            cwe: 'CWE-798', file: srcFile, line: i + 1,
            message: 'Database connection string is hardcoded in source code. Credentials will leak into version control.',
            fix: 'Move the database URL to a .env file and reference via process.env.DATABASE_URL.',
            agent: AGENT,
          });
        }
      }
    }

    return findings;
  }
}
