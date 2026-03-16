export type { Severity, Category, Finding } from './types/finding.js';
export type { Codebase } from './types/codebase.js';
export type { Report } from './types/report.js';
export type { Agent } from './types/agent.js';

export { detectLanguage } from './detection/language.js';
export { detectFramework } from './detection/framework.js';
export { detectDatabase } from './detection/database.js';
export { detectDeployTarget } from './detection/deployment.js';

export {
  calculateScore,
  getGrade,
  getGradeColor,
  getGradeLabel,
  calculateCategoryScores,
  buildSummary,
} from './scoring/rubric.js';

export { loadConfig, shouldIgnoreFile, isRuleDisabled, getRuleSeverity, isSecretAllowed } from './config.js';
export type { Config } from './config.js';
export { suggestFixes } from './fix/engine.js';
export { generatePatches } from './fix/patcher.js';
export type { Patch } from './fix/patcher.js';
