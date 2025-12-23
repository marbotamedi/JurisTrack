<!-- Template para tarefa individual -->
# 2.0 - Migração de esquema – fase 1 (tenant_id nullable + índices)

## Objetivo
- Adicionar coluna `tenant_id` nullable com FK branda e índices em todas as tabelas tenant-aware, sem alterar unicidades ainda.

## Escopo / Entregáveis
- Scripts SQL fase 1 (Supabase) versionados.
- FKs permissivas para `tenant_id` (allow NULL) e índices criados.
- Execução em ambiente alvo com validação básica de integridade.

## Passos e subtarefas
- 2.1 Gerar scripts para adicionar `tenant_id uuid NULL` e FK branda para `tenants(id)` em tabelas tenant-aware.
- 2.2 Criar índices em `tenant_id` nas tabelas afetadas.
- 2.3 Validar scripts em ambiente de teste/staging (dry-run/local se possível).
- 2.4 Executar em ambiente alvo conforme janela; registrar logs e tempo.
- 2.5 Tests: verificar esquema pós-migração (colunas, FKs brandas, índices presentes).

## Dependências
- 1.0

## Paralelizável?
- Não.

## Critérios de aceite
- Todas as tabelas tenant-aware possuem `tenant_id` nullable com FK branda e índice.
- Scripts guardados no repositório e vinculados ao inventário.
- Validação pós-execução sem erros de integridade.

## Testes
- Conferência de metadados via Supabase (coluna, FK branda, índice).
- Checklist de execução com logs armazenados.

## Notas
- Não alterar constraints únicas nesta fase para evitar quebra antes do backfill.



