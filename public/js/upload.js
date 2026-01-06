import { formatarDataBR } from "/js/formatarData.js";
import { formatarDataBR_SoData_UTC } from "/js/formatarData.js";

const AUTH_TOKEN_KEY = "juristrack_token";
function authFetch(url, options = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    window.location.href = "/login";
    return Promise.reject(new Error("Token ausente"));
  }
  const headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
  return fetch(url, { ...options, headers });
}

const form = document.getElementById("uploadForm");
const messageDiv = document.getElementById("message");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    messageDiv.textContent = "Enviando arquivo para análise...";
    messageDiv.className = "mt-3 text-center fw-bold text-primary";

    try {
      // CORREÇÃO: Aponta para a rota específica de análise
      const response = await authFetch("/upload/analise", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = "Sucesso! Análise iniciada.";
        messageDiv.className = "mt-3 text-center fw-bold text-success";
        carregarTabela();
        form.reset();
      } else {
        messageDiv.textContent = "Erro: " + (result.error || "Falha desconhecida");
        messageDiv.className = "mt-3 text-center fw-bold text-danger";
      }
    } catch (error) {
      console.error(error);
      messageDiv.textContent = "Erro de conexão ou arquivo inválido.";
      messageDiv.className = "mt-3 text-center fw-bold text-danger";
    }
  });
}

// ... (Restante do arquivo: carregarTabela, carregarResultadoModal, formatarDataBR, etc. mantém-se igual)
async function carregarTabela() {
  try {
    const response = await authFetch("/upload/publicacoes");
    if (!response.ok) throw new Error("Erro ao buscar dados");

    const dados = await response.json();
    const tbody = document.querySelector("#tablesPublicacoes tbody");
    if(!tbody) return;

    tbody.innerHTML = ""; 

    dados.forEach((publicacao) => {
      const formattedDate = formatarDataBR(publicacao.data_upload);
      let statusHtml;

      if (publicacao.status === "processado") {
        statusHtml = `<button type="button" class="btn btn-success btn-sm" 
                              data-bs-toggle="modal" data-bs-target="#resultadoModal" 
                              data-nome-arquivo="${publicacao.nome_arquivo}"> 
                        <i class="fas fa-check-circle me-1"></i> Processado
                      </button>`;
      } else if (publicacao.status === "pendente") {
        statusHtml = `<div class="d-flex align-items-center">
                        <div class="spinner-border spinner-border-sm text-warning me-2" role="status"></div>
                        <span class="badge bg-warning text-dark">Pendente</span>
                      </div>`;
      } else {
        statusHtml = `<span class="badge bg-secondary">${publicacao.status}</span>`;
      }
      
      // Ícone de Visualizar (Olho)
      const linkDisplay = `<a href="${publicacao.url_publica}" target="_blank" title="Visualizar PDF" class="btn btn-sm btn-outline-primary">
                             <i class="fas fa-eye"></i> Visualizar
                           </a>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td>${publicacao.id}</td>
            <td style="max-width: 200px;" class="text-truncate" title="${publicacao.nome_arquivo}">${publicacao.nome_arquivo}</td>
            <td>${linkDisplay}</td>
            <td>${formattedDate}</td>
            <td>${statusHtml}</td> `;

      tbody.appendChild(tr);
    });

    if (dados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhum arquivo em análise.</td></tr>`;
    }
  } catch (error) {
    console.error(error);
  }
}

// ... (Funções de Modal e EventListeners mantidas iguais)
async function carregarResultadoModal(nome_arquivo) {
  const tbody = document.querySelector("#tablesResultado tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" class="text-center">Carregando...</td></tr>`;

  try {
    const response = await authFetch(`/resultado/${nome_arquivo}`);
    if (!response.ok) throw new Error("Erro ao buscar detalhes");
    
    const resultados = await response.json();
    tbody.innerHTML = "";

    if (!resultados || !resultados.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Sem dados extraídos.</td></tr>`;
      return;
    }

    resultados.forEach((r) => {
      const fmt = window.formatarDataBR_SoData_UTC || formatarDataBR_SoData_UTC;
      const linkProcesso = r.numero_processo !== "N/A" 
        ? `<a href="#" class="link-primary fw-bold text-decoration-underline link-processo">${r.numero_processo}</a>` 
        : "N/A";
        
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${linkProcesso}</td>
        <td>${r.data_publicacao ? fmt(r.data_publicacao) : "-"}</td>
        <td>${r.prazo_entrega || "-"}</td> 
        <td>${r.data_vencimento_calculada ? fmt(r.data_vencimento_calculada) : "-"}</td>
        <td class="text-center">
          <a href="/gerarPeticao?publicacaoId=${r.publicacaoId}&voltarPara=${encodeURIComponent(nome_arquivo)}" 
             class="btn btn-primary btn-sm"><i class="fas fa-file-signature"></i></a>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Erro ao carregar.</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  carregarTabela();
  setInterval(carregarTabela, 10000); 

  const resultadoModal = document.getElementById("resultadoModal");
  if (resultadoModal) {
    resultadoModal.addEventListener("show.bs.modal", (e) => {
      const nome = e.relatedTarget?.getAttribute("data-nome-arquivo");
      if (nome) carregarResultadoModal(nome);
    });
  }
});