document.addEventListener("DOMContentLoaded", carregarEstados);

const buscaInput = document.getElementById("buscaInput");
buscaInput.addEventListener("keyup", (e) => {
    if(e.key === "Enter") carregarEstados();
});

async function carregarEstados() {
    const termo = buscaInput.value;
    const tbody = document.getElementById("tabelaCorpo");
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Carregando...</td></tr>';

    try {
        const res = await fetch(`/api/locais/estados?busca=${termo}`);
        const dados = await res.json();

        tbody.innerHTML = "";
        dados.forEach(estado => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${estado.descricao}</td>
                <td><span class="badge bg-primary-subtle text-primary border border-primary-subtle">${estado.uf}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary me-1" onclick="editar('${estado.idestado}', '${estado.descricao}', '${estado.uf}')">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deletar('${estado.idestado}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        alert("Erro ao carregar estados");
    }
}

function limparFormulario() {
    // CORREÇÃO: IDs corrigidos para PascalCase conforme o HTML
    document.getElementById("IdEstado").value = "";
    document.getElementById("Descricao").value = "";
    document.getElementById("uf").value = "";
}

window.editar = function(id, nome, uf) {
    // CORREÇÃO: IDs corrigidos para PascalCase conforme o HTML
    document.getElementById("IdEstado").value = id;
    document.getElementById("Descricao").value = nome;
    document.getElementById("uf").value = uf;
    new bootstrap.Modal(document.getElementById("modalEstado")).show();
};

window.salvar = async function() {
    // CORREÇÃO: IDs corrigidos para PascalCase conforme o HTML
    const id = document.getElementById("IdEstado").value;
    
    const body = {
        idestado: id || null,
        // CORREÇÃO: Enviando chave 'descricao' minúscula para o backend, mas lendo do ID 'Descricao' maiúsculo
        descricao: document.getElementById("Descricao").value,
        uf: document.getElementById("uf").value.toUpperCase()
    };

    try {
        const res = await fetch("/api/locais/estados", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalEstado")).hide();
            carregarEstados();
        } else {
            alert("Erro ao salvar");
        }
    } catch (error) {
        console.error(error);
    }
};

window.deletar = async function(id) {
    if(!confirm("Deseja realmente excluir este estado?")) return;
    try {
        await fetch(`/api/locais/estados/${id}`, { method: "DELETE" });
        carregarEstados();
    } catch (error) {
        alert("Erro ao deletar. Verifique se não há cidades vinculadas.");
    }
};