import Chalk from 'chalk';

export class Logger {
  private prefix = `[${this.name}] `;

  constructor(readonly name: string) {}

  info(message: string): void {
    console.info(prefix(message, Chalk.blue(this.prefix)));
  }

  warn(message: string): void {
    console.warn(prefix(message, Chalk.yellow(this.prefix)));
  }

  error(message: string): void {
    console.error(prefix(message, Chalk.red(this.prefix)));
  }
}

export function prefix(text: string, prefix: string): string {
  return text.replace(/^/gm, prefix);
}
