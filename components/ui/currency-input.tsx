'use client'

import * as React from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'name'> {
  value?: string | number
  onChange?: (value: string) => void
  name?: string
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, name, id, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')
    const [hiddenValue, setHiddenValue] = React.useState('')
    const hiddenInputRef = React.useRef<HTMLInputElement>(null)

    // Formata o valor para exibição (0,00)
    const formatCurrency = (num: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num)
    }

    // Remove formatação e retorna apenas números
    const unformatValue = (formatted: string): string => {
      return formatted.replace(/[^\d]/g, '')
    }

    // Converte string de números para número decimal
    const parseToDecimal = (numStr: string): number => {
      if (!numStr) return 0
      // Divide por 100 para converter centavos em reais
      return parseFloat(numStr) / 100
    }

    React.useEffect(() => {
      if (value === undefined || value === null || value === '') {
        setDisplayValue('')
        setHiddenValue('')
        return
      }
      
      const numValue = typeof value === 'string' 
        ? parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) 
        : value
      
      if (isNaN(numValue)) {
        setDisplayValue('')
        setHiddenValue('')
        return
      }
      
      // Permite valor 0, mas não exibe se for undefined/null
      if (numValue === 0 && (value === undefined || value === null || value === '')) {
        setDisplayValue('')
        setHiddenValue('')
        return
      }
      
      setDisplayValue(formatCurrency(numValue))
      setHiddenValue(numValue.toString())
    }, [value])

    const updateValue = (numbersOnly: string) => {
      if (!numbersOnly) {
        setDisplayValue('')
        setHiddenValue('')
        if (onChange) {
          onChange('')
        }
        return
      }

      // Converte para decimal (divide por 100)
      const decimalValue = parseToDecimal(numbersOnly)
      
      // Formata para exibição
      const formatted = formatCurrency(decimalValue)
      setDisplayValue(formatted)
      setHiddenValue(decimalValue.toString())
      
      // Envia o valor numérico como string para o onChange
      if (onChange) {
        onChange(decimalValue.toString())
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      
      // Remove tudo exceto números
      const numbersOnly = unformatValue(inputValue)
      updateValue(numbersOnly)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permite apenas números, backspace, delete, tab, escape, enter e setas
      const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End'
      ]
      
      if (allowedKeys.includes(e.key)) {
        return
      }
      
      // Permite Ctrl/Cmd + A, C, V, X
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
        return
      }
      
      // Bloqueia tudo que não for número
      if (!/[0-9]/.test(e.key)) {
        e.preventDefault()
      }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const pastedText = e.clipboardData.getData('text')
      const numbersOnly = unformatValue(pastedText)
      updateValue(numbersOnly)
    }

    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium z-10 pointer-events-none">
          R$
        </div>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="0,00"
          className={cn('pl-10 text-right', className)}
          id={id}
          {...props}
        />
        {/* Input hidden para FormData pegar o valor numérico correto */}
        {name && (
          <input
            ref={hiddenInputRef}
            type="hidden"
            name={name}
            value={hiddenValue}
          />
        )}
      </div>
    )
  }
)
CurrencyInput.displayName = 'CurrencyInput'
