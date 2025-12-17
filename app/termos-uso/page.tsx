import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Termos de Uso - Stoka',
  description: 'Termos de uso do Stoka',
}

export default function TermosUsoPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Termos de Uso</h1>
          
          <p className="text-muted-foreground mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
            <p className="mb-4">
              Ao acessar e usar o Stoka, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve usar nosso serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
            <p className="mb-4">
              O Stoka é uma plataforma de controle de estoque desenvolvida pela AG2 Soluções Tecnológicas, projetada para ajudar pequenos negócios e microempreendedores a gerenciar seus produtos, movimentações e relatórios de forma eficiente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Cadastro e Conta</h2>
            <p className="mb-4">Para usar o Stoka, você deve:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Fornecer informações precisas e completas durante o cadastro</li>
              <li>Manter a segurança de sua conta e senha</li>
              <li>Ser responsável por todas as atividades que ocorrem em sua conta</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Uso Aceitável</h2>
            <p className="mb-4">Você concorda em não:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Usar o serviço para qualquer propósito ilegal ou não autorizado</li>
              <li>Tentar acessar áreas restritas do serviço sem autorização</li>
              <li>Interferir ou interromper o funcionamento do serviço</li>
              <li>Transmitir vírus, malware ou código malicioso</li>
              <li>Copiar, modificar ou criar trabalhos derivados do serviço</li>
              <li>Usar o serviço para violar direitos de terceiros</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Propriedade Intelectual</h2>
            <p className="mb-4">
              Todo o conteúdo do Stoka, incluindo design, código, logotipos, textos e gráficos, é propriedade da AG2 Soluções Tecnológicas e está protegido por leis de direitos autorais e outras leis de propriedade intelectual. Você não pode usar, reproduzir ou distribuir qualquer parte do serviço sem nossa autorização prévia por escrito.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Dados do Usuário</h2>
            <p className="mb-4">
              Você mantém todos os direitos sobre os dados que insere no Stoka. Nós não reivindicamos propriedade sobre seus dados. No entanto, ao usar o serviço, você nos concede uma licença para armazenar, processar e exibir seus dados conforme necessário para fornecer o serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Disponibilidade do Serviço</h2>
            <p className="mb-4">
              Embora nos esforcemos para manter o serviço disponível 24/7, não garantimos disponibilidade ininterrupta. O serviço pode estar temporariamente indisponível devido a manutenção, atualizações ou circunstâncias fora de nosso controle.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Limitação de Responsabilidade</h2>
            <p className="mb-4">
              O Stoka é fornecido &quot;como está&quot; e &quot;conforme disponível&quot;. Não garantimos que o serviço atenderá aos seus requisitos específicos ou estará livre de erros. Em nenhuma circunstância seremos responsáveis por danos diretos, indiretos, incidentais ou consequenciais resultantes do uso ou incapacidade de usar o serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Modificações do Serviço</h2>
            <p className="mb-4">
              Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer aspecto do serviço a qualquer momento, com ou sem aviso prévio. Não seremos responsáveis por você ou terceiros por qualquer modificação, suspensão ou descontinuação do serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Rescisão</h2>
            <p className="mb-4">
              Podemos encerrar ou suspender sua conta e acesso ao serviço imediatamente, sem aviso prévio, por qualquer motivo, incluindo violação destes Termos de Uso. Após a rescisão, seu direito de usar o serviço cessará imediatamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Alterações nos Termos</h2>
            <p className="mb-4">
              Podemos revisar estes Termos de Uso periodicamente. As alterações entrarão em vigor quando publicadas nesta página. É sua responsabilidade revisar periodicamente estes termos. O uso continuado do serviço após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Lei Aplicável</h2>
            <p className="mb-4">
              Estes Termos de Uso são regidos pelas leis do Brasil. Qualquer disputa relacionada a estes termos será resolvida nos tribunais competentes do Brasil.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contato</h2>
            <p className="mb-4">
              Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco:
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

