# PRD - Dashboard Principal e KPIs Interativos

## 1. Visão Geral e Objetivos
O objetivo deste projeto é substituir a página inicial atual (Processos) por um Dashboard analítico. Este painel centralizará as informações mais críticas para o dia a dia do escritório jurídico, permitindo uma visão rápida da saúde da carteira de processos, prazos iminentes e movimentações recentes.

## 2. Escopo
- **Incluso**: 
    - Nova tela `dashboard.html` com layout de cartões (KPIs) e gráficos.
    - 4 Cards principais: Total de Processos, Valor em Causa, Prazos Urgentes (7 dias) e Andamentos Recentes (7 dias).
    - Interatividade nos cards de Prazos e Andamentos para abrir modais com listagem detalhada.
    - Gráficos de distribuição por Situação, Fase e Tribunal (Top 5).
    - Redirecionamento automático pós-login para o Dashboard.
- **Não Incluso**:
    - Filtros avançados por data no dashboard (será fixo em 7 dias para alertas).
    - Exportação de dados do dashboard para PDF/Excel.
    - Edição de registros diretamente pelo dashboard.
    - Permissões diferenciadas por perfil (todos veem os dados do tenant).

## 3. Usuários e Histórias de Usuário
- **Advogado/Administrador**: "Como usuário do sistema, quero entrar no JurisTrack e ver imediatamente quantos prazos tenho para vencer esta semana, para que eu possa organizar minha agenda sem precisar pesquisar processo por processo."

## 4. Requisitos Funcionais (RF)
1. **RF1 - Página Inicial**: O sistema deve redirecionar o usuário para `/dashboard` imediatamente após o login bem-sucedido.
2. **RF2 - KPI Total de Processos**: Exibir a contagem total de processos ativos do tenant (onde `deleted_at` é nulo).
3. **RF3 - KPI Valor em Causa**: Exibir a soma formatada em Moeda (BRL) do campo `valor_causa` de todos os processos ativos.
4. **RF4 - KPI Prazos Urgentes**: Exibir o número de prazos com `data_limite` entre a data atual e os próximos 7 dias.
5. **RF5 - KPI Andamentos Recentes**: Exibir o número de registros na tabela `Andamento` criados nos últimos 7 dias.
6. **RF6 - Detalhamento de Prazos (Modal)**: Ao clicar no card de Prazos Urgentes, abrir um modal exibindo: Número do Processo, Descrição do Prazo e Data Limite.
7. **RF7 - Detalhamento de Andamentos (Modal)**: Ao clicar no card de Andamentos Recentes, abrir um modal exibindo: Número do Processo, Descrição do Andamento e Data do Evento.
8. **RF8 - Gráfico de Situação**: Gráfico de rosca mostrando a distribuição de processos por `situacao`.
9. **RF9 - Gráfico de Fase**: Gráfico de barras mostrando a distribuição de processos por `fase`.
10. **RF10 - Gráfico de Tribunais**: Gráfico de barras horizontais com os 5 tribunais que possuem mais processos vinculados.
11. **RF11 - Navegação**: Adicionar link para o Dashboard no topo do menu lateral em todas as páginas do sistema.

## 5. Requisitos Não Funcionais (RNF)
1. **RNF1 - Performance**: O carregamento total das métricas do dashboard não deve exceder 3 segundos.
2. **RNF2 - Responsividade**: O layout dos cards deve se ajustar automaticamente para telas de tablets e smartphones.
3. **RNF3 - Bibliotecas**: Utilizar `Chart.js` para renderização dos gráficos e `Bootstrap 5` para modais e grid.

## 6. Modelo de Dados e Lógica
Os dados serão extraídos das tabelas:
- `processos`: Base para contagem total, valor total e agrupamentos (situação, fase, tribunal).
- `Prazo`: Filtrado por `data_limite` e vinculado ao `processoId`.
- `Andamento`: Filtrado por `data_evento` e vinculado ao `processoId`.
- **Importante**: Todas as consultas DEVEM respeitar o `tenant_id` do usuário logado.

## 7. UX/UI
- Estilo visual seguindo o padrão atual do sistema (sidebar branca, fundo cinza claro `#f8f9fa`).
- Cards de KPI com ícones FontAwesome correspondentes.
- Cursor do mouse tipo `pointer` ao passar sobre os cards interativos.

## 8. Métricas de Sucesso
- 100% dos usuários sendo direcionados para o dashboard após login.
- Redução no tempo médio que um usuário leva para identificar prazos críticos ao iniciar a sessão.

