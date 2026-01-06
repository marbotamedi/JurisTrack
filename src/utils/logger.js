import { captureException, captureMessage } from "../infra/observability/sentry.js";

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

  const traceId =
    context.traceId ??
    context?.req?.traceId;

  return sanitizeContext({ tenantId, userId, traceId });
}

function shouldCapture(level, context = {}) {
  if (context.sendToSentry === false) return false;
  return true;
}

function logBase(level, action, message, context = {}) {
  const { error, sendToSentry, ...restContext } = context;
  const timestamp = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
  const actorContext = resolveActorContext(restContext);
  const payload = sanitizeContext({
    timestamp,
    action,
    ...restContext,
    ...actorContext,
  });
  const traceId = payload.traceId;
  const consolePrefix = traceId ? `[trace:${traceId}]` : `[${action}]`;
  const consoleText = message ? `${consolePrefix} ${message}` : `${consolePrefix}`;
  const sentryText = message ? `[${action}] ${message}` : `[${action}]`;

  if (error instanceof Error) {
    payload.error = error.message;
    payload.stack = error.stack;
  }

  // eslint-disable-next-line no-console
  console[level](consoleText, payload);

  if (shouldCapture(level, context)) {
    if (error instanceof Error) {
      captureException(error, { ...payload, level });
    } else {
      captureMessage(sentryText, level, { ...payload, level });
    }
  }
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

