import 'next-auth'
import { SubscriptionStatus, PlanType } from '@/lib/models/User'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      plan?: PlanType
      subscriptionStatus?: SubscriptionStatus
      trialEndsAt?: Date
      tutorialCompleted?: boolean
    }
  }

  interface User {
    id: string
    email: string
    name: string
    plan?: PlanType
    subscriptionStatus?: SubscriptionStatus
    trialEndsAt?: Date
    tutorialCompleted?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    plan?: PlanType
    subscriptionStatus?: SubscriptionStatus
    trialEndsAt?: Date
    tutorialCompleted?: boolean
  }
}
