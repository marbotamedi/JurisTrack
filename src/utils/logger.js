function sanitizeContext(context = {}) {
  return Object.fromEntries(
    Object.entries(context).filter(
      ([, value]) => value !== undefined && value !== null
    )
  );
}

function resolveActorContext(context = {}) {
  const tenantId =
    context.tenantId ??
    context.tenant_id ??
    context?.user?.tenantId ??
    context?.user?.tenant_id ??
    context?.req?.tenantId ??
    context?.req?.user?.tenantId ??
    context?.req?.user?.tenant_id;

  const userId =
    context.userId ??
    context.user_id ??
    context?.user?.id ??
    context?.req?.user?.id ??
    context?.req?.userId;

  return sanitizeContext({ tenantId, userId });
}

function logBase(level, action, message, context = {}) {
  const timestamp = new Date().toISOString();
  const actorContext = resolveActorContext(context);
  const payload = sanitizeContext({ timestamp, action, ...context, ...actorContext });
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

