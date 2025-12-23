## 1. Visão técnica e objetivos
- Isolar dados por `tenant_id` em todas as camadas (API, serviços, jobs, cache, storage) exceto tabelas globais (`estados`, `cidades`, `Feriado`).
- Inserções sempre usam `tenant_id` do contexto (token); consultas/mutações filtram por tenant; JOINs aplicam igualdade de tenant.
- Migração faseada e reversível para adicionar `tenant_id`, backfill com tenant padrão `43f89b9e-7f0f-4ffc-87eb-4e5cf42a8597`, tornar NOT NULL, e converter unicidades para compostas.
- Observabilidade inclui `tenant_id`; bloqueio de requisições sem tenant; sem super admin nesta fase.

## 2. Arquitetura e componentes
- Stack atual: Node.js (Express), Supabase (`@supabase/supabase-js`), front em `public/`.
- Middlewares: novo `tenantContextMiddleware` (extrai `tenantId` do token `Authorization: Bearer`), aplicado antes das rotas `/api/**` (exceto `/api/auth/login`).
- Base de acesso a dados: wrapper utilitário para compor filtros `tenant_id` em SELECT/UPDATE/DELETE e injetar `tenant_id` em INSERT.
- Repositórios/serviços afetados: `processosService`, `locaisService` (somente tenant-aware onde aplicável), `pessoasRoute`, `peticaoService`, `uploadService`, `modalService`, `n8nService`, `modelosService`, `dateUtils` (caso acesse tabelas tenant-aware futuramente), `userRepository`, `tenantRepository`.
- Rotas/Controllers: adicionar dependência de contexto de tenant e validações de autorização por tenant nos controllers que escrevem/lêem entidades tenant-aware.
- Storage: prefixar uploads no bucket `teste` com `<tenantId>/` para segregar caminhos (mesmo bucket).
- Jobs/integrações n8n: carregar `tenant_id` na payload e restaurar contexto nos serviços consumidores (ex.: `finalizeProcess`).

## 3. Modelo de dados e migração
### 3.1 Inventário de tabelas
- Globais (sem `tenant_id`): `estados`, `cidades`, `Feriado`.
- Tenant-aware (adicionar `tenant_id`): `tenants` (já possui), `users` (já possui), `processos`, `pessoas`, `Publicacao`, `Prazo`, `Andamento`, `upload_Documentos`, `Modelos_Peticao`, `Historico_Peticoes`, demais tabelas auxiliares referenciadas pelos services (ex.: `situacoes`, `comarcas`, `varas`, `tribunais`, `instancias`, `tipos_acao`, `ritos`, `fases`, `moedas`, `probabilidades` se usadas em joins por tenant).

### 3.2 Fases de migração (Supabase SQL)
1) Preparação:
   - Listar chaves únicas existentes (ex.: `users.email`, `processos.numprocesso`, `pessoas.cpf_cnpj?`, `upload_Documentos.nome_arquivo?`). Planejar conversão para `(tenant_id, coluna)`.
   - Definir tenant padrão de backfill: `43f89b9e-7f0f-4ffc-87eb-4e5cf42a8597`.
2) Esquema fase 1:
   - Adicionar coluna `tenant_id uuid NULL` com FK branda para `tenants(id)` em cada tabela tenant-aware.
   - Criar índice em `tenant_id` em todas as tabelas tenant-aware.
   - Não alterar uniques ainda.
3) Backfill:
   - Script idempotente que preenche `tenant_id` vazio com o tenant padrão por ambiente.
   - Validar contagem de linhas por tabela antes/depois; logar resultados.
4) Esquema fase 2:
   - Tornar `tenant_id` NOT NULL.
   - Fortalecer FK (`ON DELETE RESTRICT`).
   - Converter chaves únicas para compostas com `tenant_id`.
   - Ajustar defaults/triggers se existirem.
5) Código:
   - Deploy dos middlewares e filtros automáticos.
   - Revisar todas as queries manuais.
6) Rollout:
   - Feature flag opcional para habilitar filtro global em produção por etapas (pode ser env `ENABLE_TENANT_SCOPE=true`).

## 4. Contexto de tenant (middleware)
- Novo middleware `tenantContextMiddleware` (ex.: `src/middlewares/tenantContext.js`):
  - Lê `Authorization` Bearer, verifica JWT (já emitido com `tenantId`).
  - Rejeita 401 se token ausente/ inválido; 400/422 se não houver `tenantId` no token.
  - Anexa `req.tenantId` e `req.user` (id/role) para downstream.
  - Aplicação: antes de todas as rotas `/api/**`, exceto `/api/auth/login`.
- Sem super admin: não há troca de tenant. Apenas aceitar o `tenantId` do token.

## 5. Camada de dados e reutilização
- Criar helper `withTenantFilter(table, tenantId)` que retorna um builder Supabase com `.eq("tenant_id", tenantId)` em SELECT/UPDATE/DELETE.
- Criar helper `injectTenant(payload, tenantId)` para INSERT, ignorando `tenant_id` vindo do client.
- Repositórios existentes devem aceitar `{ tenantId, ... }` e usá-lo para filtrar/inserir.
- Falhas ao omitir `tenantId` geram `ValidationError` e 400 no controller.

