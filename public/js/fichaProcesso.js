document.addEventListener("DOMContentLoaded", async () => {
    // 1. Carrega Combos Auxiliares em paralelo
    await Promise.all([
        carregarSelect("/api/locais/estados", "selectEstado"),
        carregarSelect("/api/auxiliares/comarcas", "IdComarca"),
        carregarSelect("/api/auxiliares/tribunais", "IdTribunal"),
        carregarSelect("/api/auxiliares/varas", "IdVara"),
        carregarSelect("/api/auxiliares/instancias", "IdInstancia"),
        carregarSelect("/api/auxiliares/decisoes", "IdDecisao")
    ]);

    // 2. Verifica se tem ID na URL para editar
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (id) {
        await carregarDadosProcesso(id);
    }
});

// Listener para mudar Cidades ao mudar Estado
document.getElementById("selectEstado").addEventListener("change", (e) => {
    carregarCidadesPorEstado(e.target.value);
});

// --- FUNÇÕES DE CARREGAMENTO ---

async function carregarSelect(url, elementId, valorSelecionado = null) {
    const select = document.getElementById(elementId);
    if (!select) return;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.warn(`Rota ${url} falhou.`);
            return;
        }
        const lista = await res.json();

        select.innerHTML = '<option value="">Selecione...</option>';
        lista.forEach(item => {
            // Tenta identificar o campo ID (pode ser id, idcomarca, etc)
            const id = item.id || item.idcomarca || item.idtribunal || item.idvara || item.idinstancia || item.iddecisao || item.idestado;
            const texto = item.descricao || item.nome;
            const uf = item.uf ? ` (${item.uf})` : '';

            const opt = document.createElement("option");
            opt.value = id;
            opt.textContent = texto + uf;
            select.appendChild(opt);
        });

        if (valorSelecionado) select.value = valorSelecionado;

    } catch (error) {
        console.error(`Erro ao carregar ${elementId}`, error);
    }
}

async function carregarCidadesPorEstado(idEstado, cidadeSelecionadaId = null) {
    const selectCidade = document.getElementById("IdCidade");
    if (!idEstado) {
        selectCidade.innerHTML = '<option value="">Selecione o Estado primeiro</option>';
        return;
    }
    try {
        const res = await fetch(`/api/locais/cidades?idEstado=${idEstado}`);
        const cidades = await res.json();
        
        selectCidade.innerHTML = '<option value="">Selecione...</option>';
        cidades.forEach(cid => {
            const opt = document.createElement("option");
            opt.value = cid.idcidade;
            opt.textContent = cid.descricao;
            selectCidade.appendChild(opt);
        });

        if (cidadeSelecionadaId) selectCidade.value = cidadeSelecionadaId;

    } catch (error) {
        console.error("Erro ao carregar cidades", error);
    }
}

// --- CARREGAR DADOS DO PROCESSO ---

async function carregarDadosProcesso(id) {
    try {
        const res = await fetch(`/api/processos/${id}`);
        if (!res.ok) throw new Error("Processo não encontrado");
        const proc = await res.json();

        // Header e IDs
        document.getElementById("headerTitulo").textContent = `Processo ${proc.numprocesso || 'S/N'}`;
        /*document.getElementById("headerSubtitulo").textContent = proc.pasta || '';*/
        document.getElementById("IdProcesso").value = proc.idprocesso;

        // Campos de Texto
        document.getElementById("NumProcesso").value = proc.numprocesso || "";
        document.getElementById("Pasta").value = proc.pasta || "";
        document.getElementById("Obs").value = proc.obs || "";

        // Campos de Data (formato YYYY-MM-DD)
        if (proc.datainicial) document.getElementById("DataInicial").value = proc.datainicial.split("T")[0];
        if (proc.datasaida) document.getElementById("DataSaida").value = proc.datasaida.split("T")[0];

        // Selects Simples
        if(proc.idcomarca) document.getElementById("IdComarca").value = proc.idcomarca;
        if(proc.idtribunal) document.getElementById("IdTribunal").value = proc.idtribunal;
        if(proc.idvara) document.getElementById("IdVara").value = proc.idvara;
        if(proc.idinstancia) document.getElementById("IdInstancia").value = proc.idinstancia;
        if(proc.iddecisao) document.getElementById("IdDecisao").value = proc.iddecisao;

        // Estado e Cidade (Cascata)
        if (proc.cidades && proc.cidades.idestado) {
            const idEstado = proc.cidades.idestado;
            document.getElementById("selectEstado").value = idEstado;
            await carregarCidadesPorEstado(idEstado, proc.idcidade);
        }

        // --- PREENCHER TABELAS DAS ABAS ---
        preencherTabelaAndamentos(proc);
        preencherTabelaPrazos(proc);
        preencherTabelaDocumentos(proc);

    } catch (error) {
        console.error(error);
        alert("Erro ao carregar ficha: " + error.message);
    }
}

