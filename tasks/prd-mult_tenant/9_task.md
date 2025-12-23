<!-- Template para tarefa individual -->
# 9.0 - Storage/uploads segregados por tenant

## Objetivo
- Segregar uploads por `tenantId`, prefixando caminhos no storage e registrando `tenant_id` nas tabelas de documentos.

## Escopo / Entregáveis
- Ajuste no `uploadService` para salvar em `<tenantId>/<filename>` no bucket `teste`.
- Registro de `tenant_id` em `upload_Documentos` e validação de acesso por tenant.
- Plano para lidar com uploads legados (migração ou bloqueio de acesso).

## Passos e subtarefas
- 9.1 Atualizar `uploadService` para prefixar caminhos com `<tenantId>/` e ignorar `tenant_id` vindo do cliente.
- 9.2 Ajustar persistência em `upload_Documentos` para incluir `tenant_id` do contexto.
- 9.3 Definir estratégia para uploads legados sem prefixo (mover ou bloquear).
- 9.4 Tests: integração garantindo salvamento no path prefixado e bloqueio de acesso entre tenants.

## Dependências
- 5.0, 6.0

## Paralelizável?
- Sim (com 5.0/6.0; independente das migrações após fase 1).

## Critérios de aceite
- Novos uploads armazenados sob prefixo de tenant e registrados com `tenant_id`.
- Acesso a arquivos de outro tenant é impedido.
- Estratégia para legados documentada/executada.

## Testes
- Integração: upload retorna path com prefixo de tenant; leitura sem tenant correspondente falha.
- Verificação de registro em `upload_Documentos` com `tenant_id` correto.

## Notas
- Coordenar com 7.0 para garantir que serviços que consomem uploads usem o mesmo path.
 
## Estratégia para uploads legados (sem prefixo)
- Inventariar registros em `upload_Documentos` com `tenant_id` nulo e caminhos sem `<tenantId>/`.
- Bloquear acesso público a legados: responder 404 quando `tenant_id` estiver ausente.
- Migrar gradualmente: mover objetos no bucket `teste` para `<tenantId>/<caminho_atual>` e atualizar `tenant_id` via script idempotente.
- Logar movimentos e falhas para reprocessar e rastrear impactos.
