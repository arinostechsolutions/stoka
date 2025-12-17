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
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <Package className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm md:text-base truncate">{product.name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">
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

