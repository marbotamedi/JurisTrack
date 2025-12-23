import supabase from "../config/supabase.js";
import { ValidationError } from "../utils/authErrors.js";

function tenantScopeEnabled() {
  return process.env.ENABLE_TENANT_SCOPE !== "false";
}

function assertTenantId(tenantId) {
  if (!tenantScopeEnabled()) return tenantId ?? null;
  if (!tenantId) {
    throw new ValidationError("tenantId é obrigatório para operações tenant-aware.");
  }
  return tenantId;
}

/**
 * Aplica escopo de tenant após escolher a operação (select/update/delete...).
 * No supabase v2, os filtros (eq, is, or, etc.) são expostos no builder
 * retornado por select/update/delete, não diretamente em supabase.from.
 */
export function withTenantFilter(table, tenantId) {
  if (!table) {
    throw new ValidationError("Nome da tabela é obrigatório para aplicar filtro de tenant.");
  }

  const enabled = tenantScopeEnabled();
  const resolvedTenantId = assertTenantId(tenantId);
  const from = supabase.from(table);

  const applyTenant = (queryBuilder) => {
    if (!enabled || resolvedTenantId === null) {
      return queryBuilder;
    }
    return queryBuilder.eq("tenant_id", resolvedTenantId);
  };

  return {
    select: (...args) => applyTenant(from.select(...args)),
    insert: (...args) => applyTenant(from.insert(...args)),
    update: (...args) => applyTenant(from.update(...args)),
    upsert: (...args) => applyTenant(from.upsert(...args)),
    delete: (...args) => applyTenant(from.delete(...args)),
  };
}

export function injectTenant(payload, tenantId) {
  if (!payload || typeof payload !== "object") {
    throw new ValidationError("payload é obrigatório para injeção de tenant.");
  }

  const enabled = tenantScopeEnabled();
  const resolvedTenantId = assertTenantId(tenantId);

  if (!enabled || resolvedTenantId === null) {
    return { ...payload };
  }

  return { ...payload, tenant_id: resolvedTenantId };
}


