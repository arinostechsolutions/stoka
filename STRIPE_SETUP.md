# Configuração do Stripe

Este documento explica como configurar o Stripe para o Stoka em ambientes de desenvolvimento e produção.

## 1. Criar conta no Stripe

1. Acesse [stripe.com](https://stripe.com) e crie uma conta
2. Complete a verificação da sua conta para poder receber pagamentos

## 2. Obter as chaves de API

### Ambiente de Teste (Development)

1. No Dashboard do Stripe, certifique-se de que está no **modo de teste** (toggle no canto superior direito)
2. Vá em **Developers > API keys**
3. Copie a **Publishable key** (começa com `pk_test_`)
4. Copie a **Secret key** (começa com `sk_test_`)

### Ambiente de Produção (Live)

1. Mude para o **modo live** no Dashboard
2. Vá em **Developers > API keys**
3. Copie a **Publishable key** (começa com `pk_live_`)
4. Copie a **Secret key** (começa com `sk_live_`)

## 3. Criar os Produtos e Preços

### No modo de teste:

1. Vá em **Products** no Dashboard do Stripe
2. Clique em **Add product**

#### Produto Starter:
- **Name**: Plano Starter
- **Description**: Gestão básica de estoque e vendas
- **Pricing**: 
  - R$ 49,90
  - Recurring (Mensal)
- Copie o **Price ID** (começa com `price_`)

#### Produto Premium:
- **Name**: Plano Premium
- **Description**: Solução completa para gestão e vendas online
- **Pricing**:
  - R$ 79,90
  - Recurring (Mensal)
- Copie o **Price ID** (começa com `price_`)

### Repita o processo no modo live para produção

## 4. Configurar Webhooks

### Para desenvolvimento local:

1. Instale o Stripe CLI: https://stripe.com/docs/stripe-cli
2. Faça login: `stripe login`
3. Inicie o listener:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copie o **webhook signing secret** que aparece no terminal (começa com `whsec_`)

### Para produção:

1. No Dashboard, vá em **Developers > Webhooks**
2. Clique em **Add endpoint**
3. URL do endpoint: `https://seu-dominio.com/api/stripe/webhook`
4. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copie o **Signing secret**

## 5. Configurar Customer Portal

1. No Dashboard, vá em **Settings > Billing > Customer portal**
2. Ative as opções desejadas:
   - ✅ Atualizar métodos de pagamento
   - ✅ Ver histórico de faturas
   - ✅ Cancelar assinatura
   - ✅ Trocar de plano
3. Salve as configurações

## 6. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu `.env.local` (desenvolvimento) ou ao seu serviço de hospedagem (produção):

```env
# URL do App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ========================================
# STRIPE - AMBIENTE DE TESTE (Development)
# ========================================

# Chaves de API - Teste
STRIPE_SECRET_KEY_TEST=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_xxx

# IDs dos Preços - Teste
STRIPE_PRICE_STARTER_TEST=price_xxx
STRIPE_PRICE_PREMIUM_TEST=price_xxx

# Webhook Secret - Teste
STRIPE_WEBHOOK_SECRET_TEST=whsec_xxx

# ========================================
# STRIPE - AMBIENTE DE PRODUÇÃO (Live)
# ========================================

# Chaves de API - Produção
STRIPE_SECRET_KEY_LIVE=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_xxx

# IDs dos Preços - Produção
STRIPE_PRICE_STARTER_LIVE=price_xxx
STRIPE_PRICE_PREMIUM_LIVE=price_xxx

# Webhook Secret - Produção
STRIPE_WEBHOOK_SECRET_LIVE=whsec_xxx
```

## 7. Como funciona a seleção de ambiente

O sistema automaticamente seleciona as chaves corretas baseado no `NODE_ENV`:

- `NODE_ENV=development` → Usa chaves `*_TEST`
- `NODE_ENV=production` → Usa chaves `*_LIVE`

## 8. Testar pagamentos

### Cartões de teste

Use estes cartões no modo de teste:

| Número | Resultado |
|--------|-----------|
| 4242 4242 4242 4242 | Pagamento aprovado |
| 4000 0000 0000 0002 | Pagamento recusado |
| 4000 0025 0000 3155 | Requer autenticação 3D Secure |

- Data de validade: qualquer data futura (ex: 12/34)
- CVC: qualquer 3 dígitos (ex: 123)
- CEP: qualquer CEP válido (ex: 01310-100)

## 9. Fluxo do usuário

1. Usuário acessa `/precos`
2. Clica em "Começar com Starter" ou "Começar com Premium"
3. Se não estiver logado, é redirecionado para `/register`
4. Se estiver logado, é redirecionado para o Checkout do Stripe
5. Após pagamento, é redirecionado para `/checkout/sucesso`
6. Usuário pode gerenciar assinatura em `/settings`

## 10. Eventos do Webhook

O sistema processa os seguintes eventos:

| Evento | Ação |
|--------|------|
| `checkout.session.completed` | Ativa a assinatura do usuário |
| `customer.subscription.updated` | Atualiza status da assinatura |
| `customer.subscription.deleted` | Cancela a assinatura |
| `invoice.payment_succeeded` | Atualiza período da assinatura |
| `invoice.payment_failed` | Marca como pagamento atrasado |

## 11. Aplicar Trial a Usuários Existentes

Se você já tem usuários cadastrados antes de implementar o Stripe, pode dar a eles um trial de 7 dias:

### Opção 1: Via API (Recomendado)

1. Adicione a variável de ambiente:
   ```env
   ADMIN_SECRET_KEY=sua_chave_secreta_aqui
   ```

2. Execute a requisição:
   ```bash
   # Em desenvolvimento (GET)
   curl "http://localhost:3000/api/admin/apply-trial?key=sua_chave_secreta_aqui"
   
   # Em produção (POST)
   curl -X POST https://seu-dominio.com/api/admin/apply-trial \
     -H "x-admin-key: sua_chave_secreta_aqui"
   ```

3. Resposta de sucesso:
   ```json
   {
     "success": true,
     "message": "Trial de 7 dias aplicado com sucesso",
     "usersUpdated": 15,
     "plan": "premium",
     "trialEndsAt": "2026-01-12T00:00:00.000Z"
   }
   ```

### Opção 2: Via Script (Linha de comando)

1. Instale as dependências:
   ```bash
   npm install dotenv ts-node --save-dev
   ```

2. Execute o script:
   ```bash
   npx ts-node scripts/apply-trial-to-existing-users.ts
   ```

### O que o script faz:

- Busca todos os usuários **sem** `subscriptionStatus` definido
- Aplica `subscriptionStatus: "trialing"`
- Define `plan: "premium"` (acesso total durante trial)
- Define `trialEndsAt` para 7 dias a partir de agora

⚠️ **Nota:** Esses usuários terão trial mas **não** terão assinatura no Stripe. Quando o trial acabar, eles precisarão assinar um plano pela página `/precos`.

## Suporte

Em caso de dúvidas, consulte a documentação oficial do Stripe: https://stripe.com/docs

