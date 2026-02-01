'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

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
  return (
    <div className="space-y-4">
      {conversations.map((conv: any) => {
        const summary = conv.conversation_summaries?.[0]

        return (
          <Card key={conv.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {summary?.category && (
                      <Badge variant="outline">
                        {CATEGORY_LABELS[summary.category] || summary.category}
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
                <Badge variant={conv.status === 'active' ? 'default' : 'secondary'}>
                  {conv.status === 'active' ? '진행 중' : '종료'}
                </Badge>
              </div>
            </CardHeader>

            {summary && (
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold mb-1">요약</p>
                    <p className="text-sm text-muted-foreground">{summary.summary}</p>
                  </div>

                  {summary.keywords && summary.keywords.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-1">키워드</p>
                      <div className="flex gap-2 flex-wrap">
                        {summary.keywords.map((keyword: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
