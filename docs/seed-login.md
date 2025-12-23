# Seed inicial de login

## Variáveis necessárias (.env)
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_TENANT_NAME` (opcional, padrão: "Tenant Default")

## Como executar
```bash
npm install        # se ainda não instalou
npm run seed:login
```

## O que o script faz
- Garante a existência do tenant default ativo (reativa se estiver inativo).
- Cria ou ajusta o usuário admin (role `admin`, status `ativo`, senha hash bcrypt custo 10).
- Não duplica registros; pode ser executado múltiplas vezes.

## Teste rápido/manual
1) Rodar o comando duas vezes e verificar ausência de duplicação.
2) Validar login com o e-mail/senha seed (endpoint `/api/auth/login`).

