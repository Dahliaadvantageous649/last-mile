import * as fs from 'node:fs';
import * as path from 'node:path';

function fileExists(rootPath: string, file: string): boolean {
  return fs.existsSync(path.join(rootPath, file));
}

export function detectLanguage(rootPath: string): string {
  if (fileExists(rootPath, 'tsconfig.json')) return 'TypeScript';

  if (fileExists(rootPath, 'go.mod')) return 'Go';
  if (fileExists(rootPath, 'Cargo.toml')) return 'Rust';
  if (fileExists(rootPath, 'Gemfile')) return 'Ruby';

  if (fileExists(rootPath, 'pom.xml') || fileExists(rootPath, 'build.gradle') || fileExists(rootPath, 'build.gradle.kts')) {
    return 'Java';
  }

  if (fileExists(rootPath, 'requirements.txt') || fileExists(rootPath, 'pyproject.toml') || fileExists(rootPath, 'setup.py')) {
    return 'Python';
  }

  if (fileExists(rootPath, 'package.json')) return 'JavaScript';

  return 'Unknown';
}
