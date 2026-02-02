'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

interface ConversationHistory {
  id: string
  summary: string
  category: string | null
  keywords: string[] | null
  sentiment: string | null
  created_at: string
  conversations: {
    id: string
    started_at: string
    ended_at: string | null
    status: string
  }
}

interface PurchasePrediction {
  id: string
  prediction_type: string
  probability_score: number
  confidence: string
  reasoning: string | null
  recommended_actions: any
  created_at: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<ConversationHistory[]>([])
  const [predictions, setPredictions] = useState<PurchasePrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/customer/history')

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to load history')
      }

      const data = await response.json()
      setConversations(data.conversations || [])
      setPredictions(data.predictions || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">오류: {error}</p>
          <Button onClick={() => router.push('/chat')}>챗봇으로 돌아가기</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto p-4 max-w-4xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">내 상담 이력</h1>
            <p className="text-sm text-muted-foreground">지금까지의 모든 상담 내역입니다</p>
          </div>
          <Link href="/chat">
            <Button variant="outline">챗봇으로</Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-4xl space-y-6 mt-6">
        {/* Purchase Predictions */}
        {predictions.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>구매 의향 분석</span>
                <Badge variant="secondary">{predictions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.map((pred) => (
                  <div key={pred.id} className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>{pred.prediction_type}</Badge>
                      <Badge variant={
                        pred.confidence === 'high' ? 'default' :
                        pred.confidence === 'medium' ? 'secondary' : 'outline'
                      }>
                        {pred.confidence === 'high' ? '높음' :
                         pred.confidence === 'medium' ? '중간' : '낮음'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        확률: {(pred.probability_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    {pred.reasoning && (
                      <p className="text-sm">{pred.reasoning}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(pred.created_at), {
                        addSuffix: true,
                        locale: ko
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversation History */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">상담 내역</h2>

          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <Card key={conv.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {conv.category || '상담'}
                    </CardTitle>
                    {conv.sentiment && (
                      <Badge variant={
                        conv.sentiment === 'positive' ? 'default' :
                        conv.sentiment === 'negative' ? 'destructive' : 'secondary'
                      }>
                        {conv.sentiment === 'positive' ? '긍정' :
                         conv.sentiment === 'negative' ? '부정' : '중립'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(conv.created_at), {
                      addSuffix: true,
                      locale: ko
                    })}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm">{conv.summary}</p>
                  {conv.keywords && conv.keywords.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {conv.keywords.map((kw, idx) => (
                        <Badge key={idx} variant="outline">{kw}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-md">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">아직 상담 이력이 없습니다.</p>
                <Link href="/chat">
                  <Button>첫 상담 시작하기</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
