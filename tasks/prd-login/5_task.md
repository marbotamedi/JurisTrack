<!-- Template para tarefa individual -->
# 5.0 - Frontend da página de login

## Objetivo
- Entregar página de login em PT-BR com validação client-side, chamada ao endpoint de auth e feedback de estado.

## Escopo / Entregáveis
- Arquivos `public/html/login.html`, `public/js/login.js`, `public/css/login.css`.
- Formulário com inputs e-mail (type=email) e senha (type=password) com labels e acessibilidade básica.
- Validação de campos obrigatórios e formato de e-mail antes do submit.
- Chamada `fetch` para `/api/auth/login`, tratamento de 200/401/400 e exibição de mensagem genérica em erro.
- Estados de carregamento (botão desabilitado) e foco visível.

## Passos e subtarefas
- Montar HTML sem framework com estrutura semântica e textos em PT-BR.
- Implementar JS de validação: required, regex básica de e-mail, bloqueio de submit inválido.
- Implementar chamada fetch POST JSON `{ email, senha }`, tratar respostas e exibir mensagens.
- Adicionar estilos mínimos responsivos e foco visível; desabilitar botão durante requisição.
- Garantir mensagens de erro/sucesso alinhadas ao backend (“Credenciais inválidas ou usuário inativo.”).

## Dependências
- 3.0.

## Paralelizável?
- Sim (após 3.0; pode rodar em paralelo com 4.0/6.0/7.0).

## Critérios de aceite
- Validação client-side impede envio vazio ou e-mail inválido.
- Requisições corretas exibem sucesso; erros exibem mensagem genérica em PT-BR.
- Acessibilidade básica: labels associados, foco visível, navegação por teclado.

## Testes
- Manual: submit vazio bloqueado; e-mail inválido bloqueado; sucesso exibe mensagem; erro 401/400 exibe mensagem genérica; botão desabilita durante requisição.

## Notas
- Não há persistência de sessão nesta fase; apenas feedback imediato ao usuário.

<!-- Template para tarefa individual -->
# 5.0 - Tratamento de erros e logs

## Objetivo
- Padronizar respostas e logging para o fluxo de login.

## Escopo / Entregáveis
- Tratamento centralizado de respostas 200/400/401/500 no controller/service.
- Mensagens genéricas em PT-BR para falhas de autenticação.
- Logs `console.info` (sucesso) e `console.warn` (falha) com dados mínimos.

## Passos e subtarefas
- 5.1 Garantir resposta 200 com `{ userId, tenantId, role, message: "Login realizado com sucesso" }`.
- 5.2 Garantir resposta 401 com `{ message: "Credenciais inválidas ou usuário inativo" }` em falhas de auth.
- 5.3 Resposta 400 para payload inválido; 500 para exceções internas.
- 5.4 Adicionar logs mínimos conforme Tech Spec.

## Dependências
- 3.0 Backend rota/controller.
- 4.0 Backend serviço/repository.

## Paralelizável?
- Não.

## Critérios de aceite
- Contratos de resposta alinhados ao Tech Spec.
- Logs emitidos conforme cenários de sucesso/falha.
- Mensagens não vazam existência de usuário.

## Testes
- Exercitar 200/400/401/500 via requisições de integração ou mocks.

## Notas
- Centralizar mensagens em constantes se já houver padrão no projeto.

