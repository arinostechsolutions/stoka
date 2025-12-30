'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Check } from 'lucide-react'

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined)

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora
  React.useEffect(() => {
    if (!open) return

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    // Delay para não fechar imediatamente
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClick)
    }, 10)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClick)
    }
  }, [open])

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div ref={containerRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const useSelectContext = () => {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error('Select components must be used within Select')
  }
  return context
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useSelectContext()

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all',
          'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          open && 'border-blue-500 ring-2 ring-blue-500',
          className
        )}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(!open)
        }}
        {...props}
      >
        {children}
        <ChevronDown 
          className={cn(
            'h-4 w-4 text-gray-500 transition-transform',
            open && 'rotate-180'
          )} 
        />
      </button>
    )
  }
)
SelectTrigger.displayName = 'SelectTrigger'

const SelectValue = ({
  placeholder,
  displayValue,
}: {
  placeholder?: string
  displayValue?: string
}) => {
  const { value } = useSelectContext()
  return (
    <span className="block truncate text-left text-gray-900">
      {displayValue || value || placeholder || 'Selecione...'}
    </span>
  )
}

interface SelectContentProps {
  children: React.ReactNode
}

const SelectContent = React.forwardRef<
  HTMLDivElement,
  SelectContentProps & React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open } = useSelectContext()

  if (!open) return null

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-[99999] mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg',
        'max-h-[300px] overflow-auto',
        className
      )}
      style={{
        top: '100%',
        left: 0,
        right: 0,
      }}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      <div className="py-1">
        {children}
      </div>
    </div>
  )
})
SelectContent.displayName = 'SelectContent'

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children: React.ReactNode
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange, setOpen } = useSelectContext()
    const isSelected = selectedValue === value

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-sm transition-colors',
          'hover:bg-gray-100 focus:bg-gray-100',
          isSelected && 'bg-blue-50 text-blue-900',
          className
        )}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onValueChange(value)
          setOpen(false)
        }}
        {...props}
      >
        {isSelected && (
          <Check className="mr-2 h-4 w-4 text-blue-600" />
        )}
        <span className={cn(!isSelected && 'ml-6')}>{children}</span>
      </div>
    )
  }
)
SelectItem.displayName = 'SelectItem'

export { SelectTrigger, SelectValue, SelectContent, SelectItem }
