<!-- Template para tarefa individual -->
# 10.0 - Observabilidade e segurança (logs/metrics/authz)

## Objetivo
- Incluir `tenant_id` em logs/metrics/traces e reforçar validações de autorização por tenant.

## Escopo / Entregáveis
- Logs padronizados contendo `tenantId` e `userId`.
- Métricas/tracing (se existentes) com tag `tenant_id`.
- Checagens de autorização garantindo que o usuário pertence ao `tenantId` do contexto.

## Passos e subtarefas
- 10.1 Atualizar utilitários de logging para acrescentar `tenantId` e `userId`.
- 10.2 Incluir tag `tenant_id` em métricas/tracing quando aplicável.
- 10.3 Reforçar validações de autorização em rotas/serviços críticos (reuso do contexto).
- 10.4 Tests: verificar logs/metrics com `tenant_id` e cenários de autorização negada.

## Dependências
- 5.0, 6.0

## Paralelizável?
- Sim (com 7.0/8.0/9.0).

## Critérios de aceite
- Logs exibem `tenant_id` para requisições e jobs.
- Métricas/tracing (quando existirem) taggeadas com `tenant_id`.
- Autorização nega acesso quando `user.tenant_id` difere de `req.tenantId`.

## Testes
- Verificação manual/automática de logs com `tenant_id`.
- Testes de autorização retornando 403 quando tenants divergem.

## Notas
- Garantir que mensagens continuem em PT-BR.



