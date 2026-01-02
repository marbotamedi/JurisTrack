# 8.0 - Ajuste de Fluxo de Login e Menu Lateral

## Objetivo
- Consolidar o dashboard como a porta de entrada oficial do sistema e garantir a navegabilidade em todas as telas.

## Escopo / Entregáveis
- Redirecionamento configurado em `public/js/login.js`.
- Links de navegação atualizados em todos os arquivos HTML.

## Passos e subtarefas
- 8.1 Alterar a lógica de sucesso do login no `public/js/login.js` para redirecionar para `dashboard.html`.
- 8.2 Identificar todos os arquivos HTML na pasta `public/html/` que possuem menu lateral.
- 8.3 Inserir o link para "Dashboard" (com ícone correspondente) no topo da lista de navegação em cada arquivo.
- 8.4 Validar se o link "Ativo" (classe `active`) está configurado corretamente no `dashboard.html`.

## Dependências
- Tarefa 4.0 concluída.

## Paralelizável?
- Não. Requer que a página do dashboard já exista.

## Critérios de aceite
- Após o login, o usuário cai no `/dashboard`.
- Em qualquer página do sistema, o usuário consegue voltar para o Dashboard via menu lateral.

## Testes
- Fazer um fluxo completo de login e verificar o destino.
- Navegar por 3 ou 4 telas diferentes e testar o link do Dashboard no menu lateral.

## Notas
- Esta tarefa é repetitiva, redobrar a atenção para não esquecer nenhum arquivo HTML.

