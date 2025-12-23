# Convenções para login multi-tenant (Supabase)

- **Tabelas**: `tenants` e `users` definidas em `scripts/sql/login-ddl.sql`. Campos de status em português (`ativo|inativo`), roles (`advogado|admin`), e-mail único global (index em `lower(email)` e check para armazenar sempre minúsculo).
- **Normalização de e-mail**: sempre `trim` + `lower` via `normalizeEmail` (`src/utils/authUtils.js`) antes de ler/escrever.
- **Erros (repos)**: funções podem lançar `ValidationError` (400), `ConflictError` (409), `NotFoundError` (404) ou `RepositoryError` (500). `findUserByEmail`/`findTenantById` retornam `null` quando não encontrado; operações de criação/atualização lançam erro.
- **Helpers disponíveis**:
  - `src/repositories/userRepository.js`: `findUserByEmail`, `findUserById`, `listUsersByTenant`, `createUser`, `updateUser`.
  - `src/repositories/tenantRepository.js`: `findTenantById`, `findActiveTenantById`.
  - Utilidades: `assertEmail`, `assertRole`, `assertStatus`, `normalizeEmail`, `nowIsoString`.
- **Seed**: `npm run seed:login` usa `.env` (`SUPABASE_URL`, `SUPABASE_KEY`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, opcional `SEED_TENANT_NAME`). Idempotente: cria tenant padrão e usuário admin apenas se não existirem.
- **Contratos de retorno**: repos retornam campos principais (`id, email, role, status, tenant_id, created_at, updated_at`). `password_hash` só é retornado em buscas internas, não deve ser exposto em controllers.


