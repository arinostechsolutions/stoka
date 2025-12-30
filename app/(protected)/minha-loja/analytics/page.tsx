import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/db'
import PublicStore from '@/lib/models/PublicStore'
import { StoreAnalyticsView } from './components/store-analytics-view'

export default async function StoreAnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  await connectDB()

  const store = await PublicStore.findOne({ userId: session.user.id as any }).lean()

  if (!store) {
    redirect('/minha-loja')
  }

  const serializedStore = JSON.parse(JSON.stringify(store))

  return <StoreAnalyticsView storeId={serializedStore._id} />
}

