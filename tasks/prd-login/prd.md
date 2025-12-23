# PRD – Login multi-tenant

## 1. Visão geral e objetivos
- Permitir autenticação de usuários por e-mail e senha, garantindo acesso apenas aos dados do seu escritório (tenant).
- Suportar dois perfis iniciais: advogado e administrador.
- Manter controle de usuários e permissões no backend próprio (Node.js) usando tabelas do Supabase.

## 2. Escopo
- Incluso: tela de login (HTML/CSS/JS), validação básica no cliente, endpoint de autenticação no backend, verificação de senha com hash, checagem de vínculo usuário↔tenant e status ativos, retorno do perfil (advogado/admin) para uso futuro, mensagens de erro genéricas, registro mínimo de evento de login.
- Incluso (novo): CRUD básico de usuários via backend (listar, criar, atualizar, inativar/reativar) com armazenamento no Supabase; sem UI dedicada (API-first).
- Fora de escopo: middleware de proteção de rotas, sessões/refresh token, recuperação ou troca de senha, criação/gestão de usuários e tenants pela UI, rate limiting/captcha, auditoria detalhada, provedores sociais/SSO.

## 3. Usuários e perfis
- Advogado: acessa processos do seu tenant; sem permissões administrativas.
- Administrador: mesmos acessos do advogado + administração futura (fora do escopo atual, mas o perfil já retorna).

## 4. Fluxos principais
- Exibir tela de login com campos e-mail e senha.
- Validação client-side: campos obrigatórios, formato de e-mail.
- Submeter POST `/api/login` (ou equivalente) com e-mail e senha.
- Backend: localizar usuário pelo e-mail, verificar senha (hash bcrypt), status ativo e tenant ativo; confirmar vínculo único a um tenant.
- Responder com sucesso contendo `user_id`, `tenant_id`, `role` e mensagem; em caso de falha, resposta genérica (“Credenciais inválidas ou usuário inativo”).
- Não manter sessão: o front apenas recebe sucesso/erro; persitência de sessão é futura.
- Gestão de usuários (API):
  - Listar usuários de um tenant (filtro por status).
  - Criar usuário: recebe `email`, `password`, `role`, `tenant_id`, `status` inicial; valida unicidade de e-mail e vínculo obrigatório ao tenant.
  - Atualizar usuário: permite alterar `role`, `status`, senha (gera novo hash) e metadados básicos; e-mail permanece imutável após criação.
  - Inativar/Reativar usuário: muda `status`; inativação bloqueia login imediatamente.
  - Todos os endpoints retornam mensagens em PT-BR e resultados em JSON.

## 5. Requisitos funcionais (RF)
1. RF1: Disponibilizar página de login em PT-BR com campos de e-mail e senha e botão “Entrar”.
2. RF2: Validar no cliente obrigatoriedade dos campos e formato básico de e-mail antes do envio.
3. RF3: Enviar requisição POST para o endpoint de login com payload `{ email, senha }` em JSON.
4. RF4: Autenticar usuário apenas se `email` existir, `status` do usuário for ativo e `tenant` associado estiver ativo.
5. RF5: Verificar senha usando hash bcrypt armazenado; rejeitar senhas incorretas.
6. RF6: Enforce multi-tenant: cada usuário pertence a um único `tenant_id`; o backend deve incluir `tenant_id` na resposta de sucesso.
7. RF7: Incluir `role` (advogado|admin) na resposta de sucesso para uso futuro de autorização.
8. RF8: Retornar erro genérico em falhas de autenticação, sem indicar se e-mail existe ou status do usuário.
9. RF9: Registrar evento mínimo de login (data/hora, user_id quando sucesso) para troubleshooting.
10. RF10: Bloquear login se o usuário estiver inativo ou o tenant estiver inativo/suspenso.
11. RF11: Disponibilizar endpoint para listar usuários por `tenant_id`, com filtros opcionais de `status`.
12. RF12: Disponibilizar endpoint para criar usuário com payload `{ email, password, role, tenant_id, status }`; validar formato de e-mail, unicidade global de e-mail e vínculo obrigatório ao tenant.
13. RF13: Disponibilizar endpoint para atualizar usuário (exceto e-mail), incluindo alteração de `role`, `status` e redefinição de senha (gerar novo bcrypt hash).
14. RF14: Disponibilizar endpoint para inativar e reativar usuário; usuários inativos não podem autenticar.
15. RF15: Todas as respostas de gestão de usuários devem estar em PT-BR e usar JSON consistente (dados, mensagem, erros).

## 6. Requisitos não funcionais (RNF)
- RNF1: Resposta do endpoint de login ≤ 2s na média sob carga esperada inicial.
- RNF2: Armazenar senhas com bcrypt (custo recomendado 10) e nunca em texto plano.
- RNF3: Comunicações devem ocorrer sobre HTTPS (assumir terminação TLS no ambiente).
- RNF4: Mensagens em PT-BR e acessíveis (labels associados a inputs, foco visível, suporte a teclado).
- RNF5: Estrutura simples em HTML/CSS/JS; sem dependência obrigatória de framework.

## 7. Modelo de dados (Supabase)
- Tabela `tenants`: `id` (uuid), `nome`, `status` (ativo|inativo), `created_at`, `updated_at`.
- Tabela `users`: `id` (uuid), `tenant_id` (fk -> tenants), `email` (único global), `password_hash`, `role` (advogado|admin), `status` (ativo|inativo), `created_at`, `updated_at`.
- Índices recomendados: `users.email` (unique), `users.tenant_id`, `tenants.status`.
- Premissa: um usuário pertence a exatamente um tenant; e-mail único global.

## 8. UX/UI
- Campo e-mail (type=email) e campo senha (type=password) com rótulos claros.
- Estados: carregando (desabilitar botão), erro genérico, sucesso.
- Texto de erro: “Credenciais inválidas ou usuário inativo.”
- Layout simples, responsivo básico; idioma PT-BR.

## 9. Métricas e monitoramento
- Taxa de sucesso/falha de login.
- Contagem de tentativas por e-mail (mesmo sem bloqueio, para futura análise).

## 10. Riscos e dependências
- Ausência de rate limiting deixa vetores de força bruta mais expostos.
- Falta de sessão implica reautenticação ou ausência de proteção de rotas até middleware futuro.
- Necessidade de semântica clara de status ativo/inativo para tenants e usuários.

## 11. Decisões tomadas
- Bcrypt para hash de senhas; custo 10.
- Erro de autenticação sempre genérico.
- Dois perfis iniciais (advogado, admin); autorização não implementada agora.
- Sem limite de tentativas nesta entrega.
- Front em HTML/CSS/JS puro; framework opcional apenas se agregar valor futuro.

## 12. Perguntas residuais
- Confirmar se o e-mail deve ser único global (premissa atual) ou por tenant. Se por tenant, ajustar índice e verificação.

