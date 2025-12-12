import { formatarDataBR } from "/js/formatarData.js";


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

      //INÍCIO: LÓGICA DO PROCESSADO OU PENDENTE

      let statusHtml;

      if (publicacao.status === "processado") {
        // MUDANÇA AQUI: Trocamos 'data-resultado' por 'data-nome-arquivo'
        // E passamos o nome do arquivo da publicação.
        statusHtml = `<span   class="btn btn-success btn-sm" 
                              data-bs-toggle="modal" 
                              data-nome-arquivo="${publicacao.nome_arquivo}"> 
                        Processado
                      </span>`;
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

document.addEventListener("DOMContentLoaded", () => {
  carregarTabela();
});