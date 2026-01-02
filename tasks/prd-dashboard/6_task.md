# 5.0 - Integração de KPIs e Consumo de API

## Objetivo
- Conectar a interface visual aos dados reais do backend, preenchendo os cards de KPI.

## Escopo / Entregáveis
- Arquivo `public/js/dashboard.js` iniciado.
- Lógica de fetch para carregar o sumário e atualizar o DOM.

## Passos e subtarefas
- 5.1 Criar `public/js/dashboard.js`.
- 5.2 Implementar função `loadSummaryData` para chamar `GET /api/dashboard/summary`.
- 5.3 Atualizar os elementos HTML dos cards com os valores retornados (Total, Valor formatado, Contagens).
- 5.4 Implementar tratamento de estados de carregamento (skeletons ou spinners) e erros.

## Dependências
- Tarefas 2.0 e 4.0 concluídas.

## Paralelizável?
- Não. Necessita tanto do endpoint funcional quanto da estrutura HTML pronta.

## Critérios de aceite
- Ao carregar a página, os cards devem exibir os dados reais do tenant em menos de 3s (RNF1).
- O valor da causa deve estar formatado em Moeda BRL.

## Testes
- Simular erro na API e verificar se o sistema exibe uma mensagem amigável ou mantém os cards limpos.
- Validar se a atualização acontece imediatamente após o carregamento da página.

## Notas
- Usar `Intl.NumberFormat` para a formatação de moeda.

