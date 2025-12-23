# Logs e observabilidade mínima (auth e CRUD de usuários)

## O que registramos
- `auth.login.success|failure`: login com ação, e-mail normalizado, `userId` e `tenantId` quando disponíveis, contadores de tentativas (`attempts`, `failures`) e carimbo de tempo.
- `users.*`: operações de CRUD (`list.success`, `create.success`, `update.success`, `inactivate.success`, `reactivate.success`) com `tenantId`, `id` do usuário quando aplicável, além do status/role atualizados.
- Erros/validações: `auth.login.validation`, `auth.login.error`, `users.request.invalid|not_found|error` guardam mensagens genéricas sem stack ou dados sensíveis na resposta. Stack só aparece no console.

## Onde ver
- Console do servidor Node (stdout/stderr). Em dev, rode `npm start` ou `node src/app.js` e observe o terminal.
- Logs são estruturados como JSON auxiliar no segundo argumento do `console`, facilitando grep ou redirecionamento para arquivo (`node src/app.js > logs.txt`).

## Exemplos
```
[auth.login.success] Login bem-sucedido {
  timestamp: "2025-12-23T03:12:45.123Z",
  action: "auth.login.success",
  email: "user@tenant.com",
  userId: "uuid-user",
  tenantId: "uuid-tenant",
  attempts: 3,
  failures: 1
}

[users.update.success] Usuário atualizado {
  timestamp: "2025-12-23T03:15:10.321Z",
  action: "users.update.success",
  id: "uuid-user",
  tenantId: "uuid-tenant",
  role: "admin",
  status: "ativo",
  passwordUpdated: true
}
```

## Contagem de tentativas de login
- Contador em memória por e-mail normalizado (`attempts`, `failures`, `lastOutcome`). Reinicia a cada restart do servidor.
- Cada tentativa (sucesso ou falha) registra o total acumulado nos logs `auth.login.*`.

## Boas práticas adotadas
- Mensagens em PT-BR e sem exposição de senha/hash.
- Campos mínimos em todos os logs: ação, timestamp, e-mail normalizado (quando aplicável) e `userId`/`tenantId` sempre que disponíveis.
- Níveis: `info` (sucesso), `warn` (validação/falha esperada), `error` (exceções internas).

