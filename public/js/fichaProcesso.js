document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    // Se tiver ID, carrega dados. Se não, é "Novo Processo".
    if (id) {
        await carregarDadosProcesso(id);
    } else {
        // Carrega combos vazios para criação
        // await carregarEstados(); 
    }
});

async function carregarDadosProcesso(id) {
    try {
        const res = await fetch(`/api/processos/${id}`);
        if(!res.ok) throw new Error("Erro ao buscar processo");
        const proc = await res.json();

        document.getElementById("headerTitulo").textContent = `Processo ${proc.numprocesso || ''}`;
        document.getElementById("headerSubtitulo").textContent = proc.pasta || 'Sem descrição';
        document.getElementById("Idprocesso").value = proc.idProcesso;

        // Preencher Campos Básicos
        document.getElementById("NumProcesso").value = proc.numprocesso || "";
        document.getElementById("Pasta").value = proc.pasta || "";
        document.getElementById("Obs").value = proc.Obs || "";
        
        // Aqui você adicionaria a lógica para setar os Selects (Cidade, Comarca, etc)
        // Isso exige carregar as listas de opções e depois selecionar o value correto.

    } catch (error) {
        alert(error.message);
    }
}

async function salvarProcesso() {
    const id = document.getElementById("IdProcesso").value;
    const body = {
        NumProcesso: document.getElementById("NumProcesso").value,
        Pasta: document.getElementById("Pasta").value,
        Obs: document.getElementById("Obs").value,
        // Adicione os IDs dos selects aqui
    };

    const method = id ? "PUT" : "POST";
    const url = id ? `/api/processos/${id}` : "/api/processos";

    try {
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        if(res.ok) {
            alert("Processo salvo com sucesso!");
            if(!id) window.location.href = "/html/processos.html"; // Volta pra lista se for novo
        } else {
            alert("Erro ao salvar");
        }
    } catch(e) {
        console.error(e);
    }
}