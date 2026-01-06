# Variáveis de Ambiente - Stoka

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
# ============================================
# STOKA - Variáveis de Ambiente
# ============================================

# --------------------------------------------
# BANCO DE DADOS (MongoDB)
# --------------------------------------------
# Crie uma conta em https://mongodb.com/atlas (grátis)
MONGODB_URI=mongodb+srv://usuario:senha@cluster.xxxxx.mongodb.net/stoka?retryWrites=true&w=majority

# --------------------------------------------
# AUTENTICAÇÃO (NextAuth.js)
# --------------------------------------------
# Gere com: openssl rand -base64 32
NEXTAUTH_SECRET=sua-chave-secreta-aqui

# URL do seu app
NEXTAUTH_URL=http://localhost:3000

# --------------------------------------------
# URL DO APP
# --------------------------------------------
NEXT_PUBLIC_APP_URL=http://localhost:3000

# --------------------------------------------
# CLOUDINARY (Upload de Imagens)
# --------------------------------------------
# Crie uma conta em https://cloudinary.com (grátis)
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=sua-api-secret

# --------------------------------------------
# ADMIN (Opcional)
# --------------------------------------------
# Chave para acessar rotas de admin (você inventa qualquer senha)
ADMIN_SECRET_KEY=sua-senha-admin-aqui

# ============================================
# STRIPE - PAGAMENTOS
# ============================================

# --------------------------------------------
# STRIPE - TESTE (Development)
# --------------------------------------------
# Dashboard Stripe → Developers → API Keys (modo TEST)

STRIPE_SECRET_KEY_TEST=sk_test_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_xxxxxxxxxxxxxxxxxxxx

# Products → Criar "Plano Starter" R$ 49,90/mês → Copiar Price ID
STRIPE_PRICE_STARTER_TEST=price_xxxxxxxxxxxxxxxxxxxx

# Products → Criar "Plano Premium" R$ 79,90/mês → Copiar Price ID
STRIPE_PRICE_PREMIUM_TEST=price_xxxxxxxxxxxxxxxxxxxx

# Stripe CLI: stripe listen --forward-to localhost:3000/api/stripe/webhook
STRIPE_WEBHOOK_SECRET_TEST=whsec_xxxxxxxxxxxxxxxxxxxx

# --------------------------------------------
# STRIPE - PRODUÇÃO (Live)
# --------------------------------------------
# ⚠️ SÓ PREENCHA QUANDO FOR PARA PRODUÇÃO

STRIPE_SECRET_KEY_LIVE=sk_live_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_xxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_STARTER_LIVE=price_xxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PREMIUM_LIVE=price_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET_LIVE=whsec_xxxxxxxxxxxxxxxxxxxx
```

## Resumo - De onde pegar cada uma:

| Variável | Onde conseguir |
|----------|----------------|
| `MONGODB_URI` | [MongoDB Atlas](https://mongodb.com/atlas) → Connect → Connection String |
| `NEXTAUTH_SECRET` | Você gera: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL do seu site |
| `NEXT_PUBLIC_APP_URL` | URL do seu site |
| `CLOUDINARY_*` | [Cloudinary](https://cloudinary.com) → Dashboard |
| `ADMIN_SECRET_KEY` | Você inventa (qualquer senha) |
| `STRIPE_SECRET_KEY_*` | [Stripe](https://dashboard.stripe.com) → Developers → API Keys |
| `STRIPE_PUBLISHABLE_KEY_*` | Stripe → Developers → API Keys |
| `STRIPE_PRICE_*` | Stripe → Products → Criar produto → Price ID |
| `STRIPE_WEBHOOK_SECRET_*` | Stripe CLI ou Dashboard → Webhooks |

## Passo a Passo Stripe:

1. **Criar conta:** https://stripe.com
2. **API Keys:** Dashboard → Developers → API Keys
3. **Criar Produtos:**
   - Products → Add Product
   - Nome: "Plano Starter" | Preço: R$ 49,90 | Recorrente: Mensal
   - Nome: "Plano Premium" | Preço: R$ 79,90 | Recorrente: Mensal
   - Copiar os Price IDs (começam com `price_`)
4. **Webhook (dev):** 
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

