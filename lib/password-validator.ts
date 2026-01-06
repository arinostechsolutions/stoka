export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4 // 0 = muito fraca, 4 = muito forte
  feedback: string
  isValid: boolean
  requirements: {
    minLength: boolean
    hasUpperCase: boolean
    hasLowerCase: boolean
    hasNumber: boolean
    hasSpecialChar: boolean
  }
}

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUpperCase: true,
  requireLowerCase: true,
  requireNumber: true,
  requireSpecialChar: true,
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }

  // Contar quantos requisitos foram atendidos
  const requirementsMet = Object.values(requirements).filter(Boolean).length

  // Calcular score baseado nos requisitos
  let score: 0 | 1 | 2 | 3 | 4 = 0
  
  if (requirementsMet === 1) score = 1
  else if (requirementsMet === 2) score = 1
  else if (requirementsMet === 3) score = 2
  else if (requirementsMet === 4) score = 3
  else if (requirementsMet === 5) score = 4

  // Bônus por comprimento extra
  if (password.length >= 12 && score < 4) {
    score = Math.min(4, score + 1) as 0 | 1 | 2 | 3 | 4
  }

  // Feedback baseado no score
  const feedbacks = {
    0: 'Senha muito fraca',
    1: 'Senha fraca',
    2: 'Senha média',
    3: 'Senha forte',
    4: 'Senha muito forte',
  }

  // Validar se atende aos requisitos mínimos
  const isValid = Object.values(requirements).every(Boolean)

  return {
    score,
    feedback: feedbacks[score],
    isValid,
    requirements,
  }
}

export function getPasswordErrors(password: string): string[] {
  const errors: string[] = []
  const strength = validatePasswordStrength(password)

  if (!strength.requirements.minLength) {
    errors.push(`Mínimo de ${PASSWORD_REQUIREMENTS.minLength} caracteres`)
  }
  if (!strength.requirements.hasUpperCase) {
    errors.push('Pelo menos uma letra maiúscula')
  }
  if (!strength.requirements.hasLowerCase) {
    errors.push('Pelo menos uma letra minúscula')
  }
  if (!strength.requirements.hasNumber) {
    errors.push('Pelo menos um número')
  }
  if (!strength.requirements.hasSpecialChar) {
    errors.push('Pelo menos um caractere especial (!@#$%...)')
  }

  return errors
}

