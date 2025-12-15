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
            
            // Clique na linha abre a ficha do processo
            tr.onclick = () => window.location.href = `/html/fichaProcesso.html?id=${p.idprocesso}`;
            
            // --- Lógica da Coluna Pasta/Link ---
            let conteudoPasta;
            const dadoPasta = p.pasta ? p.pasta.trim() : "";

            if (dadoPasta !== "") {
                // Verifica se é um Link Web (http ou https)
                const isUrl = dadoPasta.match(/^https?:\/\//i);
                
                if (isUrl) {
                    // === É UM LINK (SUPABASE/WEB) ===
                    conteudoPasta = `
                        <div class="d-flex align-items-center gap-2">
                            <a href="${dadoPasta}" target="_blank" 
                               onclick="event.stopPropagation();" 
                               class="text-decoration-none" 
                               title="Abrir arquivo">
                                <i class="fas fa-file-pdf text-danger fa-lg"></i> 
                            </a>
                            
                        </div>
                    `;
                } else {
                    // === É UMA PASTA LOCAL ===
                    // Escapa barras para JS
                    const caminhoJS = dadoPasta.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                    
                    conteudoPasta = `
                        <div class="d-flex align-items-center gap-2">
                            <i class="fas fa-folder text-warning fa-lg" 
                               style="cursor: pointer;" 
                               title="Caminho local: ${dadoPasta}"
                               onclick="event.stopPropagation(); copiarCaminho('${caminhoJS}')">
                            </i>
                            
                        </div>
                    `;
                }
            } else {
                conteudoPasta = p.descricao || '-';
            }

            tr.innerHTML = `
                <td class="fw-bold text-primary">${p.numprocesso || 'Sem número'}</td>
                <td>${p.descricao || '-'}</td>
                <td>${conteudoPasta}</td>
                <td>${p.comarcas?.descricao || '-'}</td>
                <td>${p.cidades?.descricao || '-'}</td>
                <td class="text-center"><i class="far fa-eye text-secondary"></i></td>
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