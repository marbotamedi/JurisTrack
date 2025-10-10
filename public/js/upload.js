const form = document.getElementById('uploadForm');
const messageDiv = document.getElementById('message');

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
      const dateObj = new Date(publicacao.data_upload);

      const formattedDate = dateObj.toLocaleString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "America/Sao_Paulo",
      });

      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td>${publicacao.id}</td>
            <td>${publicacao.nome_arquivo}</td>
            <td><a href="${publicacao.url_publica}" target="_blank">${publicacao.url_publica}</a></td>
            <td>${formattedDate}</td>
            <td>${publicacao.status}</td>
            `;

      tbody.appendChild(tr);
    });
    // Se a tabela estiver vazia, exibe uma mensagem
    if (dados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhuma publicação encontrada.</td></tr>`;
    }
  } catch (error) {
    console.error("Erro ao carregar a tabela:", error);
    const tbody = document.querySelector("#datatablesSimple tbody");
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Falha ao carregar dados. (Verifique o servidor e a rota /upload/publicacoes).</td></tr>`;
  }
}

carregarTabela();

