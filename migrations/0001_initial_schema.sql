-- Last Mile 360 — Initial D1 Schema
-- Phase 1: Core tables for findings, scans, and projects

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  repo_url TEXT,
  framework TEXT,
  language TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  status TEXT NOT NULL DEFAULT 'pending',
  score INTEGER,
  findings_count INTEGER DEFAULT 0,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL REFERENCES scans(id),
  severity TEXT NOT NULL,
  cwe TEXT,
  rule_id TEXT NOT NULL,
  file TEXT NOT NULL,
  line INTEGER,
  message TEXT NOT NULL,
  fix TEXT,
  agent TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (scan_id) REFERENCES scans(id)
);