function preencherTabelaAndamentos(proc) {
    const tbody = document.querySelector("#tabelaAndamentos tbody");
    tbody.innerHTML = "";
    
    // FlatMap para pegar andamentos de todas as publicações
    const lista = proc.Publicacao?.flatMap(pub => 
        pub.Andamento?.map(and => ({ ...and, origem: pub.data_publicacao })) || []
    ) || [];

    // Ordenar por data decrescente
    lista.sort((a, b) => new Date(b.data_evento) - new Date(a.data_evento));

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Nenhum andamento.</td></tr>';
        return;
    }

    lista.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${formatarDataBR(item.data_evento)}</td>
            <td>${item.descricao || '-'}</td>
            <td><small class="text-muted">Pub: ${formatarDataBR(item.origem)}</small></td>
        `;
        tbody.appendChild(tr);
    });
}

function preencherTabelaPrazos(proc) {
    const tbody = document.querySelector("#tabelaPrazos tbody");
    tbody.innerHTML = "";
    
    const lista = proc.Publicacao?.flatMap(pub => pub.Prazo || []) || [];

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nenhum prazo.</td></tr>';
        return;
    }

    lista.forEach(prazo => {
        const tr = document.createElement("tr");
        const dataLimite = new Date(prazo.data_limite);
        const hoje = new Date();
        const vencido = dataLimite < hoje;
        const badge = vencido 
            ? '<span class="badge bg-danger">Vencido</span>' 
            : '<span class="badge bg-success">No Prazo</span>';

        tr.innerHTML = `
            <td>${prazo.descricao || 'Prazo Processual'}</td>
            <td>${formatarDataBR(prazo.data_limite)}</td>
            <td>${prazo.dias} dias</td>
            <td>${badge}</td>
        `;
        tbody.appendChild(tr);
    });
}

function preencherTabelaDocumentos(proc) {
    const tbody = document.querySelector("#tabelaDocumentos tbody");
    tbody.innerHTML = "";

    // Filtra publicações que têm upload_Documentos
    const docs = proc.Publicacao?.filter(pub => pub.upload_Documentos) || [];

    if (docs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Nenhum documento anexo.</td></tr>';
        return;
    }

    docs.forEach(pub => {
        const arq = pub.upload_Documentos;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><i class="fas fa-file-pdf text-danger me-2"></i> ${arq.nome_arquivo}</td>
            <td>${formatarDataBR(pub.data_publicacao)}</td>
            <td>
                <a href="${arq.url_publica}" target="_blank" class="btn btn-sm btn-outline-primary">
                    <i class="fas fa-download"></i> Baixar
                </a>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- SALVAR ---
window.salvarProcesso = async function() {
    const id = document.getElementById("IdProcesso").value;
    const body = {
        numprocesso: document.getElementById("NumProcesso").value,
        pasta: document.getElementById("Pasta").value,
        obs: document.getElementById("Obs").value,
        datainicial: document.getElementById("DataInicial").value || null,
        datasaida: document.getElementById("DataSaida").value || null,
        
        idcidade: document.getElementById("IdCidade").value || null,
        idcomarca: document.getElementById("IdComarca").value || null,
        idtribunal: document.getElementById("IdTribunal").value || null,
        idvara: document.getElementById("IdVara").value || null,
        idinstancia: document.getElementById("IdInstancia").value || null,
        iddecisao: document.getElementById("IdDecisao").value || null
    };

    const method = id ? "PUT" : "POST";
    const url = id ? `/api/processos/${id}` : "/api/processos";

    try {
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            alert("Salvo com sucesso!");
            window.location.href = "/processos";
        } else {
            const err = await res.json();
            alert("Erro ao salvar: " + (err.error || "Desconhecido"));
        }
    } catch (e) {
        console.error(e);
        alert("Erro de conexão.");
    }
};

function formatarDataBR(dataISO) {
    if (!dataISO) return "-";
    // Ajuste para não subtrair 1 dia devido ao fuso
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}