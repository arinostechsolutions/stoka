'use client'

import { useState, forwardRef } from 'react'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { validatePasswordStrength, PASSWORD_REQUIREMENTS } from '@/lib/password-validator'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  showStrengthIndicator?: boolean
  showRequirements?: boolean
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, showStrengthIndicator = true, showRequirements = true, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [password, setPassword] = useState('')

    const strength = validatePasswordStrength(password)

    const strengthColors = {
      0: 'bg-slate-600',
      1: 'bg-red-500',
      2: 'bg-orange-500',
      3: 'bg-yellow-500',
      4: 'bg-green-500',
    }

    const strengthTextColors = {
      0: 'text-slate-400',
      1: 'text-red-400',
      2: 'text-orange-400',
      3: 'text-yellow-400',
      4: 'text-green-400',
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value)
      props.onChange?.(e)
    }

    return (
      <div className="space-y-2">
        {label && <Label htmlFor={props.id} className="text-slate-200">{label}</Label>}
        
        <div className="relative">
          <Input
            {...props}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={cn('pr-10', className)}
            onChange={handleChange}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Indicador de Força */}
        {showStrengthIndicator && password && (
          <div className="space-y-2">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    level <= strength.score ? strengthColors[strength.score] : 'bg-slate-700'
                  )}
                />
              ))}
            </div>
            <p className={cn('text-xs font-medium', strengthTextColors[strength.score])}>
              {strength.feedback}
            </p>
          </div>
        )}

        {/* Requisitos */}
        {showRequirements && password && (
          <div className="space-y-1.5 pt-1">
            <RequirementItem
              met={strength.requirements.minLength}
              text={`Mínimo de ${PASSWORD_REQUIREMENTS.minLength} caracteres`}
            />
            <RequirementItem
              met={strength.requirements.hasUpperCase}
              text="Pelo menos uma letra maiúscula (A-Z)"
            />
            <RequirementItem
              met={strength.requirements.hasLowerCase}
              text="Pelo menos uma letra minúscula (a-z)"
            />
            <RequirementItem
              met={strength.requirements.hasNumber}
              text="Pelo menos um número (0-9)"
            />
            <RequirementItem
              met={strength.requirements.hasSpecialChar}
              text="Pelo menos um caractere especial (!@#$%...)"
            />
          </div>
        )}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="h-3.5 w-3.5 text-green-400 shrink-0" />
      ) : (
        <X className="h-3.5 w-3.5 text-slate-500 shrink-0" />
      )}
      <span className={cn('transition-colors', met ? 'text-green-400' : 'text-slate-400')}>
        {text}
      </span>
    </div>
  )
}

