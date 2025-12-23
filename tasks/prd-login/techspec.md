# Tech Spec – Login multi-tenant

## 1. Visão técnica e objetivos
- Implementar login por e-mail/senha com validação de usuário ativo e tenant ativo, retornando `tenantId` e `role` (advogado|admin).
- Implementar CRUD básico de usuários (listar por tenant, criar, atualizar campos permitidos, inativar/reativar) via API backend, sem UI dedicada.
- Multi-tenant com e-mail único global; vínculo obrigatório user→tenant.
- Sem sessão nesta entrega; apenas resposta de sucesso/erro.
- Logs mínimos via console para tentativas e sucessos.

## 2. Arquitetura e componentes
- Stack existente: Node.js (Express 5), Supabase client (`@supabase/supabase-js`), estáticos em `public/`.
- Novos artefatos:
  - Rota: `src/routes/authRoute.js` (`POST /api/auth/login`).
  - Controller: `src/controllers/authController.js` (validação básica de entrada, repasse para service).
  - Service: `src/services/authService.js` (fluxo de autenticação e regras).
  - Rota: `src/routes/userRoute.js` (CRUD em `/api/users`).
  - Controller: `src/controllers/userController.js` (validação de payloads, repasse para service).
  - Service: `src/services/userService.js` (regras de criação, atualização, inativação/reativação, validações).
  - (Opcional) Repositórios finos: `src/repositories/authRepository.js`, `src/repositories/userRepository.js` para consultas Supabase; se não usar, services chamam SDK direto seguindo padrão atual.
  - Front: `public/html/login.html`, `public/js/login.js`, `public/css/login.css` (CRUD de usuários é API-first, sem UI nesta fase).
- Integrações:
  - Supabase PostgREST via SDK (`supabase.from(...).select/insert/update`).
  - Nenhum middleware de sessão/token nesta fase.
- Config:
  - Reutilizar `src/config/supabase.js` para o client.
  - Adicionar `bcrypt` (ou `bcryptjs` caso `bcrypt` falhe em build local). Custo 10.

## 3. Modelo de dados (Supabase)
- Tabelas (seguir nomes do PRD, valores de status em português):
  - `tenants`: `id uuid PK`, `nome text`, `status text check in ('ativo','inativo')`, timestamps.
  - `users`: `id uuid PK`, `tenant_id uuid FK tenants(id)`, `email text unique` (global), `password_hash text`, `role text check in ('advogado','admin')`, `status text check in ('ativo','inativo')`, timestamps.
- Índices: unique em `users.email`; índice em `users.tenant_id`; índice em `tenants.status`.
- Seed inicial:
  - Script `scripts/seed-login.js` (Node) para criar um tenant default e um usuário admin associado (gera hash bcrypt).

## 4. Fluxo de autenticação
- Input: `{ email, senha }` (JSON).
- Passos:
  1) Normalizar e-mail (`trim`, lower-case).
  2) Buscar usuário por e-mail; se não existir, falha genérica.
  3) Verificar `users.status == 'ativo'`; caso contrário falha genérica.
  4) Obter tenant do usuário; validar `tenants.status == 'ativo'`; caso contrário falha genérica.
  5) Comparar senha com `password_hash` via bcrypt.
  6) Em sucesso, responder 200 com `{ userId, tenantId, role, message }`.
  7) Em erro, responder 401 com `{ message: "Credenciais inválidas ou usuário inativo" }`.
- Logs: `console.info` em sucesso (userId, tenantId, timestamp); `console.warn` em falha (email normalizado, motivo genérico).

## 5. Fluxos de gestão de usuários (API-first)
- Listar usuários por tenant:
  - Input: query `tenantId` obrigatório; `status` opcional (`ativo|inativo`).
  - Passos: validar `tenantId`; filtrar por tenant; aplicar filtro de status se presente; ordenar por `created_at` desc.
  - Output 200: lista de usuários com `id, email, role, status, tenantId, createdAt, updatedAt`.
- Criar usuário:
  - Input JSON: `{ email, password, role, tenantId, status }`; `status` padrão `ativo` se omitido.
  - Validar email (formato, `trim/lower`), unicidade global; validar `role` em (`advogado`,`admin`); validar `tenantId` existe; `password` obrigatória (mínimo simples, p.ex. >=6 chars).
  - Gerar `password_hash` via bcrypt custo 10; inserir user com timestamps.
  - Output 201: `{ id, email, role, status, tenantId, message }`.
- Atualizar usuário (parcial, sem alterar email/tenantId):
  - Input JSON: `{ role?, status?, password? }`.
  - Validar `role`/`status` se presentes; se `password` presente, gerar novo hash bcrypt.
  - Não permite alterar `email` nem `tenantId`.
  - Output 200: usuário atualizado com campos atuais.
- Inativar/Reativar:
  - Endpoints dedicados ou update com `status`; inativação bloqueia login imediatamente.
  - Output 200: `{ id, status, message }`.
- Erros: mensagens em PT-BR; `400` para validação; `404` se usuário ou tenant não encontrados; `500` genérico.

