# 2.0 - Implementação do Dashboard Service

## Objetivo
- Desenvolver a lógica de acesso a dados para compilar as estatísticas necessárias para o dashboard, garantindo o isolamento por tenant.

## Escopo / Entregáveis
- Arquivo `src/services/dashboardService.js` implementado.
- Funções de agregação (contagem e soma) utilizando o cliente Supabase.

## Passos e subtarefas
- 2.1 Criar `src/services/dashboardService.js`.
- 2.2 Implementar lógica para `totalProcessos` (count processos ativos).
- 2.3 Implementar lógica para `valorCausaTotal` (soma de `valor_causa` de processos ativos).
- 2.4 Implementar lógica para `prazosUrgentesCount` (count prazos nos próximos 7 dias).
- 2.5 Implementar lógica para `andamentosRecentesCount` (count andamentos nos últimos 7 dias).
- 2.6 Implementar queries para distribuições (Situação, Fase, Tribunais - Top 5).
- 2.7 Integrar service no `dashboardController.js`.

## Dependências
- Tarefa 1.0 concluída.
- Helper `withTenantFilter` para queries Supabase.

## Paralelizável?
- Não. Depende da estrutura de rotas e controllers definida na Fase 1.

## Critérios de aceite
- Retorno de dados precisos conforme o banco de dados para o tenant logado.
- Performance: Queries devem ser otimizadas para retornar em menos de 1s no service.

## Testes
- Validar se os números batem com consultas manuais no banco de dados para um tenant específico.
- Verificar se a soma do valor da causa lida nulos corretamente.

## Notas
- Caso a soma de `valor_causa` em memória seja lenta, considerar o uso de uma View ou Function no Supabase.

