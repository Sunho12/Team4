import { openai, MODELS } from './openai'
import { SYSTEM_PROMPTS } from './prompts'
import { createServiceRoleClient } from '@/lib/supabase/server'

export interface PredictionResult {
  prediction_type: string
  probability_score: number
  confidence: 'low' | 'medium' | 'high'
  reasoning: string
  recommended_actions: string[]
}

interface CustomerData {
  conversations: any[]
}

// Fetch customer conversation data
async function fetchCustomerData(sessionId: string): Promise<CustomerData> {
  const supabase = await createServiceRoleClient()

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id,
      started_at,
      conversation_summaries (
        summary,
        category,
        keywords,
        sentiment
      )
    `)
    .eq('session_id', sessionId)
    .order('started_at', { ascending: false })
    .limit(10)

  return {
    conversations: conversations || []
  }
}

// Keyword-based prediction engine (conversation analysis only)
function generateKeywordBasedPredictions(data: CustomerData): PredictionResult[] {
  const predictions: PredictionResult[] = []

  if (data.conversations.length === 0) {
    return predictions
  }

  // 1. Device upgrade prediction
  const deviceUpgradeConversations = data.conversations.filter(c =>
    c.conversation_summaries?.[0]?.category === 'device_upgrade' ||
    c.conversation_summaries?.[0]?.keywords?.some((k: string) =>
      ['기기변경', '휴대폰', '스마트폰', '아이폰', '갤럭시', '폰', '교체'].includes(k)
    )
  )

  if (deviceUpgradeConversations.length > 0) {
    const score = Math.min(0.5 + (deviceUpgradeConversations.length * 0.15), 0.95)
    predictions.push({
      prediction_type: 'device_upgrade',
      probability_score: score,
      confidence: score >= 0.7 ? 'high' : 'medium',
      reasoning: `최근 대화에서 ${deviceUpgradeConversations.length}회 기기 변경 관련 문의가 있었습니다. 신규 기기 구매 의향이 있는 것으로 보입니다.`,
      recommended_actions: ['기기 할인 쿠폰 발송', '신제품 출시 알림', '매장 방문 예약 안내']
    })
  }

  // 2. Plan change prediction
  const planChangeConversations = data.conversations.filter(c =>
    c.conversation_summaries?.[0]?.category === 'plan_change' ||
    c.conversation_summaries?.[0]?.keywords?.some((k: string) =>
      ['요금제', '플랜', '데이터', '변경', '바꾸', '전환'].includes(k)
    )
  )

  const billingComplaints = data.conversations.filter(c =>
    c.conversation_summaries?.[0]?.category === 'billing_inquiry' &&
    c.conversation_summaries?.[0]?.sentiment === 'negative'
  )

  const priceSensitive = data.conversations.some(c =>
    c.conversation_summaries?.[0]?.keywords?.some((k: string) =>
      ['비싸', '비용', '할인', '저렴', '가격'].includes(k)
    )
  )

  const planScore = (planChangeConversations.length * 0.2) +
                    (billingComplaints.length * 0.2) +
                    (priceSensitive ? 0.15 : 0)

  if (planScore >= 0.4) {
    predictions.push({
      prediction_type: 'plan_change',
      probability_score: Math.min(planScore + 0.3, 0.95),
      confidence: planScore >= 0.6 ? 'high' : 'medium',
      reasoning: '요금제 변경 또는 요금 관련 문의가 있었습니다. 현재 요금제에 대한 재검토가 필요할 수 있습니다.',
      recommended_actions: ['요금제 맞춤 추천', '데이터 추가 할인 제안', '상담 전화 연결']
    })
  }

  // 3. Add service prediction
  const addServiceConversations = data.conversations.filter(c =>
    c.conversation_summaries?.[0]?.category === 'add_service' ||
    c.conversation_summaries?.[0]?.keywords?.some((k: string) =>
      ['부가서비스', '쉐어링', 'OTT', '결합', '추가', '서비스'].includes(k)
    )
  )

  if (addServiceConversations.length > 0) {
    const score = Math.min(0.5 + (addServiceConversations.length * 0.15), 0.95)
    predictions.push({
      prediction_type: 'add_service',
      probability_score: score,
      confidence: score >= 0.7 ? 'high' : 'medium',
      reasoning: '부가서비스 관련 문의가 있었습니다. 추가 서비스 가입에 관심이 있을 수 있습니다.',
      recommended_actions: ['가족 데이터 쉐어링 안내', '멤버십 혜택 소개', '부가서비스 무료 체험']
    })
  }

  // 4. Churn prevention
  const negativeConversations = data.conversations.filter(c =>
    c.conversation_summaries?.[0]?.sentiment === 'negative'
  )

  const churnKeywords = data.conversations.filter(c =>
    c.conversation_summaries?.[0]?.keywords?.some((k: string) =>
      ['타사', '번호이동', '해지', '불만', '취소', '이동'].includes(k)
    )
  )

  const churnScore = (negativeConversations.length * 0.3) + (churnKeywords.length * 0.4)

  if (churnScore >= 0.6) {
    predictions.push({
      prediction_type: 'churn_prevention',
      probability_score: Math.min(churnScore + 0.2, 0.95),
      confidence: 'high',
      reasoning: '부정적인 상담 이력과 타사 전환 언급으로 인해 이탈 위험이 높습니다. 적극적인 리텐션 활동이 필요합니다.',
      recommended_actions: ['고객 만족도 조사', 'VIP 혜택 제공', '긴급 상담 요청']
    })
  }

  return predictions
}

// Check if AI analysis is needed
function needsAIAnalysis(
  keywordPredictions: PredictionResult[],
  data: CustomerData
): boolean {
  // Case 1: No keyword-based predictions found but we have conversations
  if (keywordPredictions.length === 0 && data.conversations.length > 0) {
    return true
  }

  // Case 2: All predictions are low confidence
  const allLowConfidence = keywordPredictions.every(p => p.confidence === 'low')
  if (allLowConfidence) return true

  // Case 3: Multiple conversations with complex patterns
  if (data.conversations.length >= 5) {
    return true
  }

  // Case 4: Conflicting signals (e.g., both upgrade and churn signals)
  const hasChurnSignal = keywordPredictions.some(p => p.prediction_type === 'churn_prevention')
  const hasPositiveSignal = keywordPredictions.some(p =>
    ['device_upgrade', 'plan_change', 'add_service'].includes(p.prediction_type)
  )
  if (hasChurnSignal && hasPositiveSignal) return true

  return false
}

// Generate AI predictions based on conversation analysis
async function generateAIPredictions(data: CustomerData): Promise<PredictionResult[]> {
  const contextSummary = {
    conversation_count: data.conversations.length,
    conversations: data.conversations.slice(0, 5).map(c => ({
      date: c.started_at,
      summary: c.conversation_summaries?.[0]?.summary || 'No summary',
      category: c.conversation_summaries?.[0]?.category,
      keywords: c.conversation_summaries?.[0]?.keywords || [],
      sentiment: c.conversation_summaries?.[0]?.sentiment
    }))
  }

  const analysisPrompt = `다음은 고객의 최근 대화 기록입니다:

${JSON.stringify(contextSummary, null, 2)}

이 고객의 대화 내용을 분석하여 구매 의향과 니즈를 예측하세요. 다음 항목에 주목하세요:
- 기기 교체 필요성 (기기 관련 문의, 불만)
- 요금제 변경 필요성 (요금, 데이터 사용 관련 문의)
- 부가서비스 관심 (서비스 문의, 추가 기능)
- 이탈 위험성 (부정적 피드백, 타사 언급)

JSON 형식으로 응답하세요.`

  const response = await openai.chat.completions.create({
    model: MODELS.CHAT,
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS.PREDICT },
      { role: 'user', content: analysisPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')
  return result.predictions || []
}

// Merge keyword-based and AI predictions
function mergePredictions(
  keywordBased: PredictionResult[],
  aiPredictions: PredictionResult[]
): PredictionResult[] {
  const merged = [...keywordBased]
  const keywordBasedTypes = new Set(keywordBased.map(p => p.prediction_type))

  // Add AI predictions that aren't already in keyword-based
  for (const aiPred of aiPredictions) {
    if (!keywordBasedTypes.has(aiPred.prediction_type)) {
      merged.push(aiPred)
    }
  }

  // Sort by probability score descending
  return merged.sort((a, b) => b.probability_score - a.probability_score)
}

export async function analyzePurchaseIntent(sessionId: string): Promise<PredictionResult[]> {
  const supabase = await createServiceRoleClient()

  // Fetch customer conversation data
  const customerData = await fetchCustomerData(sessionId)

  // If no conversations, return empty predictions (don't throw error)
  if (customerData.conversations.length === 0) {
    return []
  }

  // Generate keyword-based predictions (fast, always runs)
  const keywordPredictions = generateKeywordBasedPredictions(customerData)

  // Determine if AI analysis is needed
  let finalPredictions = keywordPredictions

  if (needsAIAnalysis(keywordPredictions, customerData)) {
    try {
      const aiPredictions = await generateAIPredictions(customerData)
      finalPredictions = mergePredictions(keywordPredictions, aiPredictions)
    } catch (error) {
      console.error('AI prediction failed, using keyword-based only:', error)
      // Fall back to keyword-based if AI fails
    }
  }

  // Delete existing predictions for this session
  await supabase
    .from('purchase_predictions')
    .delete()
    .eq('session_id', sessionId)

  // Save new predictions to database
  if (finalPredictions.length > 0) {
    const predictionsToInsert = finalPredictions.map(pred => ({
      session_id: sessionId,
      prediction_type: pred.prediction_type,
      probability_score: pred.probability_score,
      confidence: pred.confidence,
      reasoning: pred.reasoning,
      recommended_actions: pred.recommended_actions,
    }))

    await supabase.from('purchase_predictions').insert(predictionsToInsert)
  }

  return finalPredictions
}
