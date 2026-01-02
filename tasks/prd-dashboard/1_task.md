# 1.0 - Configuração de Rotas e Controller

## Objetivo
- Estabelecer a infraestrutura básica de rotas e o ponto de entrada no backend para as funcionalidades do dashboard.

## Escopo / Entregáveis
- Arquivo `src/routes/dashboardRoute.js` criado e configurado.
- Arquivo `src/controllers/dashboardController.js` criado com métodos iniciais (stubs).
- Rotas registradas no servidor principal (ex: `app.js` ou `index.js`).

## Passos e subtarefas
- 1.1 Criar `src/routes/dashboardRoute.js` definindo os endpoints `GET /summary`, `GET /prazos-detalhes` e `GET /andamentos-detalhes`.
- 1.2 Criar `src/controllers/dashboardController.js` com as funções `getSummary`, `getPrazosDetalhes` e `getAndamentosDetalhes`.
- 1.3 Importar e utilizar as novas rotas no arquivo principal da aplicação.
- 1.4 Aplicar o `tenantContextMiddleware` às rotas do dashboard.

## Dependências
- Middleware de autenticação e contexto de tenant existente.

## Paralelizável?
- Sim, pode ser iniciado simultaneamente com a criação da interface frontend (Tarefa 4.0).

## Critérios de aceite
- Os endpoints devem estar acessíveis (retornando status 200 com JSON vazio ou mock) para usuários autenticados.
- O isolamento de tenant deve estar garantido via middleware.

## Testes
- Testar chamada aos endpoints via Postman/Insomnia com token de autenticação válido.
- Verificar se a rota retorna erro 401/403 sem autenticação.

## Notas
- Seguir o padrão de nomenclatura e organização de pastas já estabelecido no projeto.

