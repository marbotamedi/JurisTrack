import { formatarDataBR } from "/js/formatarData.js";
import { formatarDataBR_SoData_UTC } from "/js/formatarData.js";

const form = document.getElementById("uploadForm");
const messageDiv = document.getElementById("message");
let isNavigatingToModal2 = false;

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);

  messageDiv.textContent = "Enviando...";
  messageDiv.style.color = "blue";

  try {
    // O endpoint é a rota que criamos no Express
    const response = await fetch("/upload", {
      // http://localhost:3000/upload
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      messageDiv.textContent = "Upload bem-sucedido!";
      /*messageDiv.textContent = 'Sucesso! URL do Arquivo: ' + result.publicUrl;+*/
      messageDiv.style.color = "green";
      console.log("Upload:", result);

      carregarTabela();
    } else {
      messageDiv.textContent =
        "Erro no Upload: " + (result.error || "Detalhes indisponíveis");
      messageDiv.style.color = "red";
      console.error("Erro:", result);
      console.error("Status:", response.status);
    }
  } catch (error) {
    messageDiv.textContent =
      "Extensão não suportada (JPEG, PNG, GIF, PDF)  ou arquivo muito grande (Acima de 5MB ou 10MB).";
    /*messageDiv.textContent = 'Erro de Rede ou Servidor Inacessível.';*/
    messageDiv.style.color = "darkred";
    console.error("Erro de Rede:", error);
  }
});

// Função para carregar os dados JSON e preencher a tabela

