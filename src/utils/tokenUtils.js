import jwt from "jsonwebtoken";
import env from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Carrega .env mesmo quando este util é importado isoladamente (tests/scripts)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
env.config({ path: join(__dirname, "../../.env") });

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não configurado no ambiente.");
}

export function signAuthToken({ userId, tenantId, role }) {
  if (!userId || !tenantId || !role) {
    throw new Error("userId, tenantId e role são obrigatórios para gerar o token.");
  }

  return jwt.sign(
    {
      sub: userId,
      tenantId,
      role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyAuthToken(token) {
  if (!token) {
    throw new Error("Token de autenticação não fornecido.");
  }

  return jwt.verify(token, JWT_SECRET);
}

