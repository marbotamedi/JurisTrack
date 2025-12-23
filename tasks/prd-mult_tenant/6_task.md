<!-- Template para tarefa individual -->
# 6.0 - Helpers de scoping de dados (filtro/injeção)

## Objetivo
- Criar helpers reutilizáveis para filtrar por `tenant_id` em SELECT/UPDATE/DELETE e injetar `tenant_id` do contexto em INSERTs, ajustando a base DAO/repository.

## Escopo / Entregáveis
- Helpers `withTenantFilter(table, tenantId)` e `injectTenant(payload, tenantId)` implementados.
- Base repository/DAO atualizado para usar os helpers por padrão.
- Documentação breve de uso e exemplos.

## Passos e subtarefas
- 6.1 Implementar helper de filtro (`withTenantFilter`) aplicando `.eq("tenant_id", tenantId)` em operações de leitura/mutação.
- 6.2 Implementar helper de injeção (`injectTenant`) que sobrescreve `tenant_id` com o do contexto em inserts.
- 6.3 Refatorar base DAO/repository para consumir os helpers e falhar se `tenantId` estiver ausente.
- 6.4 Tests: unit dos helpers e da base DAO (filtro aplicado, injeção correta, erro sem tenant).

## Dependências
- 1.0

## Paralelizável?
- Sim (com 5.0, 9.0).

## Critérios de aceite
- Helpers disponíveis e utilizados pela camada base.
- Chamadas DAO aplicam filtro automático e ignoram `tenant_id` vindo do cliente.
- Testes unitários cobrindo filtros e injeções.

## Testes
- Unit: verificação de query builder com `.eq("tenant_id", tenantId)`; payload final contendo `tenant_id` correto; erro quando `tenantId` ausente.

## Notas
- Considerar flag `ENABLE_TENANT_SCOPE` se for usada para rollout gradual.

## Implementação / Uso
- Helpers adicionados em `src/repositories/tenantScope.js`.
- `withTenantFilter(table, tenantId)` aplica `.eq("tenant_id", tenantId)` e lança erro se o tenant não for informado (quando `ENABLE_TENANT_SCOPE` não for `"false"`).
- `injectTenant(payload, tenantId)` sobrescreve `tenant_id` com o do contexto e ignora o valor vindo do cliente.
- Exemplo: `withTenantFilter("users", tenantId).select("*")`; `supabase.from("users").insert([injectTenant(body, tenantId)])`.



