import { jest, describe, it, expect, beforeAll, beforeEach } from "@jest/globals";
import { ValidationError } from "../../src/utils/authErrors.js";
import { DEFAULT_TENANT_ID } from "../fixtures/multiTenant.js";

const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();
const mockRemove = jest.fn();
const mockInsertSelect = jest.fn();
const mockInsert = jest.fn(() => ({ select: mockInsertSelect }));
const mockFrom = jest.fn(() => ({ insert: mockInsert }));
const mockStorageFrom = jest.fn(() => ({
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl,
  remove: mockRemove,
}));

const mockWithTenantFilter = jest.fn();
const mockInjectTenant = jest.fn((payload, tenantId) => ({
  ...payload,
  tenant_id: tenantId,
}));

jest.unstable_mockModule("../../src/config/supabase.js", () => ({
  __esModule: true,
  default: {
    storage: { from: mockStorageFrom },
    from: mockFrom,
  },
}));

jest.unstable_mockModule("../../src/repositories/tenantScope.js", () => ({
  __esModule: true,
  withTenantFilter: mockWithTenantFilter,
  injectTenant: mockInjectTenant,
}));

let uploadFileToStorage;
let deleteDocument;

beforeAll(async () => {
  ({ uploadFileToStorage, deleteDocument } = await import(
    "../../src/services/uploadService.js"
  ));
});

beforeEach(() => {
  jest.clearAllMocks();
  mockWithTenantFilter.mockReset();
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200 })
  );
  mockInsertSelect.mockResolvedValue({
    data: [{ id: "upload-123" }],
    error: null,
  });
  mockGetPublicUrl.mockReturnValue({
    data: { publicUrl: "https://storage/teste/tenant-1/123_456/arquivo-teste.PDF" },
  });
  mockUpload.mockResolvedValue({ error: null });
});

describe("uploadService.uploadFileToStorage", () => {
  it("falha cedo se tenantId não é fornecido", async () => {
    const fakeFile = {
      originalname: "arquivo.pdf",
      mimetype: "application/pdf",
      buffer: Buffer.from("123"),
      size: 3,
    };

    await expect(
      uploadFileToStorage(fakeFile, "123", "proc-1", undefined)
    ).rejects.toBeInstanceOf(ValidationError);

    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("faz upload com caminho prefixado pelo tenant e injeta tenant_id no banco", async () => {
    const fakeFile = {
      originalname: "Árquivo Teste.PDF",
      mimetype: "application/pdf",
      buffer: Buffer.from("conteudo"),
      size: 9,
    };

    const response = await uploadFileToStorage(
      fakeFile,
      "123/456",
      "proc-1",
      "tenant-1"
    );

    expect(mockStorageFrom).toHaveBeenCalledWith("teste");
    expect(mockUpload).toHaveBeenCalledWith(
      "tenant-1/123_456/arquivo-teste.PDF",
      fakeFile.buffer,
      expect.objectContaining({ contentType: "application/pdf" })
    );
    expect(mockFrom).toHaveBeenCalledWith("upload_Documentos");

    const insertedPayload = mockInsert.mock.calls[0][0][0];
    expect(insertedPayload.tenant_id).toBe("tenant-1");
    expect(insertedPayload.nome_arquivo).toBe("arquivo-teste.PDF");
    expect(insertedPayload.url_publica).toBeDefined();
    expect(insertedPayload.status).toBe("doc_processo");

    expect(response).toEqual({
      fileName: "arquivo-teste.PDF",
      publicUrl: "https://storage/teste/tenant-1/123_456/arquivo-teste.PDF",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://agendamentoai-n8n.mapkkt.easypanel.host/webhook/processar/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ id: "upload-123", tenant_id: "tenant-1" }),
      })
    );
  });
});

describe("uploadService.deleteDocument", () => {
  it("remove do storage usando caminho segregado por tenant e deleta registro", async () => {
    const storageUrl = `https://example.com/storage/v1/object/public/teste/${DEFAULT_TENANT_ID}/pasta/arquivo.pdf`;
    const fetchBuilder = {
      select: jest.fn(() => fetchBuilder),
      eq: jest.fn(() => fetchBuilder),
      maybeSingle: jest.fn(async () => ({
        data: { id: "doc-1", url_publica: storageUrl },
        error: null,
      })),
    };

    const deleteBuilder = {
      delete: jest.fn(() => deleteBuilder),
      eq: jest.fn(() => ({ error: null })),
    };

    mockWithTenantFilter
      .mockImplementationOnce(() => fetchBuilder)
      .mockImplementationOnce(() => deleteBuilder);

    await expect(deleteDocument("doc-1", DEFAULT_TENANT_ID)).resolves.toBe(
      true
    );

    expect(fetchBuilder.eq).toHaveBeenCalledWith("id", "doc-1");
    expect(deleteBuilder.eq).toHaveBeenCalledWith("id", "doc-1");
    expect(mockStorageFrom).toHaveBeenCalledWith("teste");
    expect(mockRemove).toHaveBeenCalledWith([
      `${DEFAULT_TENANT_ID}/pasta/arquivo.pdf`,
    ]);
  });

  it("falha quando documento não pertence ao tenant informado", async () => {
    const fetchBuilder = {
      select: jest.fn(() => fetchBuilder),
      eq: jest.fn(() => fetchBuilder),
      maybeSingle: jest.fn(async () => ({ data: null, error: null })),
    };

    mockWithTenantFilter.mockReturnValueOnce(fetchBuilder);

    await expect(
      deleteDocument("doc-1", DEFAULT_TENANT_ID)
    ).rejects.toThrow("Documento não encontrado");
    expect(mockRemove).not.toHaveBeenCalled();
  });
});

