// public/js/gerenciarProcessos.js

// Seleção dos elementos do DOM
const modalEl = document.getElementById("modalProcesso");
const modalPeticoesEl = document.getElementById("modalPeticoes");
const modalVisualizarEl = document.getElementById("modalVisualizarPeticao");
const modalHistoricoEl = document.getElementById("modalHistorico"); 

// Inicialização dos Modais do Bootstrap
const modal = new bootstrap.Modal(modalEl);
const modalPeticoes = new bootstrap.Modal(modalPeticoesEl);
const modalVisualizar = modalVisualizarEl ? new bootstrap.Modal(modalVisualizarEl) : null;
const modalHistorico = modalHistoricoEl ? new bootstrap.Modal(modalHistoricoEl) : null; 

// Cache global
let peticoesCache = [];

document.addEventListener("DOMContentLoaded", carregarProcessos);

/**
 * Carrega a lista de processos na tabela principal.
 */
async function carregarProcessos() {
  const tbody = document.querySelector("#tabelaProcessos tbody");
  tbody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando...</td></tr>';

  try {
    const res = await fetch("/processos");
    const dados = await res.json();
    tbody.innerHTML = "";

    if (dados.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum processo encontrado.</td></tr>';
      return;
    }

    dados.forEach((p) => {
      const idReal = p.IdProcesso || p.idprocesso || p.id;

      // --- LÓGICA DO LINK NO NÚMERO DO PROCESSO [NOVO] ---
      let numProcessoHtml = p.numprocesso || "-";
      if (p.numprocesso) {
        // Cria um link que chama a função verHistorico
        numProcessoHtml = `
            <a href="#" onclick="verHistorico('${p.numprocesso}'); return false;" 
               class="text-decoration-underline fw-bold text-primary" 
               title="Ver Publicações deste Processo">
               ${p.numprocesso}
            </a>`;
      }

      // --- LÓGICA BOTÃO PASTA ---
      let conteudoPasta = p.pasta || "-";
      if (p.pasta && p.pasta.trim().startsWith("http")) {
        conteudoPasta = `
            <a href="${p.pasta}" target="_blank" class="btn btn-sm btn-secondary" title="Abrir local do arquivo">
                <i class="fas fa-folder-open me-1"></i> Abrir Arquivo
            </a>
        `;
      }

      const tr = document.createElement("tr");
      tr.id = `linha-processo-${idReal}`;

      tr.innerHTML = `
                <td>${numProcessoHtml}</td> <td>${p.descricao || "-"}</td>
                <td>${p.obs || "-"}</td>
                <td>${conteudoPasta}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-info text-white me-1" onclick="verPeticoes('${idReal}')" title="Ver Petições Geradas">
                        <i class="fas fa-file-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-warning text-white me-1" onclick="editar('${idReal}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="excluir('${idReal}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error(error);
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar.</td></tr>';
  }
}

// --- Funções Expostas Globalmente ---

// Função para buscar e exibir o histórico de publicações do processo
window.verHistorico = async (numProcesso) => {
    if(!modalHistorico) return;

    const tbody = document.getElementById("listaHistoricoPublicacoes");
    const titulo = document.getElementById("tituloProcessoHistorico");

    titulo.textContent = numProcesso;
    tbody.innerHTML = '<tr><td colspan="2" class="text-center">Carregando histórico...</td></tr>';
    
    modalHistorico.show();

    try {
        // Usa a rota já existente que busca pelo número do processo
        const res = await fetch(`/publicacoes/processo/${numProcesso}`);
        
        if(!res.ok) {
            // Se der 404 ou outro erro
            throw new Error("Não foi possível carregar o histórico.");
        }

        const publicacoes = await res.json();
        tbody.innerHTML = "";

        if (publicacoes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">Nenhuma publicação encontrada para este processo.</td></tr>';
            return;
        }

        publicacoes.forEach(pub => {
            // Formatação simples de data UTC
            let dataFormatada = "N/A";
            if(pub.data_publicacao) {
                // Ajuste para evitar problemas de fuso, pegando a parte da data se for ISO
                const dataObj = new Date(pub.data_publicacao);
                dataFormatada = dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            }

            tbody.innerHTML += `
                <tr>
                    <td>${dataFormatada}</td>
                    <td class="text-break" style="white-space: pre-wrap; font-size: 0.9rem;">${pub.texto_integral || '-'}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="2" class="text-center text-danger">${error.message}</td></tr>`;
    }
};

window.abrirModalCriar = () => {
  document.getElementById("formProcesso").reset();
  document.getElementById("idProcesso").value = "";
  document.getElementById("modalTitulo").innerText = "Novo Processo";

  document.getElementById("pasta").readOnly = false;
  document.getElementById("numProcesso").readOnly = false;
  document.getElementById("pasta").classList.remove("bg-light");
  document.getElementById("numProcesso").classList.remove("bg-light");
  modal.show();
};

window.salvarProcesso = async () => {
  const id = document.getElementById("idProcesso").value;

  const body = {
    pasta: document.getElementById("pasta").value,
    numprocesso: document.getElementById("numProcesso").value,
    descricao: document.getElementById("descricao").value,
    obs: document.getElementById("obs").value,
  };

  const method = id ? "PUT" : "POST";
  const url = id ? `/processos/${id}` : "/processos";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao salvar");
    }

    modal.hide();
    carregarProcessos();
  } catch (e) {
    alert("Erro: " + e.message);
  }
};

window.editar = async (id) => {
  try {
    if (!id || id === "undefined") return alert("ID inválido para edição.");

    const res = await fetch(`/processos/${id}`);
    if (!res.ok) throw new Error("Erro ao buscar dados do processo.");

    const p = await res.json();

    document.getElementById("idProcesso").value = p.IdProcesso || p.idprocesso || p.id;
    document.getElementById("pasta").value = p.pasta || "";
    document.getElementById("numProcesso").value = p.numprocesso || "";
    document.getElementById("descricao").value = p.descricao || "";
    document.getElementById("obs").value = p.obs || "";

    document.getElementById("pasta").readOnly = true;
    document.getElementById("numProcesso").readOnly = true;
    document.getElementById("pasta").classList.add("bg-light");
    document.getElementById("numProcesso").classList.add("bg-light");

    document.getElementById("modalTitulo").innerText = "Editar Processo";
    modal.show();
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
};

window.excluir = (id) => {
  if (!id || id === "undefined") return;

  if (!confirm("Deseja remover este item da visualização atual?")) return;

  const linha = document.getElementById(`linha-processo-${id}`);
  if (linha) {
    linha.remove();
  } else {
    alert("Não foi possível encontrar a linha na tabela para remover.");
  }
};

window.verPeticoes = async (id) => {
  const lista = document.getElementById("listaPeticoes");
  lista.innerHTML = '<li class="list-group-item text-center">Carregando...</li>';
  modalPeticoes.show();

  try {
    const res = await fetch(`/processos/${id}/peticoes`);
    const peticoes = await res.json();

    peticoesCache = peticoes;

    lista.innerHTML = "";

    if (peticoes.length === 0) {
      lista.innerHTML = "<li class='list-group-item'>Nenhuma petição encontrada para este processo.</li>";
      return;
    }

    peticoes.forEach((pet, index) => {
      const data = new Date(pet.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      lista.innerHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${pet.modelo_utilizado || "Sem Modelo"}</strong><br>
                        <small class="text-muted"><i class="far fa-clock"></i> ${data}</small>
                    </div>
                    <div>
                        <button class="btn btn-outline-primary btn-sm" onclick="abrirConteudoPeticao(${index})" title="Ler Conteúdo">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </li>
            `;
    });
  } catch (e) {
    console.error(e);
    lista.innerHTML = "<li class='list-group-item text-danger'>Erro ao buscar petições.</li>";
  }
};

window.abrirConteudoPeticao = (index) => {
  if (!modalVisualizar) {
    alert("Erro: O modal de visualização não foi encontrado.");
    return;
  }
  const peticao = peticoesCache[index];
  if (!peticao) return;

  const divConteudo = document.getElementById("conteudoPeticaoView");
  if (divConteudo) {
    divConteudo.innerHTML = peticao.conteudo_html || "<p class='text-muted text-center my-5'>Conteúdo vazio.</p>";
  }
  modalVisualizar.show();
};

window.imprimirConteudoModal = () => {
  const conteudoEl = document.getElementById("conteudoPeticaoView");
  if (!conteudoEl) return;
  const conteudo = conteudoEl.innerHTML;
  const win = window.open("", "", "height=700,width=900");
  win.document.write("<html><head><title>Imprimir Petição</title>");
  win.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">');
  win.document.write("<style>body { font-family: Arial, sans-serif; padding: 40px; } img { max-width: 100%; }</style>");
  win.document.write("</head><body>");
  win.document.write(conteudo);
  win.document.write("</body></html>");
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 500);
};