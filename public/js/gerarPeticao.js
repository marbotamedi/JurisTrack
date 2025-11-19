// --- Seletores de Elementos ---
const selectModelo = document.getElementById("selectModelo");
const divPainelDeDados = document.getElementById("painelDeDados");
const pPainelCarregando = document.getElementById("painelDadosCarregando");

// BOTÕES
const btnSalvarDocumento = document.getElementById("btnSalvarDocumento");
const btnImprimirDocumento = document.getElementById("btnImprimirDocumento");

// --- Variáveis Globais ---
let conteudoTemplate = "";
let dadosProcessoGlobal = {};
let publicacaoId = null;

document.addEventListener("DOMContentLoaded", async () => {
  console.log(">>> VERSÃO NOVA CARREGADA: ARIAL 14PX FORÇADO <<<"); // Se ler isso no F12, funcionou
  inicializarTinyMCE();
  await carregarContextoDoProcesso();
  carregarModelosDropdown();
});

/**
 * Configura e inicia o editor TinyMCE com FORÇA BRUTA (Arial 14px)
 */
function inicializarTinyMCE() {
  tinymce.init({
    selector: "#resultadoFinal",
    language: "pt_BR",

    // --- CONFIGURAÇÃO VISUAL NUCLEAR ---
    // O asterisco (*) obriga TODOS os elementos a usarem Arial 14px
    content_style: `
      * { 
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 14px !important;
        color: #000000 !important;
      }
      body { 
        margin: 20px !important;
        line-height: 1.3 !important; 
      }
      p { 
        margin-bottom: 10px !important; 
        margin-top: 0 !important; 
        padding: 0 !important;
      }
      /* Esconde tags de código se sobrarem */
      pre { 
        white-space: pre-wrap !important;
        background: transparent !important;
        border: none !important;
        padding: 0 !important;
      }
    `,

    paste_as_text: true,
    forced_root_block: "p",

    plugins:
      "anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount",
    toolbar:
      "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat",

    height: 500,
    menubar: false,

    setup: function (editor) {
      editor.on("init", function () {
        configurarDropInteligente(editor);
      });
    },
  });
}

function configurarDropInteligente(editor) {
  editor.on("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  });

  editor.on("drop", (e) => {
    const rawJson = e.dataTransfer.getData("application/x-juristrack");

    if (rawJson) {
      e.preventDefault();
      e.stopPropagation();

      try {
        const data = JSON.parse(rawJson);
        const chaveArrastada = data.key;
        const valor = data.value;

        if (!valor) return false;

        const substituiu = substituirVariavelSobCursor(editor, valor);

        if (!substituiu && chaveArrastada) {
          const conteudoAtual = editor.getContent();
          const regexGlobal = new RegExp(`{{\\s*${chaveArrastada}\\s*}}`, "gi");

          if (regexGlobal.test(conteudoAtual)) {
            const novoConteudo = conteudoAtual.replace(regexGlobal, valor);
            editor.setContent(novoConteudo);
          } else {
            editor.execCommand("mceInsertContent", false, valor);
          }
        } else if (!substituiu) {
          editor.execCommand("mceInsertContent", false, valor);
        }
      } catch (err) {
        console.error("Erro Drop:", err);
      }
      return false;
    }
  });
}

function substituirVariavelSobCursor(editor, novoValor) {
  const rng = editor.selection.getRng();
  if (!rng || !rng.commonAncestorContainer) return false;

  let node = rng.commonAncestorContainer;
  if (node.nodeType !== 3) return false;

  const textoCompleto = node.nodeValue;
  if (!textoCompleto) return false;

  const cursorOffset = rng.startOffset;
  const regexVariavel = /{{\s*[\w-]+\s*}}/g;
  let match;

  while ((match = regexVariavel.exec(textoCompleto)) !== null) {
    const inicio = match.index;
    const fim = regexVariavel.lastIndex;

    if (cursorOffset >= inicio && cursorOffset <= fim) {
      const novoRange = document.createRange();
      novoRange.setStart(node, inicio);
      novoRange.setEnd(node, fim);
      editor.selection.setRng(novoRange);
      editor.insertContent(novoValor);
      return true;
    }
  }
  return false;
}

async function carregarContextoDoProcesso() {
  const urlParams = new URLSearchParams(window.location.search);
  publicacaoId = urlParams.get("publicacaoId");

  if (!publicacaoId) {
    pPainelCarregando.textContent = "Modo manual.";
    return;
  }

  try {
    const response = await fetch(`/process-data/${publicacaoId}`);
    if (!response.ok) throw new Error("Erro API");
    dadosProcessoGlobal = await response.json();

    if (Object.keys(dadosProcessoGlobal).length > 0) {
      renderizarPainelDados(dadosProcessoGlobal);
    } else {
      pPainelCarregando.textContent = "Sem dados.";
    }
  } catch (error) {
    console.error(error);
  }
}

function renderizarPainelDados(data) {
  pPainelCarregando.style.display = "none";
  divPainelDeDados.innerHTML =
    '<h6 class="mb-3 text-muted">Arraste para editar:</h6>';

  Object.entries(data).forEach(([key, value]) => {
    const label = key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    const div = document.createElement("div");
    div.className = "alert alert-secondary p-2 mb-2 data-item";
    div.setAttribute("draggable", true);
    div.style.cursor = "grab";

    div.innerHTML = `
      <strong class="d-block text-dark">${label}</strong>
      <span class="badge bg-light text-dark border mb-1" style="font-size:0.7em">{{${key.toUpperCase()}}}</span>
      <div class="text-muted small text-truncate">${value}</div>
    `;

    div.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", " ");
      e.dataTransfer.setData(
        "application/x-juristrack",
        JSON.stringify({ key, value })
      );
      e.dataTransfer.effectAllowed = "copy";
    });

    divPainelDeDados.appendChild(div);
  });
}

