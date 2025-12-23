import { jest } from "@jest/globals";

const mockBuilder = {};
mockBuilder.eq = jest.fn(() => mockBuilder);
mockBuilder.select = jest.fn(() => mockBuilder);
mockBuilder.update = jest.fn(() => mockBuilder);
mockBuilder.delete = jest.fn(() => mockBuilder);
mockBuilder.insert = jest.fn(() => mockBuilder);

const mockFrom = jest.fn(() => mockBuilder);

jest.unstable_mockModule("../../src/config/supabase.js", () => ({
  __esModule: true,
  default: {
    from: mockFrom,
  },
}));

const { withTenantFilter, injectTenant } = await import(
  "../../src/repositories/tenantScope.js"
);
const { ValidationError } = await import("../../src/utils/authErrors.js");

describe("tenantScope helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ENABLE_TENANT_SCOPE;
  });

  it("aplica eq('tenant_id', tenantId) ao builder retornado", () => {
    const builder = withTenantFilter("users", "tenant-123");

    expect(mockFrom).toHaveBeenCalledWith("users");
    expect(mockBuilder.eq).toHaveBeenCalledWith("tenant_id", "tenant-123");
    expect(builder).toBe(mockBuilder);
  });

  it("lança erro quando tenantId está ausente no filtro", () => {
    expect(() => withTenantFilter("users")).toThrow(ValidationError);
  });

  it("retorna builder sem filtro quando flag de escopo está desabilitada", () => {
    process.env.ENABLE_TENANT_SCOPE = "false";

    const builder = withTenantFilter("users");

    expect(mockBuilder.eq).not.toHaveBeenCalled();
    expect(builder).toBe(mockBuilder);
  });

  it("injeta tenant_id sobrescrevendo valor vindo do cliente", () => {
    const original = { nome: "Ana", tenant_id: "cliente-x", ativo: true };
    const payload = injectTenant(original, "tenant-999");

    expect(payload).toEqual({
      nome: "Ana",
      tenant_id: "tenant-999",
      ativo: true,
    });
    expect(original.tenant_id).toBe("cliente-x");
  });

  it("lança erro quando tenantId está ausente na injeção", () => {
    expect(() => injectTenant({ nome: "Ana" })).toThrow(ValidationError);
  });

  it("mantém payload intacto quando flag de escopo está desabilitada", () => {
    process.env.ENABLE_TENANT_SCOPE = "false";
    const original = { nome: "Bruno", tenant_id: "legacy" };

    const payload = injectTenant(original);

    expect(payload).toEqual(original);
    expect(payload).not.toBe(original);
  });
});


