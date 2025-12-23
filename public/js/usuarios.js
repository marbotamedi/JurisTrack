const API_BASE = "/api/users";
const STORAGE_TENANT_KEY = "juristrack_tenantId";

const state = {
  users: [],
};

const els = {
  tabelaBody: document.getElementById("tabelaUsuariosBody"),
  total: document.getElementById("totalUsuarios"),
  busca: document.getElementById("buscaInput"),
  filtroStatus: document.getElementById("filtroStatus"),
  tenantInput: document.getElementById("tenantIdInput"),
  alertArea: document.getElementById("alertArea"),
  btnAtualizar: document.getElementById("btnAtualizar"),
  btnNovo: document.getElementById("btnNovoUsuario"),
  modalEl: document.getElementById("usuarioModal"),
  modalTitle: document.getElementById("usuarioModalTitle"),
  usuarioId: document.getElementById("usuarioId"),
  emailInput: document.getElementById("emailInput"),
  senhaInput: document.getElementById("senhaInput"),
  roleInput: document.getElementById("roleInput"),
  statusInput: document.getElementById("statusInput"),
  tenantFormInput: document.getElementById("tenantFormInput"),
  salvarBtn: document.getElementById("salvarUsuarioBtn"),
};

document.addEventListener("DOMContentLoaded", () => {
  restoreTenantFromStorage();
  bindEvents();
  renderTable();
  if (getTenantId()) {
    carregarUsuarios();
  }
});

function bindEvents() {
  els.btnAtualizar?.addEventListener("click", carregarUsuarios);
  els.btnNovo?.addEventListener("click", () => abrirModalCriar());
  els.salvarBtn?.addEventListener("click", salvarUsuario);

  els.filtroStatus?.addEventListener("change", carregarUsuarios);
  els.busca?.addEventListener("input", renderTable);
  els.tenantInput?.addEventListener("change", syncTenantToModal);

  els.tabelaBody?.addEventListener("click", (event) => {
    const actionBtn = event.target.closest("[data-action]");
    if (!actionBtn) return;

    const id = actionBtn.dataset.id;
    const action = actionBtn.dataset.action;
    const user = state.users.find((u) => String(u.id) === String(id));
    if (!user) return;

    if (action === "edit") {
      abrirModalEditar(user);
    } else if (action === "inactivate") {
      confirmarAlteracaoStatus(user, "inactivate");
    } else if (action === "reactivate") {
      confirmarAlteracaoStatus(user, "reactivate");
    }
  });
}

function restoreTenantFromStorage() {
  const saved = localStorage.getItem(STORAGE_TENANT_KEY);
  if (saved && els.tenantInput) {
    els.tenantInput.value = saved;
    syncTenantToModal();
  }
}

function syncTenantToModal() {
  if (els.tenantFormInput && els.tenantInput) {
    els.tenantFormInput.value = (els.tenantInput.value || "").trim();
  }
}

function getTenantId() {
  return (els.tenantInput?.value || "").trim();
}

function setTableMessage(text) {
  if (els.tabelaBody) {
    els.tabelaBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">${text}</td></tr>`;
  }
}

function showAlert(type, message) {
  if (!els.alertArea) return;
  if (!message) {
    els.alertArea.innerHTML = "";
    return;
  }
  els.alertArea.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    </div>
  `;
}

async function carregarUsuarios() {
  const tenantId = getTenantId();
  if (!tenantId) {
    setTableMessage("Informe o tenant e clique em Atualizar.");
    showAlert("warning", "Tenant ID é obrigatório para listar usuários.");
    return;
  }

  syncTenantToModal();
  localStorage.setItem(STORAGE_TENANT_KEY, tenantId);
  setTableMessage("Carregando usuários...");
  showAlert("info", "Buscando usuários...");

  let url = `${API_BASE}?tenantId=${encodeURIComponent(tenantId)}`;
  const status = els.filtroStatus?.value;
  if (status) {
    url += `&status=${encodeURIComponent(status)}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(data?.message || "Erro ao listar usuários.");
    }

    state.users = Array.isArray(data) ? data : [];
    renderTable();
    showAlert("success", `Lista atualizada (${state.users.length})`);
  } catch (error) {
    console.error("[usuarios] erro ao carregar", error);
    state.users = [];
    renderTable();
    showAlert("danger", error.message);
  }
}

