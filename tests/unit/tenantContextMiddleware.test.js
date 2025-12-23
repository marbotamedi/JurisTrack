import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { tenantContextMiddleware } from "../../src/middlewares/tenantContextMiddleware.js";
import { signAuthToken } from "../../src/utils/tokenUtils.js";

function buildAppWithRoute() {
  const app = express();
  app.get(
    "/api/protegida",
    tenantContextMiddleware,
    (req, res) => res.json({ tenantId: req.tenantId, user: req.user })
  );
  return app;
}

function buildAppWithAuthBypass() {
  const app = express();
  app.post("/api/auth/login", (req, res) => res.status(200).json({ ok: true }));
  app.use("/api", tenantContextMiddleware);
  app.get("/api/dummy", (req, res) =>
    res.status(200).json({ tenantId: req.tenantId })
  );
  return app;
}

describe("tenantContextMiddleware", () => {
  it("permite acesso com token válido e injeta tenantId e user", async () => {
    const token = signAuthToken({
      userId: "user-1",
      tenantId: "tenant-1",
      role: "admin",
    });
    const app = buildAppWithRoute();

    const response = await request(app)
      .get("/api/protegida")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.tenantId).toBe("tenant-1");
    expect(response.body.user).toMatchObject({
      id: "user-1",
      role: "admin",
      tenantId: "tenant-1",
    });
  });

  it("retorna 401 quando não há header Authorization", async () => {
    const app = buildAppWithRoute();

    const response = await request(app).get("/api/protegida");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      message: "Token de autenticação ausente.",
    });
  });

  it("retorna 401 quando o token é inválido", async () => {
    const app = buildAppWithRoute();

    const response = await request(app)
      .get("/api/protegida")
      .set("Authorization", "Bearer token-invalido");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      message: "Token inválido ou expirado.",
    });
  });

  it("retorna 400 quando o token não contém tenantId", async () => {
    const tokenSemTenant = jwt.sign(
      { sub: "user-1", role: "admin" },
      process.env.JWT_SECRET
    );
    const app = buildAppWithRoute();

    const response = await request(app)
      .get("/api/protegida")
      .set("Authorization", `Bearer ${tokenSemTenant}`);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Token não contém tenantId.",
    });
  });

  it("bypassa /api/auth/login e protege demais rotas /api", async () => {
    const app = buildAppWithAuthBypass();
    const token = signAuthToken({
      userId: "user-2",
      tenantId: "tenant-xyz",
      role: "advogado",
    });

    const loginResponse = await request(app).post("/api/auth/login");
    expect(loginResponse.status).toBe(200);

    const protectedResponse = await request(app)
      .get("/api/dummy")
      .set("Authorization", `Bearer ${token}`);
    expect(protectedResponse.status).toBe(200);
    expect(protectedResponse.body.tenantId).toBe("tenant-xyz");

    const failResponse = await request(app).get("/api/dummy");
    expect(failResponse.status).toBe(401);
  });
});

