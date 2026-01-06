'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Check, X, ArrowLeft, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PrecosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSelectPlan = async (planType: 'starter' | 'premium') => {
    // Se não estiver logado, redirecionar para registro
    if (status === 'unauthenticated') {
      router.push(`/register?plan=${planType}`)
      return
    }

    // Se estiver logado, criar checkout session
    setLoadingPlan(planType)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceType: planType }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Erro ao processar pagamento')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao processar pagamento')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-700 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/stoka-logo.png"
              alt="Stoka Logo"
              width={200}
              height={120}
              className="h-10 w-auto md:h-14 md:w-auto brightness-0 invert"
              style={{ objectFit: 'contain' }}
            />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Recursos
            </Link>
            <Link href="/#benefits" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Benefícios
            </Link>
            <Link href="/precos" className="text-sm font-medium text-white">
              Preços
            </Link>
            {session ? (
              <Button asChild className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Entrar
                </Link>
                <Button asChild className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                  <Link href="/register">Começar Agora</Link>
                </Button>
              </>
            )}
          </nav>
          <div className="flex md:hidden items-center gap-2">
            {session ? (
              <Button asChild size="sm" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button asChild size="sm" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                  <Link href="/register">Começar</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container px-4 py-12 md:py-24">
          <div className="mx-auto max-w-4xl text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                Planos e Preços
              </h1>
              <p className="text-xl text-slate-300 mb-8">
                Escolha o plano ideal para o seu negócio
              </p>
              <Link href="/">
                <Button variant="ghost" className="gap-2 text-slate-300 hover:text-white hover:bg-slate-800">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para página inicial
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Planos */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Plano Starter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="h-full flex flex-col bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Plano Starter</CardTitle>
                  <CardDescription className="text-slate-300">
                    Ideal para gestão básica de estoque e vendas
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">R$ 49,90</span>
                      <span className="text-slate-400">/mês</span>
                    </div>
                    <div className="text-sm text-green-400 font-medium">7 dias grátis para experimentar</div>
                  </div>

                  <ul className="space-y-3 flex-1 mb-6">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-200">Gestão de produtos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-200">Gestão de fornecedores</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-200">Controle de movimentações</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-200">Relatórios e análises</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-200">Notas fiscais</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-500 line-through">Cadastro de clientes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-500 line-through">Vitrine</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-500 line-through">Minha Loja</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-500 line-through">Campanhas</span>
                    </li>
                  </ul>

                  <Button 
                    className="w-full border-slate-600 bg-transparent text-white hover:bg-slate-700 hover:border-slate-500" 
                    variant="outline"
                    onClick={() => handleSelectPlan('starter')}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === 'starter' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      'Começar com Starter'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Plano Premium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="h-full flex flex-col bg-slate-800/50 border-blue-500/50 border-2 relative backdrop-blur-sm">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary to-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                    MAIS POPULAR
                  </span>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Plano Premium</CardTitle>
                  <CardDescription className="text-slate-300">
                    Solução completa para gestão e vendas online
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">R$ 79,90</span>
                      <span className="text-slate-400">/mês</span>
                    </div>
                    <div className="text-sm text-green-400 font-medium">7 dias grátis para experimentar</div>
                  </div>

                  <ul className="space-y-3 flex-1 mb-6">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-200">Tudo do Plano Starter</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-200">Cadastro completo de clientes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-200">Vitrine personalizada</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-200">Minha vitrine online</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-200">Analytics da Vitrine online</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-200">Criação e gestão de campanhas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-200">Histórico de compras por cliente</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-200">Suporte prioritário</span>
                    </li>
                  </ul>

                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white"
                    onClick={() => handleSelectPlan('premium')}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === 'premium' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      'Começar com Premium'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Comparação adicional */}
          <div className="mt-16 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                Qual plano é ideal para você?
              </h2>
              <p className="text-slate-300 mb-8">
                O Plano Starter é perfeito se você precisa apenas gerenciar seu estoque e fornecedores.
                <br />
                Escolha o Premium para ter acesso completo a todas as funcionalidades de vendas e gestão de clientes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="outline"
                  className="border-slate-600 bg-transparent text-white hover:bg-slate-700 hover:border-slate-500"
                  onClick={() => handleSelectPlan('starter')}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === 'starter' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Experimentar Starter'
                  )}
                </Button>
                <Button 
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                  onClick={() => handleSelectPlan('premium')}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === 'premium' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Assinar Premium'
                  )}
                </Button>
              </div>
            </motion.div>
          </div>

          {/* FAQ Pagamentos */}
          <div className="mt-16 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold mb-6 text-center text-white">Dúvidas Frequentes</h2>
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-4">
                  <h3 className="font-semibold mb-2 text-white">Como funciona o período de teste?</h3>
                  <p className="text-sm text-slate-300">
                    Você tem 7 dias grátis para experimentar todas as funcionalidades do plano escolhido. 
                    O primeiro pagamento só será cobrado após o término do período de teste.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-4">
                  <h3 className="font-semibold mb-2 text-white">Posso cancelar a qualquer momento?</h3>
                  <p className="text-sm text-slate-300">
                    Sim! Você pode cancelar sua assinatura a qualquer momento pelo portal de pagamentos. 
                    Não há multas ou taxas de cancelamento.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-4">
                  <h3 className="font-semibold mb-2 text-white">Quais formas de pagamento são aceitas?</h3>
                  <p className="text-sm text-slate-300">
                    Aceitamos todos os principais cartões de crédito (Visa, Mastercard, American Express, etc.). 
                    Os pagamentos são processados de forma segura pelo Stripe.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-4">
                  <h3 className="font-semibold mb-2 text-white">Posso trocar de plano depois?</h3>
                  <p className="text-sm text-slate-300">
                    Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
                    As alterações serão aplicadas no próximo ciclo de cobrança.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 relative z-10">
        <div className="container px-4 text-center text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} Stoka. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
