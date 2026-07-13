/* Minimal structured logger — avoids a heavy dependency while keeping consistent output. */
type Level = 'info' | 'warn' | 'error' | 'debug';

function write(level: Level, message: string, meta?: unknown): void {
  const time = new Date().toISOString();
  const base = `[${time}] ${level.toUpperCase()} ${message}`;
  if (meta !== undefined) {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](base, meta);
  } else {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](base);
  }
}

export const logger = {
  info: (msg: string, meta?: unknown) => write('info', msg, meta),
  warn: (msg: string, meta?: unknown) => write('warn', msg, meta),
  error: (msg: string, meta?: unknown) => write('error', msg, meta),
  debug: (msg: string, meta?: unknown) => write('debug', msg, meta),
};