async function carregarModelosDropdown() {
  try {
    const r = await fetch("/modelos");
    const m = await r.json();
    selectModelo.innerHTML = '<option value="">-- Selecione --</option>';
    m.forEach((mod) => {
      const opt = document.createElement("option");
      opt.value = mod.id;
      opt.textContent = mod.titulo;
      selectModelo.appendChild(opt);
    });
  } catch (e) {
    console.error(e);
  }
}

async function buscarModeloCompleto(id) {
  const editor = tinymce.get("resultadoFinal");
  if (!editor || !id) return;

  try {
    editor.setProgressState(true);
    const response = await fetch(`/modelos/${id}`);
    const modelo = await response.json();
    let texto = modelo.conteudo || "";

    // --- LIMPEZA AGRESSIVA DO HTML ---
    // 1. Substitui quebras de linha do banco por <br> se não tiver HTML
    if (!texto.includes("<p") && !texto.includes("<div")) {
      texto = texto.replace(/\n/g, "<br>");
    }

    // 2. Remove formatações conflitantes
    texto = texto.replace(/<\/?pre[^>]*>/gi, ""); // Remove tags de código
    texto = texto.replace(/<\/?span[^>]*>/gi, ""); // Remove spans
    texto = texto.replace(/font-family:[^;]+;/gi, ""); // Remove fontes inline
    texto = texto.replace(/font-size:[^;]+;/gi, ""); // Remove tamanhos inline

    if (dadosProcessoGlobal) {
      Object.entries(dadosProcessoGlobal).forEach(([key, valor]) => {
        if (valor) {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
          texto = texto.replace(regex, valor);
        }
      });
    }

    editor.setContent(texto);
    editor.execCommand("RemoveFormat"); // Última tentativa de limpar visualmente
    editor.setProgressState(false);
  } catch (error) {
    console.error(error);
    editor.setProgressState(false);
  }
}

selectModelo.addEventListener("change", () =>
  buscarModeloCompleto(selectModelo.value)
);

if (btnImprimirDocumento) {
  btnImprimirDocumento.addEventListener("click", () => {
    const editor = tinymce.get("resultadoFinal");
    if (editor) {
      const win = window.open("", "", "height=700,width=900");
      win.document.write(editor.getContent());
      win.print();
      win.close();
    }
  });
}

if (btnSalvarDocumento) {
  btnSalvarDocumento.addEventListener("click", async () => {
    const editor = tinymce.get("resultadoFinal");
    const conteudo = editor.getContent();
    if (!conteudo.trim()) return alert("Vazio");

    try {
      btnSalvarDocumento.innerHTML = "Salvando...";
      btnSalvarDocumento.disabled = true;
      const res = await fetch("/peticoes-finalizadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicacao_id: publicacaoId,
          conteudo_final: conteudo,
        }),
      });
      if (!res.ok) throw new Error("Erro");
      alert("Salvo!");
    } catch (e) {
      alert(e.message);
    } finally {
      btnSalvarDocumento.disabled = false;
      btnSalvarDocumento.innerHTML =
        '<i class="fas fa-save"></i> Salvar no Supabase';
    }
  });
}