import env from "dotenv";
import bcrypt from "bcryptjs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import supabase from "../src/config/supabase.js";
import { normalizeEmail } from "../src/utils/authUtils.js";
import {
  createUser,
  findUserByEmail,
  updateUser,
} from "../src/repositories/userRepository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

env.config({ path: join(__dirname, "../.env") });

const DEFAULT_TENANT_NAME = "Tenant Default";
const adminEmail = normalizeEmail(process.env.SEED_ADMIN_EMAIL);
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const tenantName = process.env.SEED_TENANT_NAME || DEFAULT_TENANT_NAME;

async function ensureTenant(name) {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, status")
    .eq("nome", name)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar tenant seed: ${error.message}`);
  }

  if (data) {
    if (data.status !== "ativo") {
      const { data: updated, error: updateError } = await supabase
        .from("tenants")
        .update({ status: "ativo", updated_at: new Date().toISOString() })
        .eq("id", data.id)
        .select("id")
        .single();

      if (updateError) {
        throw new Error(
          `Erro ao reativar tenant seed ${name}: ${updateError.message}`
        );
      }

      console.info(`Tenant ${name} reativado como ativo.`);
      return updated.id;
    }
    return data.id;
  }

  const { data: created, error: insertError } = await supabase
    .from("tenants")
    .insert([{ nome: name, status: "ativo" }])
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`Erro ao criar tenant seed: ${insertError.message}`);
  }

  return created.id;
}

async function ensureAdminUser(tenantId) {
  const existingUser = await findUserByEmail(adminEmail);

  if (!existingUser) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const createdUser = await createUser({
      email: adminEmail,
      passwordHash,
      role: "admin",
      tenantId,
      status: "ativo",
    });

    console.info(
      `Usuário admin criado com e-mail ${createdUser.email} no tenant ${tenantId}.`
    );
    return;
  }

  const updates = {};

  if (existingUser.role !== "admin") {
    updates.role = "admin";
  }

  if (existingUser.status !== "ativo") {
    updates.status = "ativo";
  }

  if (existingUser.tenant_id !== tenantId) {
    console.warn(
      `Usuário admin já existe porém vinculado a outro tenant (${existingUser.tenant_id}). Ajuste manual se necessário.`
    );
  }

  const currentHash = existingUser.password_hash;
  const passwordMatches =
    currentHash && adminPassword
      ? await bcrypt.compare(adminPassword, currentHash)
      : false;

  if (!passwordMatches) {
    updates.passwordHash = await bcrypt.hash(adminPassword, 10);
  }

  if (Object.keys(updates).length === 0) {
    console.info("Usuário admin já existe e está consistente. Nenhuma ação.");
    return;
  }

  await updateUser(existingUser.id, updates);
  console.info("Usuário admin atualizado para o estado esperado.");
}

async function main() {
  if (!adminEmail || !adminPassword) {
    console.error(
      "Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD no .env para rodar o seed."
    );
    process.exit(1);
  }

  console.info("Iniciando seed de login...");
  const tenantId = await ensureTenant(tenantName);

  await ensureAdminUser(tenantId);

  console.info(
    `Seed concluído. Tenant ${tenantName} (${tenantId}) e usuário admin garantidos.`
  );
}

main().catch((err) => {
  console.error("Falha ao executar seed de login:", err);
  process.exit(1);
});
