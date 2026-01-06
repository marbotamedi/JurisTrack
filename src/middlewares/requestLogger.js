import { logInfo } from "../utils/logger.js";

export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  let finalized = false;

  const finish = () => {
    if (finalized) return;
    finalized = true;
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

    logInfo("http.request", "Requisição HTTP", {
      method: req.method,
      path: req.originalUrl ?? req.url,
      statusCode: res.statusCode,
      tenantId: req.tenantId,
      userId: req.user?.id,
      traceId: req.traceId,
      duration_ms: durationMs,
    });
  };

  res.on("finish", finish);
  res.on("close", finish);

  next();
}

