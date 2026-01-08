'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  TrendingUp, 
  BarChart3, 
  Zap, 
  Shield, 
  Smartphone,
  Mail,
  Phone,
  CheckCircle2,
  ArrowRight,
  Star,
  Sparkles,
  Menu,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Animações
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: Package,
      title: 'Gestão de Produtos',
      description: 'Cadastre e organize seus produtos com facilidade. Controle SKU, categorias e estoque mínimo.',
    },
    {
      icon: TrendingUp,
      title: 'Movimentações',
      description: 'Registre entradas e saídas em segundos. Histórico completo sempre disponível.',
    },
    {
      icon: BarChart3,
      title: 'Relatórios Inteligentes',
      description: 'Visualize gastos, receitas e tendências. Dados que ajudam você a decidir.',
    },
    {
      icon: Zap,
      title: 'Rápido e Simples',
      description: 'Interface limpa e intuitiva. Sem complicações, direto ao ponto.',
    },
    {
      icon: Shield,
      title: 'Seguro',
      description: 'Seus dados protegidos com as melhores práticas de segurança.',
    },
    {
      icon: Smartphone,
      title: 'Use em Qualquer Lugar',
      description: 'Funciona perfeitamente no celular, tablet ou computador.',
    },
  ]

  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'Dona de Boutique',
      content: 'Finalmente um sistema que não complica. Consigo controlar todo meu estoque pelo celular enquanto atendo os clientes.',
      rating: 5,
    },
    {
      name: 'João Santos',
      role: 'Dono de Mercearia',
      content: 'Antes eu perdia muito tempo com planilhas. Agora em minutos sei exatamente o que preciso comprar.',
      rating: 5,
    },
    {
      name: 'Ana Costa',
      role: 'Artesã',
      content: 'O sistema é muito intuitivo. Nem precisei de ajuda para começar a usar. Recomendo demais!',
      rating: 5,
    },
    {
      name: 'Carla Mendes',
      role: 'Loja de Roupas',
      content: 'A vitrine online é sensacional! Meus clientes veem os produtos com preço e já mandam mensagem direto no meu WhatsApp. Minhas vendas aumentaram 40%!',
      rating: 5,
    },
    {
      name: 'Roberto Lima',
      role: 'Dono de Pet Shop',
      content: 'O analytics da vitrine me mostrou quais produtos mais chamam atenção. Agora sei exatamente o que destacar na loja física também.',
      rating: 5,
    },
    {
      name: 'Fernanda Oliveira',
      role: 'Revendedora',
      content: 'Compartilho o link da minha vitrine nas redes sociais e os clientes já vêm sabendo o preço. O chat vai direto pro meu WhatsApp, muito prático!',
      rating: 5,
    },
    {
      name: 'Lucas Ferreira',
      role: 'Dono de Papelaria',
      content: 'Consegui reduzir em 70% o tempo que gastava respondendo "quanto custa?". Agora tá tudo na vitrine online!',
      rating: 5,
    },
    {
      name: 'Patricia Souza',
      role: 'Confeiteira',
      content: 'Uso a vitrine pra mostrar meus bolos e doces. Os clientes escolhem, veem o preço e já fazem o pedido pelo WhatsApp. Mudou meu negócio!',
      rating: 5,
    },
  ]

  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  const stats = [
    { value: '500+', label: 'Empresas ativas' },
    { value: '50k+', label: 'Produtos cadastrados' },
    { value: '99.9%', label: 'Disponibilidade' },
  ]

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-slate-900/90 backdrop-blur-lg border-b border-slate-800' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-center">
              <Image
                src="/stoka-logo.png"
                alt="Stoka"
                width={120}
                height={40}
                className="h-8 md:h-10 w-auto brightness-0 invert"
                style={{ objectFit: 'contain' }}
              />
            </Link>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">
                Recursos
              </Link>
              <Link href="#testimonials" className="text-sm text-slate-400 hover:text-white transition-colors">
                Depoimentos
              </Link>
              <Link href="/precos" className="text-sm text-slate-400 hover:text-white transition-colors">
                Preços
              </Link>
              <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
                Entrar
              </Link>
              <Button asChild size="sm" className="rounded-full px-6 bg-emerald-500 hover:bg-emerald-600 text-white">
                <Link href="/precos">Começar Agora</Link>
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-slate-900 border-t border-slate-800"
            >
              <nav className="flex flex-col p-4 gap-4">
                <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white py-2">
                  Recursos
                </Link>
                <Link href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white py-2">
                  Depoimentos
                </Link>
                <Link href="/precos" onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white py-2">
                  Preços
                </Link>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white py-2">
                  Entrar
                </Link>
                <Link 
                  href="/precos" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="flex items-center justify-center rounded-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 px-6 relative z-10 pointer-events-auto touch-manipulation transition-colors font-medium"
                >
                  Começar Agora
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main>
        {/* Hero Section */}
        <section className="pt-32 md:pt-40 pb-20 md:pb-32 px-4 sm:px-6 relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-6xl mx-auto relative">
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="text-center max-w-3xl mx-auto"
            >
              {/* Badge */}
              <motion.div 
                variants={fadeInUp} 
                className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-4 py-1.5 text-sm font-medium mb-6"
              >
                <Sparkles className="h-4 w-4" />
                <span>7 dias grátis para experimentar</span>
              </motion.div>

              {/* Título */}
              <motion.h1 
                variants={fadeInUp}
                className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight"
              >
                Controle seu estoque
                <span className="block text-emerald-400">de forma simples</span>
              </motion.h1>
              
              {/* Subtítulo */}
              <motion.p 
                variants={fadeInUp}
                className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto"
              >
                Gerencie produtos, fornecedores e vendas em um só lugar. 
                Feito para pequenos negócios que querem crescer.
              </motion.p>
              
              {/* CTAs */}
              <motion.div 
                variants={fadeInUp}
                className="mt-10 flex flex-col sm:flex-row gap-4 justify-center relative z-10"
              >
                <Link 
                  href="/precos" 
                  className="flex items-center justify-center gap-2 rounded-full px-8 text-base h-12 bg-emerald-500 hover:bg-emerald-600 text-white relative z-10 pointer-events-auto touch-manipulation transition-colors font-medium"
                >
                  Começar Grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link 
                  href="/login" 
                  className="flex items-center justify-center rounded-full px-8 text-base h-12 bg-slate-700 hover:bg-slate-600 text-white border-0 relative z-10 pointer-events-auto touch-manipulation transition-colors font-medium"
                >
                  Já tenho conta
                </Link>
              </motion.div>

              {/* Trust indicators */}
              <motion.div 
                variants={fadeInUp}
                className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm text-slate-500"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Cancele quando quiser</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Suporte incluso</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y border-slate-800 bg-slate-800/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl md:text-4xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs md:text-sm text-slate-500 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Tudo que você precisa
              </h2>
              <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
                Recursos pensados para facilitar o dia a dia do seu negócio
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="group p-6 md:p-8 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:bg-emerald-500/30 transition-colors">
                      <Icon className="h-6 w-6 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 md:py-32 px-4 sm:px-6 bg-slate-800/30 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                O que nossos clientes dizem
              </h2>
              <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
                Histórias de quem já transformou a gestão do seu negócio
              </p>
            </motion.div>

            {/* Carrossel de Depoimentos */}
            <div className="relative">
              {/* Cards visíveis */}
              <div className="flex justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTestimonial}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="w-full max-w-2xl"
                  >
                    <div className="bg-slate-800/50 p-8 md:p-10 rounded-2xl border border-slate-700/50 text-center">
                      {/* Stars */}
                      <div className="flex gap-1 justify-center mb-6">
                        {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      
                      {/* Quote */}
                      <p className="text-xl md:text-2xl text-slate-200 leading-relaxed mb-8 font-light">
                        &quot;{testimonials[currentTestimonial].content}&quot;
                      </p>
                      
                      {/* Author */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                          <span className="text-lg font-semibold text-white">
                            {testimonials[currentTestimonial].name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-white text-lg">{testimonials[currentTestimonial].name}</div>
                          <div className="text-sm text-slate-500">{testimonials[currentTestimonial].role}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Indicadores */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentTestimonial 
                        ? 'w-8 bg-emerald-500' 
                        : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              {/* Botões de navegação */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none px-4">
                <button
                  onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                  className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                >
                  <ArrowRight className="h-5 w-5 rotate-180" />
                </button>
                <button
                  onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                  className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Contador */}
            <div className="text-center mt-6 text-sm text-slate-500">
              {currentTestimonial + 1} de {testimonials.length} depoimentos
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 md:py-32 bg-gradient-to-br from-emerald-600 to-emerald-700 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pronto para simplificar sua gestão?
            </h2>
            <p className="text-lg text-emerald-100 mb-8 max-w-xl mx-auto">
              Comece agora com 7 dias grátis. Sem compromisso, sem cartão de crédito.
            </p>
            <Button asChild size="lg" className="rounded-full px-8 h-12 text-base font-medium bg-white text-emerald-700 hover:bg-emerald-50">
              <Link href="/precos" className="flex items-center gap-2">
                Começar Agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Logo e descrição */}
            <div className="md:col-span-2">
              <Image
                src="/stoka-logo.png"
                alt="Stoka"
                width={100}
                height={32}
                className="h-8 w-auto mb-4 brightness-0 invert"
                style={{ objectFit: 'contain' }}
              />
              <p className="text-sm text-slate-500 max-w-xs mb-4">
                Controle de estoque simples e moderno para pequenos negócios e microempreendedores.
              </p>
              <p className="text-xs text-slate-600">
                Distribuído por <strong className="text-slate-500">AG2 Soluções Tecnológicas</strong>
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Links</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/precos" className="text-slate-500 hover:text-emerald-400 transition-colors">
                    Preços
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-slate-500 hover:text-emerald-400 transition-colors">
                    Entrar
                  </Link>
                </li>
                <li>
                  <Link href="/politica-privacidade" className="text-slate-500 hover:text-emerald-400 transition-colors">
                    Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="/termos-uso" className="text-slate-500 hover:text-emerald-400 transition-colors">
                    Termos de Uso
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h4 className="font-semibold text-white mb-4">Contato</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="mailto:contato@ag2tecnologia.com" className="text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    contato@ag2tecnologia.com
                  </a>
                </li>
                <li>
                  <a href="tel:+5522992645933" className="text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    (22) 99264-5933
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-600">
            <p>&copy; {new Date().getFullYear()} Stoka. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