async function carregarTabela() {
  try {
    const response = await fetch("/upload/publicacoes");
    if (!response.ok) {
      throw new Error(`Erro ao buscar publicações: ${response.status}`);
    }

    const dados = await response.json();
    const tbody = document.querySelector("#tablesPublicacoes tbody");

    tbody.innerHTML = ""; // limpa a tabela

    dados.forEach((publicacao) => {
      const formattedDate = formatarDataBR(publicacao.data_upload);

      //INÍCIO: LÓGICA DO BOTÃO DE STATUS

      let statusHtml;

      if (publicacao.status === "processado") {
        // MUDANÇA AQUI: Trocamos 'data-resultado' por 'data-nome-arquivo'
        // E passamos o nome do arquivo da publicação.
        statusHtml = `<button type="button" 
                              class="btn btn-success btn-sm" 
                              data-bs-toggle="modal" 
                              data-bs-target="#resultadoModal" 
                              data-nome-arquivo="${publicacao.nome_arquivo}"> 
                        Processado
                      </button>`;
      } else if (publicacao.status === "pendente") {
        statusHtml = `<span class="badge bg-warning text-dark">${publicacao.status}</span>`;
      } else {
        // Para qualquer outro status (ex: "erro")
        statusHtml = `<span class="badge bg-danger">${
          publicacao.status || "erro"
        }</span>`;
      }

      // FIM: LÓGICA DO BOTÃO DE STATUS

      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td>${publicacao.id}</td>
            <td>${publicacao.nome_arquivo}</td>
            <!---<td><a href="${publicacao.url_publica}" target="_blank">${publicacao.url_publica}</a></td>---->
            <td>${formattedDate}</td>
            <td>${statusHtml}</td> `;

      tbody.appendChild(tr);
    });
    // Se a tabela estiver vazia, exibe uma mensagem
    if (dados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhuma publicação encontrada.</td></tr>`;
    }
  } catch (error) {
    console.error("Erro ao carregar a tabela:", error);
    // MUDANÇA: Corrigido o seletor para a tabela correta em caso de erro
    const tbody = document.querySelector("#tablesPublicacoes tbody");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Falha ao carregar dados. (Verifique o servidor e a rota /upload/publicacoes).</td></tr>`;
    }
  }
}

// INÍCIO DO MODAL

async function carregarResultadoModal(nome_arquivo) {
  const tbody = document.querySelector("#tablesResultado tbody");
  if (!tbody) {
    console.error("Tabela do modal (#tablesResultado) não foi encontrada.");
    return;
  }

  // 1. Limpa a tabela e mostra "Carregando"
  tbody.innerHTML = `<tr><td colspan="4" class="text-center">Carregando resultado...</td></tr>`;

  try {
    // 2. Busca o resultado específico usando o nome
    const response = await fetch(`/resultado/${nome_arquivo}`);

    if (!response.ok) {
      const erro = await response.json();
      if (response.status === 404) {
        throw new Error(erro.error || "Resultado não encontrado.");
      }
      throw new Error(
        erro.error || `Erro ao buscar resultado: ${response.status}`
      );
    }

    const resultados = await response.json();

    // 3. Limpa a tabela
    tbody.innerHTML = "";

    if (!resultados || resultados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Nenhum resultado encontrado para este arquivo.</td></tr>`;
      return;
    }

    resultados.forEach((resultado) => {
      const tr = document.createElement("tr");
      console.log("Processando resultado:", resultado); // Log para depuração
      const dataPublicacaoFormatada = resultado.data_publicacao
        ? formatarDataBR_SoData_UTC(resultado.data_publicacao)
        : "Não Informado";

      // *** ESTES SÃO OS VALORES QUE QUEREMOS ***
      const datavencimentoFormatada = resultado.data_vencimento_calculada
        ? formatarDataBR_SoData_UTC(resultado.data_vencimento_calculada)
        : "Não Informado";

      const prazoEntrega = resultado.prazo_entrega || "Não Informado";

      const numeroProcesso = resultado.numero_processo || "Não Informado";
      let numeroProcessoHtml = numeroProcesso;

      if (numeroProcesso !== "Não Informado" && numeroProcesso !== "N/A") {
        // *** ESTA É A LINHA MAIS IMPORTANTE ***

        numeroProcessoHtml = `<a href="#" 
                                class="link-primary fw-bold text-decoration-underline link-processo" 
                                data-processo-numero="${numeroProcesso}"
                                data-prazo="${prazoEntrega}"
                                data-limite="${datavencimentoFormatada}">
                                ${numeroProcesso}
                             </a>`;
      }

      console.log(resultado); // O log que mostra os dados corretos

      // 1. Pega o publicacaoId que DEVE vir da sua API (Graças ao Passo 2)
      const publicacaoId = resultado.publicacaoId;

      if (!publicacaoId) {
        console.error(
          "publicacaoId não foi encontrado no objeto 'resultado'. Verifique sua API em modalRoute.js"
        );
      }

      // 2. Cria o link dinâmico para a página de gerar petição
      /*const linkGerarPeticao = `/gerarPeticao?publicacaoId=${publicacaoId}`;*/
      // Adicione o nome do arquivo como parâmetro na URL para saber para onde voltar
      // Use encodeURIComponent para garantir que espaços e acentos não quebrem o link
      const linkGerarPeticao = `/gerarPeticao?publicacaoId=${publicacaoId}&voltarPara=${encodeURIComponent(
        nome_arquivo
      )}`;

      // 3. Adiciona a nova célula <td> com o
      // Isso fará o navegador carregar a nova página na mesma aba, "fechando" o modal e a tela atual.
      tr.innerHTML = `
        <td>${numeroProcessoHtml}</td>
        <td>${dataPublicacaoFormatada}</td>
        <td>${prazoEntrega}</td> 
        <td>${datavencimentoFormatada}</td>
        
        <td class="text-center">
          <a href="${linkGerarPeticao}" 
             class="btn btn-success btn-sm" 
             <!---target="_blank" ---->
             <title="Gerar Petição para este processo">
            <i class="fas fa-gavel"></i>
          </a>
        </td>
      `;

      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar resultado no modal:", error);
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Falha ao carregar resultado: ${error.message}</td></tr>`;
  }
}

// --- Event Listeners do Modal Principal ---
const resultadoModal = document.getElementById("resultadoModal");
if (resultadoModal) {
  resultadoModal.addEventListener("show.bs.modal", function (event) {
    const button = event.relatedTarget;
    if (button) {
      const nomeArquivo = button.getAttribute("data-nome-arquivo");
      if (nomeArquivo) {
        carregarResultadoModal(nomeArquivo);
      }
    }
  });

  resultadoModal.addEventListener("hidden.bs.modal", function (event) {
    if (isNavigatingToModal2) {
      isNavigatingToModal2 = false;
      return;
    } else {
      const tbody = document.querySelector("#tablesResultado tbody");
      if (tbody) tbody.innerHTML = "";
    }
  });

  // Lógica para clicar no número do processo (Modal Aninhado)
  resultadoModal.addEventListener("click", async function (event) {
    const link = event.target.closest(".link-processo");
    if (!link) return;

    isNavigatingToModal2 = true;
    event.preventDefault();
F
    const numeroProcesso = link.getAttribute("data-processo-numero");
    const prazo = link.getAttribute("data-prazo");
    const dataLimite = link.getAttribute("data-limite");

    const primeiroModal = bootstrap.Modal.getInstance(resultadoModal);
    const detalhesModalElement = document.getElementById(
      "detalhesProcessoModal"
    );
    const detalhesModal =
      bootstrap.Modal.getOrCreateInstance(detalhesModalElement);

    const tbody = detalhesModalElement.querySelector(
      "#tableDetalhesProcesso tbody"
    );
    const tituloProcesso = detalhesModalElement.querySelector(
      "#numeroProcessoDetalhe"
    );

    document.getElementById("prazoDetalhe").textContent = prazo || "N/A";
    document.getElementById("dataLimiteDetalhe").textContent =
      dataLimite || "N/A";

    tituloProcesso.textContent = numeroProcesso;
    tbody.innerHTML = `<tr><td colspan="2" class="text-center">Carregando histórico...</td></tr>`;

    if (primeiroModal) primeiroModal.hide();
    detalhesModal.show();

    try {
      const response = await fetch(`/publicacoes/processo/${numeroProcesso}`);
      if (!response.ok) throw new Error("Erro ao buscar histórico.");

      const publicacoes = await response.json();
      tbody.innerHTML = "";

      if (publicacoes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" class="text-center text-muted">Nenhuma publicação.</td></tr>`;
      } else {
        const formatadorData =
          window.formatarDataBR_SoData_UTC || formatarDataBR_SoData_UTC;
        publicacoes.forEach((pub) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
             <td>${
               pub.data_publicacao ? formatadorData(pub.data_publicacao) : "N/A"
             }</td>
             <td class="texto-publicacao">${
               pub.texto_integral || "Texto indisponível"
             }</td>
          `;
          tbody.appendChild(tr);
        });
      }
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="2" class="text-center text-danger">${error.message}</td></tr>`;
    }
  });
}

// Botão Voltar do Modal Detalhes
const btnVoltarResultados = document.getElementById("btnVoltarParaResultados");
if (btnVoltarResultados) {
  btnVoltarResultados.addEventListener("click", function () {
    const modalResultadosEl = document.getElementById("resultadoModal");
    const modalDetalhesEl = document.getElementById("detalhesProcessoModal");

    if (modalResultadosEl && modalDetalhesEl) {
      const instanciaModalDetalhes =
        bootstrap.Modal.getInstance(modalDetalhesEl);
      const instanciaModalResultados =
        bootstrap.Modal.getOrCreateInstance(modalResultadosEl);

      if (instanciaModalDetalhes) instanciaModalDetalhes.hide();
      instanciaModalResultados.show();
    }
  });
}

// [NOVO] Inicialização e Auto-Reabertura do Modal ao Voltar da Petição

document.addEventListener("DOMContentLoaded", () => {
  carregarTabela();

  // Verifica se a URL tem ?reabrirModal=NOME_DO_ARQUIVO
  const params = new URLSearchParams(window.location.search);
  const arquivoParaReabrir = params.get("reabrirModal");

  if (arquivoParaReabrir) {
    // Delay pequeno para garantir que o DOM/Bootstrap carregou
    setTimeout(() => {
      const modalEl = document.getElementById("resultadoModal");
      if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        // Carrega os dados específicos daquele arquivo
        carregarResultadoModal(arquivoParaReabrir);

        // Limpa a URL para evitar abrir de novo no F5
        window.history.replaceState({}, document.title, "/");
      }
    }, 500);
  }
});