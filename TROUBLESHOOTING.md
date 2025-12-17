# Troubleshooting - Problemas de Autenticação no Railway

## Problema: API `/api/auth/callback/credentials` não funciona

### Checklist de Verificação

#### 1. Variáveis de Ambiente no Railway

Verifique se estas variáveis estão configuradas corretamente:

```
NEXTAUTH_URL=https://www.stoka.tech
NEXTAUTH_SECRET=sua_chave_secreta_aqui
MONGODB_URI=sua_string_de_conexao_mongodb
```

**Importante:**
- `NEXTAUTH_URL` deve ser exatamente `https://www.stoka.tech` (sem barra no final)
- `NEXTAUTH_SECRET` deve ser uma chave forte gerada aleatoriamente
- Após alterar variáveis, faça um **redeploy** no Railway

#### 2. Verificar Logs no Railway

1. No Railway, vá em **"Deployments"**
2. Clique no deployment mais recente
3. Veja os logs para identificar erros

Erros comuns:
- `NEXTAUTH_SECRET não está definido` → Adicione a variável
- `MongoDB connection failed` → Verifique o `MONGODB_URI`
- `Invalid callback URL` → Verifique o `NEXTAUTH_URL`

#### 3. Verificar Domínio Customizado

Se você está usando `www.stoka.tech`:

1. No Railway, vá em **"Settings"** → **"Domains"**
2. Verifique se o domínio está configurado corretamente
3. Certifique-se de que os registros DNS estão apontando para o Railway

#### 4. Redeploy Após Mudanças

Após alterar variáveis de ambiente:
1. Vá em **"Settings"** → **"Redeploy"**
2. Ou faça um novo commit e push para o GitHub (se tiver auto-deploy)

#### 5. Testar a API Diretamente

Teste se a rota está acessível:

```bash
curl https://www.stoka.tech/api/auth/providers
```

Deve retornar um JSON com os providers disponíveis.

#### 6. Verificar Console do Navegador

1. Abra o DevTools (F12)
2. Vá na aba **"Network"**
3. Tente fazer login
4. Veja se há erros na requisição para `/api/auth/callback/credentials`

Erros comuns:
- **404 Not Found** → A rota não está sendo encontrada (problema de build)
- **500 Internal Server Error** → Erro no servidor (verifique logs)
- **CORS Error** → Problema de configuração (já corrigido no next.config.js)

#### 7. Verificar Build no Railway

1. No Railway, vá em **"Deployments"**
2. Verifique se o build foi bem-sucedido
3. Se houver erros de build, corrija antes de fazer deploy

## Soluções Comuns

### Erro: "Invalid callback URL"

**Solução:**
- Certifique-se de que `NEXTAUTH_URL` está exatamente como `https://www.stoka.tech` (sem barra)
- Faça um redeploy após alterar

### Erro: "NEXTAUTH_SECRET não está definido"

**Solução:**
1. Gere uma nova chave: https://generate-secret.vercel.app/32
2. Adicione no Railway: `NEXTAUTH_SECRET=sua_chave_aqui`
3. Faça um redeploy

### Erro: "MongoDB connection failed"

**Solução:**
- Verifique se o `MONGODB_URI` está correto
- Se usar MongoDB Atlas, certifique-se de que o IP do Railway está autorizado (ou use `0.0.0.0/0`)

### API retorna 404

**Solução:**
- Verifique se o build foi bem-sucedido
- Certifique-se de que o arquivo `app/api/auth/[...nextauth]/route.ts` existe
- Faça um novo build e deploy

### Login não funciona mas não há erros

**Solução:**
1. Verifique os logs do Railway em tempo real
2. Teste se o MongoDB está acessível
3. Verifique se o usuário existe no banco de dados
4. Teste com um novo usuário criado diretamente no banco

## Teste Rápido

Execute este comando para testar se a API está funcionando:

```bash
curl -X POST https://www.stoka.tech/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"senha123","redirect":false,"csrfToken":"test"}'
```

Se retornar um erro de CSRF, é normal - significa que a rota está funcionando.

## Próximos Passos

Se ainda não funcionar:

1. Verifique os logs completos no Railway
2. Teste localmente com as mesmas variáveis de ambiente
3. Verifique se há algum problema com o domínio customizado
4. Entre em contato com o suporte do Railway se necessário

