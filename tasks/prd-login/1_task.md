<!-- Template para tarefa individual -->
# 1.0 - Planejamento e alinhamento de escopo e riscos

## Objetivo
- Consolidar escopo, riscos e dependências da entrega de login multi-tenant e CRUD de usuários.

## Escopo / Entregáveis
- Documento curto com decisões e premissas confirmadas.
- Lista priorizada de riscos e mitigação provisória.
- Mapa de dependências entre tarefas e insumos (env, Supabase, libs).

## Passos e subtarefas
- Revisar PRD/Tech Spec e registrar itens obrigatórios e fora de escopo.
- Validar premissas: e-mail único global, status ativo/inativo, uso de bcrypt custo 10, ausência de sessão.
- Listar riscos (bcrypt em Windows, rotas sem auth, brute force sem rate limiting) e mitigação temporária.
- Montar sequência e paralelismo das tarefas X.0 e insumos necessários.

## Dependências
- Nenhuma.

## Paralelizável?
- Não.

## Critérios de aceite
- Decisões e premissas documentadas e compartilhadas.
- Riscos e mitigação temporária acordados.
- Sequência/dependências claras para as demais tarefas.

## Testes
- Checklist de revisão de escopo validado.

## Notas
- Usar este artefato para destravar dúvidas rápidas durante desenvolvimento.

<!-- Template para tarefa individual -->
# 1.0 - Planejamento e setup

## Objetivo
- Consolidar premissas, dependências e configurações para o login multi-tenant antes da implementação.

## Escopo / Entregáveis
- Lista validada de premissas (e-mail único global, caminho do endpoint, uso de bcrypt).
- Verificação de configs existentes: `src/config/supabase.js`, disponibilidade do SDK e Node.
- Decisão sobre uso de `bcrypt` vs `bcryptjs` em ambiente atual.

## Passos e subtarefas
- 1.1 Revisar stack atual e confirmar reuso de `src/config/supabase.js`.
- 1.2 Validar disponibilidade/env vars `SUPABASE_URL` e `SUPABASE_KEY`.
- 1.3 Checar viabilidade do `bcrypt`; definir fallback `bcryptjs` se necessário.
- 1.4 Registrar decisões/pendências para as próximas tarefas.

## Dependências
- Nenhuma.

## Paralelizável?
- Sim, pode rodar em paralelo com organização de front (desde que sem dependências de backend).

## Critérios de aceite
- Premissas documentadas e acordadas.
- Dependências técnicas mapeadas (libs, env vars, acesso Supabase).
- Decisão sobre `bcrypt` vs `bcryptjs` registrada.

## Testes
- Não aplicável (tarefa de planejamento).

## Notas
- Facilitar integração futura: já antecipar caminhos dos novos arquivos.

