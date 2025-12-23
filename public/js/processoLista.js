document.addEventListener("DOMContentLoaded", () => {
    carregarProcessos();
});

const buscaInput = document.getElementById('buscaInput');
if (buscaInput) {
    buscaInput.addEventListener('keyup', (e) => {
        if(e.key === 'Enter') carregarProcessos(e.target.value);
    });
}

async function carregarProcessos(termo = "") {
    const tbody = document.getElementById("tabelaProcessosBody");
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Buscando...</td></tr>';

    try {
        let url = `/api/processos`; 
        if(termo) url += `?busca=${encodeURIComponent(termo)}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text(); 
            throw new Error(errorText || response.statusText);
        }

        const processos = await response.json();

        tbody.innerHTML = "";
        const totalEl = document.getElementById("totalResultados");
        if(totalEl) totalEl.textContent = processos.length;

        if (processos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhum processo encontrado.</td></tr>';
            return;
        }

        processos.forEach(p => {
        const tr = document.createElement("tr");
        /*tr.onclick = () => window.location.href = `/html/fichaProcesso.html?id=${p.idprocesso}`;*/
        
        // Tratamento seguro dos objetos (?. check se é nulo)
        const nomeAutor = p.autor?.nome || 'não informado';
        const nomeReu = p.reu?.nome || 'não informado';
        const descSituacao = p.situacao?.descricao || 'não informado';
        const nomeComarca = p.comarcas?.descricao;
        /*const ufEstado = p.cidades?.estados?.uf;

        /*let textoLocal = '<span class="text-muted small">Não Informado</span>';

        if (nomeComarca && ufEstado) {
            textoLocal = `${nomeComarca} / ${ufEstado}`;
        } else if (nomeComarca) {
            textoLocal = `${nomeComarca}`; // Só Comarca
        } else if (ufEstado) {
            textoLocal = `- / ${ufEstado}`; // Só UF
        }*/
        
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
                <td>${nomeAutor}</td>
                <td>${nomeReu}</td>
                <td class="text-center"><span class="badge ${badgeClass} rounded-pill">${descSituacao}</span></td>
                <td>${nomeComarca || 'não informado'}</td>
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
        tbody.innerHTML = `<tr><td colspan="5" class="text-danger">Erro: ${error.message.substring(0, 100)}...</td></tr>`;
    }
}

// Função auxiliar para pastas locais (Fallback)
window.copiarCaminho = function(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        alert("Caminho local copiado para a área de transferência:\n" + texto);
    }).catch(err => console.error('Erro ao copiar:', err));
};