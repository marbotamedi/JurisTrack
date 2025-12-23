const API_URL = '/api/auxiliares/tribunais';
const ID_CAMPO = 'idtribunal';

document.addEventListener("DOMContentLoaded", () => {
    carregar();
    carregarCombos(); // Função correta para esta tela
});

// Lista os tribunais
async function carregar() {
    try {
        const res = await fetch(API_URL);
        const dados = await res.json();
        const tbody = document.getElementById("tabelaCorpo");

        tbody.innerHTML = dados.map(item => {
            const statusHtml = item.ativo 
                ? '<span class="badge bg-success">Ativo</span>' 
                : '<span class="badge bg-danger">Inativo</span>';

            // Pega a descrição dos objetos relacionados (graças ao update no Service)
            const nomeComarca = item.comarcas ? item.comarcas.descricao : '-';
            const nomeInstancia = item.instancias ? item.instancias.descricao : '-';

            return `
            <tr>
                <td>${item.descricao}</td>
                <td>${nomeComarca}</td>
                <td>${nomeInstancia}</td>
                <td>${statusHtml}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary" 
                        onclick="editar('${item[ID_CAMPO]}', '${item.descricao}', '${item.idcomarca}', '${item.idinstancia}', ${item.ativo})">
                        <i class="fas fa-pen"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
    } catch (error) {
        console.error("Erro ao carregar:", error);
    }
}

// Carrega Comarcas e Instâncias para os Selects
async function carregarCombos() {
    try {
        // Carrega Comarcas
        const resComarcas = await fetch("/api/auxiliares/comarcas");
        const comarcas = await resComarcas.json();
        const selComarca = document.getElementById("SelectComarca");
        if(selComarca) {
            selComarca.innerHTML = '<option value="">Selecione...</option>';
            comarcas.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.idcomarca;
                opt.textContent = c.descricao;
                selComarca.appendChild(opt);
            });
        }

        // Carrega Instâncias
        const resInstancias = await fetch("/api/auxiliares/instancias");
        const instancias = await resInstancias.json();
        const selInstancia = document.getElementById("SelectInstancia");
        if(selInstancia) {
            selInstancia.innerHTML = '<option value="">Selecione...</option>';
            instancias.forEach(i => {
                const opt = document.createElement("option");
                opt.value = i.idinstancia; 
                opt.textContent = i.descricao;
                selInstancia.appendChild(opt);
            });
        }

    } catch (error) {
        console.error("Erro ao carregar combos:", error);
    }
}

window.abrirModal = () => {
    document.getElementById("IdRegisto").value = "";
    document.getElementById("Descricao").value = "";
    if(document.getElementById("SelectComarca")) document.getElementById("SelectComarca").value = "";
    if(document.getElementById("SelectInstancia")) document.getElementById("SelectInstancia").value = "";
    
    const checkAtivo = document.getElementById("Ativo");
    if(checkAtivo) checkAtivo.checked = true;

    new bootstrap.Modal(document.getElementById("modalAuxiliar")).show();
};

window.editar = (id, desc, idComarca, idInstancia, status) => {
    document.getElementById("IdRegisto").value = id;
    document.getElementById("Descricao").value = desc;
    
    // Define os valores dos selects (se forem nulos ou 'undefined', fica no "Selecione...")
    if(document.getElementById("SelectComarca")) {
        document.getElementById("SelectComarca").value = (idComarca && idComarca !== 'null' && idComarca !== 'undefined') ? idComarca : "";
    }
    if(document.getElementById("SelectInstancia")) {
        document.getElementById("SelectInstancia").value = (idInstancia && idInstancia !== 'null' && idInstancia !== 'undefined') ? idInstancia : "";
    }

    const isActive = (String(status) === 'true');
    const checkAtivo = document.getElementById("Ativo");
    if(checkAtivo) checkAtivo.checked = isActive;

    new bootstrap.Modal(document.getElementById("modalAuxiliar")).show();
};

window.salvar = async () => {
    const desc = document.getElementById("Descricao").value;
    const idComarca = document.getElementById("SelectComarca").value;
    const idInstancia = document.getElementById("SelectInstancia").value;
    const checkAtivo = document.getElementById("Ativo");

    if (!desc) return alert("A descrição é obrigatória.");

    const body = { 
        descricao: desc,
        idcomarca: idComarca || null,
        idinstancia: idInstancia || null,
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