<!-- Template para tarefa individual -->
# 7.0 - Logs e observabilidade mínima

## Objetivo
- Padronizar logs e métricas mínimas para autenticação e CRUD de usuários, facilitando troubleshooting.

## Escopo / Entregáveis
- Convenção de logs (info/warn/error) aplicada em auth e CRUD.
- Campos mínimos em logs: userId (quando disponível), tenantId, e-mail normalizado (quando aplicável), ação, timestamp.
- Contagem básica de tentativas de login (mesmo sem bloqueio) e registro de falhas genéricas.
- Documentação breve de como consultar/interpretrar logs.

## Passos e subtarefas
- Definir utilitário ou padrão de log reutilizável nos controllers/services.
- Incluir logs info em sucesso e warn em falhas de validação/credenciais; error em exceções.
- Incluir contagem simples de tentativas (ex.: incremento em memória/log) para futura análise.
- Garantir mensagens em PT-BR e evitar vazamento de detalhes sensíveis.
- Documentar pontos de log e exemplos de saída.

## Dependências
- 3.0, 4.0.

## Paralelizável?
- Sim (após 3.0/4.0 estarem estáveis o suficiente).

## Critérios de aceite
- Logs presentes nos fluxos principais com níveis apropriados.
- Não vazar dados sensíveis (senha, hash, stack em resposta).
- Contagem ou registro de tentativas de login disponível para consulta.

## Testes
- Verificar logs em cenários de sucesso/falha para auth e CRUD.
- Confirmar que respostas ao cliente permanecem genéricas enquanto logs têm detalhes suficientes para suporte.

## Notas
- Planejar evolução futura para persistir logs/metrics; nesta fase, console é suficiente.

<!-- Template para tarefa individual -->
# 7.0 - Frontend lógica de login

## Objetivo
- Implementar a lógica client-side de validação e chamada ao endpoint de login.

## Escopo / Entregáveis
- `public/js/login.js` com validação de campos, controle de loading, chamada `fetch` para `/api/auth/login`.
- Tratamento de respostas 200/401 e exibição de mensagem genérica de erro.

## Passos e subtarefas
- 7.1 Validar campos obrigatórios e formato básico de e-mail antes do submit.
- 7.2 Desabilitar botão durante requisição e reabilitar após resposta.
- 7.3 Consumir endpoint, tratar 200/401, exibir mensagens em PT-BR.
- 7.4 Manter mensagens genéricas e não vazarem existência de usuário.

## Dependências
- 3.0 Backend rota/controller.
- 4.0 Backend serviço/repository.
- 6.0 Frontend página de login.

## Paralelizável?
- Não.

## Critérios de aceite
- Submit bloqueia quando campos vazios/invalid e-mail.
- Estados de loading e erro exibidos corretamente.
- Chamada ao endpoint conforme contrato (JSON `{ email, senha }`).

## Testes
- Teste manual: campos vazios, e-mail inválido, credenciais erradas, sucesso.
- Verificar reabilitação do botão após resposta.

## Notas
- Manter código simples (JS puro) conforme Tech Spec.
# 7.0 - Frontend da página de login

## Objetivo
- Disponibilizar tela de login em PT-BR com validação client-side e chamada ao endpoint.

## Escopo / Entregáveis
- `public/html/login.html` com formulário (email, senha, botão).
- `public/js/login.js` com validação e chamada `fetch` para `/api/auth/login`.
- `public/css/login.css` com estilo simples e foco visível.

## Passos e subtarefas
- 7.1 Criar HTML com labels, inputs e estados de carregando/erro.
- 7.2 Implementar validação: campos obrigatórios e formato básico de e-mail.
- 7.3 Implementar `fetch` POST JSON para o endpoint; tratar 200 e 401.
- 7.4 Exibir mensagem genérica em erro: "Credenciais inválidas ou usuário inativo".
- 7.5 Desabilitar botão durante requisição e reabilitar após resposta.
- 7.6 Garantir acessibilidade mínima (labels, foco visível, teclado).

## Dependências
- 4.0 (rota), 5.0 (service) para contrato de resposta.

## Paralelizável?
- Parcial. Pode ser codado em paralelo enquanto o backend avança, ajustando contrato ao final.

## Critérios de aceite
- Validação client-side bloqueia submit vazio ou e-mail inválido.
- Respostas do backend exibidas corretamente (sucesso/erro genérico).
- UI em PT-BR e responsiva simples.

## Testes
- Manual: fluxos de sucesso e erro (401) no navegador.
- Verificar desabilitar botão em estado de carregamento.

## Notas
- Não há persistência de sessão; apenas feedback imediato ao usuário.


