<!-- Template para tarefa individual -->
# 3.0 - Autenticação `/api/auth/login`

## Objetivo
- Implementar fluxo de login multi-tenant com validação de usuário/tenant ativos, bcrypt e respostas em PT-BR.

## Escopo / Entregáveis
- Rota/controller `/api/auth/login` com validação de payload.
- Service com normalização de e-mail, checagem de status do usuário e tenant, comparação de senha com bcrypt (custo 10).
- Contratos de resposta: 200 sucesso com `userId`, `tenantId`, `role`, mensagem; 400/401/500 conforme spec.
- Logs mínimos (info em sucesso, warn em falha).

## Passos e subtarefas
- Validar entrada: e-mail obrigatório/formato, senha obrigatória; retornar 400 quando inválido.
- Normalizar e-mail (trim/lower) antes de consulta.
- Consultar usuário por e-mail; checar `users.status == 'ativo'`; obter tenant e checar `tenants.status == 'ativo'`.
- Comparar senha com `password_hash` via bcrypt; em falha, responder 401 genérico.
- Em sucesso, responder payload completo e registrar log info com userId/tenantId/timestamp; em falha, log warn com e-mail normalizado.
- Tratar erros inesperados com 500 e log error.

## Dependências
- 2.0.

## Paralelizável?
- Parcial (após 2.0; pode evoluir em paralelo ao 4.0 se contratos de repositório estáveis).

## Critérios de aceite
- Requisições válidas retornam 200 com campos exigidos; falhas retornam mensagens genéricas em PT-BR.
- Checagens de status de usuário e tenant efetivas (bloqueiam inativos).
- Logs emitidos conforme cenários de sucesso/falha/erro.

## Testes
- Unit: sucesso, usuário inexistente, usuário inativo, tenant inativo, senha incorreta.
- Contrato: 400 para payload inválido; 401 para credenciais inválidas; 200 com dados completos.

## Notas
- Se `bcrypt` nativo falhar, avaliar `bcryptjs` mantendo a mesma interface.

<!-- Template para tarefa individual -->
# 3.0 - Backend rota/controller

## Objetivo
- Expor o endpoint `POST /api/auth/login` com validação básica e integração ao service.

## Escopo / Entregáveis
- Rota em `src/routes/authRoute.js`.
- Controller em `src/controllers/authController.js` com validação de payload.
- Registro da rota no app principal.

## Passos e subtarefas
- 3.1 Criar `authRoute` com rota `POST /api/auth/login`.
- 3.2 Implementar `authController` validando campos obrigatórios e formato básico de e-mail.
- 3.3 Lidar com erros de validação (400) e repassar para service.
- 3.4 Registrar rota no servidor Express.

## Dependências
- 1.0 Planejamento e setup.

## Paralelizável?
- Sim, pode avançar em paralelo ao seed (2.0), desde que use mocks até o service real.

## Critérios de aceite
- Endpoint responde 400 para payload inválido e chama service para payload válido.
- Rota registrada e acessível via `/api/auth/login`.

## Testes
- Requisições manuais/automatizadas confirmando 400 quando falta campo ou e-mail inválido.

## Notas
- Manter mensagens em PT-BR e genéricas.