function renderTable() {
  if (!els.tabelaBody) return;

  const termo = (els.busca?.value || "").toLowerCase().trim();
  const filtrados = state.users.filter((u) => {
    if (!termo) return true;
    return (
      (u.email || "").toLowerCase().includes(termo) ||
      (u.role || "").toLowerCase().includes(termo)
    );
  });

  if (els.total) {
    els.total.textContent = filtrados.length;
  }

  if (filtrados.length === 0) {
    setTableMessage("Nenhum usuário encontrado com os filtros atuais.");
    return;
  }

  els.tabelaBody.innerHTML = filtrados
    .map((user) => {
      const badgeClass =
        user.status === "ativo" ? "badge-ativo" : "badge-inativo";
      const statusLabel = user.status === "ativo" ? "Ativo" : "Inativo";
      const createdAt = formatDate(user.created_at);

      return `
        <tr>
          <td>${user.email || "-"}</td>
          <td>${user.role || "-"}</td>
          <td class="text-center"><span class="badge ${badgeClass}">${statusLabel}</span></td>
          <td>${user.tenant_id || "-"}</td>
          <td>${createdAt}</td>
          <td class="text-end table-actions">
            <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${user.id}">
              <i class="fas fa-pen"></i>
            </button>
            ${
              user.status === "ativo"
                ? `<button class="btn btn-sm btn-outline-danger" data-action="inactivate" data-id="${user.id}">
                    <i class="fas fa-user-slash"></i>
                  </button>`
                : `<button class="btn btn-sm btn-outline-success" data-action="reactivate" data-id="${user.id}">
                    <i class="fas fa-user-check"></i>
                  </button>`
            }
          </td>
        </tr>
      `;
    })
    .join("");
}

function abrirModalCriar() {
  if (!els.modalEl) return;
  els.modalTitle.textContent = "Novo Usuário";
  els.usuarioId.value = "";
  els.emailInput.removeAttribute("disabled");
  els.tenantFormInput.removeAttribute("disabled");
  els.emailInput.value = "";
  els.senhaInput.value = "";
  els.roleInput.value = "advogado";
  els.statusInput.value = "ativo";
  syncTenantToModal();
  new bootstrap.Modal(els.modalEl).show();
}

function abrirModalEditar(user) {
  if (!els.modalEl) return;
  els.modalTitle.textContent = "Editar Usuário";
  els.usuarioId.value = user.id;
  els.emailInput.value = user.email || "";
  els.emailInput.setAttribute("disabled", "disabled");
  els.senhaInput.value = "";
  els.roleInput.value = user.role || "advogado";
  els.statusInput.value = user.status || "ativo";
  els.tenantFormInput.value = user.tenant_id || getTenantId() || "";
  els.tenantFormInput.setAttribute("disabled", "disabled");

  new bootstrap.Modal(els.modalEl).show();
}

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

async function salvarUsuario() {
  const id = (els.usuarioId?.value || "").trim();
  const email = (els.emailInput?.value || "").trim().toLowerCase();
  const senha = els.senhaInput?.value || "";
  const role = els.roleInput?.value || "";
  const status = els.statusInput?.value || "";
  const tenantId = (els.tenantFormInput?.value || "").trim() || getTenantId();

  if (!tenantId) {
    showAlert("warning", "Tenant ID é obrigatório.");
    return;
  }

  if (!id && !validarEmail(email)) {
    showAlert("warning", "Informe um e-mail válido.");
    return;
  }

  if (!role) {
    showAlert("warning", "Role é obrigatória.");
    return;
  }

  if (!status) {
    showAlert("warning", "Status é obrigatório.");
    return;
  }

  if (!id && (!senha || senha.length < 6)) {
    showAlert("warning", "Senha deve ter pelo menos 6 caracteres.");
    return;
  }

  if (id && senha && senha.length < 6) {
    showAlert("warning", "Senha deve ter pelo menos 6 caracteres.");
    return;
  }

  const payload = {};
  let method = "POST";
  let url = API_BASE;

  if (id) {
    method = "PATCH";
    url = `${API_BASE}/${id}`;
    payload.role = role;
    payload.status = status;
    if (senha) {
      payload.password = senha;
    }
  } else {
    payload.email = email;
    payload.password = senha;
    payload.role = role;
    payload.status = status;
    payload.tenantId = tenantId;
  }

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || "Erro ao salvar usuário.");
    }

    bootstrap.Modal.getInstance(els.modalEl)?.hide();
    showAlert("success", data?.message || "Usuário salvo com sucesso.");
    carregarUsuarios();
  } catch (error) {
    console.error("[usuarios] erro ao salvar", error);
    showAlert("danger", error.message);
  }
}

function confirmarAlteracaoStatus(user, action) {
  const actionLabel = action === "inactivate" ? "inativar" : "reativar";
  const confirmacao = window.confirm(
    `Deseja ${actionLabel} o usuário ${user.email}?`
  );
  if (!confirmacao) return;
  alterarStatus(user.id, action);
}

async function alterarStatus(id, action) {
  const endpoint =
    action === "inactivate"
      ? `${API_BASE}/${id}/inactivate`
      : `${API_BASE}/${id}/reactivate`;

  try {
    const response = await fetch(endpoint, { method: "POST" });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || "Erro ao alterar status.");
    }

    showAlert("success", data?.message || "Status atualizado com sucesso.");
    carregarUsuarios();
  } catch (error) {
    console.error("[usuarios] erro status", error);
    showAlert("danger", error.message);
  }
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