## 6. Ajustes por domínio
### 6.1 Auth/Login
- Login já retorna `tenantId` no token; sem mudanças funcionais.
- Adicionar middleware de contexto para demais rotas.

### 6.2 Users/Tenants
- `userRepository`: manter `tenant_id` obrigatório em criação; ajustar listagem para usar `tenantId` do contexto (não query param).
- `tenantRepository`: validar que operações respeitam tenant (geralmente leitura do próprio tenant ativo).

### 6.3 Processos e relacionadas
- `processosService`: todas as queries `from("processos")` devem receber `.eq("tenant_id", tenantId)` e JOINs com tabelas auxiliares tenant-aware devem incluir `.eq("...tenant_id", tenantId)` onde aplicável.
- Operações de criação/atualização/inativação devem forçar `tenant_id` do contexto no payload.
- Soft delete: manter filtro `tenant_id` no update.

### 6.4 Pessoas
- `pessoasRoute`: GET e POST devem usar `tenantId` do contexto; inserts adicionam `tenant_id` do contexto.

### 6.5 Petições/Histórico
- `peticaoService`, `modalService`, `n8nService`:
  - `Publicacao`, `Prazo`, `Andamento`, `upload_Documentos`, `processos` devem ser filtradas por `tenant_id`.
  - `finalizeProcess`: validar que `upload_Documentos` e `Prazo` pertencem ao mesmo `tenant_id`; incluir `tenant_id` no update de status.

### 6.6 Upload/Storage
- `uploadService`: salvar no bucket com path `<tenantId>/<filename>`; registrar `tenant_id` em `upload_Documentos`.
- `notifyN8NWebhook` deve enviar `tenant_id`; consumidores restauram contexto antes de ler/gravar.

### 6.7 Modelos
- `modelosService`: adicionar `tenant_id` em inserts e filtros em selects/updates/deletes para `Modelos_Peticao`.

### 6.8 Auxiliares/locais
- Tabelas globais (`estados`, `cidades`, `Feriado`) permanecem sem tenant.
- Demais auxiliares usados em joins devem ganhar `tenant_id` se forem dados do cliente; caso sejam catálogos globais, mantêm sem tenant (confirmar por tabela na migração).

## 7. APIs e contratos (REST)
- Requisições autenticadas devem carregar header `Authorization: Bearer <token>`; middleware extrai `tenantId`.
- Não aceitar `tenantId` no corpo ou query para recursos tenant-aware; usar sempre o contexto.
- Mensagens de erro em PT-BR; 401 para ausência/invalid token; 400/422 para payload inválido/sem tenant; 403 para acesso a recurso de outro tenant (checagem se necessário).

## 8. Observabilidade e segurança
- Logs: incluir `tenantId`, `userId` em `logInfo/logWarn/logError`.
- Métricas/tracing (se existirem): adicionar tag `tenant_id`.
- Validação de autorização: garantir que `user.tenant_id === req.tenantId` ao carregar usuário do token.
- Storage path segregado por `tenantId`.

## 9. Estratégia de testes
- Unit: helpers `withTenantFilter`/`injectTenant`; middleware de contexto (token ok/sem tenant/token inválido).
- Unit/integração: services `processos`, `pessoas`, `upload`, `modelos`, `n8n` verificando filtro por `tenant_id` e rejeição de recursos de outro tenant.
- Contrato (API):
  - Bloqueio sem token / sem tenant.
  - Inserções ignoram `tenantId` enviado e usam o do token.
  - Listagens não retornam dados de outro tenant.
- Dados de teste/fixtures: incluir `tenant_id` em todas as entidades; seeds com tenant padrão.

## 10. Rollout e migração operacional
- Executar migrações fase 1 + backfill em janela controlada (aceito downtime breve).
- Validar contagens pós-backfill e índices.
- Aplicar fase 2 (NOT NULL + uniques compostas).
- Deploy de código com middleware e filtros ativados (flag opcional para produção).
- Smoke tests: login, listagem de processos/pessoas/modelos, upload + n8n finalize.

## 11. Riscos e mitigação
- Filtro esquecido em query manual → usar helpers e revisar todas as chamadas Supabase.
- Colisão de unicidade ao compor → mapear e ajustar antes do NOT NULL.
- Jobs n8n sem tenant → incluir `tenant_id` na payload e validar no consumidor.
- Uploads existentes sem pasta por tenant → migrar caminhos antigos ou bloquear acesso legado até mover.

## 12. Tarefas recomendadas
- Criar middleware `tenantContextMiddleware` e aplicá-lo nas rotas `/api` (exceto login).
- Implementar helpers de scoping (filtro/injeção) e refatorar repositórios/serviços.
- Escrever scripts SQL de migração (fases 1 e 2) e script de backfill idempotente.
- Atualizar serviços: `processosService`, `pessoasRoute`, `peticaoService`, `uploadService`, `n8nService`, `modelosService`, etc., para usar `tenantId` do contexto.
- Ajustar storage para prefixo `<tenantId>/` e registrar `tenant_id` em `upload_Documentos`.
- Adicionar testes (unit/integração/contrato) cobrindo isolamento por tenant.

