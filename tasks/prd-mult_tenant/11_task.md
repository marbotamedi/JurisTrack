<!-- Template para tarefa individual -->
# 11.0 - Testes e dados de teste

## Objetivo
- Cobrir isolamento multi-tenant com testes unitários, integração/contrato e atualizar fixtures/seeds com `tenant_id`.

## Escopo / Entregáveis
- Suite de testes cobrindo middleware, helpers, serviços, jobs, storage.
- Fixtures/seeds atualizadas com `tenant_id` (tenant padrão e casos multi-tenant).
- Testes de contrato/API para bloqueio sem tenant e isolamento de dados.

## Passos e subtarefas
- 11.1 Atualizar fixtures/seeds para incluir `tenant_id` em todas as entidades.
- 11.2 Criar/ajustar testes unitários: middleware, helpers (`withTenantFilter`, `injectTenant`), validações de autorização.
- 11.3 Criar testes de integração/contrato por domínio (processos, pessoas, uploads, modelos, petições/n8n) validando isolamento e unicidades compostas.
- 11.4 Tests: adicionar cenários negativos (sem tenant, tenant divergente, duplicidade por tenant) e positivos (dados isolados).

## Dependências
- 5.0–10.0

## Paralelizável?
- Não.

## Critérios de aceite
- Cobertura dos principais fluxos tenant-aware com testes passando.
- Seeds/fixtures compatíveis com migrações (tenant obrigatório).
- Testes de contrato falham quando falta `tenantId` e aprovam quando correto.

## Testes
- Execução da suíte com foco nos novos casos de isolamento e unicidade composta.
- Validação manual mínima em ambiente de teste após seeds.

## Notas
- Garantir que IDs de tenant usados nas seeds estejam alinhados com o tenant padrão definido.



