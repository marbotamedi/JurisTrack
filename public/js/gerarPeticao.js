// --- Seletores de Elementos ---
const selectModelo = document.getElementById("selectModelo");
const btnSalvarDocumento = document.getElementById("btnSalvarDocumento");
const btnImprimirDocumento = document.getElementById("btnImprimirDocumento");

// --- Variáveis Globais ---
let dadosProcessoGlobal = {};
let publicacaoId = null;

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", async () => {
  inicializarTinyMCE();
  await carregarContextoDoProcesso(); // 1. Baixa dados do processo para memória
  carregarModelosDropdown(); // 2. Carrega lista de modelos
  configurarBotaoVoltar(); // 3. Ajusta link de voltar
});

function configurarBotaoVoltar() {
  const params = new URLSearchParams(window.location.search);
  const arquivoParaVoltar = params.get("voltarPara");
  const btnVoltar = document.querySelector('a[href="/"]');
  if (btnVoltar && arquivoParaVoltar) {
    btnVoltar.href = `/?reabrirModal=${encodeURIComponent(arquivoParaVoltar)}`;
  }
}

/**
 * Configura TinyMCE (Arial 14px forçado para visualização padrão ABNT/Jurídica)
 */
function inicializarTinyMCE() {
  tinymce.init({
    selector: "#resultadoFinal",
    language: "pt_BR",
    content_style: `
      * { 
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 14px !important;
        color: #000000 !important;
      }
      body { 
        margin: 20px !important;
        line-height: 1.5 !important; 
      }
      p { margin-bottom: 10px !important; }
    `,
    paste_as_text: true, // Evita colar formatação externa suja
    forced_root_block: "p",
    plugins:
      "anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount",
    toolbar:
      "undo redo | blocks fontfamily fontsize | bold italic underline | align lineheight | numlist bullist indent outdent | removeformat",
    height: 650,
    menubar: false,
  });
}

/**
 * Busca os dados do processo via API e guarda em dadosProcessoGlobal.
 * Não renderiza nada na tela, apenas prepara os dados para o replace silencioso.
 */
async function carregarContextoDoProcesso() {
  const urlParams = new URLSearchParams(window.location.search);
  publicacaoId = urlParams.get("publicacaoId");

  if (!publicacaoId) return;

  try {
    const response = await fetch(`/process-data/${publicacaoId}`);
    if (!response.ok) throw new Error("Erro ao buscar dados do processo");

    dadosProcessoGlobal = await response.json();

    // Tratamento de Datas: Converte YYYY-MM-DD para DD/MM/YYYY
    Object.keys(dadosProcessoGlobal).forEach((key) => {
      const val = dadosProcessoGlobal[key];
      if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) {
        dadosProcessoGlobal[key] = formatarDataParaBr(val);
      }
    });

    console.log("Dados do processo prontos para uso:", dadosProcessoGlobal);
  } catch (error) {
    console.error(error);
    alert("Aviso: Não foi possível carregar os dados automáticos do processo.");
  }
}

function formatarDataParaBr(dataString) {
  if (!dataString) return "";
  const dataParte = dataString.split("T")[0];
  const partes = dataParte.split("-");
  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }
  return dataString;
}

/**
 * Preenche o select com os modelos do banco.
 */
async function carregarModelosDropdown() {
  try {
    const r = await fetch("/modelos");
    const m = await r.json();

    selectModelo.innerHTML =
      '<option value="">-- Selecione um modelo --</option>';

    m.forEach((mod) => {
      const opt = document.createElement("option");
      opt.value = mod.id;
      opt.textContent = mod.titulo;
      selectModelo.appendChild(opt);
    });

    // Se vier ID na URL (ex: vindo de uma tela de "usar este modelo")
    const urlParams = new URLSearchParams(window.location.search);
    const modeloIdFromUrl = urlParams.get("modeloId");
    if (modeloIdFromUrl) {
      selectModelo.value = modeloIdFromUrl;
      buscarModeloCompleto(modeloIdFromUrl);
    }
  } catch (e) {
    console.error(e);
  }
}

/**
 * Busca o conteúdo do modelo e aplica o REPLACE automático.
 */
async function buscarModeloCompleto(id) {
  const editor = tinymce.get("resultadoFinal");
  if (!editor || !id) return;

  try {
    editor.setProgressState(true); // Mostra loader do TinyMCE

    const response = await fetch(`/modelos/${id}`);
    const modelo = await response.json();
    let texto = modelo.conteudo || "";

    // 1. Limpeza básica de quebras de linha antigas
    if (!texto.includes("<p") && !texto.includes("<div")) {
      texto = texto.replace(/\n/g, "<br>");
    }

    // 2. Substituição Automática (Case Insensitive)
    // Itera sobre as chaves retornadas pelo backend (ex: NumProcesso, Cidade_Descricao)
    if (dadosProcessoGlobal && Object.keys(dadosProcessoGlobal).length > 0) {
      Object.entries(dadosProcessoGlobal).forEach(([key, valor]) => {
        if (valor) {
          // Cria regex global e insensível a maiúsculas: {{ chave }} ou {{chave}}
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
          texto = texto.replace(regex, valor);
        }
      });
    }

    // Define o conteúdo final no editor
    editor.setContent(texto);
    editor.setProgressState(false);
  } catch (error) {
    console.error(error);
    editor.setProgressState(false);
    alert("Erro ao carregar e preencher o modelo.");
  }
}

// Gatilho de mudança do select
selectModelo.addEventListener("change", () =>
  buscarModeloCompleto(selectModelo.value)
);

// --- Botões Salvar/Imprimir ---

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

    if (!conteudo || conteudo.trim() === "") {
      return alert("O documento está vazio.");
    }

    // Pega o elemento <select>
    const select = document.getElementById("selectModelo");
    // Pega o texto da opção selecionada (ex: "Pedido de Dilação de Prazo")
    // Se nada estiver selecionado, envia string vazia ou nulo
    const modeloTexto =
      select.selectedIndex >= 0
        ? select.options[select.selectedIndex].text
        : null;

    try {
      btnSalvarDocumento.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Salvando...';
      btnSalvarDocumento.disabled = true;

      // Chama a rota que criamos
      const res = await fetch("/peticoes-finalizadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicacao_id: publicacaoId,
          conteudo_final: conteudo,
          modelo_utilizado: modeloTexto, // <--- ENVIANDO O NOME AGORA
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar.");

      alert("Petição salva com sucesso!");
    } catch (e) {
      alert(e.message);
    } finally {
      btnSalvarDocumento.disabled = false;
      btnSalvarDocumento.innerHTML =
        '<i class="fas fa-save me-1"></i> Salvar no Supabase';
    }
  });
}