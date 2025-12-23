import jwt from "jsonwebtoken";

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

