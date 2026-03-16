import type { Codebase } from './codebase';
import type { Finding } from './finding';
import type { Category } from './finding';

export interface Report {
  projectName: string;
  scanDate: string;
  score: number;
  grade: string;
  gradeColor: string;
  codebase: Codebase;
  findings: Finding[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  categoryScores: Record<Category, { score: number; weight: number; findings: number }>;
}
