'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PREDICTION_LABELS } from '@/types/prediction'

interface PredictionScoreCardProps {
  prediction: {
    id: string
    prediction_type: string
    probability_score: number
    confidence: 'low' | 'medium' | 'high'
    reasoning: string
    recommended_actions: string[] | any
  }
}

const CONFIDENCE_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-green-100 text-green-800',
}

const CONFIDENCE_LABELS: Record<string, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
}

export function PredictionScoreCard({ prediction }: PredictionScoreCardProps) {
  const actions = Array.isArray(prediction.recommended_actions)
    ? prediction.recommended_actions
    : []

  const predictionLabel =
    PREDICTION_LABELS[prediction.prediction_type as keyof typeof PREDICTION_LABELS] ||
    prediction.prediction_type

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{predictionLabel}</CardTitle>
          {prediction.confidence && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                CONFIDENCE_COLORS[prediction.confidence] || CONFIDENCE_COLORS.low
              }`}
            >
              신뢰도: {CONFIDENCE_LABELS[prediction.confidence] || prediction.confidence}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">구매 확률</span>
            <span className="text-2xl font-bold">
              {Math.round(prediction.probability_score * 100)}%
            </span>
          </div>
          <Progress value={prediction.probability_score * 100} className="h-2" />
        </div>

        {prediction.reasoning && (
          <div>
            <p className="text-sm font-semibold mb-1">분석 근거</p>
            <p className="text-sm text-muted-foreground">{prediction.reasoning}</p>
          </div>
        )}

        {actions.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">추천 행동</p>
            <ul className="space-y-1">
              {actions.map((action: string, idx: number) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                  <span className="mr-2">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
