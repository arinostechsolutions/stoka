'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const tutorialSteps = [
  {
    title: '🎉 Bem-vindo ao Stoka!',
    description: 'Vamos fazer um rápido tour pela plataforma para você conhecer as principais funcionalidades.',
    details: 'Navegue pelos slides para conhecer cada funcionalidade.',
  },
  {
    title: '🚚 Fornecedores',
    description: 'É aqui que tudo começa!',
    details: 'Cadastre seus fornecedores primeiro, pois você precisará deles para registrar produtos no sistema.',
  },
  {
    title: '📦 Produtos',
    description: 'Gerencie todo seu estoque',
    details: 'Cadastre produtos com informações completas: nome, SKU, preços, fotos e vincule ao fornecedor.',
  },
  {
    title: '📋 Movimentações',
    description: 'Registre entradas, saídas e ajustes',
    details: 'Acompanhe preços, formas de pagamento e mantenha histórico completo de todas as transações.',
  },
  {
    title: '📊 Dashboard',
    description: 'Seu centro de comando',
    details: 'Veja em tempo real: total de produtos, valor do estoque, movimentações recentes e alertas.',
  },
  {
    title: '👥 Clientes',
    description: 'Cadastre seus clientes',
    details: 'Informações completas: contato, endereço, Instagram. Acompanhe histórico de compras. ⭐ Premium',
  },
  {
    title: '🏪 Vitrine Online',
    description: 'Crie sua loja online',
    details: 'Configure aparência, escolha produtos e seus clientes compram direto pelo WhatsApp. ⭐ Premium',
  },
  {
    title: '📈 Minha Loja + Analytics',
    description: 'stoka.tech/loja/sua-loja',
    details: 'Compartilhe nos stories! Acompanhe visualizações, cliques, produtos mais vistos e conversões. ⭐ Premium',
  },
  {
    title: '🎯 Campanhas',
    description: 'Crie campanhas promocionais',
    details: 'Defina descontos, agrupe produtos e veja quais campanhas geram mais vendas. ⭐ Premium',
  },
  {
    title: '🚀 Pronto para começar!',
    description: 'Agora você conhece todas as funcionalidades',
    details: '1. Cadastre fornecedores\n2. Adicione produtos\n3. Registre movimentações\n4. Configure sua loja online!',
  },
]

export function MobileTutorialModal() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    // Verifica se é mobile e se o usuário não completou o tutorial
    const isMobile = window.innerWidth < 768
    const tutorialSkipped = sessionStorage.getItem('tutorialSkipped')
    const tutorialCompleted = localStorage.getItem('tutorialCompleted')
    
    if (isMobile && session?.user && !(session.user as any).tutorialCompleted && !tutorialSkipped && !tutorialCompleted) {
      setTimeout(() => {
        setOpen(true)
      }, 1000)
    }
  }, [session])

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setDirection(1)
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    setOpen(false)
    sessionStorage.setItem('tutorialSkipped', 'true')
  }

  const handleComplete = async () => {
    setOpen(false)
    
    // Salva no localStorage
    localStorage.setItem('tutorialCompleted', 'true')
    
    try {
      const response = await fetch('/api/user/tutorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })

      if (response.ok) {
        await update()
        router.refresh()
      }
    } catch (error) {
      console.error('Erro ao marcar tutorial como completo:', error)
    }
  }

  const step = tutorialSteps[currentStep]
  const isLastStep = currentStep === tutorialSteps.length - 1

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleSkip()
      }
    }}>
      <DialogContent 
        className="max-w-[90vw] sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{step.title}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-base font-medium text-foreground">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
            transition={{ duration: 0.2 }}
            className="py-4"
          >
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {step.details}
            </p>
          </motion.div>
        </AnimatePresence>

        <DialogFooter className="flex-col sm:flex-col gap-3">
          {/* Indicador de progresso */}
          <div className="flex items-center justify-center gap-1">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-6 bg-primary'
                    : index < currentStep
                    ? 'w-1.5 bg-primary/50'
                    : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Contador */}
          <div className="text-center text-sm text-muted-foreground">
            {currentStep + 1} de {tutorialSteps.length}
          </div>

          {/* Botões */}
          <div className="flex items-center justify-between w-full gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>

            {!isLastStep && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="flex-1"
              >
                Pular
              </Button>
            )}

            <Button
              onClick={handleNext}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              {isLastStep ? 'Finalizar' : 'Próximo'}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

