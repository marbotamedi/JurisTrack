# 6.0 - Gráficos Interativos com Chart.js

## Objetivo
- Renderizar as visualizações gráficas de distribuição de processos utilizando a biblioteca Chart.js.

## Escopo / Entregáveis
- Implementação dos 3 gráficos no `public/js/dashboard.js`.

## Passos e subtarefas
- 6.1 Adicionar script do `Chart.js` ao `dashboard.html`.
- 6.2 Criar função `renderCharts` que recebe os dados de distribuição.
- 6.3 Configurar gráfico de rosca para Situação.
- 6.4 Configurar gráfico de barras para Fase.
- 6.5 Configurar gráfico de barras horizontais para Top 5 Tribunais.
- 6.6 Aplicar cores e estilos que combinem com a UI do sistema.

## Dependências
- Tarefas 2.0 e 4.0 concluídas.

## Paralelizável?
- Sim, pode ser feito em paralelo com a integração de KPIs (Tarefa 5.0).

## Critérios de aceite
- Gráficos renderizados corretamente com legendas e tooltips.
- Dados exibidos devem corresponder aos retornados pelo endpoint de sumário.

## Testes
- Testar interatividade (passar o mouse sobre as fatias/barras).
- Verificar se o gráfico se ajusta ao redimensionar a tela.

## Notas
- Atentar para as cores do gráfico para garantir boa legibilidade e contraste.

