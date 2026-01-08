'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Crown, Sparkles, Loader2, FileText, Shield } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { validatePasswordStrength } from '@/lib/password-validator'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  // Validar formulário
  const isFormValid = useMemo(() => {
    const passwordStrength = validatePasswordStrength(password)
    return (
      name.trim().length >= 2 &&
      email.trim().length > 0 &&
      email.includes('@') &&
      passwordStrength.isValid &&
      acceptedTerms
    )
  }, [name, email, password, acceptedTerms])
  
  // Capturar plano da URL
  const planFromUrl = searchParams.get('plan') as 'starter' | 'premium' | null
  const validPlan = planFromUrl === 'starter' || planFromUrl === 'premium' ? planFromUrl : null

  // Redirecionar para preços se não tiver plano selecionado
  useEffect(() => {
    if (!validPlan) {
      router.replace('/precos')
    }
  }, [validPlan, router])

  // Mostrar loading enquanto redireciona
  if (!validPlan) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Criar conta
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Erro na resposta:', data)
        setError(data.error || data.details || 'Erro ao criar conta')
        return
      }

      // 2. Se tem plano selecionado, fazer login e ir para checkout
      if (validPlan) {
        const signInResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (signInResult?.ok) {
          // 3. Criar checkout session
          const checkoutResponse = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priceType: validPlan }),
          })

          const checkoutData = await checkoutResponse.json()

          if (checkoutData.url) {
            window.location.href = checkoutData.url
            return
          }
        }
        
        // Se falhar o checkout, ir para login
        router.push('/login?registered=true')
      } else {
        // Sem plano, ir para login normal
      router.push('/login?registered=true')
      }
    } catch (err: any) {
      console.error('Erro ao criar conta:', err)
      setError(err.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="w-full max-w-lg bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <Image
            src="/stoka-logo.png"
            alt="Stoka Logo"
            width={200}
            height={120}
            className="h-16 w-auto brightness-0 invert"
            style={{ objectFit: 'contain' }}
          />
        </div>
        <CardTitle className="text-2xl font-bold text-center text-white">Criar conta</CardTitle>
        <CardDescription className="text-center text-slate-300">
          {validPlan ? (
            'Crie sua conta para continuar'
          ) : (
            'Comece a controlar seu estoque agora'
          )}
        </CardDescription>
        
        {/* Mostrar plano selecionado */}
        {validPlan && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Badge 
              variant="secondary" 
              className={
                validPlan === 'premium' 
                  ? 'bg-amber-100 text-amber-800 border-amber-300' 
                  : 'bg-primary/10 text-primary'
              }
            >
              {validPlan === 'premium' ? (
                <Crown className="h-3 w-3 mr-1" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              Plano {validPlan === 'premium' ? 'Premium' : 'Starter'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              R$ {validPlan === 'premium' ? '79,90' : '49,90'}/mês
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-200">Nome</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              disabled={loading}
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-200">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-primary"
            />
          </div>
          <PasswordInput
              id="password"
            label="Senha"
            placeholder="Crie uma senha forte"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            disabled={loading}
            showStrengthIndicator={true}
            showRequirements={true}
            className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-primary"
          />

          {/* Checkbox de Termos e Política */}
          <div className="flex items-start space-x-3 rounded-lg border border-slate-700 bg-slate-900/30 p-4">
            <Checkbox 
              id="terms" 
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              disabled={loading}
              className="mt-1"
            />
            <div className="flex-1">
              <label 
                htmlFor="terms" 
                className="text-sm text-slate-300 leading-relaxed cursor-pointer"
              >
                Li e aceito os{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setShowTermsModal(true)
                  }}
                  className="text-blue-400 hover:text-blue-300 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  Termos de Uso
                </button>
                {' '}e a{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setShowPrivacyModal(true)
                  }}
                  className="text-blue-400 hover:text-blue-300 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Shield className="h-3 w-3" />
                  Política de Privacidade
                </button>
              </label>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Começar 7 dias grátis'
            )}
          </Button>
          
          <p className="text-xs text-center text-slate-400">
            Você não será cobrado durante o período de teste.
            <br />
            Cancele a qualquer momento.
          </p>
          
          <div className="text-center text-sm text-slate-300">
            Já tem conta?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 hover:underline font-medium">
              Entrar
            </Link>
          </div>
          
          {!validPlan && (
            <div className="text-center">
              <Link href="/precos" className="text-xs text-muted-foreground hover:text-primary">
                Ver planos disponíveis →
              </Link>
            </div>
          )}
        </form>
      </CardContent>
    </Card>

    {/* Modal de Termos de Uso */}
    <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Termos de Uso do Stoka
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm text-slate-300">
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">1. Aceitação dos Termos</h3>
              <p className="mb-2">
                Ao acessar e utilizar a plataforma Stoka (&quot;Plataforma&quot;, &quot;Serviço&quot; ou &quot;nós&quot;), você (&quot;Usuário&quot; ou &quot;você&quot;) concorda em cumprir e estar vinculado aos presentes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
              </p>
              <p>
                A Stoka é uma plataforma de gestão de estoque e vendas desenvolvida para auxiliar pequenos e médios empreendedores na organização de seus negócios.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">2. Definições</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Plataforma:</strong> Sistema web Stoka e todos os seus recursos, funcionalidades e conteúdos.</li>
                <li><strong>Usuário:</strong> Pessoa física ou jurídica que se cadastra e utiliza a Plataforma.</li>
                <li><strong>Conta:</strong> Perfil criado pelo Usuário para acessar a Plataforma.</li>
                <li><strong>Dados:</strong> Todas as informações inseridas, armazenadas ou processadas na Plataforma pelo Usuário.</li>
                <li><strong>Assinatura:</strong> Plano pago (Starter ou Premium) que garante acesso às funcionalidades da Plataforma.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">3. Cadastro e Conta</h3>
              <p className="mb-2">
                3.1. Para utilizar a Plataforma, você deve criar uma conta fornecendo informações verdadeiras, precisas, atuais e completas.
              </p>
              <p className="mb-2">
                3.2. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.
              </p>
              <p className="mb-2">
                3.3. Você concorda em notificar imediatamente a Stoka sobre qualquer uso não autorizado de sua conta.
              </p>
              <p>
                3.4. É vedado o compartilhamento de credenciais de acesso com terceiros.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">4. Período de Teste Gratuito</h3>
              <p className="mb-2">
                4.1. Novos usuários têm direito a um período de teste gratuito de 7 (sete) dias com acesso ao plano escolhido.
              </p>
              <p className="mb-2">
                4.2. Durante o período de teste, não há cobrança. Ao final do teste, caso não haja cancelamento, a assinatura será automaticamente ativada e cobrada.
              </p>
              <p>
                4.3. O Usuário pode cancelar a qualquer momento durante o teste sem custos.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">5. Planos e Pagamentos</h3>
              <p className="mb-2">
                5.1. A Stoka oferece dois planos de assinatura: <strong>Starter</strong> (R$ 49,90/mês) e <strong>Premium</strong> (R$ 79,90/mês).
              </p>
              <p className="mb-2">
                5.2. Os pagamentos são processados mensalmente via Stripe. O Usuário autoriza a cobrança recorrente no cartão de crédito cadastrado.
              </p>
              <p className="mb-2">
                5.3. Em caso de falha no pagamento, o acesso à Plataforma poderá ser suspenso até a regularização.
              </p>
              <p className="mb-2">
                5.4. Cancelamentos devem ser solicitados através das configurações da conta. O acesso permanece ativo até o final do período já pago.
              </p>
              <p>
                5.5. Não há reembolso de valores já pagos, exceto nos casos previstos em lei ou por decisão da Stoka.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">6. Uso Aceitável</h3>
              <p className="mb-2">Você concorda em NÃO utilizar a Plataforma para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violar qualquer lei, regulamento ou direito de terceiros;</li>
                <li>Transmitir vírus, malware ou qualquer código malicioso;</li>
                <li>Realizar engenharia reversa, descompilar ou desmontar qualquer parte da Plataforma;</li>
                <li>Coletar informações de outros usuários sem consentimento;</li>
                <li>Utilizar a Plataforma para fins ilegais, fraudulentos ou não autorizados;</li>
                <li>Sobrecarregar ou interferir no funcionamento da Plataforma;</li>
                <li>Criar múltiplas contas para abusar do período de teste;</li>
                <li>Revender, redistribuir ou sublicenciar o acesso à Plataforma.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">7. Propriedade Intelectual</h3>
              <p className="mb-2">
                7.1. Todo o conteúdo da Plataforma, incluindo mas não se limitando a textos, gráficos, logotipos, ícones, imagens, clipes de áudio, downloads digitais e software, é propriedade da Stoka ou de seus fornecedores de conteúdo e está protegido por leis de propriedade intelectual.
              </p>
              <p className="mb-2">
                7.2. Os Dados inseridos pelo Usuário permanecem de sua propriedade. A Stoka não reivindica direitos sobre o conteúdo que você carrega ou cria na Plataforma.
              </p>
              <p>
                7.3. Você concede à Stoka uma licença limitada, não exclusiva e revogável para hospedar, armazenar e processar seus Dados exclusivamente para fornecer os serviços contratados.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">8. Limitação de Responsabilidade</h3>
              <p className="mb-2">
                8.1. A Plataforma é fornecida &quot;no estado em que se encontra&quot; e &quot;conforme disponível&quot;, sem garantias de qualquer tipo, expressas ou implícitas.
              </p>
              <p className="mb-2">
                8.2. A Stoka não garante que a Plataforma será ininterrupta, livre de erros, vírus ou outros componentes nocivos.
              </p>
              <p className="mb-2">
                8.3. Em nenhuma circunstância a Stoka será responsável por danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, mas não se limitando a, perda de lucros, dados, uso, boa vontade ou outras perdas intangíveis.
              </p>
              <p className="mb-2">
                8.4. A responsabilidade total da Stoka, se houver, não excederá o valor pago pelo Usuário nos últimos 3 (três) meses de assinatura.
              </p>
              <p>
                8.5. O Usuário é responsável por manter backups de seus Dados. A Stoka não se responsabiliza por perda de dados.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">9. Suspensão e Encerramento</h3>
              <p className="mb-2">
                9.1. A Stoka reserva-se o direito de suspender ou encerrar sua conta, a qualquer momento, por violação destes Termos ou por qualquer outro motivo, a seu exclusivo critério.
              </p>
              <p className="mb-2">
                9.2. Após o encerramento, você perderá o acesso à sua conta e aos Dados nela contidos.
              </p>
              <p>
                9.3. Você pode encerrar sua conta a qualquer momento através das configurações da conta.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">10. Modificações</h3>
              <p className="mb-2">
                10.1. A Stoka reserva-se o direito de modificar estes Termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou através da Plataforma.
              </p>
              <p>
                10.2. O uso continuado da Plataforma após as modificações constitui aceitação dos novos Termos.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">11. Lei Aplicável e Foro</h3>
              <p className="mb-2">
                11.1. Estes Termos são regidos pelas leis da República Federativa do Brasil.
              </p>
              <p>
                11.2. Fica eleito o foro da Comarca da capital do Estado onde a Stoka está sediada para dirimir quaisquer questões oriundas destes Termos, com exclusão de qualquer outro, por mais privilegiado que seja.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">12. Disposições Gerais</h3>
              <p className="mb-2">
                12.1. Estes Termos constituem o acordo integral entre você e a Stoka.
              </p>
              <p className="mb-2">
                12.2. A invalidade de qualquer disposição não afeta a validade das demais.
              </p>
              <p>
                12.3. O não exercício de qualquer direito pela Stoka não constitui renúncia a tal direito.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">13. Contato</h3>
              <p>
                Para questões sobre estes Termos, entre em contato conosco através do e-mail: <a href="mailto:suporte@stoka.tech" className="text-blue-400 hover:underline">suporte@stoka.tech</a>
              </p>
            </section>

            <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 text-center">
                Ao clicar em &quot;Aceito os Termos de Uso&quot;, você confirma que leu, compreendeu e concorda em estar vinculado a estes Termos.
              </p>
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-3 mt-4">
          <Button 
            variant="outline" 
            onClick={() => setShowTermsModal(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Fechar
          </Button>
          <Button 
            onClick={() => {
              setAcceptedTerms(true)
              setShowTermsModal(false)
            }}
            className="bg-primary hover:bg-primary/90"
          >
            Li e Aceito os Termos
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Modal de Política de Privacidade */}
    <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Política de Privacidade do Stoka
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm text-slate-300">
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">1. Introdução</h3>
              <p className="mb-2">
                A Stoka (&quot;nós&quot;, &quot;nosso&quot; ou &quot;Plataforma&quot;) está comprometida em proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações quando você utiliza nossa plataforma de gestão de estoque e vendas.
              </p>
              <p>
                Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e demais legislações aplicáveis.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">2. Informações que Coletamos</h3>
              
              <h4 className="font-semibold text-white mt-4 mb-2">2.1. Informações de Cadastro</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Senha (armazenada de forma criptografada)</li>
                <li>Informações de pagamento (processadas via Stripe, não armazenamos dados de cartão)</li>
              </ul>

              <h4 className="font-semibold text-white mt-4 mb-2">2.2. Dados de Uso da Plataforma</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Produtos, fornecedores e clientes cadastrados</li>
                <li>Movimentações de estoque e vendas</li>
                <li>Relatórios e análises gerados</li>
                <li>Configurações de conta e preferências</li>
                <li>Imagens e arquivos enviados</li>
              </ul>

              <h4 className="font-semibold text-white mt-4 mb-2">2.3. Informações Técnicas</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Endereço IP</li>
                <li>Tipo de navegador e dispositivo</li>
                <li>Sistema operacional</li>
                <li>Páginas visitadas e ações realizadas</li>
                <li>Data e hora de acesso</li>
                <li>Cookies e tecnologias similares</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">3. Como Utilizamos Suas Informações</h3>
              <p className="mb-2">Utilizamos suas informações para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Fornecer e melhorar o Serviço:</strong> Processar suas transações, manter sua conta, fornecer suporte ao cliente e desenvolver novos recursos.</li>
                <li><strong>Comunicação:</strong> Enviar notificações sobre sua conta, atualizações do serviço, newsletters (com seu consentimento) e responder suas solicitações.</li>
                <li><strong>Segurança:</strong> Detectar e prevenir fraudes, proteger contra atividades maliciosas e garantir a segurança da Plataforma.</li>
                <li><strong>Análise:</strong> Compreender como os usuários utilizam a Plataforma para melhorar a experiência e desenvolver novos recursos.</li>
                <li><strong>Pagamentos:</strong> Processar pagamentos e gerenciar assinaturas através do Stripe.</li>
                <li><strong>Cumprimento Legal:</strong> Cumprir obrigações legais e regulatórias.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">4. Base Legal para Processamento</h3>
              <p className="mb-2">Processamos seus dados pessoais com base em:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Execução de Contrato:</strong> Para fornecer os serviços que você contratou.</li>
                <li><strong>Consentimento:</strong> Quando você consente explicitamente (ex: receber newsletters).</li>
                <li><strong>Legítimo Interesse:</strong> Para melhorar nossos serviços, segurança e análises.</li>
                <li><strong>Obrigação Legal:</strong> Para cumprir requisitos legais e regulatórios.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">5. Compartilhamento de Informações</h3>
              <p className="mb-2">Não vendemos suas informações pessoais. Podemos compartilhar suas informações apenas com:</p>
              
              <h4 className="font-semibold text-white mt-4 mb-2">5.1. Prestadores de Serviço</h4>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                <li><strong>Stripe:</strong> Para processamento de pagamentos</li>
                <li><strong>MongoDB Atlas:</strong> Para armazenamento de dados</li>
                <li><strong>Vercel/AWS:</strong> Para hospedagem da Plataforma</li>
                <li><strong>Serviços de E-mail:</strong> Para comunicações transacionais</li>
              </ul>
              <p className="mb-2 text-sm italic">Todos os prestadores são obrigados contratualmente a proteger seus dados.</p>

              <h4 className="font-semibold text-white mt-4 mb-2">5.2. Requisitos Legais</h4>
              <p>
                Podemos divulgar suas informações se exigido por lei, ordem judicial, processo legal ou para proteger direitos, propriedade ou segurança.
              </p>

              <h4 className="font-semibold text-white mt-4 mb-2">5.3. Transferência de Negócio</h4>
              <p>
                Em caso de fusão, aquisição ou venda de ativos, suas informações podem ser transferidas, sempre mantendo os compromissos desta Política.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">6. Segurança dos Dados</h3>
              <p className="mb-2">
                Implementamos medidas técnicas e organizacionais apropriadas para proteger seus dados, incluindo:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
                <li>Criptografia de senhas (bcrypt)</li>
                <li>Controles de acesso rigorosos</li>
                <li>Monitoramento de segurança</li>
                <li>Backups regulares</li>
                <li>Auditorias de segurança periódicas</li>
              </ul>
              <p className="mt-2 text-sm italic">
                Apesar de nossos esforços, nenhum sistema é 100% seguro. Você é responsável por manter a confidencialidade de suas credenciais.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">7. Retenção de Dados</h3>
              <p className="mb-2">
                Retemos suas informações pelo tempo necessário para fornecer os serviços, cumprir obrigações legais e resolver disputas.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Dados de Conta:</strong> Enquanto sua conta estiver ativa e por até 5 anos após o encerramento (obrigações legais).</li>
                <li><strong>Dados de Pagamento:</strong> Conforme exigido por lei fiscal (mínimo 5 anos).</li>
                <li><strong>Logs de Acesso:</strong> Por até 6 meses.</li>
              </ul>
              <p className="mt-2">
                Após esses períodos, seus dados serão excluídos ou anonimizados de forma segura.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">8. Seus Direitos (LGPD)</h3>
              <p className="mb-2">Você tem direito a:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Confirmação e Acesso:</strong> Saber se processamos seus dados e acessá-los.</li>
                <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados.</li>
                <li><strong>Anonimização, Bloqueio ou Eliminação:</strong> De dados desnecessários, excessivos ou tratados em desconformidade.</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado e legível.</li>
                <li><strong>Eliminação:</strong> Dos dados tratados com seu consentimento.</li>
                <li><strong>Informação:</strong> Sobre compartilhamento de dados com terceiros.</li>
                <li><strong>Revogação de Consentimento:</strong> A qualquer momento.</li>
                <li><strong>Revisão de Decisões Automatizadas:</strong> Questionar decisões baseadas em processamento automatizado.</li>
              </ul>
              <p className="mt-3">
                Para exercer seus direitos, entre em contato através do e-mail: <a href="mailto:privacidade@stoka.tech" className="text-blue-400 hover:underline">privacidade@stoka.tech</a>
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">9. Cookies e Tecnologias Similares</h3>
              <p className="mb-2">
                Utilizamos cookies e tecnologias similares para melhorar sua experiência. Você pode controlar cookies através das configurações do seu navegador.
              </p>
              <h4 className="font-semibold text-white mt-3 mb-2">Tipos de Cookies:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Essenciais:</strong> Necessários para o funcionamento básico da Plataforma.</li>
                <li><strong>Funcionais:</strong> Lembram suas preferências e escolhas.</li>
                <li><strong>Analíticos:</strong> Nos ajudam a entender como você usa a Plataforma.</li>
                <li><strong>Autenticação:</strong> Mantêm você conectado à sua conta.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">10. Transferência Internacional de Dados</h3>
              <p>
                Seus dados podem ser transferidos e processados em servidores localizados fora do Brasil. Garantimos que tais transferências cumprem as exigências da LGPD e que seus dados recebem proteção adequada.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">11. Privacidade de Crianças</h3>
              <p>
                Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente informações pessoais de crianças. Se você é pai/mãe ou responsável e acredita que seu filho forneceu informações, entre em contato conosco.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">12. Alterações nesta Política</h3>
              <p className="mb-2">
                Podemos atualizar esta Política periodicamente. Notificaremos você sobre mudanças significativas por e-mail ou através de um aviso na Plataforma.
              </p>
              <p>
                A versão atualizada será publicada com a nova data de &quot;Última atualização&quot;.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">13. Encarregado de Dados (DPO)</h3>
              <p>
                Para questões relacionadas à proteção de dados e privacidade, você pode contatar nosso Encarregado de Dados:
              </p>
              <p className="mt-2">
                <strong>E-mail:</strong> <a href="mailto:dpo@stoka.tech" className="text-blue-400 hover:underline">dpo@stoka.tech</a>
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">14. Autoridade Nacional de Proteção de Dados (ANPD)</h3>
              <p>
                Você também tem o direito de apresentar uma reclamação à Autoridade Nacional de Proteção de Dados (ANPD) se acreditar que seus direitos de privacidade foram violados.
              </p>
              <p className="mt-2">
                <strong>Site da ANPD:</strong> <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">www.gov.br/anpd</a>
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">15. Contato</h3>
              <p>
                Para dúvidas, solicitações ou preocupações sobre privacidade:
              </p>
              <ul className="mt-2 space-y-1">
                <li><strong>E-mail geral:</strong> <a href="mailto:suporte@stoka.tech" className="text-blue-400 hover:underline">suporte@stoka.tech</a></li>
                <li><strong>E-mail privacidade:</strong> <a href="mailto:privacidade@stoka.tech" className="text-blue-400 hover:underline">privacidade@stoka.tech</a></li>
                <li><strong>E-mail DPO:</strong> <a href="mailto:dpo@stoka.tech" className="text-blue-400 hover:underline">dpo@stoka.tech</a></li>
              </ul>
            </section>

            <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 text-center">
                Ao utilizar a Plataforma Stoka, você reconhece que leu e compreendeu esta Política de Privacidade e concorda com o processamento de suas informações conforme descrito.
              </p>
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-3 mt-4">
          <Button 
            variant="outline" 
            onClick={() => setShowPrivacyModal(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Fechar
          </Button>
          <Button 
            onClick={() => {
              setAcceptedTerms(true)
              setShowPrivacyModal(false)
            }}
            className="bg-primary hover:bg-primary/90"
          >
            Li e Aceito a Política
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-lg">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    }>
      <RegisterForm />
    </Suspense>
  )
}
