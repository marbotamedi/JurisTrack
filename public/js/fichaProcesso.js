document.addEventListener("DOMContentLoaded", async () => {
    // 1. Carrega Combos Auxiliares em paralelo para performance
    await Promise.all([
        carregarSelect("/api/locais/estados", "selectEstado"),
        carregarSelect("/api/auxiliares/comarcas", "IdComarca"),
        carregarSelect("/api/auxiliares/tribunais", "IdTribunal"),
        carregarSelect("/api/auxiliares/varas", "IdVara"),
        carregarSelect("/api/auxiliares/decisoes", "IdDecisao"),
        carregarSelect("/api/auxiliares/tipos_acao", "id_tipo_acao"), // Corrigido ID
        carregarSelect("/api/auxiliares/ritos", "id_rito"),
        carregarSelect("/api/auxiliares/esferas", "id_esfera"),
        carregarSelect("/api/auxiliares/fases", "id_fase"),
        carregarSelect("/api/auxiliares/situacoes", "id_situacao"),
        carregarSelect("/api/auxiliares/probabilidades", "id_probabilidade"),
        carregarSelect("/api/auxiliares/moedas", "id_moeda"),
        carregarPessoas()
    ]);

    // 2. Verifica se tem ID na URL para editar
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (id) {
        document.getElementById("btnExcluir").style.display = "inline-block";
        document.getElementById("headerTitulo").textContent = "Editar Processo";
        await carregarDadosProcesso(id);
    }
});

// Listener para mudar Cidades ao mudar Estado
document.getElementById("selectEstado").addEventListener("change", (e) => {
    carregarCidadesPorEstado(e.target.value);
});

// Atualiza a tabela de partes quando os selects mudam
document.getElementById("id_autor").addEventListener("change", atualizarTabelaPartes);
document.getElementById("id_reu").addEventListener("change", atualizarTabelaPartes);

// --- FUNÇÕES DE CARREGAMENTO ---

async function carregarPessoas() {
    try {
        const res = await fetch("/api/pessoas");
        const pessoas = await res.json();
        
        // Popula os 3 selects com a mesma lista de pessoas
        ['id_autor', 'id_reu', 'id_advogado'].forEach(elemId => {
            const select = document.getElementById(elemId);
            if(!select) return;
            select.innerHTML = '<option value="">Selecione...</option>';
            pessoas.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.idpessoa || p.id; // Verifica qual campo ID vem da API
                opt.textContent = p.nome + (p.cpf_cnpj ? ` (${p.cpf_cnpj})` : '');
                // Guarda dados no dataset para montar a tabela sem nova requisição
                opt.dataset.cpf = p.cpf_cnpj || '';
                opt.dataset.nome = p.nome;
                select.appendChild(opt);
            });
        });
    } catch (e) {
        console.error("Erro ao carregar pessoas", e);
    }
}

async function carregarSelect(url, elementId) {
    const select = document.getElementById(elementId);
    if (!select) return;
    try {
        const res = await fetch(url);
        const lista = await res.json();
        select.innerHTML = '<option value="">Selecione...</option>';
        lista.forEach(item => {
            // Lógica para pegar o ID correto independente do nome da tabela
            const id = Object.values(item)[0]; // Pega o primeiro valor (geralmente o ID UUID)
            const texto = item.descricao || item.nome;
            
            const opt = document.createElement("option");
            opt.value = id;
            opt.textContent = texto;
            select.appendChild(opt);
        });
    } catch (error) { console.error(`Erro ${elementId}`, error); }
}

async function carregarCidadesPorEstado(idEstado, cidadeId = null) {
    const sel = document.getElementById("IdCidade");
    if(!idEstado) { sel.innerHTML = '<option value="">Selecione Estado...</option>'; return; }
    try {
        const res = await fetch(`/api/locais/cidades?idEstado=${idEstado}`); // Verifique se sua API aceita filtro por query
        // Se a API não filtrar, filtra no front (menos performático mas funcional)
        const listaTotal = await res.json();
        const lista = listaTotal.filter(c => c.idestado === idEstado); // Filtro manual se necessario
        
        sel.innerHTML = '<option value="">Selecione...</option>';
        lista.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.idcidade;
            opt.textContent = c.descricao;
            sel.appendChild(opt);
        });
        if(cidadeId) sel.value = cidadeId;
    } catch(e) {}
}

