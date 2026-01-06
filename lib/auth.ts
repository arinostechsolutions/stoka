import bcrypt from 'bcryptjs'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import User from './models/User'
import connectDB from './db'
import { loginSchema } from './validations'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await connectDB()

        const user = await User.findOne({ email: credentials.email })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          plan: user.plan || undefined,
          subscriptionStatus: user.subscriptionStatus || undefined,
          trialEndsAt: user.trialEndsAt || undefined,
          tutorialCompleted: user.tutorialCompleted || false,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.plan = user.plan || undefined
        token.subscriptionStatus = user.subscriptionStatus || undefined
        token.trialEndsAt = user.trialEndsAt || undefined
        token.tutorialCompleted = user.tutorialCompleted || false
      }

      // Atualizar dados do usuário quando a sessão for atualizada
      if (trigger === 'update') {
        await connectDB()
        const dbUser = await User.findById(token.id)
        if (dbUser) {
          token.plan = dbUser.plan || undefined
          token.subscriptionStatus = dbUser.subscriptionStatus || undefined
          token.trialEndsAt = dbUser.trialEndsAt || undefined
          token.tutorialCompleted = dbUser.tutorialCompleted || false
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.plan = token.plan || undefined
        session.user.subscriptionStatus = token.subscriptionStatus || undefined
        session.user.trialEndsAt = token.trialEndsAt || undefined
        session.user.tutorialCompleted = token.tutorialCompleted || false
      }
      return session
    },
  },
}