## 6. Endpoints e contratos
- `POST /api/auth/login`
  - Request body: `{ email: string, senha: string }`.
  - Validações: email obrigatório e formato básico; senha obrigatória.
  - Responses:
    - 200: `{ userId, tenantId, role, message: "Login realizado com sucesso" }`
    - 401: `{ message: "Credenciais inválidas ou usuário inativo" }`
    - 400: `{ message: "Parâmetros inválidos" }` (faltou campo ou formato de e-mail).
    - 500: `{ message: "Erro interno" }` com log do stack no servidor.
- `GET /api/users`
  - Query: `tenantId` (obrigatório), `status` opcional.
  - 200: lista de usuários do tenant (campos principais).
  - 400: tenantId ausente ou inválido.
- `POST /api/users`
  - Body: `{ email, password, role, tenantId, status? }`.
  - 201: usuário criado com mensagem.
  - 400: validação (email inválido/duplicado, role/status fora da lista, tenant inexistente, password ausente).
  - 500: erro interno.
- `PATCH /api/users/:id`
  - Body: `{ role?, status?, password? }` (email e tenantId não alteram).
  - 200: usuário atualizado.
  - 400: validação; 404: usuário não encontrado.
- `POST /api/users/:id/inactivate` e `POST /api/users/:id/reactivate` (ou `PATCH` com status)
  - 200: `{ id, status, message }`.
  - 404: usuário não encontrado.

## 7. Frontend (public/html/login.html)
- Página em `public/html/login.html`; script em `public/js/login.js`; estilo em `public/css/login.css`.
- Formulário: input e-mail (type=email), senha (type=password), botão “Entrar”.
- Validação client-side: campos obrigatórios, formato de e-mail; desabilitar botão enquanto requisitando.
- Chamada `fetch` para `/api/auth/login` com JSON; tratar 200/401; exibir mensagem de erro genérica.
- Acessibilidade: labels, foco visível, textos em PT-BR.
- Gestão de usuários: sem UI nesta fase; consumo via API apenas.

## 8. Regras de segurança
- Hash: bcrypt custo 10; nunca armazenar senha em texto plano.
- Erros sempre genéricos para não vazar existência de usuário.
- Sem rate limiting nesta fase (risco aceito); documentado em riscos.
- HTTPS assumido no deploy; ambiente local pode usar HTTP.
- Status em português: `'ativo'|'inativo'` para usuários e tenants.
- Emails sempre normalizados (trim/lower) antes de validar/criar.
- Email é único global e não altera após criação.

## 9. Observabilidade e logs
- Console logs:
  - Login sucesso: nível info com userId, tenantId, timestamp.
  - Login falha: nível warn com email normalizado, motivo genérico.
  - CRUD usuários: nível info para criação/atualização/status change (id, tenantId); warn em validação/404; error em exceções.
- Futuro: considerar persistir em tabela `login_events` e `user_audit` se precisarmos histórico/auditoria.

## 10. Migração e seed
- Criar SQL/DDL (executar via Supabase SQL):
  - `tenants` e `users` conforme seção 3.
- Script seed `scripts/seed-login.js`:
  - Lê `.env` (SUPABASE_URL, SUPABASE_KEY).
  - Cria tenant default ativo (ex.: "Tenant Default").
  - Cria usuário admin ativo com e-mail definido em variável `SEED_ADMIN_EMAIL`, senha `SEED_ADMIN_PASSWORD` (hash bcrypt).
  - Idempotente: verifica existência pelo e-mail antes de criar.

## 11. Estratégia de testes
- Unit (auth service): 
  - Sucesso de login (status ativo, tenant ativo, senha ok).
  - Usuário inexistente.
  - Usuário inativo.
  - Tenant inativo.
  - Senha incorreta.
- Unit (user service):
  - Criar usuário com e-mail novo (hash gerado, status default ativo).
  - Rejeitar e-mail duplicado, formato inválido, role inválida, tenant inexistente.
  - Atualizar role/status; não alterar email/tenantId.
  - Atualizar senha gera novo hash.
  - Inativar/reativar reflete no status e bloqueia login.
- Contract/manual (endpoint):
  - Login: 400 payload faltante/invalid email; 401 credenciais inválidas; 200 com userId/tenantId/role.
  - Users: 400 validação; 404 usuário inexistente; 200/201 em sucesso; listar filtra por tenant/status.
- Front manual:
  - Validação client-side bloqueia submit vazio.
  - Exibição de erro genérico.
- Não há suíte de testes atual; se não implementarmos automação, registrar passos de teste manual.

## 12. Riscos e mitigação
- Sem rate limiting: risco de brute force; mitigação futura com middleware/Redis.
- Sem sessão/middleware: rotas continuam desprotegidas até próxima fase.
- Dependência de bcrypt nativa em Windows pode falhar em build local; alternativa `bcryptjs` se necessário (ajustar spec/lock).
- Gestão de usuários sem autenticação/autorização nesta fase: risco se rotas ficarem públicas; mitigar temporariamente com chave de serviço restrita ou IP allowlist no ambiente até termos middleware.

## 13. Pendências/decisões
- Confirmado: e-mail único global; caminho `/api/auth/login`; logs apenas console; status em português; bcrypt custo 10; front em `public/html`.
- Implementar seed obrigatório conforme seção 10.
- Definir formato final dos endpoints de status (`/inactivate`/`/reactivate` vs `PATCH status`); seguir convenção REST escolhida.

