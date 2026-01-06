'use client'

import { useState, useEffect } from 'react'
import Joyride, { CallBackProps, STATUS, Step, TooltipRenderProps } from 'react-joyride'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function OnboardingTour() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [run, setRun] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Fix hydration error - só renderiza no cliente
  useEffect(() => {
    setMounted(true)
    // Detecta se é mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Verifica se o usuário já completou o tutorial (apenas desktop)
    const tutorialSkipped = sessionStorage.getItem('tutorialSkipped')
    const tutorialCompleted = localStorage.getItem('tutorialCompleted')
    
    if (mounted && !isMobile && session?.user && !(session.user as any).tutorialCompleted && !tutorialSkipped && !tutorialCompleted) {
      // Desktop - inicia após 1 segundo
      const timer = setTimeout(() => {
        setRun(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [session, mounted, isMobile])

  // Não renderiza nada no servidor
  if (!mounted) {
    return null
  }

  // Não renderiza nada se for mobile (usa MobileTutorialModal)
  if (isMobile) {
    return null
  }

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">Bem-vindo ao Stoka! 🎉</h2>
          <p className="text-base">
            Vamos fazer um rápido tour pela plataforma para você conhecer as principais funcionalidades.
          </p>
          <p className="text-sm text-muted-foreground">
            Isso levará apenas 1 minuto!
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="fornecedores"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">🚚 Fornecedores</h3>
          <p className="font-medium text-emerald-600 dark:text-emerald-400 mb-2">
            👉 É aqui que tudo começa!
          </p>
          <p>
            Cadastre seus fornecedores primeiro, pois você precisará deles para 
            registrar produtos no sistema. Organize suas informações de contato e 
            facilite a gestão de compras.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="produtos"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">📦 Produtos</h3>
          <p>
            Cadastre seus produtos com informações completas: nome, SKU, categoria, 
            preços de compra e venda, fotos e muito mais.
          </p>
          <p className="text-sm">
            🏷️ Controle quantidades, estoque mínimo e vincule cada produto ao fornecedor correspondente.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="movimentacoes"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">📋 Movimentações</h3>
          <p>
            Registre todas as operações de estoque: entradas de fornecedores, 
            saídas de vendas e ajustes manuais.
          </p>
          <p className="text-sm">
            💰 Acompanhe preços, formas de pagamento e mantenha histórico completo de todas as transações.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="dashboard"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">📊 Dashboard</h3>
          <p>
            Seu centro de comando! Veja em tempo real: total de produtos, valor 
            do estoque, movimentações recentes e alertas importantes.
          </p>
          <p className="text-sm">
            🎯 Para usuários Premium: acompanhe também Top Clientes do Mês e Aniversariantes.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="clientes"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">👥 Clientes</h3>
          <p>
            Cadastre seus clientes com informações completas: contato, endereço, 
            Instagram e anotações importantes.
          </p>
          <p className="text-sm">
            📊 Acompanhe histórico de compras e identifique seus melhores clientes.
          </p>
          {(session?.user as any)?.plan !== 'premium' && (
            <p className="text-xs text-amber-500">⭐ Recurso Premium</p>
          )}
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="vitrine"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">🏪 Vitrine Online</h3>
          <p>
            Crie sua loja online personalizada! Configure a aparência, escolha os 
            produtos que ficarão disponíveis e gere sua URL exclusiva.
          </p>
          <p className="text-sm">
            💬 Seus clientes selecionam produtos e são direcionados direto para 
            conversa 1:1 no WhatsApp com você.
          </p>
          {(session?.user as any)?.plan !== 'premium' && (
            <p className="text-xs text-amber-500">⭐ Recurso Premium</p>
          )}
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="minha-loja"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-base md:text-lg font-semibold">📈 Minha Loja + Analytics</h3>
          <p className="text-sm md:text-base">
            Ative sua loja online com uma URL personalizada como:
          </p>
          <p className="text-[10px] md:text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded font-mono break-all">
            stoka.tech/loja/sua-loja
          </p>
          <p className="text-xs md:text-sm">
            📱 Compartilhe nos stories do Instagram e outras redes sociais!
          </p>
          <p className="text-xs md:text-sm">
            📊 Acompanhe métricas em tempo real: visualizações, cliques, produtos 
            mais vistos, conversões e muito mais.
          </p>
          {(session?.user as any)?.plan !== 'premium' && (
            <p className="text-xs text-amber-500">⭐ Recurso Premium</p>
          )}
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="campanhas"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">🎯 Campanhas</h3>
          <p>
            Crie campanhas promocionais organizadas: defina descontos, agrupe produtos 
            e acompanhe resultados.
          </p>
          <p className="text-sm">
            📈 Veja quais campanhas geram mais vendas e otimize suas estratégias.
          </p>
          {(session?.user as any)?.plan !== 'premium' && (
            <p className="text-xs text-amber-500">⭐ Recurso Premium</p>
          )}
        </div>
      ),
      placement: 'right',
    },
    {
      target: 'body',
      content: (
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">Pronto para começar! 🚀</h2>
          <p className="text-base">
            Agora você já conhece as principais funcionalidades do Stoka.
          </p>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 space-y-2">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              💡 Próximos passos sugeridos:
            </p>
            <ol className="text-sm text-emerald-700 dark:text-emerald-400 space-y-1 list-decimal list-inside">
              <li>Cadastre seus fornecedores</li>
              <li>Adicione seus produtos</li>
              <li>Registre suas primeiras movimentações</li>
              {(session?.user as any)?.plan === 'premium' && (
                <li>Configure sua loja online!</li>
              )}
            </ol>
          </div>
          <p className="text-sm text-muted-foreground">
            Você está a poucos cliques de transformar a gestão do seu negócio! 💪
          </p>
        </div>
      ),
      placement: 'center',
    },
  ]

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data

    if (status === STATUS.FINISHED) {
      // Tutorial completado - salva no banco e localStorage
      setRun(false)
      
      // Salva no localStorage
      localStorage.setItem('tutorialCompleted', 'true')
      
      try {
        const response = await fetch('/api/user/tutorial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true }),
        })

        if (response.ok) {
          // Atualiza a sessão
          await update()
          router.refresh()
        }
      } catch (error) {
        console.error('Erro ao marcar tutorial como completo:', error)
      }
    } else if (status === STATUS.SKIPPED) {
      // Tutorial pulado/fechado - salva no sessionStorage
      setRun(false)
      sessionStorage.setItem('tutorialSkipped', 'true')
    }
  }

  // Handler para fechar o tutorial
  const handleClose = () => {
    setRun(false)
    sessionStorage.setItem('tutorialSkipped', 'true')
  }

  // Tooltip customizado
  const CustomTooltip = ({
    continuous,
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    skipProps,
    tooltipProps,
    isLastStep,
  }: TooltipRenderProps) => {
    const totalSteps = steps.length
    const currentStep = index + 1

    return (
      <div
        {...tooltipProps}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-4 md:p-6 max-w-[90vw] md:max-w-md"
      >
        {/* Header com botão de fechar */}
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="flex-1">
            {step.title && (
              <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">{step.title}</h3>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors ml-2"
          >
            <X className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="mb-4 md:mb-6 text-sm md:text-base text-slate-600 dark:text-slate-300">
          {step.content}
        </div>

        {/* Footer com progresso e botões */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          {/* Progresso */}
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
            {currentStep} de {totalSteps}
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2">
            {/* Botão Pular */}
            {!isLastStep && (
              <Button
                onClick={handleClose}
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs md:text-sm"
              >
                Pular
              </Button>
            )}

            {/* Botão Voltar */}
            {index > 0 && (
              <Button
                {...backProps}
                variant="outline"
                size="sm"
                className="text-xs md:text-sm"
              >
                Voltar
              </Button>
            )}

            {/* Botão Próximo/Finalizar */}
            <Button
              {...primaryProps}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs md:text-sm px-3 md:px-4"
            >
              {isLastStep ? 'Finalizar' : 'Próximo'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
      <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress={false}
      showSkipButton={false}
      disableOverlayClose
      spotlightClicks
      disableScrolling={false}
      scrollToFirstStep
      scrollOffset={200}
      spotlightPadding={10}
      callback={handleJoyrideCallback}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          primaryColor: '#10b981', // emerald-500
          zIndex: 10000,
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
        },
        spotlight: {
          borderRadius: 8,
          padding: 10,
        },
      }}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  )
}

