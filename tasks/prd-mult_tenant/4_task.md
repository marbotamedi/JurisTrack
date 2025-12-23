<!-- Template para tarefa individual -->
# 4.0 - Migração de esquema – fase 2 (NOT NULL + uniques compostas)

## Objetivo
- Tornar `tenant_id` obrigatório, reforçar FKs e converter chaves únicas para incluir `tenant_id`, mantendo reversibilidade controlada.

## Escopo / Entregáveis
- Scripts SQL fase 2 (NOT NULL, FKs fortes, uniques compostas) versionados.
- Execução com validação de integridade e impacto em índices.
- Evidências de sucesso e plano de rollback documentado.

## Passos e subtarefas
- 4.1 Atualizar scripts para `tenant_id` NOT NULL e FKs com `ON DELETE RESTRICT`.
- 4.2 Converter uniques para compostas `(tenant_id, coluna)` conforme inventário.
- 4.3 Validar scripts em staging (tempo, locks, compatibilidade com dados backfillados).
- 4.4 Executar em ambiente alvo com janela acordada; registrar logs.
- 4.5 Tests: verificar ausência de `tenant_id` nulo e unicidades aplicadas corretamente.

## Dependências
- 3.0

## Paralelizável?
- Não.

## Critérios de aceite
- Todas as tabelas tenant-aware com `tenant_id` NOT NULL, FKs fortes e uniques compostas ativas.
- Validação pós-execução sem violações.
- Scripts e logs versionados.

## Testes
- Checagem de constraints no catálogo (NOT NULL, FK restritiva, uniques ativas).
- Tentativa controlada de inserir duplicado por tenant para confirmar unicidade composta.

## Notas
- Confirmar que índices cobrem colunas das novas uniques para evitar regressão de performance.



