import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'
import { Card, CardContent } from '@/components/ui/card'
import { Package } from 'lucide-react'
import Link from 'next/link'

export async function ProductsList({ supplierId }: { supplierId: string }) {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id

  await connectDB()

  const products = await Product.find({
    userId: userId as any,
    supplierId: supplierId as any,
  })
    .sort({ name: 1 })
    .lean()

  if (products.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        Nenhum produto associado a este fornecedor
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {products.map((product: any) => (
        <Link key={product._id.toString()} href={`/produtos/${product._id}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Estoque: {product.quantity}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

