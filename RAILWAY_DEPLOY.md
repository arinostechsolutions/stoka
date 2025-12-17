 # Deploy no Railway

## Passo a Passo para Deploy

### 1. Preparar o Repositório no GitHub

1. **Criar um repositório no GitHub** (se ainda não tiver):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```

2. **Verificar se o repositório está público ou privado**:
   - Railway pode acessar repositórios privados se você conectar sua conta GitHub

### 2. Conectar Railway ao GitHub

1. Acesse [Railway.app](https://railway.app)
2. Faça login com sua conta GitHub
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Autorize o Railway a acessar seus repositórios GitHub
6. Selecione o repositório do STOKA
7. Clique em **"Deploy Now"**

### 3. Configurar Variáveis de Ambiente no Railway

Após o deploy inicial, você precisa configurar as variáveis de ambiente:

1. No projeto Railway, vá em **"Variables"** ou **"Settings"**
2. Adicione as seguintes variáveis:

#### Variáveis Obrigatórias:

```
NEXTAUTH_SECRET=seu_secret_aqui_gerado_aleatoriamente
NEXTAUTH_URL=https://seu-projeto.railway.app
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/stoka?retryWrites=true&w=majority
```

#### Como gerar o NEXTAUTH_SECRET:

No terminal, execute:
```bash
openssl rand -base64 32
```

Ou use um gerador online: https://generate-secret.vercel.app/32

### 4. Configurar o Build no Railway

O Railway detecta automaticamente projetos Next.js, mas você pode verificar:

1. Vá em **"Settings"** do seu projeto
2. Verifique se o **"Build Command"** está como: `npm run build`
3. Verifique se o **"Start Command"** está como: `npm start`
4. O **"Root Directory"** deve estar vazio (raiz do projeto)

### 5. Configurar o Domínio (Opcional)

1. No Railway, vá em **"Settings"**
2. Em **"Domains"**, você pode:
   - Usar o domínio gerado automaticamente pelo Railway (ex: `seu-projeto.railway.app`)
   - Ou adicionar um domínio customizado

### 6. Verificar o Deploy

1. Após o deploy, acesse a URL fornecida pelo Railway
2. Verifique se a aplicação está funcionando
3. Teste o login/registro

## Troubleshooting

### Erro: "MongoDB connection failed"
- Verifique se o `MONGODB_URI` está correto
- Certifique-se de que o IP do Railway está autorizado no MongoDB Atlas (ou use `0.0.0.0/0` para permitir todos)

### Erro: "NEXTAUTH_SECRET is not set"
- Adicione a variável `NEXTAUTH_SECRET` no Railway
- Gere um novo secret e atualize

### Erro: "Build failed"
- Verifique os logs no Railway
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique se não há erros de TypeScript

### A aplicação não inicia
- Verifique os logs em tempo real no Railway
- Certifique-se de que o `NEXTAUTH_URL` está correto (deve ser a URL do Railway)

## Estrutura de Arquivos Necessários

Certifique-se de que estes arquivos estão no repositório:

- `package.json` ✅
- `next.config.js` ou `next.config.mjs` ✅
- `.env.example` ✅
- `tsconfig.json` ✅
- Todos os arquivos da aplicação ✅

## Comandos Úteis

### Ver logs em tempo real:
No Railway, vá em **"Deployments"** e clique no deployment mais recente para ver os logs.

### Reiniciar a aplicação:
No Railway, vá em **"Settings"** e clique em **"Restart"**.

### Ver variáveis de ambiente:
No Railway, vá em **"Variables"** para ver e editar todas as variáveis.

## Próximos Passos

Após o deploy bem-sucedido:

1. Teste todas as funcionalidades
2. Configure um domínio customizado (opcional)
3. Configure monitoramento e alertas (opcional)
4. Configure backups do banco de dados (MongoDB Atlas)

