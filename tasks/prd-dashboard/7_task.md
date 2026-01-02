# 7.0 - Implementação de Modais de Detalhamento

## Objetivo
- Adicionar interatividade aos cards de "Prazos Urgentes" e "Andamentos Recentes" para exibir informações detalhadas em modais.

## Escopo / Entregáveis
- Lógica de eventos de clique e carregamento dinâmico de tabelas dentro dos modais no `dashboard.js`.

## Passos e subtarefas
- 7.1 Adicionar listeners de clique nos cards de Prazos e Andamentos.
- 7.2 Implementar funções `openPrazosModal` e `openAndamentosModal`.
- 7.3 Realizar fetch para os endpoints de detalhamento (`/api/dashboard/prazos-detalhes` e `/api/dashboard/andamentos-detalhes`).
- 7.4 Gerar dinamicamente o conteúdo da tabela (HTML string ou DOM nodes) dentro do corpo do modal.
- 7.5 Mostrar o modal utilizando o objeto `bootstrap.Modal`.

## Dependências
- Tarefas 3.0 e 5.0 concluídas.

## Paralelizável?
- Não. Depende dos endpoints específicos e da lógica base de JS.

## Critérios de aceite
- Ao clicar no card, o modal deve abrir e exibir a lista correta.
- Se não houver dados, exibir uma mensagem informativa (ex: "Nenhum prazo para os próximos 7 dias").

## Testes
- Validar se o modal fecha corretamente ao clicar fora ou no botão fechar.
- Garantir que o conteúdo do modal seja limpo antes de uma nova carga para evitar duplicidade.

## Notas
- Formatar as datas para o padrão brasileiro (`DD/MM/YYYY`) na listagem dos modais.

