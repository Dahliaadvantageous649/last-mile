export interface Codebase {
  rootPath: string;
  framework: string | null;
  language: string;
  database: string | null;
  deployTarget: string | null;
  packageManager: string | null;
  files: string[];
}
