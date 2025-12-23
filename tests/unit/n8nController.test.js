import { jest } from "@jest/globals";

const finalizeProcessMock = jest.fn();

jest.unstable_mockModule("../../src/services/n8nService.js", () => ({
  __esModule: true,
  finalizeProcess: finalizeProcessMock,
}));

const { completeProcess } = await import(
  "../../src/controllers/n8nController.js"
);

function buildRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("n8nController.completeProcess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna 400 quando uploadId ou publicacaoId faltam", async () => {
    const req = {
      body: { uploadId: null, publicacaoId: null },
      tenantId: "tenant-1",
    };
    const res = buildRes();

    await completeProcess(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "uploadId e publicacaoId são obrigatórios.",
    });
    expect(finalizeProcessMock).not.toHaveBeenCalled();
  });

  it("retorna 422 quando tenant_id não é enviado na payload do job", async () => {
    const req = {
      body: { uploadId: 1, publicacaoId: "pub-1" },
      tenantId: "tenant-1",
    };
    const res = buildRes();

    await completeProcess(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: "tenant_id é obrigatório na payload do job.",
    });
    expect(finalizeProcessMock).not.toHaveBeenCalled();
  });

  it("retorna 403 quando tenant_id do job diverge do token", async () => {
    const req = {
      body: { uploadId: 1, publicacaoId: "pub-1", tenant_id: "outro-tenant" },
      tenantId: "tenant-1",
    };
    const res = buildRes();

    await completeProcess(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "tenant_id do job não corresponde ao tenant do token.",
    });
    expect(finalizeProcessMock).not.toHaveBeenCalled();
  });

  it("chama o service e retorna 200 quando payload é válida", async () => {
    finalizeProcessMock.mockResolvedValue({ message: "ok" });
    const req = {
      body: { uploadId: 1, publicacaoId: "pub-1", tenant_id: "tenant-1" },
      tenantId: "tenant-1",
    };
    const res = buildRes();

    await completeProcess(req, res);

    expect(finalizeProcessMock).toHaveBeenCalledWith(1, "pub-1", "tenant-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "ok" });
  });
});

