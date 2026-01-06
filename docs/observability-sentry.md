# Observabilidade com Sentry (backend Express)

## Variáveis de ambiente
- `SENTRY_DSN`: DSN do projeto no Sentry. Sem este valor o Sentry fica desabilitado.
- `SENTRY_ENVIRONMENT`: nome do ambiente (`prod`, `stg`, `dev`, etc.).
- `SENTRY_RELEASE`: identificação da release (ex.: commit ou tag).
- `SENTRY_TRACES_SAMPLE_RATE`: amostragem de tracing (padrão 0.1).
- `SENTRY_PROFILES_SAMPLE_RATE`: amostragem de profiling (padrão 0.05).

## Como funciona
- Inicialização no `src/app.js` via `initSentry(app)`; se não houver DSN, todos os middlewares do Sentry viram no-ops.
- Middlewares conectados: request + tracing antes das rotas e error handler após as rotas.
- `logger` envia `info`, `warn` e `error` para o Sentry (a menos que `sendToSentry:false` seja passado no contexto).
- Middleware `traceMiddleware` gera/propaga `X-Trace-Id` em todas as requisições e injeta `trace_id` como tag no Sentry.
- Erros globais (`unhandledRejection` e `uncaughtException`) são capturados quando o Sentry está habilitado.
- `requestLogger` continua apenas no console para evitar ruído no Sentry.

## Como validar localmente
1) Configure o `.env` com um DSN de teste e o ambiente desejado:
```
SENTRY_DSN=SEU_DSN_DE_TESTE
SENTRY_ENVIRONMENT=dev
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.05
```
2) Suba a API: `npm start`.
3) Gere um evento de aviso (warning): chame uma rota protegida sem token, por exemplo `GET /api/processos` sem `Authorization`. O middleware de tenant retornará 401 e registrará um `logWarn`, que será enviado ao Sentry.
4) Gere um evento de erro: provoque um erro de negócio (ex.: payload inválido em rotas que exigem campos obrigatórios) e verifique a aparição do evento `error` no Sentry.
5) Confirme no painel do Sentry que aparecem as tags de `action`, `tenantId` e `userId` (quando presentes).

## Notas para produção
- Utilize DSNs separados por ambiente.
- Ajuste `TRACES/PROFILES_SAMPLE_RATE` via ambiente para controlar custos sem mudar código.
- `SENTRY_RELEASE` é opcional, mas recomendado para versionar eventos e facilitar futuros sourcemaps.

