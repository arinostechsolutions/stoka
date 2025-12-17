'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteSupplier } from '../actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export function DeleteSupplierButton({ supplierId }: { supplierId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSupplier(supplierId)
      if (result.success) {
        router.push('/fornecedores')
        router.refresh()
      }
    })
  }

  return (
    <>
      <Button variant="destructive" size="sm" className="px-3" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Fornecedor</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O fornecedor será removido permanentemente.
              Os produtos associados não serão removidos, mas perderão a associação.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

