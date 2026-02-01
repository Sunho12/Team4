export interface PurchasePrediction {
  id: string
  prediction_type: string
  probability_score: number
  confidence: 'low' | 'medium' | 'high'
  reasoning: string
  recommended_actions: string[]
  created_at: string
}

export type PredictionType = 'device_upgrade' | 'plan_change' | 'add_service'

export const PREDICTION_LABELS: Record<PredictionType, string> = {
  device_upgrade: '기기 변경',
  plan_change: '요금제 변경',
  add_service: '부가서비스 가입',
}
