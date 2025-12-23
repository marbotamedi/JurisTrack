<!-- Template para tarefa individual -->
# 1.0 - Inventário e planejamento de migração

## Objetivo
- Mapear tabelas tenant-aware vs globais, listar chaves únicas a compor com `tenant_id` e definir plano de migração/backfill usando o tenant padrão.

## Escopo / Entregáveis
- Inventário de tabelas com indicação de `tenant_id` necessário ou exclusão (globais).
- Lista de constraints únicas a converter para `(tenant_id, coluna)`.
- Plano faseado confirmado (fase 1, backfill, fase 2) com tenant padrão por ambiente.
- Checklist de pré-requisitos para aplicar migrações (acessos, janelas, backups).

## Passos e subtarefas
- 1.1 Extrair esquema atual no Supabase e classificar tabelas em globais vs tenant-aware.
- 1.2 Listar índices/uniques existentes e identificar quais virarão compostos com `tenant_id`.
- 1.3 Documentar tenant padrão de backfill por ambiente e regras para linhas existentes.
- 1.4 Redigir plano resumido das fases de migração (ordem, rollback possível, validações).
- 1.5 Revisar com o time e ajustar inventário/risco antes de scripts.
- 1.6 Tests: revisão por pares do inventário e conferência cruzada com PRD/Tech Spec.

## Dependências
- Nenhuma.

## Paralelizável?
- Sim (desbloqueia 5.0/6.0; pode rodar em paralelo com alinhamento de time).

## Critérios de aceite
- Inventário validado e versionado no repositório.
- Lista de uniques alvo acordada.
- Tenant padrão e regras de backfill definidos por ambiente.
- Plano de fases aprovado pelo time.

## Testes
- Checklist de revisão por pares do inventário e das decisões de uniques.
- Validação do inventário contra o PRD/Tech Spec sem divergências.

## Notas
- Se surgir dúvida sobre tabela “auxiliar”, registrar e classificar antes de seguir para scripts.



