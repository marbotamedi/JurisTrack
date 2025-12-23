export const DEFAULT_TENANT_ID = "43f89b9e-7f0f-4ffc-87eb-4e5cf42a8597";
export const OTHER_TENANT_ID = "11111111-2222-3333-4444-555555555555";

export const uploadFixture = {
  id: "upload-123",
  nome_arquivo: "arquivo-teste.PDF",
  url_publica: `https://storage/v1/object/public/teste/${DEFAULT_TENANT_ID}/123_456/arquivo-teste.PDF`,
  processo_id: "proc-1",
  tenant_id: DEFAULT_TENANT_ID,
  data_upload: "2024-02-01",
};

export const publicacaoFixtures = [
  { id: "pub-1", data_publicacao: "2024-02-02", processoid: "proc-1", uploadid: "upload-123" },
  { id: "pub-2", data_publicacao: "2024-03-03", processoid: "proc-1", uploadid: "upload-123" },
];

export const prazoFixture = {
  id: "prazo-1",
  data_inicio: "2024-02-05",
  dias: 10,
  data_limite: "2024-02-19",
};

export const andamentoFixture = {
  data_evento: "2024-02-10",
  descricao: "Movimentação de teste",
};

export const processoFixture = {
  idprocesso: "proc-1",
  numprocesso: "0001111-00.2024.1.00.0001",
};

export const modelosByTenant = {
  [DEFAULT_TENANT_ID]: [
    {
      id: "modelo-1",
      titulo: "Petição Inicial",
      descricao: "Template inicial",
      conteudo: "<p>Conteúdo A</p>",
      tags: ["iniciais"],
      tenant_id: DEFAULT_TENANT_ID,
    },
  ],
  [OTHER_TENANT_ID]: [
    {
      id: "modelo-2",
      titulo: "Contestação",
      descricao: "Template B",
      conteudo: "<p>Conteúdo B</p>",
      tags: ["defesa"],
      tenant_id: OTHER_TENANT_ID,
    },
  ],
};

export function cloneFixture(value) {
  return JSON.parse(JSON.stringify(value));
}

