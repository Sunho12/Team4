'use client'

import { useEffect, useState } from 'react'
import { ChatInterface } from '@/components/chat/ChatInterface'

export default function ChatPage() {
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)

  useEffect(() => {
    initializeSession()
  }, [])

  const initializeSession = async () => {
    let token = localStorage.getItem('chat_session_token')

    if (!token) {
      const response = await fetch('/api/chat/session', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        token = data.sessionToken
        localStorage.setItem('chat_session_token', token!)
      }
    }

    setSessionToken(token)
  }

  if (!sessionToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">세션을 초기화하는 중...</p>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col">
      <ChatInterface
        sessionToken={sessionToken}
        conversationId={conversationId}
        onConversationCreated={setConversationId}
      />
    </main>
  )
}
