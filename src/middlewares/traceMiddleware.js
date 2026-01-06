import { v4 as uuidv4 } from "uuid";
import { setSentryScope } from "../infra/observability/sentry.js";

export function traceMiddleware(req, res, next) {
  const incoming = req.headers["x-trace-id"];
  const traceId = typeof incoming === "string" && incoming.trim() !== ""
    ? incoming
    : uuidv4();

  req.traceId = traceId;
  res.setHeader("X-Trace-Id", traceId);

  setSentryScope({
    traceId,
    method: req.method,
    path: req.originalUrl ?? req.url,
  });

  next();
}


