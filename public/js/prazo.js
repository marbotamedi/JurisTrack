import { formatarDataBR_SoData_UTC } from "/js/formatarData.js";

document.addEventListener("DOMContentLoaded", async () => {
const tbody = document.querySelector("#tabelaPrazos tbody");
tbody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';

try {
    // Chama a rota que criamos no Passo 1
    const res = await fetch("/processos/dados/todos-prazos");
    const dados = await res.json();
    
    tbody.innerHTML = "";

    if(dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-muted">Nenhum prazo encontrado.</td></tr>';
        return;
    }

    dados.forEach(d => {
        // Link para gerar petição (igual ao modal antigo)
        const linkGerar = `/gerarPeticao?publicacaoId=${d.publicacao_id}&voltarPara=prazos`;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="fw-bold text-primary">${d.num_processo}</td>
            <td>${formatarDataBR_SoData_UTC(d.data_publicacao)}</td>
            <td><span class="badge bg-secondary">${d.dias} dias</span></td>
            <td class="fw-bold ${verificarUrgencia(d.data_limite)}">${formatarDataBR_SoData_UTC(d.data_limite)}</td>
            <td>
                    <a href="${linkGerar}" class="btn btn-success btn-sm" title="Gerar Petição">
                    <i class="fas fa-gavel"></i> Gerar Petição
                    </a>
            </td>
        `;
        tbody.appendChild(tr);
    });

} catch (error) {
    console.error(error);
    tbody.innerHTML = '<tr><td colspan="5" class="text-danger">Erro ao carregar prazos.</td></tr>';
}
});

function verificarUrgencia(dataLimite) {
    if(!dataLimite) return "";
    const hoje = new Date().toISOString().split('T')[0];
    if (dataLimite < hoje) return "text-danger"; // Vencido
    if (dataLimite === hoje) return "text-warning"; // Vence hoje
    return "text-success";
}