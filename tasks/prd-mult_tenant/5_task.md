<!-- Template para tarefa individual -->
# 5.0 - Middleware de contexto de tenant

## Objetivo
- Implementar `tenantContextMiddleware` que extrai `tenantId` do token, valida presença e aplica-o às rotas `/api` (exceto login).

## Escopo / Entregáveis
- Middleware criado e registrado antes das rotas `/api` (exceto `/api/auth/login`).
- Respostas adequadas: 401 para token ausente/inválido, 400/422 para ausência de `tenantId`.
- Documentação de uso e impacto nas rotas existentes.

## Passos e subtarefas
- 5.1 Implementar middleware lendo `Authorization: Bearer` e validando JWT com `tenantId`.
- 5.2 Anexar `req.tenantId` e `req.user` para uso downstream; bloquear requisições sem tenant.
- 5.3 Registrar middleware na cadeia de `/api/**`, excluindo `/api/auth/login`.
- 5.4 Tests: unit do middleware (token ok/sem token/token inválido/sem tenant) e integração simples em rota dummy.

## Dependências
- 1.0

## Paralelizável?
- Sim (com 6.0, 9.0).

## Critérios de aceite
- Middleware aplicado em todas as rotas protegidas e retornando códigos corretos.
- `tenantId` disponível para serviços/DAO via `req`.
- Testes unitários cobrindo cenários de sucesso e erro.

## Testes
- Unit: casos de token válido, token ausente, token inválido, token sem `tenantId`.
- Integração: rota protegida respondendo 200 com tenant válido e 401/400 nos casos de falha.

## Notas
- Garantir mensagens de erro em PT-BR conforme padrão atual.



