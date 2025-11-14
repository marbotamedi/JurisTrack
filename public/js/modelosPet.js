// --- Seletores de Elementos ---
const tabelaBody = document.querySelector("#tabelaModelos tbody");
const modeloModalElement = document.getElementById("modeloModal");
const modeloModal = new bootstrap.Modal(modeloModalElement);
const modalTitle = document.getElementById("modeloModalLabel");
const modalError = document.getElementById("modalError");
const btnSalvarModelo = document.getElementById("btnSalvarModelo");
const btnNovoModelo = document.getElementById("btnNovoModelo");

// Seletores do Modal de Detalhes
const detalhesModalElement = document.getElementById("detalhesModal");
const detalhesModal = new bootstrap.Modal(detalhesModalElement);
const detalhesTitulo = document.getElementById("detalhesTitulo");
const detalhesDescricao = document.getElementById("detalhesDescricao");
const detalhesTags = document.getElementById("detalhesTags");
const detalhesConteudo = document.getElementById("detalhesConteudo");

// Formulário
const formModelo = document.getElementById("formModelo");
const formModeloId = document.getElementById("formModeloId");
const formTitulo = document.getElementById("formTitulo");
const formDescricao = document.getElementById("formDescricao");
const formTags = document.getElementById("formTags");
const formConteudo = document.getElementById("formConteudo");

// Confirmação de Exclusão
const confirmDeleteBox = document.getElementById("confirmDeleteBox");
const confirmDeleteBackdrop = document.getElementById("confirmDeleteBackdrop");
const btnCancelDelete = document.getElementById("btnCancelDelete");
const btnConfirmDelete = document.getElementById("btnConfirmDelete");

// Variável para guardar o ID ao deletar
let deleteId = null;

// --- Funções ---

/**
 * Mostra a mensagem de erro no modal.
 * @param {string} message - A mensagem de erro.
 */
function showModalError(message) {
  modalError.textContent = message;
  modalError.style.display = "block";
}

/**
 * Esconde a mensagem de erro no modal.
 */
function hideModalError() {
  modalError.style.display = "none";
}

/**
 * Carrega e exibe todos os modelos na tabela.
 */
