<!-- Template para tarefa individual -->
# 2.0 - Modelo de dados e acesso Supabase (DDL/helpers)

## Objetivo
- Garantir tabelas, índices e camada de acesso Supabase alinhados ao multi-tenant e requisitos de status/roles.

## Escopo / Entregáveis
- DDL para `tenants` e `users` com checagens e índices conforme spec.
- Helpers/repositórios para operações de leitura/escrita em Supabase com normalização de e-mail.
- Validações de domínio: status (`ativo|inativo`), role (`advogado|admin`), e-mail único global.

## Passos e subtarefas
- Confirmar/configurar `src/config/supabase.js` e variáveis `SUPABASE_URL`/`SUPABASE_KEY`.
- Criar/atualizar DDL de `tenants` e `users` com constraints e índices recomendados.
- Implementar helpers ou repositórios para: buscar usuário por e-mail (normalizado), buscar tenant por id/status, listar usuários por tenant e status, criar/atualizar usuário.
- Garantir normalização de e-mail (trim/lower) e checagem de unicidade antes de criação.
- Documentar convenções de erro/retorno para uso pelos services.

## Dependências
- 1.0.

## Paralelizável?
- Parcial (após 1.0; pode avançar em paralelo a 3.0/4.0 apenas após DDL pronta).

## Critérios de aceite
- DDL aplicada/validada e versionada.
- Helpers/repositórios expõem operações necessárias com tratamento de erros consistente.
- Unicidade de e-mail e enums de status/role cobertos por constraints ou validações.

## Testes
- Exercitar operações básicas contra ambiente Supabase (listar/criar/atualizar) e validar erros de unicidade.

## Notas
- Se `bcrypt` nativo falhar, registrar decisão de usar `bcryptjs` apenas nas camadas de serviço.

<!-- Template para tarefa individual -->
# 2.0 - Modelo de dados e seed (repository)

## Objetivo
- Garantir tabelas, índices e seed idempotente para suportar autenticação multi-tenant.

## Escopo / Entregáveis
- SQL/DDL para `tenants` e `users` com checks de status e índices.
- Script `repository/seed-login.js` idempotente que cria tenant e usuário admin iniciais com bcrypt.
- Instruções de execução do seed e variáveis necessárias.

## Passos e subtarefas
- 2.1 Redigir DDL para `tenants` e `users` com índices (`email` unique, `tenant_id`, `tenants.status`).
- 2.2 Implementar `repository/seed-login.js` lendo `.env`, gerando hash bcrypt custo 10.
- 2.3 Tornar o seed idempotente: checar e-mail antes de inserir.
- 2.4 Documentar como rodar o seed e valores de `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`.

## Dependências
- 1.0 Planejamento e setup.

## Paralelizável?
- Parcial: DDL e seed podem ocorrer em paralelo a 3.0, mas precisam concluir antes de 4.0 para testes.

## Critérios de aceite
- DDL compatível com Supabase, com checks de status em português.
- Seed roda sem erros repetidos e cria dados apenas quando ausentes.
- Hash gerado com bcrypt custo 10 (ou fallback definido em 1.0).

## Testes
- Executar seed duas vezes verificando idempotência.
- Validar existência de registros esperados (tenant, admin) via Supabase.

## Notas
- Se `bcrypt` nativo falhar no ambiente, ajustar para `bcryptjs` e registrar na doc.

