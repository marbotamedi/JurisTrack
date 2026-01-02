# 3.0 - Endpoints de Detalhamento para Modais

## Objetivo
- Prover os dados detalhados para as listagens que serão exibidas nos modais interativos do dashboard.

## Escopo / Entregáveis
- Métodos de serviço e controller para listagem detalhada de Prazos Urgentes e Andamentos Recentes.

## Passos e subtarefas
- 3.1 Implementar `getPrazosDetalhes` no service: Buscar Número do Processo (via join), Descrição e Data Limite.
- 3.2 Implementar `getAndamentosDetalhes` no service: Buscar Número do Processo (via join), Descrição e Data do Evento.
- 3.3 Atualizar controller para passar os parâmetros de paginação (se necessário, embora o PRD peça apenas listagem simples).
- 3.4 Validar o retorno JSON nos formatos esperados pelo frontend.

## Dependências
- Tarefa 2.0 concluída.

## Paralelizável?
- Não. Depende da lógica base de serviço.

## Critérios de aceite
- JSON de retorno deve conter todos os campos exigidos no RF6 e RF7.
- Dados filtrados corretamente pelos últimos/próximos 7 dias e por tenant.

## Testes
- Testar endpoints via ferramenta de API e validar a estrutura do array retornado.
- Garantir que processos deletados não apareçam no detalhamento.

## Notas
- Utilizar `select` com joins para trazer o número do processo das tabelas relacionadas.

