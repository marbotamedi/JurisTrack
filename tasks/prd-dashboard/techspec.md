# Tech Spec - Dashboard Principal e KPIs Interativos

## 1. Visão Técnica e Objetivos
O objetivo é implementar uma nova página inicial (`/dashboard`) que forneça uma visão analítica e centralizada da carteira de processos do tenant. A solução deve ser performática, responsiva e integrada ao fluxo de autenticação existente.

## 2. Arquitetura e Componentes

### 2.1 Backend (Node.js/Express)
- **Novos Módulos**:
  - `src/controllers/dashboardController.js`: Gerencia as requisições de estatísticas e listagens detalhadas.
  - `src/services/dashboardService.js`: Camada de acesso a dados via Supabase, aplicando filtros de tenant.
  - `src/routes/dashboardRoute.js`: Expõe os endpoints protegidos por autenticação e contexto de tenant.
- **Middleware**: Utilizar o `tenantContextMiddleware` já existente para garantir isolamento de dados.

### 2.2 Frontend (HTML/JS/CSS)
- **Página**: `public/html/dashboard.html` utilizando Bootstrap 5 para grid e componentes.
- **Lógica**: `public/js/dashboard.js` para consumo de APIs e inicialização do `Chart.js`.
- **Estilos**: `public/css/dashboard.css` para customização dos cards de KPI e gráficos.

## 3. Endpoints de API

### 3.1 `GET /api/dashboard/summary`
Retorna os dados agregados para os cards de KPI e gráficos.
- **KPIs**:
  - `totalProcessos`: Contagem de processos ativos.
  - `valorCausaTotal`: Soma de `valor_causa` formatada.
  - `prazosUrgentesCount`: Count de prazos (próximos 7 dias).
  - `andamentosRecentesCount`: Count de andamentos (últimos 7 dias).
- **Gráficos**:
  - `distribuicaoSituacao`: [{ label, count }].
  - `distribuicaoFase`: [{ label, count }].
  - `topTribunais`: Top 5 tribunais [{ label, count }].

### 3.2 `GET /api/dashboard/prazos-detalhes`
Retorna listagem para o modal de prazos urgentes.
- **Campos**: Número do Processo, Descrição do Prazo, Data Limite.

### 3.3 `GET /api/dashboard/andamentos-detalhes`
Retorna listagem para o modal de andamentos recentes.
- **Campos**: Número do Processo, Descrição do Andamento, Data do Evento.

## 4. Modelo de Dados e Lógica

### 4.1 Consultas Supabase
- Todas as queries devem utilizar o helper `withTenantFilter` para garantir o `tenant_id`.
- **Lógica de Datas**:
  - Prazos: `.gte('data_limite', now)` e `.lte('data_limite', now + 7 days)`.
  - Andamentos: `.gte('data_evento', now - 7 days)` e `.lte('data_evento', now)`.
- **Agregações**:
  - Utilizar `.select('*', { count: 'exact', head: true })` para contagens rápidas.
  - Para somas (`valor_causa`), buscar todos os valores ativos e somar no service (ou utilizar RPC se necessário por performance).

## 5. Fluxo de Navegação e UI

### 5.1 Redirecionamento Pós-Login
- Alterar `public/js/login.js` para redirecionar de `/processos` para `/dashboard` após sucesso no login.

### 5.2 Menu Lateral
- Inserir link do Dashboard no topo da `nav` em todos os arquivos HTML (ex: `processos.html`, `usuarios.html`, etc.).

### 5.3 Modais
- Implementar modais Bootstrap 5 no `dashboard.html` que são populados via fetch ao clicar nos cards correspondentes.

## 6. Bibliotecas Terceiras
- **Chart.js**: Renderização dos gráficos de rosca e barras.
- **FontAwesome**: Ícones para os cards de KPI.
- **Bootstrap 5**: Layout, cards e modais.

## 7. Estratégia de Testes
- **Integração**: Validar que os endpoints de dashboard retornam apenas dados do tenant autenticado.
- **Unitário**: Testar lógica de formatação de moeda e filtros de data no `dashboardService`.
- **UI**: Verificar responsividade do grid de cards em dispositivos móveis.

## 8. Riscos e Mitigações
- **Performance de Soma**: Se o tenant tiver milhares de processos, a soma em memória pode ser lenta. *Mitigação*: Monitorar tempo de resposta e usar View ou RPC no Supabase se ultrapassar 1s.
- **Inconsistência de Menu**: Como o menu é replicado, um arquivo pode ser esquecido. *Mitigação*: Fazer checklist rigoroso de todos os HTMLs em `public/html/`.

