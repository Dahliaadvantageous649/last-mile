import * as fs from 'node:fs';
import * as path from 'node:path';

function fileExists(rootPath: string, ...segments: string[]): boolean {
  return fs.existsSync(path.join(rootPath, ...segments));
}

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

function readFileContents(rootPath: string, file: string): string {
  const filePath = path.join(rootPath, file);
  if (!fs.existsSync(filePath)) return '';
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

export function detectFramework(rootPath: string): string | null {
  const deps = readJsonDeps(rootPath);

  if (
    fileExists(rootPath, 'next.config.js') ||
    fileExists(rootPath, 'next.config.ts') ||
    fileExists(rootPath, 'next.config.mjs') ||
    deps['next']
  ) {
    return 'Next.js';
  }

  if (
    fileExists(rootPath, 'remix.config.js') ||
    fileExists(rootPath, 'remix.config.ts') ||
    Object.keys(deps).some((d) => d.startsWith('@remix-run'))
  ) {
    return 'Remix';
  }

  if (fileExists(rootPath, 'nuxt.config.ts') || fileExists(rootPath, 'nuxt.config.js') || deps['nuxt']) {
    return 'Nuxt';
  }

  if (fileExists(rootPath, 'svelte.config.js') || fileExists(rootPath, 'svelte.config.ts') || deps['@sveltejs/kit']) {
    return 'SvelteKit';
  }

  if (deps['express']) return 'Express';

  const requirements = readFileContents(rootPath, 'requirements.txt').toLowerCase();
  const pyproject = readFileContents(rootPath, 'pyproject.toml').toLowerCase();

  if (requirements.includes('fastapi') || pyproject.includes('fastapi')) return 'FastAPI';
  if (requirements.includes('django') || pyproject.includes('django')) return 'Django';
  if (requirements.includes('flask') || pyproject.includes('flask')) return 'Flask';

  const gemfile = readFileContents(rootPath, 'Gemfile');
  if (gemfile.includes('rails')) return 'Rails';

  const pomXml = readFileContents(rootPath, 'pom.xml');
  const buildGradle = readFileContents(rootPath, 'build.gradle');
  if (pomXml.includes('spring-boot') || buildGradle.includes('spring-boot')) return 'Spring Boot';

  return null;
}
