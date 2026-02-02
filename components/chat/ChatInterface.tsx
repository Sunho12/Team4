'use client'

import { useState, useEffect } from 'react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Message } from '@/types/chat'

interface ChatInterfaceProps {
  sessionToken: string
  conversationId: string | null
  onConversationCreated: (id: string) => void
}

export function ChatInterface({ sessionToken, conversationId, onConversationCreated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [predictions, setPredictions] = useState<any>(null)

  useEffect(() => {
    if (!conversationId) {
      createConversation()
    } else {
      loadMessages()
    }
  }, [conversationId])

  const createConversation = async () => {
    try {
      const response = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      })

      if (response.ok) {
        const data = await response.json()
        onConversationCreated(data.conversationId)
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const loadMessages = async () => {
    if (!conversationId) return

    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim()) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: content,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: data.messageId,
          role: 'assistant',
          content: data.response,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const endConversation = async () => {
    if (!conversationId) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })

      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary)
        setPredictions(data.predictions)
      }
    } catch (error) {
      console.error('Failed to end conversation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (summary) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-2xl w-full p-6">
          <h2 className="text-2xl font-bold mb-4">상담이 종료되었습니다</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">요약</h3>
              <p className="text-muted-foreground">{summary.summary}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">카테고리</h3>
              <p className="text-muted-foreground">{summary.category}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">키워드</h3>
              <div className="flex gap-2 flex-wrap">
                {summary.keywords?.map((kw: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-secondary rounded-md text-sm">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Purchase Predictions */}
            {predictions && predictions.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-2">구매 의향 분석</h3>
                <div className="space-y-3">
                  {predictions.map((pred: any, idx: number) => (
                    <div key={idx} className="p-3 bg-blue-50 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">
                          {pred.prediction_type}
                        </span>
                        <span className="px-2 py-1 bg-white rounded text-xs">
                          확률: {(pred.probability_score * 100).toFixed(0)}%
                        </span>
                        <span className="px-2 py-1 bg-white rounded text-xs">
                          신뢰도: {pred.confidence === 'high' ? '높음' : pred.confidence === 'medium' ? '중간' : '낮음'}
                        </span>
                      </div>
                      {pred.reasoning && (
                        <p className="text-sm text-muted-foreground">{pred.reasoning}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                setSummary(null)
                setPredictions(null)
                setMessages([])
                onConversationCreated('')
                createConversation()
              }}
              className="w-full mt-4"
            >
              새 상담 시작
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">T-world 챗봇</h1>
        <Button variant="outline" onClick={endConversation} disabled={isLoading}>
          대화 종료
        </Button>
      </div>

      <MessageList messages={messages} isLoading={isLoading} />

      <MessageInput onSend={sendMessage} disabled={isLoading} />
    </div>
  )
}
