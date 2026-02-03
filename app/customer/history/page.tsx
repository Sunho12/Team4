'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import Image from 'next/image'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-5 max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/tworld" className="cursor-pointer hover:opacity-80 transition-opacity">
              <Image
                src="/Tworld/T.png"
                alt="T world"
                width={40}
                height={40}
                priority
              />
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                내 상담 이력
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">지금까지의 모든 상담 내역입니다</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="hover:bg-gray-50">초기화면</Button>
            </Link>
            <Link href="/chat">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                챗봇으로
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 max-w-5xl space-y-8">
        {/* Purchase Predictions */}
        {predictions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-800">구매 의향 분석</h2>
              <Badge variant="secondary" className="ml-1">{predictions.length}</Badge>
            </div>
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-5">
                  {predictions.map((pred) => (
                    <div key={pred.id} className="border-l-4 border-blue-500 bg-blue-50/50 rounded-r-lg pl-5 pr-4 py-4 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-blue-600">{pred.prediction_type}</Badge>
                        <Badge variant={
                          pred.confidence === 'high' ? 'default' :
                          pred.confidence === 'medium' ? 'secondary' : 'outline'
                        }>
                          {pred.confidence === 'high' ? '높음' :
                           pred.confidence === 'medium' ? '중간' : '낮음'}
                        </Badge>
                        <span className="text-sm font-medium text-blue-700">
                          확률: {(pred.probability_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      {pred.reasoning && (
                        <p className="text-sm leading-relaxed text-gray-700 mb-2">{pred.reasoning}</p>
                      )}
                      <p className="text-xs text-gray-500">
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
          </div>
        )}

        {/* Conversation History */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-800">상담 내역</h2>
            <span className="text-sm text-gray-500">총 {conversations.length}건</span>
          </div>

          {conversations.length > 0 ? (
            <div className="space-y-4">
              {conversations.map((conv) => (
                <Card key={conv.id} className="shadow-md hover:shadow-xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm overflow-hidden group">
                  <CardHeader className="pb-3 pt-5 px-6 bg-gradient-to-r from-gray-50/50 to-white group-hover:from-blue-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-gray-800">
                        {conv.category || '상담'}
                      </CardTitle>
                      {conv.sentiment && (
                        <Badge
                          variant={
                            conv.sentiment === 'positive' ? 'default' :
                            conv.sentiment === 'negative' ? 'destructive' : 'secondary'
                          }
                          className="px-3 py-1"
                        >
                          {conv.sentiment === 'positive' ? '😊 긍정' :
                           conv.sentiment === 'negative' ? '😔 부정' : '😐 중립'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(conv.created_at), {
                        addSuffix: true,
                        locale: ko
                      })}
                    </p>
                  </CardHeader>
                  <CardContent className="px-6 pb-5 pt-4">
                    <p className="text-sm leading-relaxed text-gray-700 mb-4">
                      {conv.summary}
                    </p>
                    {conv.keywords && conv.keywords.length > 0 && (
                      <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100">
                        {conv.keywords.map((kw, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="bg-white hover:bg-gray-50 transition-colors"
                          >
                            #{kw}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="py-16 text-center">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-gray-600 mb-6 text-lg">아직 상담 이력이 없습니다.</p>
                <Link href="/chat">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-2 text-base">
                    첫 상담 시작하기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
