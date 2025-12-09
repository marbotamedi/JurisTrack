// public/js/gerenciarProcessos.js

const modalEl = document.getElementById('modalProcesso');
const modalPeticoesEl = document.getElementById('modalPeticoes');
const modal = new bootstrap.Modal(modalEl);
const modalPeticoes = new bootstrap.Modal(modalPeticoesEl);

document.addEventListener("DOMContentLoaded", carregarProcessos);

async function carregarProcessos() {
    const tbody = document.querySelector("#tabelaProcessos tbody");
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Carregando...</td></tr>';
    
    try {
        const res = await fetch("/processos");
        const dados = await res.json();
        tbody.innerHTML = "";
        
        if(dados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum processo encontrado.</td></tr>';
            return;
        }

        dados.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${p.pasta || '-'}</td>
                <td>${p.numprocesso || '-'}</td>
                <td>${p.descricao || '-'}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-info text-white me-1" onclick="verPeticoes('${p.idprocesso}')" title="Ver Petições">
                        <i class="fas fa-file-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-warning text-white me-1" onclick="editar('${p.idprocesso}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="excluir('${p.idprocesso}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Erro ao carregar.</td></tr>';
    }
}

// Expõe funções para o escopo global (para funcionar no onclick do HTML)
window.abrirModalCriar = () => {
    document.getElementById("formProcesso").reset();
    document.getElementById("idProcesso").value = "";
    document.getElementById("modalTitulo").innerText = "Novo Processo";
    modal.show();
};

window.salvarProcesso = async () => {
    const id = document.getElementById("idProcesso").value;
    const body = {
        pasta: document.getElementById("pasta").value,
        numprocesso: document.getElementById("numProcesso").value,
        descricao: document.getElementById("descricao").value,
        obs: document.getElementById("obs").value
    };

    const method = id ? "PUT" : "POST";
    const url = id ? `/processos/${id}` : "/processos";

    try {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        
        if(!res.ok) throw new Error("Erro ao salvar");
        
        modal.hide();
        carregarProcessos();
    } catch (e) {
        alert(e.message);
    }
};

window.editar = async (id) => {
    try {
        const res = await fetch(`/processos/${id}`);
        const p = await res.json();
        
        document.getElementById("idProcesso").value = p.idprocesso;
        document.getElementById("pasta").value = p.pasta || "";
        document.getElementById("numProcesso").value = p.numprocesso || "";
        document.getElementById("descricao").value = p.descricao || "";
        document.getElementById("obs").value = p.obs || "";
        
        document.getElementById("modalTitulo").innerText = "Editar Processo";
        modal.show();
    } catch(e) { console.error(e); }
};

window.excluir = async (id) => {
    if(!confirm("Tem certeza que deseja excluir este processo?")) return;
    try {
        await fetch(`/processos/${id}`, { method: "DELETE" });
        carregarProcessos();
    } catch(e) { alert("Erro ao excluir"); }
};

window.verPeticoes = async (id) => {
    const lista = document.getElementById("listaPeticoes");
    lista.innerHTML = "Carregando...";
    modalPeticoes.show();

    try {
        const res = await fetch(`/processos/${id}/peticoes`);
        const peticoes = await res.json();
        lista.innerHTML = "";

        if(peticoes.length === 0) {
            lista.innerHTML = "<li class='list-group-item'>Nenhuma petição encontrada para este processo.</li>";
            return;
        }

        peticoes.forEach(pet => {
            const data = new Date(pet.created_at).toLocaleDateString("pt-BR");
            lista.innerHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${pet.modelo_utilizado || "Sem Modelo"}</strong><br>
                        <small class="text-muted">Gerada em: ${data}</small>
                    </div>
                </li>
            `;
        });
    } catch (e) {
        lista.innerHTML = "<li class='list-group-item text-danger'>Erro ao buscar petições.</li>";
    }
};