<!-- Template para tarefa individual -->
# 6.0 - Seed inicial de tenant e admin

## Objetivo
- Criar script idempotente para provisionar tenant default e usuário admin com senha hash em Supabase.

## Escopo / Entregáveis
- Script `scripts/seed-login.js` lendo `.env` (`SUPABASE_URL`, `SUPABASE_KEY`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`).
- Criação de tenant default ativo e usuário admin ativo vinculado, se não existirem.
- Uso de bcrypt custo 10 para gerar `password_hash`.
- Instruções rápidas de execução/documentação.

## Passos e subtarefas
- Conectar ao Supabase via client existente.
- Verificar existência do tenant default; criar se ausente.
- Verificar usuário admin pelo e-mail normalizado; criar se ausente com role `admin`, status `ativo`, tenant vinculado.
- Garantir idempotência (não duplicar registros).
- Documentar comando de execução e variáveis necessárias.

## Dependências
- 2.0.

## Paralelizável?
- Sim (após 2.0; pode rodar em paralelo com 3.0/4.0/5.0).

## Critérios de aceite
- Execução sem erros em ambiente configurado; não duplica registros.
- Usuário e tenant criados ficam ativos e aptos para login.
- Hash de senha gerado com bcrypt custo 10.

## Testes
- Rodar script duas vezes e verificar ausência de duplicação.
- Validar login com o usuário seed após criação.

## Notas
- Se `bcrypt` nativo falhar, usar `bcryptjs` apenas neste script mantendo custo 10.

<!-- Template para tarefa individual -->
# 6.0 - Frontend página de login

## Objetivo
- Criar a estrutura visual e estilos básicos da página de login em PT-BR.

## Escopo / Entregáveis
- Arquivo `public/html/login.html` com formulário (e-mail, senha, botão).
- Estilos em `public/css/login.css` com responsividade básica e acessibilidade.
- Labels, foco visível e textos em PT-BR.

## Passos e subtarefas
- 6.1 Montar HTML com inputs type=email/password, botão “Entrar” e área de mensagens.
- 6.2 Aplicar estilos básicos (layout simples, foco visível, estados de erro).
- 6.3 Garantir semântica e atributos de acessibilidade (for/id, aria-live para mensagens).

## Dependências
- 1.0 Planejamento e setup.

## Paralelizável?
- Sim, pode avançar em paralelo ao backend.

## Critérios de aceite
- Página renderiza campos e botão em PT-BR.
- Acessibilidade mínima atendida (labels associados, foco visível).
- Layout responsivo básico.

## Testes
- Verificação manual da página em desktop e mobile viewport.

## Notas
- Deixar hooks (ids/classes) para o JS consumir estados de loading e erro.

