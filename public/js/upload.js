import { formatarDataBR } from "/js/formatarData.js";
import { formatarDataBR_SoData_UTC } from "/js/formatarData.js";

const form = document.getElementById("uploadForm");
const messageDiv = document.getElementById("message");

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
      "Extensão não suportada (JPEG, PNG, GIF, PDF)  ou arquivo muito grande (Acima de 5MB).";
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

      // =======================================================
      //           INÍCIO: LÓGICA DO BOTÃO DE STATUS
      // =======================================================
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
      // =======================================================
      //             FIM: LÓGICA DO BOTÃO DE STATUS
      // =======================================================

      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td>${publicacao.id}</td>
            <td>${publicacao.nome_arquivo}</td>
            <td><a href="${publicacao.url_publica}" target="_blank">${publicacao.url_publica}</a></td>
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

// =======================================================
//           INÍCIO: JAVASCRIPT DO MODAL (MODIFICADO)
// =======================================================

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
    const response = await fetch(`/upload/resultado/${nome_arquivo}`);

    if (!response.ok) {
      const erro = await response.json(); // Tenta ler a mensagem de erro do backend
      if (response.status === 404) {
        throw new Error(erro.error || "Resultado não encontrado.");
      }
      throw new Error(
        erro.error || `Erro ao buscar resultado: ${response.status}`
      );
    }

    // MUDANÇA: Renomeado para 'resultados' (plural)
    const resultados = await response.json(); // Recebe o ARRAY

    // 3. Limpa a tabela
    tbody.innerHTML = "";

    // MUDANÇA: Adiciona verificação de array vazio (caso o backend falhe em dar 404)
    if (!resultados || resultados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Nenhum resultado encontrado para este arquivo.</td></tr>`;
      return;
    }

    // MUDANÇA: Faz um loop (forEach) no array de resultados
    resultados.forEach((resultado) => {
      // Cria uma nova linha para CADA resultado
      const tr = document.createElement("tr");
      const dataMovimentacaoFormatada = resultado.nova_movimentacao
        ? formatarDataBR_SoData_UTC(resultado.nova_movimentacao)
        : "Não Informado";

      const dataPublicacaoFormatada = resultado.data_publicacao
        ? formatarDataBR_SoData_UTC(resultado.data_publicacao)
        : formatarDataBR_SoData_UTC(resultado.nova_movimentacao);

      const datavencimentoFormatada = resultado.data_vencimento_calculada
        ? formatarDataBR_SoData_UTC(resultado.data_vencimento_calculada)
        : "Não Informado";

      tr.innerHTML = `
        <td>${resultado.numero_processo || "Não Informado"}</td>
        <td>${dataMovimentacaoFormatada}</td> 
        <td>${dataPublicacaoFormatada}</td>
        <td>${resultado.prazo_entrega || "Não Informado"}</td>
        <td>${datavencimentoFormatada}</td>
      `;

      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar resultado no modal:", error);
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Falha ao carregar resultado: ${error.message}</td></tr>`;
  }
}

// =======================================================
// LISTENER DO MODAL (Sem alteração, mas incluído)
// =======================================================
const resultadoModal = document.getElementById("resultadoModal");
if (resultadoModal) {
  // 'show.bs.modal' é o evento que dispara QUANDO o modal VAI ABRIR
  resultadoModal.addEventListener("show.bs.modal", function (event) {
    // Pega o botão que acionou o modal
    const button = event.relatedTarget;

    // MUDANÇA: Lendo 'data-nome-arquivo'
    const nomeArquivo = button.getAttribute("data-nome-arquivo");

    if (nomeArquivo) {
      // Chama a nova função para carregar os dados DESTE NOME
      carregarResultadoModal(nomeArquivo);
    } else {
      // MUDANÇA: Mensagem de erro atualizada
      const tbody = document.querySelector("#tablesResultado tbody");
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Erro: Nome do arquivo não foi encontrado.</td></tr>`;
      }
    }
  });

  // BÔNUS: Limpa a tabela do modal quando ele é fechado
  // Isso evita que o dado antigo apareça rapidamente antes do novo carregar
  resultadoModal.addEventListener("hidden.bs.modal", function (event) {
    const tbody = document.querySelector("#tablesResultado tbody");
    if (tbody) {
      tbody.innerHTML = ""; // Limpa o conteúdo
    }
  });
}

// =======================================================
// CHAMADA INICIAL
// =======================================================
// Carrega a tabela principal quando a página é aberta
carregarTabela();
// Removido o 's;' extra que estava no seu arquivo anterior
