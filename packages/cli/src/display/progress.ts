const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export class Progress {
  private interval: ReturnType<typeof setInterval> | null = null;
  private frame = 0;
  private startTime = 0;
  private noColor: boolean;

  constructor(noColor = false) {
    this.noColor = noColor;
  }

  start(label = 'Scanning') {
    this.startTime = Date.now();
    this.frame = 0;
    const dim = this.noColor ? '' : '\x1b[2m';
    const cyan = this.noColor ? '' : '\x1b[36m';
    const r = this.noColor ? '' : '\x1b[0m';

    this.interval = setInterval(() => {
      const spinner = SPINNER_FRAMES[this.frame % SPINNER_FRAMES.length];
      process.stderr.write(`\r  ${cyan}${spinner}${r} ${dim}${label}...${r}  `);
      this.frame++;
    }, 80);
  }

  update(agentName: string) {
    if (!this.interval) return;
    this.stop();
    this.start(`Running ${agentName} agent`);
  }

  stop(): number {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      process.stderr.write('\r' + ' '.repeat(60) + '\r');
    }
    return Date.now() - this.startTime;
  }

  done() {
    const elapsed = this.stop();
    const dim = this.noColor ? '' : '\x1b[2m';
    const green = this.noColor ? '' : '\x1b[32m';
    const r = this.noColor ? '' : '\x1b[0m';
    const ms = elapsed < 1000 ? `${elapsed}ms` : `${(elapsed / 1000).toFixed(1)}s`;
    process.stderr.write(`  ${green}✓${r} ${dim}Scan completed in ${ms}${r}\n`);
  }
}
