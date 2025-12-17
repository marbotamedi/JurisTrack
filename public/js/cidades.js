document.addEventListener("DOMContentLoaded", () => {
    carregarCidades();
    carregarComboEstados(); // Carrega os estados para o modal
});

const buscaInput = document.getElementById("buscaInput");
buscaInput.addEventListener("keyup", (e) => {
    if(e.key === "Enter") carregarCidades();
});

async function carregarCidades() {
    const termo = buscaInput.value;
    const tbody = document.getElementById("tabelaCorpo");
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Carregando...</td></tr>';

    try {
        const res = await fetch(`/api/locais/cidades?busca=${termo}`);
        const dados = await res.json();

        tbody.innerHTML = "";
        dados.forEach(cidade => {
            const nomeEstado = cidade.estados ? cidade.estados.descricao : "-";
            const ufEstado = cidade.estados ? cidade.estados.uf : "-";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${cidade.descricao}</td>
                <td>
                    ${nomeEstado}
                </td>
                <td>
                    <span class="badge bg-light text-dark border me-1">${ufEstado}</span>                   
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary me-1" onclick="editar('${cidade.idcidade}', '${cidade.descricao}', '${cidade.idestado}')">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deletar('${cidade.idcidade}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        alert("Erro ao carregar cidades");
    }
}

async function carregarComboEstados() {
    try {
        const res = await fetch("/api/locais/estados");
        const estados = await res.json();
        const select = document.getElementById("IdEstado");
        const selectUF = document.getElementById("idUF");
        
        // Limpa e preenche
        select.innerHTML = '<option value="">Selecione...</option>';
        if(selectUF) selectUF.innerHTML = '<option value="">Selecione...</option>';
        
        estados.forEach(est => {
            // Preenche Combo de Estado
            const opt = document.createElement("option");
            opt.value = est.idestado;
            opt.textContent = `${est.descricao}`;
            select.appendChild(opt);

            // Preenche Combo de UF (se existir na tela)
            if(selectUF) {
                const optUf = document.createElement("option");
                optUf.value = est.idestado;
                optUf.textContent = `${est.uf}`;
                selectUF.appendChild(optUf);
            }
        });
    } catch (error) {
        console.error("Erro ao carregar combo de estados", error);
    }
}

window.abrirModal = function() {
    document.getElementById("IdCidade").value = "";
    document.getElementById("Descricao").value = "";
    document.getElementById("IdEstado").value = "";
    if(document.getElementById("idUF")) document.getElementById("idUF").value = "";
    
    new bootstrap.Modal(document.getElementById("modalCidade")).show();
};

window.editar = function(id, nome, idestado) {
    document.getElementById("IdCidade").value = id;
    document.getElementById("Descricao").value = nome;
    document.getElementById("IdEstado").value = idestado;
    
    // Sincroniza UF se existir
    if(document.getElementById("idUF")) document.getElementById("idUF").value = idestado;

    new bootstrap.Modal(document.getElementById("modalCidade")).show();
};

window.salvar = async function() {
    const id = document.getElementById("IdCidade").value;
    const body = {
        idcidade: id || null,
        // CORREÇÃO: A chave deve ser 'descricao' (minúsculo) para o backend aceitar
        descricao: document.getElementById("Descricao").value,
        idestado: document.getElementById("IdEstado").value
    };

    if(!body.idestado) return alert("Selecione um Estado");

    try {
        const res = await fetch("/api/locais/cidades", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalCidade")).hide();
            carregarCidades();
        } else {
            alert("Erro ao salvar");
        }
    } catch (error) {
        console.error(error);
    }
};

window.deletar = async function(id) {
    if(!confirm("Deseja realmente excluir esta cidade?")) return;
    try {
        await fetch(`/api/locais/cidades/${id}`, { method: "DELETE" });
        carregarCidades();
    } catch (error) {
        alert("Erro ao deletar");
    }
};

// Sincronizar Combos (Opcional: Ao mudar Estado, muda UF e vice-versa)
const selEstado = document.getElementById("IdEstado");
const selUF = document.getElementById("idUF");

if(selEstado && selUF) {
    selEstado.addEventListener("change", () => selUF.value = selEstado.value);
    selUF.addEventListener("change", () => selEstado.value = selUF.value);
}