const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgPurple: '\x1b[45m',
};

function gradeAnsiColor(grade: string, noColor: boolean): string {
  if (noColor) return '';
  if (grade === 'A+') return ANSI.purple;
  if (grade === 'A') return ANSI.blue;
  if (grade === 'B') return ANSI.green;
  if (grade === 'C') return ANSI.yellow;
  return ANSI.red;
}

function getLabel(grade: string): string {
  if (grade === 'A+' || grade === 'A') return 'Production-ready';
  if (grade === 'B') return 'Nearly ready';
  if (grade === 'C') return 'Needs attention';
  if (grade === 'D') return 'Significant issues';
  return 'Not production-ready';
}

function center(text: string, width: number): string {
  const visLen = text.replace(/\x1b\[[0-9;]*m/g, '').length;
  const pad = Math.max(0, width - visLen);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

export function renderScoreGauge(score: number, grade: string, noColor = false): string {
  const r = noColor ? '' : ANSI.reset;
  const b = noColor ? '' : ANSI.bold;
  const d = noColor ? '' : ANSI.dim;
  const c = gradeAnsiColor(grade, noColor);

  const barWidth = 30;
  const filled = Math.round((score / 100) * barWidth);
  const empty = barWidth - filled;
  const bar = `${c}${'█'.repeat(filled)}${d}${'░'.repeat(empty)}${r}`;

  const innerWidth = 44;
  const top = `  ┌${'─'.repeat(innerWidth + 1)}┐`;
  const bot = `  └${'─'.repeat(innerWidth + 1)}┘`;
  const side = (content: string) => `  │${center(content, innerWidth + 1)}│`;
  const blank = side('');

  const title = `${b}PRODUCTION READINESS${r}`;
  const scoreText = `${c}${b}${score}${r} / 100`;
  const gradeText = `Grade: ${c}${b}${grade}${r}`;
  const label = `${c}${getLabel(grade)}${r}`;

  const lines = [
    '',
    top,
    blank,
    side(title),
    blank,
    side(bar),
    side(scoreText),
    side(gradeText),
    side(label),
    blank,
    bot,
    '',
  ];

  return lines.join('\n');
}
