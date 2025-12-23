const API_URL = '/api/auxiliares/situacoes'
const ID_CAMPO = 'idsituacao'

document.addEventListener("DOMContentLoaded", () => {
    carregar();
});

async function carregar() {
    try {
        const res = await fetch(API_URL);
        const dados = await res.json();
       
        const tbody = document.getElementById("tabelaCorpo");

        if (dados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Nenhuma Fase cadastrada.</td></tr>';
            return;
        }

        tbody.innerHTML = dados.map(item => {
            const statusHtml = item.ativo 
                ? '<span class="badge bg-success">Ativo</span>' 
                : '<span class="badge bg-danger">Inativo</span>';

            const idSituacoes = item.idsituacao || item.IdSituacao|| item.idSituacao;

            return `
            <tr>
                <td>${item.descricao}</td>
                <td>${statusHtml}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary" 
                        onclick="editar('${idSituacoes}', '${item.descricao}', ${item.ativo})">
                        <i class="fas fa-pen"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
    } catch (error) {
        console.error("Erro ao carregar:", error);
    }
}


window.abrirModal = () => {
    document.getElementById("IdRegisto").value = "";
    document.getElementById("Descricao").value = "";
   
   
    const checkAtivo = document.getElementById("Ativo");
    if(checkAtivo) checkAtivo.checked = true;

    new bootstrap.Modal(document.getElementById("modalAuxiliar")).show();
};

window.editar = (id, desc, status) => {
    document.getElementById("IdRegisto").value = id;
    document.getElementById("Descricao").value = desc;
    
    const isActive = (String(status) === 'true');
    const checkAtivo = document.getElementById("Ativo");
    if(checkAtivo) checkAtivo.checked = isActive;

    new bootstrap.Modal(document.getElementById("modalAuxiliar")).show();
};

window.salvar = async () => {
    const desc = document.getElementById("Descricao").value;
    const checkAtivo = document.getElementById("Ativo");

    if (!desc) return alert("A descrição é obrigatória.");

    
    const body = { 
        descricao: desc,
        ativo: checkAtivo ? checkAtivo.checked : true
    };
    
    const id = document.getElementById("IdRegisto").value;
    
    
    if (id) body[ID_CAMPO] = id;

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        if (res.ok) { 
            bootstrap.Modal.getInstance(document.getElementById("modalAuxiliar")).hide();
            carregar();
        } else {
            const erro = await res.json();
            alert("Erro ao salvar: " + (erro.error || "Desconhecido"));
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão.");
    }
};