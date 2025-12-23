import bcrypt from "bcryptjs";

import { normalizeEmail } from "../utils/authUtils.js";
import { logInfo, logWarn } from "../utils/logger.js";
import { findActiveTenantById } from "../repositories/tenantRepository.js";
import { findUserByEmail } from "../repositories/userRepository.js";
import { signAuthToken } from "../utils/tokenUtils.js";

const GENERIC_AUTH_MESSAGE = "Credenciais inválidas ou usuário inativo";

const loginAttempts = new Map();

function recordLoginAttempt(email, outcome) {
  const entry =
    loginAttempts.get(email) ?? { attempts: 0, failures: 0, lastOutcome: null };

  const next = {
    attempts: entry.attempts + 1,
    failures: entry.failures + (outcome === "failure" ? 1 : 0),
    lastOutcome: outcome,
    lastAttemptAt: new Date().toISOString(),
  };

  loginAttempts.set(email, next);
  return next;
}

export async function login({ email, senha }) {
  const normalizedEmail = normalizeEmail(email);

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    const stats = recordLoginAttempt(normalizedEmail, "failure");
    logWarn("auth.login.failure", "Usuário não encontrado", {
      email: normalizedEmail,
      attempts: stats.attempts,
      failures: stats.failures,
    });
    return { ok: false, message: GENERIC_AUTH_MESSAGE };
  }

  if (user.status !== "ativo") {
    const stats = recordLoginAttempt(normalizedEmail, "failure");
    logWarn("auth.login.failure", "Usuário inativo", {
      email: normalizedEmail,
      userId: user.id,
      tenantId: user.tenant_id,
      attempts: stats.attempts,
      failures: stats.failures,
    });
    return { ok: false, message: GENERIC_AUTH_MESSAGE };
  }

  const tenant = await findActiveTenantById(user.tenant_id);
  if (!tenant) {
    const stats = recordLoginAttempt(normalizedEmail, "failure");
    logWarn("auth.login.failure", "Tenant inativo ou inexistente", {
      email: normalizedEmail,
      userId: user.id,
      tenantId: user.tenant_id,
      attempts: stats.attempts,
      failures: stats.failures,
    });
    return { ok: false, message: GENERIC_AUTH_MESSAGE };
  }

  const passwordIsValid = await bcrypt.compare(
    senha,
    user.password_hash ?? ""
  );

  if (!passwordIsValid) {
    const stats = recordLoginAttempt(normalizedEmail, "failure");
    logWarn("auth.login.failure", "Senha incorreta", {
      email: normalizedEmail,
      userId: user.id,
      tenantId: user.tenant_id,
      attempts: stats.attempts,
      failures: stats.failures,
    });
    return { ok: false, message: GENERIC_AUTH_MESSAGE };
  }

  const stats = recordLoginAttempt(normalizedEmail, "success");
  logInfo("auth.login.success", "Login bem-sucedido", {
    email: normalizedEmail,
    userId: user.id,
    tenantId: user.tenant_id,
    attempts: stats.attempts,
    failures: stats.failures,
  });

  const token = signAuthToken({
    userId: user.id,
    tenantId: user.tenant_id,
    role: user.role,
  });

  return {
    ok: true,
    userId: user.id,
    tenantId: user.tenant_id,
    role: user.role,
    token,
  };
}

export const messages = {
  genericAuth: GENERIC_AUTH_MESSAGE,
  success: "Login realizado com sucesso",
};

