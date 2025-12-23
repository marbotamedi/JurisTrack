const API_URL = '/api/auxiliares/comarcas';
const ID_CAMPO = 'idcomarca';

document.addEventListener("DOMContentLoaded", () => {
    carregar();
    carregarEstados();
});

// Função para listar as comarcas
async function carregar() {
    try {
        const res = await fetch(API_URL);
        
        // Se der erro 500, exibe alerta
        if (!res.ok) {
            const erro = await res.json();
            throw new Error(erro.error || "Erro ao carregar dados");
        }

        const dados = await res.json();
        const tbody = document.getElementById("tabelaCorpo");
        
        tbody.innerHTML = dados.map(item => {
            const statusHtml = item.ativo 
                ? '<span class="badge bg-success">Ativo</span>' 
                : '<span class="badge bg-danger">Inativo</span>';

            // CORREÇÃO: Usa 'estados' (plural) e protege contra nulos com '?'
            // O nome da propriedade vem do nome da tabela no banco (estados)
            const nomeEstado = item.estados ? item.estados.descricao : '-';

            return `
            <tr>
                <td>${item.descricao}</td>
                <td>${nomeEstado}</td>
                <td>${statusHtml}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary" 
                        onclick="editar('${item[ID_CAMPO]}', '${item.descricao}', '${item.idestado}', ${item.ativo})">
                        <i class="fas fa-pen"></i>
                    </button>
                    </td>
            </tr>`;
        }).join('');
    } catch (error) {
        console.error("Erro no frontend:", error);
        document.getElementById("tabelaCorpo").innerHTML = 
            `<tr><td colspan="4" class="text-center text-danger">Erro: ${error.message}</td></tr>`;
    }
}

// Carrega o combo de estados no modal
async function carregarEstados() {
    try {
        const res = await fetch("/api/locais/estados");
        const estados = await res.json();
        const select = document.getElementById("SelectEstado");
        
        if (select) {
            select.innerHTML = '<option value="">Selecione um Estado...</option>';
            estados.forEach(est => {
                const opt = document.createElement("option");
                opt.value = est.idestado;
                opt.textContent = est.descricao;
                select.appendChild(opt);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar estados:", error);
    }
}

window.abrirModal = () => {
    document.getElementById("IdRegisto").value = "";
    document.getElementById("Descricao").value = "";
    if(document.getElementById("SelectEstado")) document.getElementById("SelectEstado").value = "";
    
    const checkAtivo = document.getElementById("Ativo");
    if(checkAtivo) checkAtivo.checked = true;

    new bootstrap.Modal(document.getElementById("modalAuxiliar")).show();
};

window.editar = (id, desc, idEstado, status) => {
    document.getElementById("IdRegisto").value = id;
    document.getElementById("Descricao").value = desc;
    
    const sel = document.getElementById("SelectEstado");
    // Garante que o valor não seja 'undefined' ou 'null' texto
    if(sel) sel.value = (idEstado && idEstado !== 'undefined' && idEstado !== 'null') ? idEstado : "";

    const isActive = (String(status) === 'true');
    const checkAtivo = document.getElementById("Ativo");
    if(checkAtivo) checkAtivo.checked = isActive;

    new bootstrap.Modal(document.getElementById("modalAuxiliar")).show();
};

window.salvar = async () => {
    const desc = document.getElementById("Descricao").value;
    const idEstado = document.getElementById("SelectEstado").value;
    
    const checkAtivo = document.getElementById("Ativo");
    const isAtivo = checkAtivo ? checkAtivo.checked : true;

    if (!desc || !idEstado) return alert("Preencha a descrição e selecione o Estado.");

    const body = { 
        descricao: desc,
        idestado: idEstado,
        ativo: isAtivo 
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
        alert("Erro de conexão com o servidor.");
    }
};