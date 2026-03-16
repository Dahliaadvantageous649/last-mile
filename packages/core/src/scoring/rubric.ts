import type { Finding, Severity, Category } from '../types/finding.js';

const SEVERITY_PENALTY: Record<Severity, number> = {
  critical: 15,
  high: 8,
  medium: 4,
  low: 2,
  info: 0,
};

const CATEGORY_WEIGHTS: Record<Category, number> = {
  security: 0.35,
  database: 0.20,
  infrastructure: 0.20,
  observability: 0.15,
  quality: 0.10,
};

export function calculateScore(findings: Finding[]): number {
  let deductions = 0;
  for (const f of findings) {
    deductions += SEVERITY_PENALTY[f.severity];
  }
  return Math.max(0, Math.min(100, 100 - deductions));
}

export function getGrade(score: number): string {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 85) return 'B';
  if (score >= 70) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

export function getGradeColor(grade: string): string {
  if (grade === 'A+') return 'purple';
  if (grade === 'A') return 'blue';
  if (grade === 'B') return 'green';
  if (grade === 'C') return 'yellow';
  return 'red';
}

export function getGradeLabel(grade: string): string {
  if (grade === 'A+' || grade === 'A') return 'Production-ready';
  if (grade === 'B') return 'Nearly ready';
  if (grade === 'C') return 'Needs attention';
  if (grade === 'D') return 'Significant issues';
  return 'Not production-ready';
}

export function calculateCategoryScores(
  findings: Finding[],
): Record<Category, { score: number; weight: number; findings: number }> {
  const categories: Category[] = ['security', 'database', 'infrastructure', 'observability', 'quality'];
  const result = {} as Record<Category, { score: number; weight: number; findings: number }>;

  for (const cat of categories) {
    const catFindings = findings.filter((f) => f.category === cat);
    result[cat] = {
      score: calculateScore(catFindings),
      weight: CATEGORY_WEIGHTS[cat],
      findings: catFindings.length,
    };
  }

  return result;
}

export function buildSummary(findings: Finding[]) {
  return {
    total: findings.length,
    critical: findings.filter((f) => f.severity === 'critical').length,
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    low: findings.filter((f) => f.severity === 'low').length,
    info: findings.filter((f) => f.severity === 'info').length,
  };
}
