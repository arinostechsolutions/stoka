import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidade - Stoka',
  description: 'Política de privacidade do Stoka',
}

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl px-4 py-8 md:py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Política de Privacidade</h1>
          
          <p className="text-muted-foreground mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
            <p className="mb-4">
              A AG2 Soluções Tecnológicas (&quot;nós&quot;, &quot;nosso&quot; ou &quot;empresa&quot;) respeita sua privacidade e está comprometida em proteger seus dados pessoais. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações quando você usa o Stoka.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Informações que Coletamos</h2>
            <p className="mb-4">Coletamos as seguintes informações:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Dados de Cadastro:</strong> Nome, e-mail, senha (criptografada), CNPJ (opcional), Razão Social (opcional) e Nome Fantasia (opcional)</li>
              <li><strong>Dados de Uso:</strong> Informações sobre como você usa o serviço, incluindo produtos cadastrados, movimentações e relatórios gerados</li>
              <li><strong>Dados Técnicos:</strong> Endereço IP, tipo de navegador, sistema operacional e informações de dispositivo</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Como Usamos suas Informações</h2>
            <p className="mb-4">Utilizamos suas informações para:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Processar suas transações e gerenciar sua conta</li>
              <li>Enviar notificações importantes sobre o serviço</li>
              <li>Detectar e prevenir fraudes e abusos</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Compartilhamento de Informações</h2>
            <p className="mb-4">
              Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto nas seguintes situações:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Quando necessário para fornecer o serviço (ex: provedores de hospedagem)</li>
              <li>Quando exigido por lei ou ordem judicial</li>
              <li>Para proteger nossos direitos e segurança</li>
              <li>Com seu consentimento explícito</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Segurança dos Dados</h2>
            <p className="mb-4">
              Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Criptografia de dados sensíveis</li>
              <li>Autenticação segura</li>
              <li>Monitoramento regular de segurança</li>
              <li>Backups regulares</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Seus Direitos</h2>
            <p className="mb-4">Você tem o direito de:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incorretos ou incompletos</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Opor-se ao processamento de seus dados</li>
              <li>Solicitar a portabilidade de seus dados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Retenção de Dados</h2>
            <p className="mb-4">
              Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir os propósitos descritos nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Cookies e Tecnologias Similares</h2>
            <p className="mb-4">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso do serviço e personalizar conteúdo. Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Alterações nesta Política</h2>
            <p className="mb-4">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas publicando a nova política nesta página e atualizando a data de &quot;Última atualização&quot;.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contato</h2>
            <p className="mb-4">
              Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco:
            </p>
            <ul className="list-none space-y-2 mb-4">
              <li><strong>E-mail:</strong> contato@ag2tecnologia.com</li>
              <li><strong>Telefone:</strong> (22) 99264-5933</li>
              <li><strong>Empresa:</strong> AG2 Soluções Tecnológicas</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

