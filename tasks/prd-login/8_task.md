<!-- Template para tarefa individual -->
# 8.0 - Testes e QA (unitário/contrato/manual)

## Objetivo
- Cobrir cenários críticos de autenticação e CRUD com testes unitários/contrato e roteiro manual para o front.

## Escopo / Entregáveis
- Conjunto de casos unitários prioritários para authService e userService.
- Casos de contrato/smoke para endpoints `/api/auth/login` e `/api/users`.
- Roteiro manual para a página de login (validações, fluxos de sucesso/erro).
- Registro de resultados e gaps conhecidos.

## Passos e subtarefas
- Implementar testes unitários para auth: sucesso, usuário inexistente, usuário inativo, tenant inativo, senha incorreta.
- Implementar testes unitários para CRUD: criar válido, e-mail duplicado/formato inválido, role/status inválidos, tenant inexistente, update role/status/senha, inativar/reativar.
- Criar testes de contrato/smoke para endpoints (200/201/400/401/404 conforme casos).
- Definir e executar roteiro manual para o front: validação client-side, mensagens genéricas, estados de carregamento.
- Registrar evidências e gaps a endereçar em fases futuras.

## Dependências
- 3.0, 4.0, 5.0.

## Paralelizável?
- Parcial (pode iniciar esqueleto após 3.0/4.0; validar front após 5.0).

## Critérios de aceite
- Casos críticos cobrem todos os requisitos funcionais principais de auth e CRUD.
- Endpoints retornam códigos/mensagens esperados em PT-BR.
- Roteiro manual executado no front com resultados registrados.

## Testes
- Execução da suíte unitária/contrato passa sem falhas; checklist manual completo.

## Notas
- Registrar gaps conhecidos (ex.: ausência de rate limiting, ausência de sessão) para acompanhamento.

<!-- Template para tarefa individual -->
# 8.0 - Testes e QA

## Objetivo
- Validar funcionalmente o login no serviço e no front, cobrindo casos de sucesso e falha.

## Escopo / Entregáveis
- Testes unitários do service de auth.
- Checklist/manual do endpoint (200/400/401/500).
- Passos de teste manual no front (validação client-side, mensagens, loading).

## Passos e subtarefas
- 8.1 Escrever testes unit do service: sucesso, usuário inexistente, usuário inativo, tenant inativo, senha incorreta.
- 8.2 Exercitar endpoint com payloads válidos/invalid (400/401/200).
- 8.3 Testar front manualmente: campos vazios, e-mail inválido, credenciais erradas, sucesso.
- 8.4 Registrar resultados e gaps (ex.: falta de rate limiting, ausência de sessão).

## Dependências
- 3.0 Backend rota/controller.
- 4.0 Backend serviço/repository.
- 7.0 Frontend lógica de login.

## Paralelizável?
- Não.

## Critérios de aceite
- Casos de teste executados e documentados.
- Falhas esperadas retornam mensagens genéricas.
- Front bloqueia submissão inválida e apresenta estados corretos.

## Testes
- Incluídos nas subtarefas (unit + manual).

## Notas
- Se não houver suíte de testes configurada, registrar comandos manualmente (curl/Postman).
# 8.0 - Observabilidade e mensagens

## Objetivo
- Garantir logs mínimos e mensagens padronizadas em PT-BR para o fluxo de login.

## Escopo / Entregáveis
- Logs `console.info` para sucesso e `console.warn` para falha, com campos mínimos.
- Mensagens genéricas padronizadas em responses (400/401/500) e no front.
- Checklist de riscos conhecidos documentados.

## Passos e subtarefas
- 8.1 Padronizar mensagens retornadas pelo controller/service (400/401/500).
- 8.2 Confirmar mensagens exibidas no front são idênticas às do backend para erros genéricos.
- 8.3 Incluir logs mínimos no service (sucesso/falha) conforme Tech Spec.
- 8.4 Registrar riscos aceitos (sem rate limit, sem sessão) e próximos passos.

## Dependências
- 4.0, 5.0 (para mensagens/fluxo).

## Paralelizável?
- Sim. Pode ocorrer em paralelo ao frontend após o contrato estabilizar.

## Critérios de aceite
- Mensagens consistentes e em PT-BR.
- Logs presentes e úteis para troubleshooting inicial.

## Testes
- Verificar logs em sucesso e falha.
- Validar respostas 401/400/500 mantêm mensagem genérica.

## Notas
- Evitar logging de senha ou detalhes sensíveis.


