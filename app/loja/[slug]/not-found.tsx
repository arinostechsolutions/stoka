import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="text-center space-y-4">
        <Package className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-4xl font-bold">Loja não encontrada</h1>
        <p className="text-muted-foreground">
          A loja que você está procurando não existe ou não está mais disponível.
        </p>
        <Link href="/">
          <Button>Voltar ao início</Button>
        </Link>
      </div>
    </div>
  )
}


