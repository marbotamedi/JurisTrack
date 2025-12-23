import bcrypt from "bcryptjs";

import {
  createUser as createUserRepository,
  listUsersByTenant,
  updateUser as updateUserRepository,
} from "../repositories/userRepository.js";
import { findTenantById } from "../repositories/tenantRepository.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/authErrors.js";
import { assertRole, assertStatus } from "../utils/authUtils.js";
import { logInfo } from "../utils/logger.js";

const BCRYPT_COST = 10;

async function ensureTenantExists(tenantId) {
  const tenant = await findTenantById(tenantId);
  if (!tenant) {
    throw new NotFoundError("Tenant não encontrado.");
  }
  return tenant;
}

function assertPassword(value) {
  if (!value || value.length < 6) {
    throw new ValidationError("Senha deve ter pelo menos 6 caracteres.");
  }
  return value;
}

export async function listUsers({ tenantId, status }) {
  await ensureTenantExists(tenantId);
  const users = await listUsersByTenant({ tenantId, status });

  logInfo("users.list.success", "Listagem de usuários concluída", {
    tenantId,
    status,
    total: users.length,
  });

  return users;
}

export async function createUser({ email, password, role, tenantId, status }) {
  await ensureTenantExists(tenantId);

  const normalizedRole = assertRole(role);
  const normalizedStatus = assertStatus(status);
  const validPassword = assertPassword(password);

  const passwordHash = await bcrypt.hash(validPassword, BCRYPT_COST);

  const user = await createUserRepository({
    email,
    passwordHash,
    role: normalizedRole,
    tenantId,
    status: normalizedStatus,
  });

  logInfo("users.create.success", "Usuário criado", {
    id: user.id,
    tenantId: user.tenant_id,
    email: user.email,
    role: user.role,
    status: user.status,
  });

  return { ...user, message: "Usuário criado com sucesso" };
}

export async function updateUser(id, { role, status, password, email, tenantId }) {
  if (email !== undefined) {
    throw new ValidationError("E-mail não pode ser alterado.");
  }
  if (tenantId !== undefined) {
    throw new ValidationError("tenantId não pode ser alterado.");
  }

  const payload = {};

  if (role !== undefined) {
    payload.role = assertRole(role);
  }
  if (status !== undefined) {
    payload.status = assertStatus(status);
  }
  if (password !== undefined) {
    const validPassword = assertPassword(password);
    payload.passwordHash = await bcrypt.hash(validPassword, BCRYPT_COST);
  }

  const user = await updateUserRepository(id, payload);

  logInfo("users.update.success", "Usuário atualizado", {
    id: user.id,
    tenantId: user.tenant_id,
    role: user.role,
    status: user.status,
    passwordUpdated: Boolean(payload.passwordHash),
  });

  return { ...user, message: "Usuário atualizado com sucesso" };
}

export async function inactivateUser(id) {
  const user = await updateUserRepository(id, { status: "inativo" });

  logInfo("users.inactivate.success", "Usuário inativado", {
    id: user.id,
    tenantId: user.tenant_id,
    status: user.status,
  });

  return { id: user.id, status: user.status, message: "Usuário inativado com sucesso" };
}

export async function reactivateUser(id) {
  const user = await updateUserRepository(id, { status: "ativo" });

  logInfo("users.reactivate.success", "Usuário reativado", {
    id: user.id,
    tenantId: user.tenant_id,
    status: user.status,
  });

  return { id: user.id, status: user.status, message: "Usuário reativado com sucesso" };
}

