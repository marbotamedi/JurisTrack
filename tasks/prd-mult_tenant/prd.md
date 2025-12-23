## PRD – Adequação Multi-Tenant no JurisTrack

### Visão Geral
- Objetivo: garantir isolamento lógico por `tenant_id` em todas as tabelas e camadas (API, serviços, jobs, cache, storage), usando o tenant presente no token.
- Escopo: todas as entidades de negócio (exceto tabelas globais) passam a ter `tenant_id` com FK para `tenants`, filtros obrigatórios e constraints únicas compostas.
- Fora de escopo: estratégia de multi-tenant por schema/database separado; mudanças no fluxo de login (já retorna tenant).

### Problema
- Somente `users` possui `tenant_id`; demais tabelas não são segregadas.
- Riscos: vazamento de dados entre clientes, colisão de chaves únicas e operações sem filtro por tenant.

### Metas e Critérios de Sucesso
- Nenhuma leitura/escrita cruzada entre tenants (testes automatizados cobrindo).
- Consultas, mutações e joins aplicam `tenant_id` para todas as tabelas tenant-aware.
- Unicidade sensível ao tenant (ex.: `(tenant_id, email)`).
- Jobs/filas, cache e storage segregados por `tenant_id`.
- Observabilidade (logs/metrics/tracing) inclui `tenant_id`.

### Requisitos Funcionais
1) Contexto de tenant
- Middleware extrai `tenant_id` do token e rejeita requisições sem tenant.
- Suporte opcional a “super admin” para troca de tenant com regra clara e validação.

2) Persistência
- Tabelas tenant-aware recebem coluna `tenant_id` (FK para `tenants`), NOT NULL após backfill.
- Constraints únicas tornam-se compostas com `tenant_id`.
- Índice em `tenant_id`; revisar índices existentes após a mudança.

3) Consultas e mutações
- SELECT/UPDATE/DELETE sempre filtram por `tenant_id`.
- INSERT força `tenant_id` do contexto (não confiar no payload).
- JOINs entre tabelas tenant-aware incluem igualdade de tenant.

4) Domínio/Serviços
- Serviços/repositórios recebem ou derivam `tenant_id` do contexto.
- Caches chaveados por `tenant_id`.
- Arquivos/blobs usam prefixo por `tenant_id` (se storage compartilhado).
- Jobs/filas carregam `tenant_id` na payload e restauram contexto no consumidor.

5) Observabilidade e Segurança
- Logs/metrics/traces incluem `tenant_id`.
- Autorização valida se o usuário pertence ao tenant do contexto.

6) Testes
- Fixtures/seeds incluem `tenant_id`.
- Testes de isolamento: não retornar dados de outro tenant; chaves únicas por tenant; operações sem tenant são bloqueadas.

### Requisitos Não Funcionais
- Migração segura e reversível por etapas.
- Impacto mínimo em performance (índices adequados).
- Scripts idempotentes de backfill.

### Plano de Migração (fases)
1) Preparação
- Inventário de tabelas tenant-aware vs globais.
- Listar chaves únicas a converter para compostas.
- Definir tenant padrão para backfill em cada ambiente.

2) Migração de esquema (fase 1)
- Adicionar `tenant_id` nullable nas tabelas tenant-aware.
- Criar índices em `tenant_id` e FKs permitindo NULL.
- Ainda não alterar uniques para evitar quebra precoce.

3) Backfill
- Preencher `tenant_id` com tenant padrão ou regra derivada (script idempotente).
- Validar contagem de linhas e consistência.

4) Migração de esquema (fase 2)
- Tornar `tenant_id` NOT NULL.
- Ativar FKs definitivas.
- Converter chaves únicas para `(tenant_id, <coluna>)`.
- Ajustar triggers/defaults se existirem.

5) Ajustes de código
- Middleware de contexto de tenant (token → `context.tenantId`).
- Base repository/DAO com filtro automático em SELECT/UPDATE/DELETE e injeção em INSERT.
- Ajustar serviços/queries manuais para usar o contexto.
- Ajustar JOINs para igualdade de tenant.
- Jobs/filas: incluir `tenant_id` no payload; consumidores restauram contexto.
- Cache/storage: segregar por `tenant_id`.

6) Observabilidade e testes
- Incluir `tenant_id` em logs/metrics/traces.
- Atualizar seeds/fixtures.
- Adicionar testes de isolamento e de unicidade composta.

7) Rollout
- Feature flag para ativar o filtro global por partes, se possível.
- Deploy em staging com migrações e backfill; validar testes e consultas críticas.
- Deploy em produção com janelas curtas e monitoramento.

### Riscos e Mitigações
- Filtro de tenant esquecido em query manual → camada base com escopo obrigatório.
- Colisão de unicidade ao compor → mapear e migrar antes de aplicar NOT NULL.
- Jobs sem tenant → falha silenciosa; validar payloads e adicionar checagens.
- Cache/storage compartilhado vazando dados → prefixar por `tenant_id`.

### Métricas de Aceite
- Testes de isolamento passando (consultas não cruzam tenants).
- 100% das tabelas tenant-aware com `tenant_id` NOT NULL + FK.
- Unicidades compostas aplicadas nas entidades críticas (ex.: usuários, processos, clientes).
- Logs/metrics exibem `tenant_id` em requisições e jobs.

### Próximos Passos Imediatos
- Inventariar tabelas tenant-aware e listar constraints únicas a converter.
- Definir tenant padrão para backfill por ambiente.
- Especificar migrações faseadas (nullable → backfill → NOT NULL/FK → uniques compostas).
- Esboçar middleware de contexto e base repository com filtro automático.
- Planejar testes/fixtures com `tenant_id`.

