// Warm-up da conexão com o banco de dados
// Este arquivo é importado no layout para pré-conectar ao MongoDB
import connectDB from './db'

let isWarmingUp = false
let warmUpPromise: Promise<void> | null = null

export async function warmUpDB() {
  // Evita múltiplas tentativas simultâneas de warm-up
  if (isWarmingUp && warmUpPromise) {
    return warmUpPromise
  }

  if (warmUpPromise) {
    return warmUpPromise
  }

  isWarmingUp = true
  warmUpPromise = (async () => {
    try {
      await connectDB()
      // Pequeno delay para garantir que a conexão está estável
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error('Erro no warm-up do banco:', error)
    } finally {
      isWarmingUp = false
    }
  })()

  return warmUpPromise
}

// Executa warm-up em background (não bloqueia)
if (typeof window === 'undefined') {
  warmUpDB().catch(() => {
    // Ignora erros no warm-up inicial
  })
}

