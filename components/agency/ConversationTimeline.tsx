'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ConversationTimelineProps {
  conversations: any[]
}

const CATEGORY_LABELS: Record<string, string> = {
  plan_change: '요금제 변경',
  device_upgrade: '기기 변경',
  billing_inquiry: '요금 문의',
  technical_support: '기술 지원',
  add_service: '서비스 가입',
  cancel_service: '서비스 해지',
  general_inquiry: '일반 문의',
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'bg-green-100 text-green-800',
  neutral: 'bg-gray-100 text-gray-800',
  negative: 'bg-red-100 text-red-800',
}

export function ConversationTimeline({ conversations }: ConversationTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="space-y-4">
      {conversations.map((conv: any) => {
        const summary = conv.conversation_summaries?.[0]
        const isExpanded = expandedId === conv.id

        return (
          <Card key={conv.id} className="overflow-hidden">
            <CardHeader
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => toggleExpanded(conv.id)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    {summary?.category && (
                      <Badge variant="outline">
                        {summary.category}
                      </Badge>
                    )}
                    {summary?.sentiment && (
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${
                          SENTIMENT_COLORS[summary.sentiment] || SENTIMENT_COLORS.neutral
                        }`}
                      >
                        {summary.sentiment === 'positive'
                          ? '긍정적'
                          : summary.sentiment === 'negative'
                          ? '부정적'
                          : '중립적'}
                      </span>
                    )}
                  </div>
                  <CardDescription>
                    {format(new Date(conv.started_at), 'yyyy-MM-dd HH:mm')}
                    {conv.ended_at && ` - ${format(new Date(conv.ended_at), 'HH:mm')}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={conv.status === 'active' ? 'default' : 'secondary'}>
                    {conv.status === 'active' ? '진행 중' : '종료'}
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>

            {isExpanded && summary && (
              <CardContent className="border-t bg-muted/30 pt-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* 고객이 본 카드와 동일한 스타일 */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">상담 요약</h3>

                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3">요약</h4>
                        <p className="text-gray-700 leading-relaxed">{summary.summary}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">카테고리</h4>
                        <p className="text-gray-700">
                          {summary.category}
                        </p>
                      </div>

                      {summary.keywords && summary.keywords.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">키워드</h4>
                          <div className="flex gap-2 flex-wrap">
                            {summary.keywords.map((keyword: string, idx: number) => (
                              <span key={idx} className="px-3 py-1 bg-secondary rounded-md text-sm">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