async function carregarModelos() {
  try {
    tabelaBody.innerHTML =
      '<tr><td colspan="4" class="text-center">Carregando...</td></tr>';
    const response = await fetch("/modelos"); // Rota GET /modelos

    if (!response.ok) {
      throw new Error("Falha ao carregar modelos.");
    }

    const modelos = await response.json();
    tabelaBody.innerHTML = ""; // Limpa a tabela

    if (modelos.length === 0) {
      tabelaBody.innerHTML =
        '<tr><td colspan="4" class="text-center">Nenhum modelo cadastrado.</td></tr>';
      return;
    }

    modelos.forEach((modelo) => {
      // Converte o array de tags em string, ou mostra 'N/A'
      const tagsString =
        Array.isArray(modelo.tags) && modelo.tags.length > 0
          ? modelo.tags.join(", ")
          : "N/A";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${modelo.titulo || "N/A"}</td>
        <td>${modelo.descricao || "N/A"}</td>
        <td>${tagsString}</td>
        <td>
          <button class="btn btn-sm btn-success btn-details" data-id="${
            modelo.id
          }" title="Detalhes">
            <i class="fas fa-info-circle"></i>
          </button>
          <button class="btn btn-sm btn-primary btn-edit" data-id="${
            modelo.id
          }" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger btn-delete" data-id="${
            modelo.id
          }" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tabelaBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar modelos:", error);
    tabelaBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Erro ao carregar dados: ${error.message}</td></tr>`;
  }
}

/**
 * Abre o modal de detalhes, buscando os dados completos do modelo.
 * @param {string} id - O UUID do modelo a ser exibido.
 */
async function abrirModalDetalhes(id) {
  try {
    // Limpa o modal e mostra "Carregando"
    detalhesTitulo.textContent = "Carregando...";
    detalhesDescricao.textContent = "Carregando...";
    detalhesTags.textContent = "Carregando...";
    detalhesConteudo.textContent = "Carregando...";
    detalhesTags.className = "badge bg-secondary"; // Reseta a classe
    detalhesModal.show();

    // Busca o modelo completo (incluindo o 'conteudo')
    const response = await fetch(`/modelos/${id}`); // Rota GET /modelos/:id
    if (!response.ok) {
      throw new Error("Falha ao buscar detalhes do modelo.");
    }
    const modelo = await response.json();

    // Preenche o modal com os dados
    detalhesTitulo.textContent = modelo.titulo || "Sem Título";
    detalhesDescricao.textContent = modelo.descricao || "Nenhuma descrição";
    detalhesConteudo.innerHTML = modelo.conteudo || "Nenhum conteúdo";

    // Formata as tags
    const tagsString =
      Array.isArray(modelo.tags) && modelo.tags.length > 0
        ? modelo.tags.join(", ")
        : "Nenhuma tag";

    detalhesTags.textContent = tagsString;
    // Remove o 'badge' se não houver tags
    if (tagsString === "Nenhuma tag") {
      detalhesTags.className = ""; // Remove a classe de 'badge'
    } else {
      detalhesTags.className = "badge bg-secondary"; // Garante que tem a classe
    }
  } catch (error) {
    console.error("Erro ao abrir detalhes:", error);
    // Mostra erro dentro do modal
    detalhesTitulo.textContent = "Erro ao Carregar";
    detalhesConteudo.textContent =
      "Não foi possível carregar os dados: " + error.message;
  }
}

/**
 * Abre o modal para edição, buscando os dados completos do modelo.
 * @param {string} id - O UUID do modelo a ser editado.
 */
async function abrirModalEdicao(id) {
  try {
    // Busca o modelo completo (incluindo o 'conteudo')
    const response = await fetch(`/modelos/${id}`); // Rota GET /modelos/:id
    if (!response.ok) {
      throw new Error("Falha ao buscar detalhes do modelo.");
    }
    const modelo = await response.json();

    // Preenche o formulário
    modalTitle.textContent = "Editar Modelo";
    formModeloId.value = modelo.id;
    formTitulo.value = modelo.titulo || "";
    formDescricao.value = modelo.descricao || "";
    tinymce.get("formConteudo").setContent(modelo.conteudo || "");
    formTags.value =
      Array.isArray(modelo.tags) && modelo.tags.length > 0
        ? modelo.tags.join(", ")
        : "";

    hideModalError();
    modeloModal.show();
  } catch (error) {
    console.error("Erro ao abrir edição:", error);
    // Idealmente, mostraria isso para o usuário
    alert("Não foi possível carregar os dados para edição: " + error.message);
  }
}

/**
 * Abre o modal para criação (limpa o formulário).
 */
function abrirModalCriacao() {
  modalTitle.textContent = "Novo Modelo";
  formModelo.reset(); // Limpa o formulário
  formModeloId.value = ""; // Garante que o ID está vazio
  hideModalError();
  modeloModal.show();
}

/**
 * Salva o modelo (criação ou atualização).
 */
async function salvarModelo() {
  const id = formModeloId.value;
  const url = id ? `/modelos/${id}` : "/modelos"; // Rota PUT /modelos/:id ou POST /modelos
  const method = id ? "PUT" : "POST";

  const conteudoDoEditor = tinymce.get("formConteudo").getContent();

  const body = {
    titulo: formTitulo.value,
    descricao: formDescricao.value,
    tags: formTags.value, // O backend vai tratar a string
    conteudo: conteudoDoEditor,
  };

  // Validação simples no frontend
  if (!body.titulo || !body.conteudo) {
    showModalError("Título e Conteúdo são obrigatórios.");
    return;
  }

  hideModalError();

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Erro desconhecido ao salvar.");
    }

    modeloModal.hide(); // Fecha o modal
    carregarModelos(); // Atualiza a tabela
  } catch (error) {
    console.error("Erro ao salvar:", error);
    showModalError(error.message);
  }
}

/**
 * Mostra a confirmação de exclusão.
 * @param {string} id - O ID do modelo a ser deletado.
 */
function showDeleteConfirmation(id) {
  deleteId = id; // Armazena o ID
  confirmDeleteBox.style.display = "block";
  confirmDeleteBackdrop.style.display = "block";
}

/**
 * Esconde a confirmação de exclusão.
 */
function hideDeleteConfirmation() {
  deleteId = null;
  confirmDeleteBox.style.display = "none";
  confirmDeleteBackdrop.style.display = "none";
}

/**
 * Executa a exclusão do modelo.
 */
async function deletarModelo() {
  if (!deleteId) return;

  try {
    const response = await fetch(`/modelos/${deleteId}`, {
      // Rota DELETE /modelos/:id
      method: "DELETE",
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Falha ao deletar.");
    }

    hideDeleteConfirmation();
    carregarModelos(); // Atualiza a tabela
  } catch (error) {
    console.error("Erro ao deletar:", error);
    // Mostra erro para o usuário (substitua por um modal de erro se preferir)
    alert("Erro ao excluir modelo: " + error.message);
    hideDeleteConfirmation();
  }
}

// --- Event Listeners ---

// Carrega os modelos ao iniciar a página
document.addEventListener("DOMContentLoaded", carregarModelos);

// Botão "Novo Modelo"
btnNovoModelo.addEventListener("click", abrirModalCriacao);

// Botão "Salvar" dentro do modal
btnSalvarModelo.addEventListener("click", salvarModelo);

// Gerenciamento de cliques na tabela (para botões de Detalhes, Editar e Excluir)
tabelaBody.addEventListener("click", (e) => {
  const button = e.target.closest("button"); // Pega o botão clicado

  if (!button) return; // Sai se não clicou em um botão

  const id = button.dataset.id; // Pega o data-id do botão

  if (button.classList.contains("btn-details")) {
    abrirModalDetalhes(id);
  }

  if (button.classList.contains("btn-edit")) {
    abrirModalEdicao(id);
  }

  if (button.classList.contains("btn-delete")) {
    showDeleteConfirmation(id);
  }
});

// Botões da caixa de confirmação de exclusão
btnCancelDelete.addEventListener("click", hideDeleteConfirmation);
btnConfirmDelete.addEventListener("click", deletarModelo);
confirmDeleteBackdrop.addEventListener("click", hideDeleteConfirmation);