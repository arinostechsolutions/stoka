# Configuração de Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Database
# MongoDB connection string
# Exemplo local: mongodb://localhost:27017/stoka
# Exemplo MongoDB Atlas: mongodb+srv://usuario:senha@cluster.mongodb.net/stoka
MONGODB_URI=mongodb://localhost:27017/stoka

# NextAuth Configuration
# URL base da aplicação (sem barra no final)
# OPCIONAL em desenvolvimento (NextAuth detecta automaticamente)
# OBRIGATÓRIO em produção: https://seu-dominio.com
NEXTAUTH_URL=http://localhost:3000

# Chave secreta para NextAuth (OBRIGATÓRIA - gere uma chave aleatória forte)
# Você pode gerar uma com: openssl rand -base64 32
# OU use: https://generate-secret.vercel.app/32
# IMPORTANTE: Sem esta variável, a autenticação não funcionará!
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# App Configuration (opcional - não usado atualmente)
# URL da aplicação (pode ser igual ao NEXTAUTH_URL)
# APP_URL=http://localhost:3000
```

## Como gerar o NEXTAUTH_SECRET

### No Linux/Mac:
```bash
openssl rand -base64 32
```

### No Windows (PowerShell):
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Online:
Acesse: https://generate-secret.vercel.app/32

## Exemplos de MONGODB_URI

### MongoDB Local:
```
MONGODB_URI=mongodb://localhost:27017/stoka
```

### MongoDB Atlas:
```
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/stoka?retryWrites=true&w=majority
```

### Railway MongoDB:
```
MONGODB_URI=mongodb://mongo:27017/stoka
```
(Use a variável fornecida pelo Railway)

## Variáveis para Produção (Railway)

No Railway, configure as seguintes variáveis:

- `MONGODB_URI` - Fornecido pelo serviço MongoDB do Railway (OBRIGATÓRIO)
- `NEXTAUTH_SECRET` - Gere uma chave secreta forte e única (OBRIGATÓRIO)
- `NEXTAUTH_URL` - URL do seu app no Railway (OBRIGATÓRIO em produção)
  - Exemplo: `https://stoka.railway.app`
  - Sem barra no final!

