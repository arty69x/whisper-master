export class Logger {
  public info(message: string): void {
    process.stdout.write(`[info] ${message}\n`);
  }

  public error(message: string): void {
    process.stderr.write(`[error] ${message}\n`);
  }
}
