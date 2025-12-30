import { notFound } from 'next/navigation'
import connectDB from '@/lib/db'
import PublicStore from '@/lib/models/PublicStore'
import Product from '@/lib/models/Product'
import { PublicStoreView } from './components/public-store-view'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  await connectDB()
  
  const store = await PublicStore.findOne({ 
    slug: params.slug,
    isActive: true 
  }).lean()

  if (!store) {
    return {
      title: 'Loja não encontrada',
    }
  }

  return {
    title: store.title,
    description: store.description || `Confira nossos produtos!`,
  }
}

export default async function PublicStorePage({ params }: { params: { slug: string } }) {
  await connectDB()

  const store = await PublicStore.findOne({
    slug: params.slug,
    isActive: true,
  }).lean()

  if (!store) {
    notFound()
  }

  // Busca os produtos selecionados
  const products = await Product.find({
    _id: { $in: store.selectedProducts },
    quantity: { $gt: 0 }, // Apenas produtos com estoque
  })
    .select('name nome_vitrine imageUrl salePrice brand size quantity pre_venda genero')
    .lean()

  const serializedStore = JSON.parse(JSON.stringify(store))
  const serializedProducts = JSON.parse(JSON.stringify(products))

  return <PublicStoreView store={serializedStore} products={serializedProducts} />
}


