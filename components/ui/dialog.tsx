'use client'

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pt-20 md:pt-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Content */}
      <div className="relative z-[70] w-full max-w-2xl">
        {children}
      </div>
    </div>
  )
}

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }
>(({ className, onClose, children, onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, scale: 0.96, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.96, y: 10 }}
    transition={{ duration: 0.15 }}
    className={cn(
      "relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden",
      className
    )}
    onClick={(e) => e.stopPropagation()}
    {...props}
  >
    {/* Close button */}
    {onClose && (
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Fechar</span>
      </button>
    )}
    
    {/* Content */}
    <div className="overflow-y-auto max-h-[90vh] p-6">
      {children}
    </div>
  </motion.div>
))
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mb-6 pb-4 border-b border-gray-200",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-2xl font-bold text-gray-900",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600 mt-1", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      ref,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        props.onClick?.(e)
        if (children.props.onClick) {
          children.props.onClick(e as any)
        }
      },
    } as any)
  }
  return (
    <button ref={ref} {...props}>
      {children}
    </button>
  )
})
DialogTrigger.displayName = "DialogTrigger"

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger }
