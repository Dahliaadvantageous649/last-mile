import * as fs from 'node:fs';
import * as path from 'node:path';

function exists(rootPath: string, file: string): boolean {
  return fs.existsSync(path.join(rootPath, file));
}

export function detectDeployTarget(rootPath: string): string | null {
  if (exists(rootPath, 'vercel.json') || exists(rootPath, '.vercel')) return 'Vercel';
  if (exists(rootPath, 'netlify.toml')) return 'Netlify';
  if (exists(rootPath, 'fly.toml')) return 'Fly.io';
  if (exists(rootPath, 'railway.json') || exists(rootPath, 'railway.toml')) return 'Railway';
  if (exists(rootPath, 'wrangler.toml') || exists(rootPath, 'wrangler.jsonc')) return 'Cloudflare';
  if (exists(rootPath, 'serverless.yml') || exists(rootPath, 'serverless.yaml') || exists(rootPath, '.aws')) return 'AWS';
  if (exists(rootPath, 'Procfile')) return 'Heroku';
  if (exists(rootPath, 'Dockerfile') || exists(rootPath, 'docker-compose.yml') || exists(rootPath, 'docker-compose.yaml')) return 'Docker';

  return null;
}
