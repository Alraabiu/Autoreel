function write(level, ...args) {
  const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
  console[method](`[${new Date().toISOString()}] [${level.toUpperCase()}]`, ...args);
}

export const log = {
  info: (...a) => write('info', ...a),
  warn: (...a) => write('warn', ...a),
  error: (...a) => write('error', ...a),
};