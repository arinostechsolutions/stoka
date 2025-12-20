"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AlertDialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | undefined>(undefined)

interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const AlertDialog = ({ open: controlledOpen, onOpenChange: controlledOnOpenChange, children }: AlertDialogProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const onOpenChange = controlledOnOpenChange || setInternalOpen

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  )
}

const AlertDialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, children, onClick, ...props }, ref) => {
  const context = React.useContext(AlertDialogContext)
  if (!context) throw new Error("AlertDialogTrigger must be used within AlertDialog")

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context.onOpenChange(true)
    onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { ...props, onClick: handleClick, ref })
  }

  return (
    <button ref={ref} onClick={handleClick} {...props}>
      {children}
    </button>
  )
})
AlertDialogTrigger.displayName = "AlertDialogTrigger"

const AlertDialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(AlertDialogContext)
  if (!context) throw new Error("AlertDialogContent must be used within AlertDialog")

  return (
    <Dialog open={context.open} onOpenChange={context.onOpenChange}>
      <DialogContent
        ref={ref}
        className={cn("sm:max-w-[425px]", className)}
        onClose={() => context.onOpenChange(false)}
        {...props}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
})
AlertDialogContent.displayName = "AlertDialogContent"

const AlertDialogHeader = DialogHeader
const AlertDialogTitle = DialogTitle
const AlertDialogDescription = DialogDescription

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <Button ref={ref} className={className} {...props} />
))
AlertDialogAction.displayName = "AlertDialogAction"

const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <Button ref={ref} variant="outline" className={cn("mt-2 sm:mt-0", className)} {...props} />
))
AlertDialogCancel.displayName = "AlertDialogCancel"

// Placeholder exports for compatibility
const AlertDialogPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>
const AlertDialogOverlay = () => null

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}

