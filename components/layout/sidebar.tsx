'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SidebarContent } from './sidebar-content'

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop Sidebar - sempre visível */}
      <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-card">
        <SidebarContent showLogo={true} />
      </aside>

      {/* Mobile Header com Logo e Botão Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[60] flex items-center gap-3 h-16 px-4 bg-card border-b">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="bg-background shadow-sm shrink-0"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 [&>button]:hidden">
            <div className="flex h-full w-full flex-col bg-card">
              <SidebarContent showLogo={false} onLinkClick={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-xl font-bold">Stoka</h1>
      </div>
    </>
  )
}

