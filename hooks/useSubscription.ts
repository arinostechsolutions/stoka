'use client'

import { useQuery } from '@tanstack/react-query'

export interface SubscriptionData {
  plan: 'starter' | 'premium' | null
  isActive: boolean
  isTrialing: boolean
  status: string | null
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  daysLeftInTrial: number | null
  statusFormatted?: string
  planFormatted?: string
  hasStripeCustomer?: boolean
}

async function fetchSubscription(): Promise<SubscriptionData> {
  const response = await fetch('/api/stripe/subscription')
  if (!response.ok) {
    throw new Error('Erro ao buscar subscription')
  }
  return response.json()
}

export function useSubscription() {
  return useQuery<SubscriptionData>({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    gcTime: 10 * 60 * 1000, // Mantém no cache por 10 minutos
    retry: 1,
  })
}

