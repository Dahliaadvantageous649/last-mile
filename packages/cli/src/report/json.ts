import type { Report } from '../../../core/src/types/report.js';

export function generateJsonReport(report: Report): string {
  return JSON.stringify(report, null, 2);
}
