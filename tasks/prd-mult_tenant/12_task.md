<!-- Template para tarefa individual -->
# 12.0 - Rollout e feature flag

## Objetivo
- Planejar e executar o rollout do escopo multi-tenant com opção de flag (`ENABLE_TENANT_SCOPE`), incluindo smoke tests e checklist de deploy.

## Escopo / Entregáveis
- Plano de ativação por ambiente com janelas e responsáveis.
- Feature flag configurada (se adotada) e estratégia de ativação gradual.
- Checklist de deploy + smoke tests documentados.

## Passos e subtarefas
- 12.1 Definir estratégia de ativação: flag global ou ativação direta após migrações e código pronto.
- 12.2 Preparar checklist de deploy (ordem: migrações, backfill, fase 2, código, flag).
- 12.3 Executar rollout em staging: ativar flag (se usada), rodar smoke tests (login, listagens, uploads, jobs chave).
- 12.4 Executar rollout em produção: aplicar ordem acordada, monitorar logs/metrics e reverter flag se necessário.
- 12.5 Tests: smoke tests em cada ambiente e verificação de isolamento pós-ativação.

## Dependências
- 4.0, 11.0

## Paralelizável?
- Não.

## Critérios de aceite
- Rollout concluído com smoke tests verdes em staging e produção.
- Flag documentada e removível/desativável se necessário.
- Checklist e evidências de execução arquivados.

## Testes
- Smoke tests pós-deploy: login, listagem de processos/pessoas/modelos, upload + job n8n crítico.
- Monitoramento inicial sem erros de autorização/tenant em logs.

## Notas
- Se flag não for usada, registrar justificativa e plano de rollback alternativo.



