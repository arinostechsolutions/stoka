'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Check, X, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PrecosPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/stoka-logo.png"
              alt="Stoka Logo"
              width={200}
              height={120}
              className="h-10 w-auto md:h-14 md:w-auto"
              style={{ objectFit: 'contain' }}
            />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </Link>
            <Link href="/#benefits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Benefícios
            </Link>
            <Link href="/precos" className="text-sm font-medium text-foreground">
              Preços
            </Link>
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Button asChild>
              <Link href="/register">Começar Grátis</Link>
            </Button>
          </nav>
          <div className="flex md:hidden items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Começar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container px-4 py-12 md:py-24">
          <div className="mx-auto max-w-4xl text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Planos e Preços
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Escolha o plano ideal para o seu negócio
              </p>
              <Link href="/">
                <Button variant="ghost" className="gap-2">
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
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-2xl">Plano Starter</CardTitle>
                  <CardDescription>
                    Ideal para gestão básica de estoque e vendas
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-6">
                    <div className="text-3xl font-bold">Grátis</div>
                    <div className="text-sm text-muted-foreground">7 dias gratuitos para experimentar</div>
                  </div>

                  <ul className="space-y-3 flex-1 mb-6">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Gestão de produtos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Gestão de fornecedores</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Controle de movimentações</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Relatórios e análises</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Notas fiscais</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground line-through">Cadastro de clientes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground line-through">Vitrine</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground line-through">Minha Loja</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground line-through">Campanhas</span>
                    </li>
                  </ul>

                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => window.open('https://wa.me/5522992645933?text=Olá! Gostaria de conhecer o Plano Starter do Stoka.', '_blank')}
                  >
                    Selecionar Plano
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
              <Card className="h-full flex flex-col border-primary border-2 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    MAIS POPULAR
                  </span>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl">Plano Premium</CardTitle>
                  <CardDescription>
                    Solução completa para gestão e vendas online
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-6">
                    <div className="text-3xl font-bold">Premium</div>
                    <div className="text-sm text-muted-foreground">7 dias gratuitos para experimentar</div>
                  </div>

                  <ul className="space-y-3 flex-1 mb-6">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Tudo do Plano Starter</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Cadastro completo de clientes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Vitrine personalizada</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Minha Loja online</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Criação e gestão de campanhas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Histórico de compras por cliente</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Sistema de parcelas e pagamentos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Suporte prioritário</span>
                    </li>
                  </ul>

                  <Button 
                    className="w-full"
                    onClick={() => window.open('https://wa.me/5522992645933?text=Olá! Gostaria de conhecer o Plano Premium do Stoka.', '_blank')}
                  >
                    Selecionar Plano
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
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Qual plano é ideal para você?
              </h2>
              <p className="text-muted-foreground mb-8">
                O Plano Starter é perfeito se você precisa apenas gerenciar seu estoque e fornecedores.
                <br />
                Escolha o Premium para ter acesso completo a todas as funcionalidades de vendas e gestão de clientes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="outline"
                  onClick={() => window.open('https://wa.me/5522992645933?text=Olá! Gostaria de conhecer o Plano Starter do Stoka.', '_blank')}
                >
                  Experimentar Starter Grátis
                </Button>
                <Button 
                  onClick={() => window.open('https://wa.me/5522992645933?text=Olá! Gostaria de conhecer o Plano Premium do Stoka.', '_blank')}
                >
                  Assinar Premium
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Stoka. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

