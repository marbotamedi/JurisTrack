<!-- Template para tarefa individual -->
# 8.0 - Jobs e integrações (n8n) com tenant

## Objetivo
- Propagar e restaurar `tenant_id` em jobs/integrações (n8n), garantindo que operações assíncronas respeitem o contexto de tenant.

## Escopo / Entregáveis
- Payloads de jobs n8n incluindo `tenant_id`.
- Consumidores/serviços que processam jobs restaurando `tenantId` antes de acessar dados.
- Validações para rejeitar jobs sem `tenant_id`.

## Passos e subtarefas
- 8.1 Atualizar produtores de jobs (ex.: `notifyN8NWebhook`) para incluir `tenant_id`.
- 8.2 Ajustar consumidores (ex.: `finalizeProcess`) para restaurar `tenantId` e validar igualdade entre recursos.
- 8.3 Garantir que chamadas downstream usem helpers de scoping (filtro/injeção).
- 8.4 Tests: integração simulando job com tenant válido e erro quando faltante ou divergente.

## Dependências
- 5.0, 6.0

## Paralelizável?
- Sim (após 5.0/6.0).

## Critérios de aceite
- Todos os jobs/integrações relevantes carregam `tenant_id` e falham claramente quando ausente.
- Consumidores usam contexto restaurado para filtros e joins.
- Testes de integração cobrindo fluxo happy path e falha.

## Testes
- Integração: job com `tenant_id` correto executa; job sem/errado falha com erro controlado.
- Verificação de logs contendo `tenant_id` durante o processamento.

## Notas
- Confirmar lista de jobs n8n ativos e cobrir cada um.



