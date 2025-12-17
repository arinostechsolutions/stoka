import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    'NEXTAUTH_SECRET não está definido. Adicione no arquivo .env'
  )
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

