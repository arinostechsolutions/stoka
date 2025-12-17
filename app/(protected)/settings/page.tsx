import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import User from '@/lib/models/User'
import { ProfileForm } from './components/profile-form'
import { PasswordForm } from './components/password-form'
import { Settings } from 'lucide-react'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  await connectDB()

  const user = await User.findById(session.user.id as any).lean()

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configurações
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas preferências e informações da conta
        </p>
      </div>

      <div className="space-y-6">
        <ProfileForm 
          user={{
            name: user.name,
            email: user.email,
            cnpj: user.cnpj,
            companyName: user.companyName,
            tradeName: user.tradeName,
          }}
        />
        
        <PasswordForm />
      </div>
    </div>
  )
}
