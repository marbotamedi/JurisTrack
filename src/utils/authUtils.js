import { ValidationError } from "./authErrors.js";

export const VALID_ROLES = ["advogado", "admin"];
export const VALID_STATUSES = ["ativo", "inativo"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function assertEmail(value) {
  const normalized = normalizeEmail(value);
  if (!normalized || !EMAIL_REGEX.test(normalized)) {
    throw new ValidationError("E-mail inválido ou ausente.");
  }
  return normalized;
}

export function assertRole(value) {
  if (!VALID_ROLES.includes(value)) {
    throw new ValidationError("Role inválida. Use advogado|admin.");
  }
  return value;
}

export function assertStatus(value) {
  const status = value ?? "ativo";
  if (!VALID_STATUSES.includes(status)) {
    throw new ValidationError("Status inválido. Use ativo|inativo.");
  }
  return status;
}

export function nowIsoString() {
  return new Date().toISOString();
}

