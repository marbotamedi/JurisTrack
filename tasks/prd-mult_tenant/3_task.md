<!-- Template para tarefa individual -->
# 3.0 - Backfill de tenant_id (idempotente)

## Objetivo
- Preencher `tenant_id` nas tabelas tenant-aware usando tenant padrão por ambiente, com script idempotente e validação de contagens.

## Escopo / Entregáveis
- Script de backfill idempotente versionado.
- Execução registrada (logs) com contagens antes/depois por tabela.
- Plano de rollback/reatribuição documentado se necessário.

## Passos e subtarefas
- 3.1 Redigir script idempotente que preenche `tenant_id` nulo com o tenant padrão.
- 3.2 Rodar em ambiente de teste/staging; coletar contagens e comparar.
- 3.3 Ajustar script conforme performance/locks observados.
- 3.4 Executar no ambiente alvo com logs de contagem antes/depois.
- 3.5 Tests: validar que não há linhas com `tenant_id` nulo após o backfill.

## Dependências
- 2.0

## Paralelizável?
- Não.

## Critérios de aceite
- Zero linhas com `tenant_id` nulo nas tabelas tenant-aware após execução.
- Logs de contagem por tabela armazenados.
- Script permanece idempotente (reexecução não altera dados válidos).

## Testes
- Consulta de verificação (`count` de `tenant_id IS NULL`) retornando zero.
- Conferência manual de amostras de linhas preenchidas.

## Notas
- Monitorar locks/impacto; se necessário, aplicar em lotes por tabela.



