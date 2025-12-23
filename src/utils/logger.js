function sanitizeContext(context = {}) {
  return Object.fromEntries(
    Object.entries(context).filter(
      ([, value]) => value !== undefined && value !== null
    )
  );
}

function logBase(level, action, message, context = {}) {
  const timestamp = new Date().toISOString();
  const payload = sanitizeContext({ timestamp, action, ...context });
  const text = message ? `[${action}] ${message}` : `[${action}]`;

  const error = context.error;
  if (error instanceof Error) {
    payload.error = error.message;
    payload.stack = error.stack;
  }

  // eslint-disable-next-line no-console
  console[level](text, payload);
}

export function logInfo(action, message, context) {
  logBase("info", action, message, context);
}

export function logWarn(action, message, context) {
  logBase("warn", action, message, context);
}

export function logError(action, message, context) {
  logBase("error", action, message, context);
}

