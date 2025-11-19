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
      const linkGerarPeticao = `/gerarPeticao?publicacaoId=${publicacaoId}`;

      // 3. Adiciona a nova célula <td> com o link
      tr.innerHTML = `
        <td>${numeroProcessoHtml}</td>
        <td>${dataPublicacaoFormatada}</td>
        <td>${prazoEntrega}</td> 
        <td>${datavencimentoFormatada}</td>
        
        <td class="text-center">
          <a href="${linkGerarPeticao}" 
             class="btn btn-success btn-sm" 
             target="_blank" 
             title="Gerar Petição para este processo">
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

const resultadoModal = document.getElementById("resultadoModal");
if (resultadoModal) {
  // 'show.bs.modal' é o evento que dispara QUANDO o modal VAI ABRIR
  resultadoModal.addEventListener("show.bs.modal", function (event) {
    // Pega o botão que acionou o modal
    const button = event.relatedTarget;

    // VERIFICA SE O BOTÃO EXISTE (se não for null)
    if (button) {
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
    } else {
      console.error("Erro: O botão que acionou o modal é null.");
    }
  });

  // BÔNUS: Limpa a tabela do modal quando ele é fechado
  // Isso evita que o dado antigo apareça rapidamente antes do novo carregar
  resultadoModal.addEventListener("hidden.bs.modal", function (event) {
    if (isNavigatingToModal2) {
      isNavigatingToModal2 = false;
      return; // Não limpa se estamos indo para o segundo modal
    } else {
      const tbody = document.querySelector("#tablesResultado tbody");
      if (tbody) {
        tbody.innerHTML = ""; // Limpa o conteúdo
      }
    }
  });
}

//    Publicações > Detalhes do Processo (Modal Aninhado)

resultadoModal.addEventListener("click", async function (event) {
  // 1. Verifica se o que foi clicado é o link que queremos
  const link = event.target.closest(".link-processo");

  // Se não for o link, não faz nada
  if (!link) {
    return;
  }

  isNavigatingToModal2 = true;

  // 2. Impede o link de navegar (comportamento padrão do <a>)
  event.preventDefault();

  // 3. Pega o número do processo que guardamos no data-attribute
  const numeroProcesso = link.getAttribute("data-processo-numero");
  const prazo = link.getAttribute("data-prazo");
  const dataLimite = link.getAttribute("data-limite");

  if (!numeroProcesso) {
    console.error(
      "Não foi possível encontrar o 'data-processo-numero' no link."
    );
    return;
  }

  // 4. Pega a instância do modal ATUAL (o primeiro)
  const primeiroModal = bootstrap.Modal.getInstance(resultadoModal);

  // 5. Prepara o NOVO modal (#detalhesProcessoModal)
  const detalhesModalElement = document.getElementById("detalhesProcessoModal");
  // Se 'detalhesModalElement' for nulo, o HTML está errado.
  if (!detalhesModalElement) {
    console.error(
      "ERRO: O elemento #detalhesProcessoModal não foi encontrado no HTML."
    );
    return;
  }
  const detalhesModal =
    bootstrap.Modal.getOrCreateInstance(detalhesModalElement);

  const tbody = detalhesModalElement.querySelector(
    "#tableDetalhesProcesso tbody"
  );
  const tituloProcesso = detalhesModalElement.querySelector(
    "#numeroProcessoDetalhe"
  );
  const prazoDetalhe = detalhesModalElement.querySelector("#prazoDetalhe");
  const dataLimiteDetalhe =
    detalhesModalElement.querySelector("#dataLimiteDetalhe");

  // 6. Mostra "Carregando..."
  tituloProcesso.textContent = numeroProcesso;
  prazoDetalhe.textContent = prazo || "N/A";
  dataLimiteDetalhe.textContent = dataLimite || "N/A";
  tbody.innerHTML = `<tr><td colspan="2" class="text-center">Carregando histórico...</td></tr>`;

  // 7. ESCONDE o primeiro modal
  if (primeiroModal) {
    primeiroModal.hide();
  }

  // 8. MOSTRA o novo modal
  // Isso deve acontecer DEPOIS de esconder o primeiro.
  detalhesModal.show();

  // 9. Busca os dados na API que criamos
  try {
    const response = await fetch(`/publicacoes/processo/${numeroProcesso}`);

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(
        erro.error || `Erro ${response.status} ao buscar publicações.`
      );
    }

    const publicacoes = await response.json();

    // 10. Limpa a tabela e preenche com os dados
    tbody.innerHTML = "";

    if (publicacoes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" class="text-center text-muted">Nenhuma publicação encontrada para este processo.</td></tr>`;
    } else {
      // Formata as datas (a função já existe no seu formatarData.js)
      const formatadorData =
        window.formatarDataBR_SoData_UTC || formatarDataBR_SoData_UTC;

      publicacoes.forEach((pub) => {
        const tr = document.createElement("tr");
        const dataFormatada = pub.data_publicacao
          ? formatadorData(pub.data_publicacao)
          : "N/A";

        tr.innerHTML = `
                    <td>${dataFormatada}</td>
                    <td class="texto-publicacao">${
                      pub.texto_integral || "Texto não disponível"
                    }</td>
                `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error("Erro ao buscar detalhes do processo:", error);
    tbody.innerHTML = `<tr><td colspan="2" class="text-center text-danger">Falha ao carregar histórico: ${error.message}</td></tr>`;
  }
});

// Pega o botão "Voltar"
const btnVoltarResultados = document.getElementById("btnVoltarParaResultados");

if (btnVoltarResultados) {
  // Adiciona o evento de clique
  btnVoltarResultados.addEventListener("click", function () {
    // Pega os elementos dos dois modais
    const modalResultadosEl = document.getElementById("resultadoModal");
    const modalDetalhesEl = document.getElementById("detalhesProcessoModal");

    if (modalResultadosEl && modalDetalhesEl) {
      // Pega as instâncias de modal do Bootstrap
      // Usamos .getInstance() para o modal que ESTÁ ABERTO
      const instanciaModalDetalhes =
        bootstrap.Modal.getInstance(modalDetalhesEl);

      // Usamos .getOrCreateInstance() para o modal que queremos ABRIR
      const instanciaModalResultados =
        bootstrap.Modal.getOrCreateInstance(modalResultadosEl);

      // 1. Esconde o modal atual (Detalhes)
      if (instanciaModalDetalhes) {
        instanciaModalDetalhes.hide();
      }

      // 2. Mostra o modal anterior (Resultados)
      instanciaModalResultados.show();
    } else {
      console.error(
        "Não foi possível encontrar os elementos dos modais para a ação 'Voltar'."
      );
    }
  });
}
carregarTabela();