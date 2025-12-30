'use client'

import { useEffect, useRef, useCallback } from 'react'

interface UseStoreAnalyticsProps {
  storeId: string
  enabled?: boolean
}

export function useStoreAnalytics({ storeId, enabled = true }: UseStoreAnalyticsProps) {
  const sessionIdRef = useRef<string>('')
  const startTimeRef = useRef<Date | null>(null)
  const pageViewSentRef = useRef(false)

  // Gera ou recupera sessionId
  useEffect(() => {
    if (!enabled || !storeId) return

    // Gera sessionId único
    if (!sessionIdRef.current) {
      sessionIdRef.current = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    // Salva no sessionStorage para manter durante a sessão
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`store_session_${storeId}`)
      if (stored) {
        sessionIdRef.current = stored
      } else {
        sessionStorage.setItem(`store_session_${storeId}`, sessionIdRef.current)
      }
    }

    startTimeRef.current = new Date()
  }, [storeId, enabled])

  // Envia evento para API
  const trackEvent = useCallback(async (
    eventType: string,
    data?: Record<string, any>
  ) => {
    if (!enabled || !storeId || !sessionIdRef.current) return

    try {
      await fetch('/api/store-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId,
          sessionId: sessionIdRef.current,
          eventType,
          data,
        }),
      })
    } catch (error) {
      console.error('Erro ao enviar evento de analytics:', error)
    }
  }, [storeId, enabled])

  // Track page view na montagem
  useEffect(() => {
    if (!enabled || !storeId || pageViewSentRef.current) return

    trackEvent('page_view')
    pageViewSentRef.current = true
  }, [storeId, enabled, trackEvent])

  // Track session end quando o usuário sai
  useEffect(() => {
    if (!enabled || !storeId) return

    const handleBeforeUnload = () => {
      // Usa fetch com keepalive para garantir que o evento seja enviado mesmo ao sair
      if (sessionIdRef.current) {
        fetch('/api/store-analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storeId,
            sessionId: sessionIdRef.current,
            eventType: 'session_end',
            data: {},
          }),
          keepalive: true, // Mantém a requisição mesmo após a página fechar
        }).catch(() => {
          // Ignora erros silenciosamente
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Tenta enviar session_end ao desmontar também
      if (sessionIdRef.current) {
        trackEvent('session_end')
      }
    }
  }, [storeId, enabled, trackEvent])

  return {
    trackEvent,
    sessionId: sessionIdRef.current,
  }
}

