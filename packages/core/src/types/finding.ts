export interface Finding { id: string; severity: "critical" | "high" | "medium" | "low"; cwe: string; file: string; line: number; message: string; fix?: string; }
