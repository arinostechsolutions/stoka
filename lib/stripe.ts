import Stripe from 'stripe'

// Verificar se estamos em ambiente de desenvolvimento ou produção
const isDevelopment = process.env.NODE_ENV === 'development'

// Usar chaves diferentes baseado no ambiente
const stripeSecretKey = isDevelopment 
  ? process.env.STRIPE_SECRET_KEY_TEST 
  : process.env.STRIPE_SECRET_KEY_LIVE

// Durante o build, podemos não ter todas as keys, então usamos uma placeholder
const finalStripeKey = stripeSecretKey || process.env.STRIPE_SECRET_KEY_TEST || 'sk_test_placeholder'

export const stripe = new Stripe(finalStripeKey, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
})

// Helper para verificar se Stripe está configurado corretamente
export function isStripeConfigured(): boolean {
  return !!stripeSecretKey
}

// IDs dos produtos/preços no Stripe (você precisa criar no painel do Stripe)
// Ambiente de teste
export const STRIPE_PRICES_TEST = {
  STARTER: process.env.STRIPE_PRICE_STARTER_TEST || '',
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM_TEST || '',
}

// Ambiente de produção
export const STRIPE_PRICES_LIVE = {
  STARTER: process.env.STRIPE_PRICE_STARTER_LIVE || '',
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM_LIVE || '',
}

// Retorna os preços corretos baseado no ambiente
export const getStripePrices = () => {
  return isDevelopment ? STRIPE_PRICES_TEST : STRIPE_PRICES_LIVE
}

// Chave pública para o frontend
export const getStripePublicKey = () => {
  return isDevelopment 
    ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST 
    : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE
}

// Planos disponíveis
export const PLANS = {
  STARTER: {
    name: 'Starter',
    price: 49.90,
    features: [
      'Gestão de produtos',
      'Gestão de fornecedores',
      'Controle de movimentações',
      'Relatórios e análises',
      'Notas fiscais',
    ],
  },
  PREMIUM: {
    name: 'Premium',
    price: 79.90,
    features: [
      'Tudo do Plano Starter',
      'Cadastro completo de clientes',
      'Vitrine personalizada',
      'Minha Loja online',
      'Criação e gestão de campanhas',
      'Histórico de compras por cliente',
      'Sistema de parcelas e pagamentos',
      'Suporte prioritário',
    ],
  },
}

// Dias de trial gratuito
export const TRIAL_DAYS = 7

