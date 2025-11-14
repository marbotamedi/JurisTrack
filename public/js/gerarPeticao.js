// --- Seletores de Elementos ---
const selectModelo = document.getElementById("selectModelo");
const divFormularioDinamico = document.getElementById("formularioDinamico");
const btnGerarDocumento = document.getElementById("btnGerarDocumento");
const textResultadoFinal = document.getElementById("resultadoFinal");

// --- Variáveis Globais ---
let conteudoTemplate = ""; // Armazena o HTML/Texto do modelo
let variaveisUnicas = []; // Armazena os nomes das variáveis (ex: "VARA")

/**
 * 1. Carrega a lista de modelos no dropdown
 */
async function carregarModelosDropdown() {
  try {
    const response = await fetch("/modelos"); // Rota GET /modelos
    if (!response.ok) throw new Error("Falha ao buscar modelos.");
    
    const modelos = await response.json();

    selectModelo.innerHTML = '<option value="">-- Selecione um modelo --</option>'; // Limpa o "Carregando"

    modelos.forEach(modelo => {
      const option = document.createElement("option");
      option.value = modelo.id;
      option.textContent = modelo.titulo;
      selectModelo.appendChild(option);
    });

  } catch (error) {
    console.error(error);
    selectModelo.innerHTML = '<option value="">Erro ao carregar modelos</option>';
  }
}

/**
 * 2. Busca o modelo completo quando o usuário seleciona
 */
async function buscarModeloCompleto(id) {
  if (!id) {
    // Esconde tudo se o usuário "limpar" a seleção
    divFormularioDinamico.style.display = "none";
    btnGerarDocumento.style.display = "none";
    textResultadoFinal.value = "";
    conteudoTemplate = "";
    return;
  }

  try {
    const response = await fetch(`/modelos/${id}`); // Rota GET /modelos/:id
    if (!response.ok) throw new Error("Falha ao buscar conteúdo do modelo.");

    const modelo = await response.json();
    conteudoTemplate = modelo.conteudo || ""; // Salva o conteúdo do template

    // 3. Extrai as variáveis usando Regex
    // Esta Regex (Expressão Regular) encontra {{qualquer_coisa_aqui}}
    const regex = /{{\s*([\w_]+)\s*}}/g;
    
    // .matchAll() encontra todas as ocorrências
    // Usamos Set para garantir que cada variável apareça só uma vez no formulário
    const matches = [...conteudoTemplate.matchAll(regex)];
    variaveisUnicas = [...new Set(matches.map(match => match[1]))]; // Pega só o nome (ex: "VARA")

    // 4. Gera o formulário
    gerarFormularioDinamico(variaveisUnicas);

  } catch (error) {
    console.error(error);
    alert("Erro ao carregar o template: " + error.message);
  }
}

/**
 * 4. Gera o formulário dinamicamente
 */
function gerarFormularioDinamico(variaveis) {
  divFormularioDinamico.innerHTML = '<h5 class="mb-3">Preencha os dados:</h5>'; // Limpa o form

  if (variaveis.length === 0) {
    divFormularioDinamico.innerHTML += "<p>Este modelo não possui campos para preenchimento.</p>";
  }

  variaveis.forEach(nomeVariavel => {
    const inputId = `input_${nomeVariavel}`;
    
    // Substitui _ por espaço e capitaliza para o <label>
    const labelTexto = nomeVariavel.replace(/_/g, " ");

    const divGroup = document.createElement("div");
    divGroup.className = "mb-3";
    divGroup.innerHTML = `
      <label for="${inputId}" class="form-label">${labelTexto}</label>
      <input type="text" class="form-control" id="${inputId}" data-variavel="${nomeVariavel}">
    `;
    divFormularioDinamico.appendChild(divGroup);
  });

  // Mostra o formulário e o botão
  divFormularioDinamico.style.display = "block";
  btnGerarDocumento.style.display = "block";
}

/**
 * 5. Gera o documento final ao clicar no botão
 */
function gerarDocumentoFinal() {
  let textoFinal = conteudoTemplate;

  // Pega todos os inputs que criamos
  const inputs = divFormularioDinamico.querySelectorAll("input[data-variavel]");

  inputs.forEach(input => {
    const nomeVariavel = input.dataset.variavel; // Ex: "NOME_CLIENTE"
    const valor = input.value;

    // Cria uma Regex global para substituir TODAS as ocorrências de {{VARIAVEL}}
    const regex = new RegExp(`{{\\s*${nomeVariavel}\\s*}}`, "g");
    
    textoFinal = textoFinal.replace(regex, valor);
  });

  // Mostra o resultado final
  textResultadoFinal.value = textoFinal;
}

// --- Event Listeners ---

// 1. Carrega os modelos assim que a página abre
document.addEventListener("DOMContentLoaded", carregarModelosDropdown);

// 2. Busca o modelo quando o usuário muda o dropdown
selectModelo.addEventListener("change", () => {
  buscarModeloCompleto(selectModelo.value);
});

// 3. Gera o documento quando o usuário clica no botão
btnGerarDocumento.addEventListener("click", gerarDocumentoFinal);