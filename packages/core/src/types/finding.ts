export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Category = 'security' | 'database' | 'infrastructure' | 'observability' | 'quality';

export interface Finding {
  id: string;
  ruleId: string;
  severity: Severity;
  category: Category;
  cwe?: string;
  file: string;
  line: number;
  column?: number;
  message: string;
  fix?: string;
  agent: string;
}
