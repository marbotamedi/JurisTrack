<!-- Template para tarefa individual -->
# 7.0 - Refatoração de serviços e rotas tenant-aware

## Objetivo
- Aplicar filtros/injeções de `tenant_id` e validações de autorização em serviços e rotas que manipulam dados tenant-aware.

## Escopo / Entregáveis
- Serviços/rotas atualizados: `processosService`, `locaisService` (quando tenant-aware), `pessoasRoute`, `peticaoService`, `uploadService`, `modalService`, `n8nService`, `modelosService`, `userRepository`, `tenantRepository`.
- JOINs ajustados para igualdade de tenant onde aplicável.
- Validações de autorização por tenant (usuário pertence ao tenant do contexto).

## Passos e subtarefas
- 7.1 Injetar `tenantId` do contexto em todos os serviços/rotas listados; remover confiança em payload de cliente.
- 7.2 Garantir filtros `.eq("tenant_id", tenantId)` em SELECT/UPDATE/DELETE e nas JOINs relevantes.
- 7.3 Ajustar validações de autorização (`user.tenant_id === req.tenantId` onde pertinente).
- 7.4 Tests: unit/integração por domínio (processos, pessoas, uploads, modelos, petições/n8n) verificando isolamento e rejeição sem tenant.

## Dependências
- 5.0, 6.0

## Paralelizável?
- Parcial (por domínio, desde que dependências atendidas).

## Critérios de aceite
- Nenhuma rota/serviço tenant-aware acessa dados sem filtro por `tenant_id`.
- Inserts ignoram `tenant_id` enviado pelo cliente e usam o do contexto.
- Autorização básica por tenant aplicada.
- Testes por domínio cobrindo cenários de isolamento.

## Testes
- Integração: listagens não retornam dados de outro tenant; inserts/updates rejeitam falta de tenant.
- Unit: checar JOINs com igualdade de tenant.

## Notas
- Revisar serviços com queries manuais para evitar escapes ao helper padrão.



