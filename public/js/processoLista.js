document.addEventListener("DOMContentLoaded", () => {
    carregarFiltros(); // Carrega as opções (Otimizado)
    carregarProcessos(); // Carrega a lista inicial
});

const buscaInput = document.getElementById('buscaInput');
const filtroSituacao = document.getElementById('filtroSituacao');
const filtroComarca = document.getElementById('filtroComarca');

// Adiciona eventos para recarregar ao mudar qualquer filtro
if (buscaInput) {
    buscaInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') carregarProcessos();
    });
}

if (filtroSituacao) {
    filtroSituacao.addEventListener('change', () => carregarProcessos());
}

if (filtroComarca) {
    filtroComarca.addEventListener('change', () => carregarProcessos());
}

// --- FUNÇÃO OTIMIZADA COM PROMISE.ALL ---
async function carregarFiltros() {
    const token = localStorage.getItem("juristrack_token");
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    try {
        // Dispara as requisições em PARALELO
        const [resSituacoes, resComarcas] = await Promise.all([
            fetch('/api/auxiliares/situacoes', { headers }),
            fetch('/api/auxiliares/comarcas', { headers })
        ]);

        // 1. Processa Situações
        if (resSituacoes.ok) {
            const situacoes = await resSituacoes.json();
            let options = '<option value="">Todas</option>';
            situacoes.forEach(s => {
                options += `<option value="${s.idsituacao}">${s.descricao}</option>`;
            });
            if (filtroSituacao) filtroSituacao.innerHTML = options;
        }

        // 2. Processa Comarcas
        if (resComarcas.ok) {
            const comarcas = await resComarcas.json();
            let options = '<option value="">Todas</option>';
            comarcas.forEach(c => {
                options += `<option value="${c.idcomarca}">${c.descricao}</option>`;
            });
            if (filtroComarca) filtroComarca.innerHTML = options;
        }

    } catch (error) {
        console.error("Erro ao carregar filtros:", error);
    }
}

async function carregarProcessos() {
    const tbody = document.getElementById("tabelaProcessosBody");
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Buscando...</td></tr>';

    try {
        const termo = buscaInput ? buscaInput.value : "";
        const idSituacao = filtroSituacao ? filtroSituacao.value : "";
        const idComarca = filtroComarca ? filtroComarca.value : "";

        const params = new URLSearchParams();
        if (termo) params.append('busca', termo);
        if (idSituacao) params.append('situacao', idSituacao);
        if (idComarca) params.append('comarca', idComarca);

        let url = `/api/processos?${params.toString()}`;

        const token = localStorage.getItem("juristrack_token");
        if (!token) {
            window.location.href = "/login";
            return;
        }

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || response.statusText);
        }

        const processos = await response.json();

        tbody.innerHTML = "";
        const totalEl = document.getElementById("totalResultados");
        if (totalEl) totalEl.textContent = processos.length;

        if (processos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhum processo encontrado.</td></tr>';
            return;
        }

        processos.forEach(p => {
            const tr = document.createElement("tr");

            const autores = p.partes?.filter(x => x.tipo_parte === 'Autor').map(x => x.pessoas?.nome).join(', ') || 'não informado';
            const reus = p.partes?.filter(x => x.tipo_parte === 'Réu').map(x => x.pessoas?.nome).join(', ') || 'não informado';
            const descSituacao = p.situacao?.descricao || 'não informado';
            const nomeComarca = p.comarcas?.descricao || 'não informado';

            let badgeClass = 'bg-secondary';
            if (descSituacao === 'Ativo') badgeClass = 'bg-primary';
            if (descSituacao === 'Arquivado') badgeClass = 'bg-success';
            if (descSituacao === 'Suspenso') badgeClass = 'bg-warning text-dark';

            tr.innerHTML = `
                <td>
                    <a href="/html/fichaProcesso.html?id=${p.idprocesso}&modo=leitura" 
                       class="fw-bold text-primary text-decoration-none" 
                       style="font-family: monospace;" 
                       title="Visualizar (Somente Leitura)">
                        ${p.numprocesso || 'S/N'}
                    </a>
                </td>
                <td>${p.assunto || 'não informado'}</td>
                <td>${autores}</td>
                <td>${reus}</td>
                <td class="text-center"><span class="badge ${badgeClass} rounded-pill">${descSituacao}</span></td>
                <td>${nomeComarca}</td>
                <td class="text-end">
                    <a href="/html/fichaProcesso.html?id=${p.idprocesso}" 
                       class="btn btn-sm btn-outline-secondary border-0" 
                       title="Editar Processo">
                        <i class="far fa-eye"></i>
                    </a>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="7" class="text-danger">Erro: ${error.message.substring(0, 100)}...</td></tr>`;
    }
}