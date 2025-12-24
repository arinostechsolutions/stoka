export function maskPhone(value: string): string {
  const numbers = value.replace(/\D/g, '')
  
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, (match, p1, p2, p3) => {
      if (p3) return `(${p1}) ${p2}-${p3}`
      if (p2) return `(${p1}) ${p2}`
      if (p1) return `(${p1}`
      return numbers
    })
  } else if (numbers.length <= 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, (match, p1, p2, p3) => {
      if (p3) return `(${p1}) ${p2}-${p3}`
      if (p2) return `(${p1}) ${p2}`
      if (p1) return `(${p1}`
      return numbers
    })
  } else {
    // Para números com código do país (ex: 5511999999999)
    // Formato: +55 (11) 99999-9999
    return numbers.replace(/(\d{2})(\d{2})(\d{5})(\d{0,4})/, (match, p1, p2, p3, p4) => {
      if (p4) return `+${p1} (${p2}) ${p3}-${p4}`
      if (p3) return `+${p1} (${p2}) ${p3}`
      if (p2) return `+${p1} (${p2}`
      if (p1) return `+${p1}`
      return numbers
    })
  }
}

export function maskCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, '')
  
  return numbers.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5'
  ).substring(0, 18)
}

export function unmaskPhone(value: string): string {
  return value.replace(/\D/g, '')
}

export function unmaskCNPJ(value: string): string {
  return value.replace(/\D/g, '')
}

export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = unmaskCNPJ(cnpj)
  
  if (cleanCNPJ.length !== 14) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false
  
  // Validação dos dígitos verificadores
  let length = cleanCNPJ.length - 2
  let numbers = cleanCNPJ.substring(0, length)
  const digits = cleanCNPJ.substring(length)
  let sum = 0
  let pos = length - 7
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false
  
  length = length + 1
  numbers = cleanCNPJ.substring(0, length)
  sum = 0
  pos = length - 7
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false
  
  return true
}

