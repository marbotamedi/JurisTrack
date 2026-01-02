# Plano de Tarefas - Dashboard Principal e KPIs Interativos

## Contexto
- Objetivo: Substituir a página inicial por um Dashboard analítico centralizado com KPIs e gráficos interativos.
- PRD: `tasks/prd-dashboard/prd.md`
- Tech Spec: `tasks/prd-dashboard/techspec.md`

## Premissas e Escopo
- Inclusões: 4 cards de KPI (Total, Valor, Prazos, Andamentos), 3 gráficos (Situação, Fase, Tribunal), modais de detalhamento, redirecionamento pós-login e atualização de menu.
- Exclusões: Filtros de data (fixo em 7 dias), exportação de dados, edição direta no dashboard e permissões por perfil.
- Riscos conhecidos: Performance da soma de `valor_causa` em grandes volumes de dados; inconsistência visual no menu lateral replicado em múltiplos arquivos.

## Fases sugeridas
- Fase 1: Backend e Infraestrutura (Rotas, Controller, Service e Queries Supabase)
- Fase 2: Frontend e Interface de Usuário (HTML/CSS, Integração de APIs e Gráficos)
- Fase 3: Fluxo Global e Refinamento (Login, Menu lateral e Ajustes de Responsividade)

## Dependências globais
- Acesso ao Supabase e permissões de leitura nas tabelas `processos`, `Prazo` e `Andamento`.
- Existência do `tenantContextMiddleware` e helper `withTenantFilter`.

## Lista de tarefas
| ID | Título | Depende de | Paralelizável | Entregáveis principais |
| --- | --- | --- | --- | --- |
| 1.0 | Configuração de Rotas e Controller | - | Sim (com 4.0) | `dashboardRoute.js`, `dashboardController.js` |
| 2.0 | Implementação do Dashboard Service | 1.0 | Não | `dashboardService.js` (queries aggregadas) |
| 3.0 | Endpoints de Detalhamento para Modais | 2.0 | Não | Endpoints de listagem detalhada (Prazos/Andamentos) |
| 4.0 | Interface HTML/CSS do Dashboard | - | Sim (com 1.0) | `dashboard.html`, `dashboard.css` |
| 5.0 | Integração de KPIs e Consumo de API | 2.0, 4.0 | Não | `dashboard.js` (Cards atualizados) |
| 6.0 | Gráficos Interativos com Chart.js | 2.0, 4.0 | Sim (com 5.0) | `dashboard.js` (Gráficos renderizados) |
| 7.0 | Implementação de Modais de Detalhamento | 3.0, 5.0 | Não | `dashboard.js` (Modais funcionais) |
| 8.0 | Ajuste de Fluxo de Login e Menu Lateral | 4.0 | Não | Redirecionamento login e menu atualizado em todos HTMLs |
| 9.0 | Refinamento de UI/UX e Responsividade | 7.0, 8.0 | Não | Dashboard finalizado e responsivo |

## Notas
- Critérios de numeração: X.0 tarefas principais, X.Y subtarefas.
- Sempre incluir testes como subtarefas nas tarefas relevantes.

