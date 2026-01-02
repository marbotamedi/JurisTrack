# 4.0 - Interface HTML/CSS do Dashboard

## Objetivo
- Criar a casca visual do dashboard, seguindo a identidade visual do sistema e garantindo responsividade.

## Escopo / Entregáveis
- Arquivo `public/html/dashboard.html`.
- Arquivo `public/css/dashboard.css`.

## Passos e subtarefas
- 4.1 Criar `public/html/dashboard.html` com a estrutura de sidebar e navbar padrão.
- 4.2 Implementar grid Bootstrap 5 com os 4 cards de KPI (ícones, títulos e placeholders para valores).
- 4.3 Criar containers (`<canvas>`) para os gráficos de Situação, Fase e Tribunais.
- 4.4 Implementar modais ocultos no final do HTML para detalhamento.
- 4.5 Estilizar cards no `dashboard.css` (sombras, cores de destaque, cursor pointer).

## Dependências
- Bibliotecas Bootstrap 5 e FontAwesome vinculadas no HTML.

## Paralelizável?
- Sim, pode ser feita em paralelo com as tarefas de Backend (1.0 e 2.0).

## Critérios de aceite
- Layout fiel ao padrão do sistema (sidebar branca, fundo `#f8f9fa`).
- Total responsividade (cards empilhados em mobile, grid em desktop).

## Testes
- Visualizar o arquivo no navegador e testar diferentes tamanhos de janela (inspeção de elemento).
- Verificar se os modais abrem corretamente (via trigger manual de teste).

## Notas
- Usar IDs claros nos elementos de texto dos cards para facilitar a manipulação via JS posterior.