async function carregarDadosProcesso(id) {
    try {
        const res = await fetch(`/api/processos/${id}`);
        if (!res.ok) throw new Error("Erro ao buscar processo");
        const proc = await res.json();
        

        // Header
        document.getElementById("headerNumProcesso").textContent = proc.numprocesso || "Sem Número";

        // IDs Principais
        document.getElementById("IdProcesso").value = proc.idprocesso;
        document.getElementById("NumProcesso").value = proc.numprocesso || "";
        document.getElementById("ClasseProcessual").value = proc.classe_processual || "";
        document.getElementById("Assunto").value = proc.assunto || "";
        document.getElementById("ValorCausa").value = proc.valor_causa || "";
        document.getElementById("Obs").value = proc.obs || ""; // Notas Internas
        
        // Helper para setar valor
        const setVal = (eid, val) => { 
            const el = document.getElementById(eid);
            if(el) el.value = val || ""; 
        };
        
        setVal("id_tipo_acao", proc.idtipoacao); // Note: schema usa idtipoacao (sem underscore no banco, mas checkar retorno da API)
        setVal("id_rito", proc.idrito);
        setVal("id_esfera", proc.idesfera);
        setVal("id_fase", proc.idfase);
        setVal("id_situacao", proc.idsituacao);
        setVal("id_probabilidade", proc.idprobabilidade);
        setVal("id_moeda", proc.idmoeda);
        setVal("IdComarca", proc.idcomarca);
        setVal("IdVara", proc.idvara);

        // Pessoas
        setVal("id_autor", proc.idautor);
        setVal("id_reu", proc.idreu);
        setVal("id_advogado", proc.idadvogado);
        
        // Atualiza tabela visual de partes
        atualizarTabelaPartes();

        if (proc.data_distribuicao) document.getElementById("DataDistribuicao").value = proc.data_distribuicao.split("T")[0];

        // Estado e Cidade (Cascata)
        if (proc.cidades && proc.cidades.idestado) {
            document.getElementById("selectEstado").value = proc.cidades.idestado;
            await carregarCidadesPorEstado(proc.cidades.idestado, proc.idcidade);
        } else if (proc.idcidade) {
            // Caso tenha cidade mas o join não trouxe estado
             setVal("IdCidade", proc.idcidade);
        }
        
    } catch (error) {
        console.error(error);
        alert("Erro ao carregar dados do processo.");
    }
}

// Simula a Tabela de Partes usando os selects ocultos
function atualizarTabelaPartes() {
    const tbody = document.getElementById("tabelaPartesBody");
    tbody.innerHTML = "";

    const addRow = (tipo, selectId) => {
        const select = document.getElementById(selectId);
        if(select && select.selectedIndex > 0) {
            const opt = select.options[select.selectedIndex];
            const nome = opt.dataset.nome || opt.text;
            const cpf = opt.dataset.cpf || "-";
            
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><span class="badge ${tipo === 'Autor' ? 'bg-primary' : 'bg-danger'}">${tipo}</span></td>
                <td>${nome}</td>
                <td>${cpf}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="alert('Edição rápida indisponível')"><i class="fas fa-pen"></i></button>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="document.getElementById('${selectId}').value=''; atualizarTabelaPartes();"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        }
    };

    addRow("Autor", "id_autor");
    addRow("Réu", "id_reu");
    
    if(tbody.innerHTML === "") {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nenhuma parte cadastrada</td></tr>';
    }
}

window.salvarProcesso = async function() {
    const id = document.getElementById("IdProcesso").value;
    const val = (id) => { const el = document.getElementById(id); return el ? el.value : null; };

    // Mapeamento correto com o Schema do Banco (source: 20 tabela processos)
    const body = {
        numprocesso: val("NumProcesso"),
        classe_processual: val("ClasseProcessual"),
        assunto: val("Assunto"),
        valor_causa: val("ValorCausa") ? parseFloat(val("ValorCausa").replace(",", ".")) : null,
        data_distribuicao: val("DataDistribuicao"),
        obs: val("Obs"), // Notas Internas
        
        // FKs Auxiliares
        idtipoacao: val("id_tipo_acao"),
        idrito: val("id_rito"),
        idesfera: val("id_esfera"),
        idfase: val("id_fase"),
        idsituacao: val("id_situacao"),
        idprobabilidade: val("id_probabilidade"),
        idmoeda: val("id_moeda"),
        idcomarca: val("IdComarca"),
        idvara: val("IdVara"),
        idcidade: val("IdCidade"),

        // FKs Pessoas
        idautor: val("id_autor"),
        idreu: val("id_reu"),
        idadvogado: val("id_advogado")
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
            const data = await res.json();
            alert("Processo salvo com sucesso!");
            if(!id) {
                // Se for novo, redireciona para edição para carregar IDs
                window.location.href = `/html/fichaProcesso.html?id=${data[0].idprocesso}`; 
            }
        } else {
            const err = await res.json();
            alert("Erro ao salvar: " + (err.error || "Desconhecido"));
        }
    } catch (e) { alert("Erro de conexão"); console.error(e); }
};

window.excluirProcesso = async function() {
    if(!confirm("Tem certeza que deseja excluir este processo?")) return;
    const id = document.getElementById("IdProcesso").value;
    try {
        const res = await fetch(`/api/processos/${id}`, { method: "DELETE" });
        if(res.ok) {
            alert("Processo excluído.");
            window.location.href = "/processos";
        } else {
            alert("Erro ao excluir.");
        }
    } catch(e) { console.error(e); }
};