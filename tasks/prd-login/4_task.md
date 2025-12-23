<!-- Template para tarefa individual -->
# 4.0 - CRUD de usuários `/api/users`

## Objetivo
- Disponibilizar API de gestão de usuários por tenant (listar, criar, atualizar, inativar/reativar) com validações e mensagens em PT-BR.

## Escopo / Entregáveis
- Rotas/controller para `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id`, endpoints de inativar/reativar (ou PATCH status).
- Services com regras: validação de role/status, e-mail único global, tenant obrigatório, hash de senha ao criar/atualizar.
- Contratos de resposta em PT-BR com códigos 200/201/400/404/500 conforme casos.

## Passos e subtarefas
- `GET /api/users`: validar `tenantId` obrigatório; filtro opcional de status; ordenar por `created_at` desc.
- `POST /api/users`: validar e-mail (formato/trim/lower), unicidade global, role/status permitidos, tenant existente; gerar `password_hash` com bcrypt.
- `PATCH /api/users/:id`: permitir `role`, `status`, `password`; não alterar `email` nem `tenantId`; hash novo se senha informada.
- Inativar/reativar: expor endpoints ou convenção PATCH com `status`; garantir bloqueio imediato no login.
- Mensagens e payloads em PT-BR consistentes; tratar 404 quando usuário/tenant não existir.
- Logar info em sucesso (id/tenantId/ação) e warn em validação/404.

## Dependências
- 2.0.

## Paralelizável?
- Parcial (após 2.0; pode evoluir em paralelo ao 3.0).

## Critérios de aceite
- Endpoints retornam dados esperados e códigos corretos.
- Unicidade de e-mail e validações de role/status/tenant aplicadas.
- Atualizações de senha geram novo hash; status controla acesso no login.

## Testes
- Unit: criar usuário válido, rejeitar e-mail duplicado/formato inválido/role inválida/tenant inexistente; atualizar role/status; atualizar senha gera hash; inativar/reativar reflete status.
- Contrato: 400 em validação, 404 quando usuário não encontrado, 200/201 em sucesso.

## Notas
- Considerar reuso de mensagens/formatadores entre auth e CRUD para consistência.

<!-- Template para tarefa individual -->
# 4.0 - Backend serviço/repository

## Objetivo
- Implementar fluxo completo de autenticação com Supabase, validações e bcrypt.

## Escopo / Entregáveis
- `src/services/authService.js` com etapas: normalizar e-mail, buscar usuário, validar status, validar tenant, bcrypt compare, montar resposta.
- Opcional `src/repository/authRepository.js` (ou acesso direto) seguindo padrão da codebase.
- Integração com Supabase via `src/config/supabase.js`.

## Passos e subtarefas
- 4.1 Implementar busca de usuário por e-mail e status; garantir e-mail lower/trim.
- 4.2 Validar status do usuário (`ativo`) e do tenant (`ativo`).
- 4.3 Comparar senha com `password_hash` via bcrypt (ou fallback definido).
- 4.4 Retornar sucesso `{ userId, tenantId, role, message }` ou lançar erro genérico.
- 4.5 Adicionar logs (`info` em sucesso, `warn` em falha genérica).

## Dependências
- 2.0 Modelo de dados e seed (repository).
- 3.0 Backend rota/controller.

## Paralelizável?
- Não, depende de 2.0 e 3.0.

## Critérios de aceite
- Serviço autentica corretamente conforme PRD/Tech Spec.
- Erros não vazam detalhes (mensagem genérica).
- Funciona com dados do seed.

## Testes
- Unitários do service: sucesso, usuário inexistente, usuário inativo, tenant inativo, senha incorreta.

## Notas
- Manter status em português (`ativo`/`inativo`).
# 4.0 - Rota e controller de login

## Objetivo
- Expor `POST /api/auth/login` com validação básica e repasse ao serviço.

## Escopo / Entregáveis
- `src/routes/authRoute.js` registrando a rota.
- `src/controllers/authController.js` validando entrada e chamando o service.
- Registro da rota no app principal.

## Passos e subtarefas
- 4.1 Criar `authRoute.js` com endpoint `POST /api/auth/login`.
- 4.2 Implementar `authController.js` para validar formato básico de e-mail e campos obrigatórios.
- 4.3 Integrar rota no bootstrap do app (`app.js`), seguindo padrão das rotas existentes.
- 4.4 Garantir respostas 400 para payload inválido antes do service.

## Dependências
- 2.0 (modelo/seed), 3.0 (deps/config).

## Paralelizável?
- Não. Depende de config pronta e deve alinhar contratos com o service.

## Critérios de aceite
- Rota acessível e retornando 400 em payload inválido.
- Controller chama o service com payload normalizado.

## Testes
- Chamada manual/automatizada com payload faltante -> 400.
- Chamada com payload válido encaminha ao service (mock ou stub).

## Notas
- Manter mensagens em PT-BR e genéricas no caminho de erro.


