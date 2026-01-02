const charts = {
  situacao: null,
  fase: null,
  tribunais: null,
};

const palette = [
  "#2563eb",
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
  "#14b8a6",
  "#8b5cf6",
  "#f472b6",
  "#10b981",
];

function cycleColors(length) {
  return Array.from({ length }, (_, index) => palette[index % palette.length]);
}

function formatCurrencyBRL(value) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(safeValue);
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Erro ao buscar ${url}`);
  }
  return response.json();
}

function updateKpis(summary) {
  const {
    totalProcessos = 0,
    valorCausaTotal = 0,
    prazosUrgentesCount = 0,
    andamentosRecentesCount = 0,
  } = summary || {};

  const map = {
    "kpi-total-processos": totalProcessos,
    "kpi-valor-causa": formatCurrencyBRL(valorCausaTotal),
    "kpi-prazos-urgentes": prazosUrgentesCount,
    "kpi-andamentos-recentes": andamentosRecentesCount,
  };

  Object.entries(map).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value ?? "--";
    }
  });
}

function destroyChart(key) {
  if (charts[key]) {
    charts[key].destroy();
    charts[key] = null;
  }
}

function renderCharts(distribuicoes = {}) {
  const {
    distribuicaoSituacao = [],
    distribuicaoFase = [],
    topTribunais = [],
  } = distribuicoes;

  // Situação - Rosca
  const situacaoCtx = document.getElementById("chart-situacao");
  if (situacaoCtx) {
    destroyChart("situacao");
    const labels = distribuicaoSituacao.map((item) => item.label || "Não informado");
    const data = distribuicaoSituacao.map((item) => item.count || 0);
    charts.situacao = new Chart(situacaoCtx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: cycleColors(labels.length),
            borderWidth: 0,
          },
        ],
      },
      options: {
        plugins: {
          legend: { position: "bottom" },
          tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}` } },
        },
        cutout: "60%",
      },
    });
  }

  // Fase - Barras verticais
  const faseCtx = document.getElementById("chart-fase");
  if (faseCtx) {
    destroyChart("fase");
    const labels = distribuicaoFase.map((item) => item.label || "Não informado");
    const data = distribuicaoFase.map((item) => item.count || 0);
    charts.fase = new Chart(faseCtx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Processos",
            data,
            backgroundColor: cycleColors(labels.length),
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} processos` } },
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 } },
        },
      },
    });
  }

  // Tribunais - Barras horizontais
  const tribunaisCtx = document.getElementById("chart-tribunais");
  if (tribunaisCtx) {
    destroyChart("tribunais");
    const labels = topTribunais.map((item) => item.label || "Não informado");
    const data = topTribunais.map((item) => item.count || 0);
    charts.tribunais = new Chart(tribunaisCtx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Processos",
            data,
            backgroundColor: cycleColors(labels.length),
            borderRadius: 8,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.x} processos` } },
        },
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    });
  }
}

function renderTableRows(targetId, items, emptyMessage) {
  const tbody = document.getElementById(targetId);
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">${emptyMessage}</td></tr>`;
    return;
  }

  tbody.innerHTML = items
    .map(
      (item) => `
      <tr>
        <td>${item.numeroProcesso || "--"}</td>
        <td>${item.descricao || "--"}</td>
        <td>${item.data_limite ? formatDate(item.data_limite) : item.data_evento ? formatDate(item.data_evento) : "--"}</td>
      </tr>`
    )
    .join("");
}

async function carregarPrazos() {
  renderTableRows("tabela-prazos", null, "Carregando prazos...");
  try {
    const { items } = await fetchJson("/api/dashboard/prazos-detalhes");
    renderTableRows("tabela-prazos", items, "Nenhum prazo urgente encontrado.");
  } catch (error) {
    console.error(error);
    renderTableRows("tabela-prazos", null, "Erro ao carregar prazos.");
  }
}

async function carregarAndamentos() {
  renderTableRows("tabela-andamentos", null, "Carregando andamentos...");
  try {
    const { items } = await fetchJson("/api/dashboard/andamentos-detalhes");
    renderTableRows("tabela-andamentos", items, "Nenhum andamento recente encontrado.");
  } catch (error) {
    console.error(error);
    renderTableRows("tabela-andamentos", null, "Erro ao carregar andamentos.");
  }
}

async function carregarResumo() {
  try {
    const summary = await fetchJson("/api/dashboard/summary");
    updateKpis(summary);
    renderCharts(summary);
  } catch (error) {
    console.error(error);
    updateKpis({});
  }
}

function setupModalListeners() {
  const prazosModal = document.getElementById("modalPrazos");
  const andamentosModal = document.getElementById("modalAndamentos");

  if (prazosModal) {
    prazosModal.addEventListener("show.bs.modal", carregarPrazos);
  }

  if (andamentosModal) {
    andamentosModal.addEventListener("show.bs.modal", carregarAndamentos);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  carregarResumo();
  setupModalListeners();
});

