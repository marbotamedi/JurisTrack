import { formatarDataBR } from "/js/formatarData.js";

document.addEventListener("DOMContentLoaded", () => {
    carregarHistorico();
    inicializarTinyMCE();
});

// Configuração do TinyMCE (Igual ao da geração)
function inicializarTinyMCE() {
    tinymce.init({
        selector: '#editorConteudo',
        language: 'pt_BR',
        height: 600,
        menubar: false,
        elementpath: false,
        plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
        toolbar: 'undo redo | fontfamily fontsize | bold italic underline | align lineheight | numlist bullist indent outdent | removeformat',
        content_style: `body { font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.5; }`
    });
}

// 1. Carregar a lista do backend
async function carregarHistorico() {
    const tbody = document.querySelector("#tabelaHistorico tbody");
    try {
        const res = await fetch("/peticoes-finalizadas"); // Rota GET
        if (!res.ok) throw new Error("Erro ao buscar histórico");
        
        const dados = await res.json();
        console.log(dados);
        tbody.innerHTML = "";

        if (dados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nenhuma petição gerada.</td></tr>';
            return;
        }

        dados.forEach(item => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${formatarDataBR(item.data_criacao)}</td>
                <td><strong>${item.num_processo}</strong></td>
                <td>${item.modelo}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-primary btn-abrir" 
                        data-id="${item.id}"
                        data-pub="${item.publicacao_id}"
                        data-modelo="${item.modelo}">
                        <i class="fas fa-edit me-1"></i> Ver/Editar
                    </button>
                </td>
            `;
            
            // O conteúdo HTML pode ser grande, então guardamos no objeto DOM da linha ou buscamos novamente
            // Aqui vamos armazenar no dataset de forma codificada ou buscar do array 'dados' pelo ID
            const btn = tr.querySelector(".btn-abrir");
            btn.onclick = () => abrirEditor(item); // Passa o objeto completo

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Erro: ${error.message}</td></tr>`;
    }
}

// 2. Abrir o Modal com o conteúdo
const modalEditor = new bootstrap.Modal(document.getElementById('editorModal'));

function abrirEditor(item) {
    document.getElementById("editPublicacaoId").value = item.publicacao_id;
    document.getElementById("editModeloNome").value = item.modelo;
    
    // Define o conteúdo no TinyMCE
    if (tinymce.get("editorConteudo")) {
        tinymce.get("editorConteudo").setContent(item.conteudo || "");
    }
    
    modalEditor.show();
}

// 3. Salvar Nova Versão (Cria nova linha no banco)
document.getElementById("btnSalvarNovaVersao").addEventListener("click", async function() {
    const btn = this;
    const conteudo = tinymce.get("editorConteudo").getContent();
    const pubId = document.getElementById("editPublicacaoId").value;
    const modelo = document.getElementById("editModeloNome").value;

    if(!conteudo) return alert("Conteúdo vazio.");

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

        const res = await fetch("/peticoes-finalizadas", {
            method: "POST", // POST cria novo registro
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                publicacao_id: pubId,
                conteudo_final: conteudo,
                modelo_utilizado: modelo
            })
        });

        if(!res.ok) throw new Error("Erro ao salvar.");
        
        alert("Alteração salva como um novo registro no histórico!");
        modalEditor.hide();
        carregarHistorico(); // Atualiza a lista para mostrar o novo item

    } catch (e) {
        alert(e.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save me-1"></i> Salvar Alteração (Novo Registro)';
    }
});

// 4. Imprimir
document.getElementById("btnImprimir").addEventListener("click", () => {
    const conteudo = tinymce.get("editorConteudo").getContent();
    const win = window.open('', '', 'height=700,width=900');
    win.document.write('<html><head><title>Imprimir Petição</title>');
    win.document.write('</head><body>');
    win.document.write(conteudo);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
});