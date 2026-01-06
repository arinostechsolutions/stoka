'use client'

import { ReactNode } from 'react'
import { SubscriptionGuard } from './subscription-guard'
import { SubscriptionBanner } from './subscription-banner'

interface ProtectedContentProps {
  children: ReactNode
}

export function ProtectedContent({ children }: ProtectedContentProps) {
  return (
    <>
      <SubscriptionBanner />
      <SubscriptionGuard>
        {children}
      </SubscriptionGuard>
    </>
  )
}

