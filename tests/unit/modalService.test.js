import { jest } from "@jest/globals";
import {
  DEFAULT_TENANT_ID,
  andamentoFixture,
  prazoFixture,
  processoFixture,
  publicacaoFixtures,
  uploadFixture,
} from "../fixtures/multiTenant.js";

const withTenantFilterMock = jest.fn();

jest.unstable_mockModule("../../src/repositories/tenantScope.js", () => ({
  __esModule: true,
  withTenantFilter: withTenantFilterMock,
}));

let getProcessingResult;
let getProcessHistory;

function buildSingleBuilder(result) {
  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    maybeSingle: jest.fn(async () => ({ data: result, error: null })),
  };
  return builder;
}

describe("modalService (tenant-aware consultas)", () => {
  beforeAll(async () => {
    ({ getProcessingResult, getProcessHistory } = await import(
      "../../src/services/modalService.js"
    ));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("monta resultado do processamento apenas com dados do tenant", async () => {
    const builders = {
      upload_Documentos: buildSingleBuilder({ id: uploadFixture.id }),
      Publicacao: {
        select: jest.fn(() => ({
          eq: jest.fn(async () => ({
            data: publicacaoFixtures,
            error: null,
          })),
        })),
      },
      processos: buildSingleBuilder({ numprocesso: processoFixture.numprocesso }),
      Prazo: buildSingleBuilder({
        dias: prazoFixture.dias,
        data_limite: prazoFixture.data_limite,
      }),
      Andamento: buildSingleBuilder({ data_evento: andamentoFixture.data_evento }),
    };
    builders.Andamento.order = jest.fn(() => builders.Andamento);
    builders.Andamento.limit = jest.fn(() => builders.Andamento);

    withTenantFilterMock.mockImplementation((table, tenantId) => {
      expect(tenantId).toBe(DEFAULT_TENANT_ID);
      return builders[table];
    });

    const result = await getProcessingResult(
      uploadFixture.nome_arquivo,
      DEFAULT_TENANT_ID
    );

    expect(result).toEqual([
      expect.objectContaining({
        publicacaoId: "pub-1",
        numero_processo: processoFixture.numprocesso,
        nova_movimentação: andamentoFixture.data_evento,
        data_publicacao: publicacaoFixtures[0].data_publicacao,
        prazo_entrega: prazoFixture.dias,
        data_vencimento_calculada: prazoFixture.data_limite,
      }),
      expect.objectContaining({
        publicacaoId: "pub-2",
      }),
    ]);
    expect(withTenantFilterMock).toHaveBeenCalledWith(
      "upload_Documentos",
      DEFAULT_TENANT_ID
    );
    expect(withTenantFilterMock).toHaveBeenCalledWith(
      "Publicacao",
      DEFAULT_TENANT_ID
    );
    expect(withTenantFilterMock).toHaveBeenCalledWith(
      "processos",
      DEFAULT_TENANT_ID
    );
  });

  it("falha quando upload não existe para o tenant", async () => {
    const missingUploadBuilder = buildSingleBuilder(null);
    withTenantFilterMock.mockReturnValueOnce(missingUploadBuilder);

    await expect(
      getProcessingResult("qualquer.pdf", DEFAULT_TENANT_ID)
    ).rejects.toThrow("Documento de upload não encontrado.");
  });

  it("impede histórico quando processo não é encontrado no tenant", async () => {
    const processoBuilder = buildSingleBuilder(null);
    withTenantFilterMock.mockReturnValueOnce(processoBuilder);

    await expect(
      getProcessHistory(processoFixture.numprocesso, DEFAULT_TENANT_ID)
    ).rejects.toThrow("Processo não encontrado.");
  });
});


