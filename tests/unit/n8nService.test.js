import { jest } from "@jest/globals";
import { DEFAULT_TENANT_ID, prazoFixture } from "../fixtures/multiTenant.js";

const withTenantFilterMock = jest.fn();
const addBusinessDaysMock = jest.fn(async () => ({
  format: () => "2024-05-20",
}));

jest.unstable_mockModule("../../src/repositories/tenantScope.js", () => ({
  __esModule: true,
  withTenantFilter: withTenantFilterMock,
}));

jest.unstable_mockModule("../../src/utils/dateUtils.js", () => ({
  __esModule: true,
  addBusinessDays: addBusinessDaysMock,
}));

let finalizeProcess;

function buildSelectSingle(data) {
  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    maybeSingle: jest.fn(async () => ({ data, error: null })),
  };
  return builder;
}

function buildUpdateBuilder() {
  const builder = {
    update: jest.fn(() => builder),
    eq: jest.fn(() => ({ error: null })),
  };
  return builder;
}

describe("n8nService.finalizeProcess", () => {
  beforeAll(async () => {
    ({ finalizeProcess } = await import("../../src/services/n8nService.js"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("atualiza prazo e upload somente dentro do tenant", async () => {
    const uploadBuilder = buildSelectSingle({ id: "upload-123" });
    const prazoBuilder = buildSelectSingle({
      id: prazoFixture.id,
      data_inicio: prazoFixture.data_inicio,
      dias: prazoFixture.dias,
    });
    const prazoUpdateBuilder = buildUpdateBuilder();
    const uploadUpdateBuilder = buildUpdateBuilder();

    withTenantFilterMock
      .mockImplementationOnce(() => uploadBuilder)
      .mockImplementationOnce(() => prazoBuilder)
      .mockImplementationOnce(() => prazoUpdateBuilder)
      .mockImplementationOnce(() => uploadUpdateBuilder);

    const response = await finalizeProcess(
      "upload-123",
      "pub-1",
      DEFAULT_TENANT_ID
    );

    expect(addBusinessDaysMock).toHaveBeenCalledWith(
      prazoFixture.data_inicio,
      prazoFixture.dias
    );
    expect(prazoUpdateBuilder.update).toHaveBeenCalledWith({
      data_limite: "2024-05-20",
    });
    expect(uploadUpdateBuilder.update).toHaveBeenCalledWith({
      status: "processado",
    });
    expect(response).toEqual({ message: "Processo finalizado com sucesso." });
  });

  it("erro quando upload não está disponível no tenant", async () => {
    const uploadBuilder = buildSelectSingle(null);
    withTenantFilterMock.mockReturnValueOnce(uploadBuilder);

    await expect(
      finalizeProcess("upload-x", "pub-1", DEFAULT_TENANT_ID)
    ).rejects.toThrow("Upload upload-x não encontrado");
  });
});


