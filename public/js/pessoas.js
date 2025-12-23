const API_URL = '/api/auxiliares/pessoas';
const ID_CAMPO = 'idpessoa';

document.addEventListener("DOMContentLoaded", () => {
    carregar();
});

async function carregar() {
    try {
        const res = await fetch(API_URL);
        const dados = await res.json();
       
        const tbody = document.getElementById("tabelaCorpo");
        if (!tbody) return;
        
        tbody.innerHTML = "";

        if (!dados || dados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhuma pessoa cadastrada.</td></tr>';
            return;
        }

        tbody.innerHTML = dados.map(item => {
            const statusHtml = item.ativo 
                ? '<span class="badge bg-success">Ativo</span>' 
                : '<span class="badge bg-danger">Inativo</span>';

            const idReal = item.idpessoa || item.id || '';

            return `
            <tr>
                <td>${item.nome || '-'}</td>
                <td>${item.cpf_cnpj || '-'}</td>
                <td>${item.tipo_pessoa || '-'}</td>
                <td>${item.email || '-'}</td>
                <td>${item.telefone || '-'}</td>
                <td>${statusHtml}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary" 
                        onclick='editar(${JSON.stringify({
                            id: idReal,
                            nome: item.nome || '',
                            cpf_cnpj: item.cpf_cnpj || '',
                            tipo_pessoa: item.tipo_pessoa || 'Fisica',
                            email: item.email || '',
                            telefone: item.telefone || '',
                            ativo: item.ativo
                        })})'>
                        <i class="fas fa-pen"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
    } catch (error) {
        console.error("Erro ao carregar:", error);
        const tbody = document.getElementById("tabelaCorpo");
        if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Erro ao carregar dados.</td></tr>';
    }
}

window.abrirModal = () => {
    document.getElementById("IdRegisto").value = "";
    document.getElementById("Nome").value = "";
    document.getElementById("CPF_CNPJ").value = "";
    document.getElementById("Tipo").value = "Fisica";
    document.getElementById("email").value = "";
    document.getElementById("Telefone").value = "";
    
    const checkAtivo = document.getElementById("Ativo");
    if(checkAtivo) checkAtivo.checked = true;

    new bootstrap.Modal(document.getElementById("modalAuxiliar")).show();
};

window.editar = (dados) => {
    document.getElementById("IdRegisto").value = dados.id || '';
    document.getElementById("Nome").value = dados.nome || '';
    document.getElementById("CPF_CNPJ").value = dados.cpf_cnpj || '';
    document.getElementById("Tipo").value = dados.tipo_pessoa || 'Fisica';
    document.getElementById("email").value = dados.email || '';
    document.getElementById("Telefone").value = dados.telefone || '';
    
    const checkAtivo = document.getElementById("Ativo");
    if(checkAtivo) checkAtivo.checked = Boolean(dados.ativo);

    new bootstrap.Modal(document.getElementById("modalAuxiliar")).show();
};

window.salvar = async () => {
    const nome = document.getElementById("Nome").value;
    const cpf = document.getElementById("CPF_CNPJ").value;
    const tipo = document.getElementById("Tipo").value;
    const email = document.getElementById("email").value;
    const tel = document.getElementById("Telefone").value;
    const checkAtivo = document.getElementById("Ativo");

    if (!nome) return alert("O Nome é obrigatório.");

    const body = { 
        nome: nome,
        cpf_cnpj: cpf,
        tipo_pessoa: tipo,
        email: email,
        telefone: tel,
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