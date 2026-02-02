export interface PurchasePrediction {
  id: string;
  prediction_type: PredictionType;
  
  // 1. 타이밍 예측 (언제 발생할 것인가)
  timing_window: {
    expected_within_days: number; // 예: 30 (30일 이내 발생 확률 높음)
    urgency: 'low' | 'normal' | 'emergency'; // 약정 만료, 파손 등 긴급도
  };

  // 2. 예측 상세 (어떤 구체적인 액션인가)
  prediction_details: {
    target_category: string; // 예: "iPhone 16 Pro", "OTT 결합 요금제"
    estimated_revenue_delta: number; // 해당 액션 발생 시 예상 ARPU 증감액
  };

  // 3. 신뢰도 및 근거
  probability_score: number; // 0.0 ~ 1.0
  confidence: 'low' | 'medium' | 'high';
  
  // 핵심 트리거: 왜 이 예측이 생성되었는가 (데이터 시각화/상담 가이드용)
  trigger_factors: TriggerFactor[]; 

  reasoning: string; // 상담원에게 보여줄 요약 문구
  recommended_actions: RecommendedAction[]; // 대응 스크립트나 오퍼링
  
  created_at: string;
}

export type PredictionType = 'device_upgrade' | 'plan_change' | 'add_service' | 'churn_prevention' | 'retention';

export const PREDICTION_LABELS: Record<PredictionType, string> = {
  device_upgrade: '기기 변경',
  plan_change: '요금제 변경',
  add_service: '부가서비스 가입',
  churn_prevention: '이탈 방지/재약정', // 번호이동 가능성이 높은 고객
  retention: '변동 예정 없음'
};

export interface TriggerFactor {
  factor_type: 'contract_end' | 'usage_pattern' | 'device_age' | 'competitor_offer';
  description: string;
  weight: number; // 해당 요인이 예측에 미친 영향도
}

export interface RecommendedAction {
  action_type: 'call' | 'sms_coupon' | 'visit_invite';
  description: string;
  benefit_code: string; // 프로모션 코드 등
}

