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
        
        // Define o HTML do status de forma clara
        const statusHtml = estado.ativo 
            ? '<span class="badge bg-success">Ativo</span>' 
            : '<span class="badge bg-danger">Inativo</span>';

        tr.innerHTML = `
            <td>${estado.descricao}</td>
            <td><span class="badge bg-primary-subtle text-primary border border-primary-subtle">${estado.uf}</span></td>
            <td>${statusHtml}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary me-1" 
                    onclick="editar('${estado.idestado}', '${estado.descricao}', '${estado.uf}', ${estado.ativo})">
                    <i class="fas fa-pen"></i>
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

// Atualize a função editar
// public/js/estados.js -> Função editar()

window.editar = function(id, nome, uf, status) {
    document.getElementById("IdEstado").value = id;
    document.getElementById("Descricao").value = nome;
    document.getElementById("uf").value = uf;
    
    // Garante que o valor seja tratado como booleano
    // Se status for a string "true", vira true. Se for o booleano true, permanece true.
    const isActive = (String(status) === 'true');
    
    document.getElementById("Ativo").checked = isActive;
    
    new bootstrap.Modal(document.getElementById("modalEstado")).show();
};

// Atualize a função salvar
window.salvar = async function() {
    const body = {
        idestado: document.getElementById("IdEstado").value || null,
        descricao: document.getElementById("Descricao").value,
        uf: document.getElementById("uf").value.toUpperCase(),
        ativo: document.getElementById("Ativo").checked // Envia o valor
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