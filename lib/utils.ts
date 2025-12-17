import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhone(phone: string): string {
  if (!phone) return ''
  const numbers = phone.replace(/\D/g, '')
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, (match, p1, p2, p3) => {
      if (p3) return `(${p1}) ${p2}-${p3}`
      if (p2) return `(${p1}) ${p2}`
      if (p1) return `(${p1}`
      return numbers
    })
  } else {
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, (match, p1, p2, p3) => {
      if (p3) return `(${p1}) ${p2}-${p3}`
      if (p2) return `(${p1}) ${p2}`
      if (p1) return `(${p1}`
      return numbers
    })
  }
}

export function formatCNPJ(cnpj: string): string {
  if (!cnpj) return ''
  const numbers = cnpj.replace(/\D/g, '')
  return numbers.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5'
  ).substring(0, 18)
}

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatDiscountType(discountType?: string): string {
  if (!discountType) return ''
  switch (discountType) {
    case 'percent':
      return 'Percentual'
    case 'fixed':
      return 'Valor Fixo'
    default:
      return discountType
  }
}

