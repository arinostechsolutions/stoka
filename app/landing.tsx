'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  BarChart3, 
  Zap, 
  Shield, 
  Smartphone,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import ImageCarousel from '@/components/ImageCarousel'
import { motion } from 'framer-motion'

// Lista de imagens do carrossel - só mostrar se houver imagens
const carouselImages: Array<{
  src: string
  alt: string
  title?: string
  description?: string
}> = []

export default function LandingPage() {
  const [hasImages, setHasImages] = useState(false)

  useEffect(() => {
    // Verificar se há imagens no diretório public/carousel
    // Por enquanto, vamos verificar se o array tem imagens
    setHasImages(carouselImages.length > 0)
  }, [])

  const features = [
    {
      icon: Package,
      title: 'Gestão de Produtos',
      description: 'Cadastre e organize seus produtos com facilidade. Controle SKU, categorias e quantidades mínimas.',
    },
    {
      icon: TrendingUp,
      title: 'Movimentações',
      description: 'Registre entradas e saídas de forma rápida. Acompanhe o histórico completo de movimentações.',
    },
    {
      icon: AlertTriangle,
      title: 'Alertas Inteligentes',
      description: 'Receba avisos automáticos quando o estoque estiver baixo. Nunca mais fique sem produtos.',
    },
    {
      icon: BarChart3,
      title: 'Relatórios Completos',
      description: 'Visualize gastos, receitas e valor do estoque. Gráficos detalhados para análise completa.',
    },
    {
      icon: Zap,
      title: 'Rápido e Simples',
      description: 'Interface intuitiva e responsiva. Funciona perfeitamente no celular e no computador.',
    },
    {
      icon: Shield,
      title: 'Seguro e Confiável',
      description: 'Seus dados estão protegidos. Sistema desenvolvido com as melhores práticas de segurança.',
    },
  ]

  const benefits = [
    'Controle total do seu estoque',
    'Economia de tempo e recursos',
    'Decisões baseadas em dados',
    'Acesso de qualquer lugar',
    'Interface moderna e intuitiva',
    'Suporte completo',
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Image
              src="/stoka-logo.png"
              alt="Stoka Logo"
              width={200}
              height={120}
              className="h-10 w-auto md:h-14 md:w-auto"
              style={{ objectFit: 'contain' }}
            />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </Link>
            <Link href="#benefits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Benefícios
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
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Controle de Estoque
                <span className="text-primary"> Simples e Moderno</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl md:text-2xl max-w-2xl mx-auto">
                Gerencie seu estoque de forma eficiente. Ideal para pequenos negócios e microempreendedores.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="text-base">
                  <Link href="/register" className="flex items-center">
                    Começar Grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base">
                  <Link href="/login">Já tenho conta</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Carousel Section - Só mostra se houver imagens */}
        {hasImages && (
          <section className="container px-4 py-8 md:py-12">
            <ImageCarousel images={carouselImages} />
          </section>
        )}

        {/* Features Section */}
        <section id="features" className="container px-4 py-12 md:py-24 bg-muted/50">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Recursos Poderosos
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Tudo que você precisa para gerenciar seu estoque de forma profissional
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="container px-4 py-12 md:py-24">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Por que escolher o Stoka?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                A solução completa para o controle do seu estoque
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-base">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container px-4 py-12 md:py-24 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6">
              Pronto para começar?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Cadastre-se gratuitamente e comece a gerenciar seu estoque hoje mesmo
            </p>
            <Button asChild size="lg" variant="secondary" className="text-base">
              <Link href="/register" className="flex items-center">
                Criar Conta Grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container px-4 py-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center mb-4">
                <Image
                  src="/stoka-logo.png"
                  alt="Stoka Logo"
                  width={200}
                  height={120}
                  className="h-10 w-auto"
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Controle de estoque simples e moderno para pequenos negócios e microempreendedores.
              </p>
              <p className="text-xs text-muted-foreground">
                Distribuído por <strong>AG2 Soluções Tecnológicas</strong>
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    Entrar
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">
                    Cadastrar
                  </Link>
                </li>
                <li>
                  <Link href="/politica-privacidade" className="text-muted-foreground hover:text-foreground transition-colors">
                    Política de Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="/termos-uso" className="text-muted-foreground hover:text-foreground transition-colors">
                    Termos de Uso
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contato</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:contato@ag2tecnologia.com" className="hover:text-foreground transition-colors">
                    contato@ag2tecnologia.com
                  </a>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <a href="tel:+5522992645933" className="hover:text-foreground transition-colors">
                    (22) 99264-5933
                  </a>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>AG2 Soluções Tecnológicas</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Stoka. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

