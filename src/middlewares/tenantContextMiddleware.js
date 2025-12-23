import { verifyAuthToken } from "../utils/tokenUtils.js";
import { logError, logWarn } from "../utils/logger.js";

const INVALID_TOKEN_MESSAGE = "Token inválido ou expirado.";
const MISSING_TOKEN_MESSAGE = "Token de autenticação ausente.";
const MISSING_TENANT_MESSAGE = "Token não contém tenantId.";

function extractBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== "string") return null;

  const [scheme, token] = header.split(" ");
  if (!token || scheme?.toLowerCase() !== "bearer") return null;
  return token;
}

export function tenantContextMiddleware(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    logWarn("tenant.middleware.missing_token", MISSING_TOKEN_MESSAGE, {
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({ message: MISSING_TOKEN_MESSAGE });
  }

  try {
    const payload = verifyAuthToken(token);
    const tenantId = payload?.tenantId;
    const userId = payload?.sub;

    if (!tenantId) {
      logWarn("tenant.middleware.missing_tenant", MISSING_TENANT_MESSAGE, {
        path: req.path,
        method: req.method,
        userId: payload?.sub,
      });
      return res.status(400).json({ message: MISSING_TENANT_MESSAGE });
    }

    if (!userId) {
      logWarn("tenant.middleware.missing_user", INVALID_TOKEN_MESSAGE, {
        path: req.path,
        method: req.method,
        tenantId,
      });
      return res.status(401).json({ message: INVALID_TOKEN_MESSAGE });
    }

    req.tenantId = tenantId;
    req.user = {
      id: userId,
      role: payload?.role,
      tenantId,
    };

    return next();
  } catch (error) {
    logError("tenant.middleware.invalid_token", INVALID_TOKEN_MESSAGE, {
      path: req.path,
      method: req.method,
      error,
    });
    return res.status(401).json({ message: INVALID_TOKEN_MESSAGE });
  }
}

